// =============================================================================
// POST /api/sync-status/test — real connection test against the source DB
// =============================================================================
// Opens the tenant's newest read-only connection, runs SELECT 1, checks the
// session is actually read-only, and returns the verdict. No toasts.

import { NextResponse, type NextRequest } from "next/server";
import { getDb, resolveTenantScope } from "@gps/shared";
import { authenticate } from "@/src/server/auth-helpers";
import { testAdapterConnection } from "@/src/server/adapters/service";
import { ok, forbidden, serverError } from "@/src/server/response";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;

  const scope = resolveTenantScope(auth.claims);
  if (scope.kind === "denied") return forbidden(scope.reason);
  if (scope.kind !== "single-tenant") return forbidden("Chain-level scope not supported in v1.");

  try {
    return ok(await testAdapterConnection(getDb(), scope.tenantId));
  } catch (err) {
    console.error("[POST /api/sync-status/test] Failed:", err);
    return serverError();
  }
}
