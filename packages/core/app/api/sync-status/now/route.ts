// =============================================================================
// POST /api/sync-status/now — runs one real adapter sync
// =============================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getDb, resolveTenantScope } from "@gps/shared";
import { authenticate } from "@/src/server/auth-helpers";
import { AdapterError, syncTenant } from "@/src/server/adapters/service";
import type { ApiResponse } from "@gps/shared";

export const runtime = "nodejs";

// Remote Postgres (Neon) can drop a long-running connection mid-sync. The sync
// is idempotent, so retrying after a partial run is safe — it simply re-links
// whatever is still missing.
const RETRYABLE_NETWORK_ERROR =
  /ECONNRESET|ECONNREFUSED|ETIMEDOUT|EPIPE|ECONNABORTED|CONNECT_TIMEOUT|Connection terminated|socket hang up/i;

async function syncWithRetry(tenantId: string, actorUserId: string | null) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await syncTenant(getDb(), tenantId, actorUserId);
    } catch (err) {
      lastError = err;
      if (err instanceof AdapterError) throw err;
      const message = err instanceof Error ? err.message : String(err);
      if (!RETRYABLE_NETWORK_ERROR.test(message) || attempt === 3) throw err;
      console.warn(
        `[POST /api/sync-status/now] attempt ${attempt} failed (${message}); retrying`,
      );
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
  throw lastError;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;

  const scope = resolveTenantScope(auth.claims);
  if (scope.kind === "denied") {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: { code: "FORBIDDEN", message: scope.reason } },
      { status: 403 }
    );
  }
  if (scope.kind !== "single-tenant") {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: { code: "FORBIDDEN", message: "Chain-level scope not supported in v1." } },
      { status: 403 }
    );
  }

  try {
    const data = await syncWithRetry(scope.tenantId, auth.claims.sub);
    return NextResponse.json<ApiResponse<typeof data>>({ success: true, data });
  } catch (err) {
    if (err instanceof AdapterError) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: { code: err.code, message: err.message } },
        { status: err.status }
      );
    }
    console.error("[POST /api/sync-status/now] Failed:", err);
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: {
          code: "SYNC_FAILED",
          message: err instanceof Error ? err.message : "Adapter sync failed.",
        },
      },
      { status: 502 }
    );
  }
}
