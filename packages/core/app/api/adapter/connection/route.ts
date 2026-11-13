// =============================================================================
// POST /api/adapter/connection
// =============================================================================
// Admin-only. Stores (encrypted) the connection string for the caller's
// active tenant's source PMS DB. Two connection flavors:
//   - isReadOnly=true  → adapter reads raw rows (existing default)
//   - isReadOnly=false → registration form writes raw rows
//
// The DSN must include defaultTransactionReadOnly=true for read-only
// connections (per Card 1 contract). We do NOT silently add this — the
// admin is required to set it themselves, and the /test endpoint verifies
// the actual session is read-only.

import { NextResponse, type NextRequest } from "next/server";
import { getDb, resolveTenantScope } from "@gps/shared";
import { authenticate } from "@/src/server/auth-helpers";
import { encryptConnectionUrl } from "@/src/server/adapters/connection-crypto";
import { ok, forbidden, badRequest, serverError } from "@/src/server/response";
import { writeAuditLog } from "@/src/server/audit/log";

export const runtime = "nodejs";

interface ConnectionBody {
  pmsType?: string;
  connectionUrl?: string;
  isReadOnly?: boolean;
}

const ALLOWED_PMS = ["qloapps", "mews", "cloudbeds", "apaleo", "custom"] as const;
type PmsType = (typeof ALLOWED_PMS)[number];

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;
  const claims = auth.claims;

  if (!claims.groups?.includes("Admin")) {
    return forbidden("Only admins can configure adapter connections.");
  }

  const scope = resolveTenantScope(claims);
  if (scope.kind === "denied") return forbidden(scope.reason);
  if (scope.kind !== "single-tenant") return forbidden("Chain-level scope not supported in v1.");
  const tenantId = scope.tenantId;

  let body: ConnectionBody;
  try {
    body = await request.json();
  } catch {
    return badRequest("BAD_REQUEST", "Invalid JSON body.");
  }

  const pmsType = (body.pmsType || "").trim() as PmsType;
  if (!ALLOWED_PMS.includes(pmsType)) {
    return badRequest("VALIDATION_ERROR", `pmsType must be one of: ${ALLOWED_PMS.join(", ")}.`);
  }

  const connectionUrl = (body.connectionUrl || "").trim();
  if (!connectionUrl) {
    return badRequest("VALIDATION_ERROR", "connectionUrl is required.");
  }
  // Basic sanity: must look like a postgres DSN.
  if (!/^postgres(ql)?:\/\//i.test(connectionUrl)) {
    return badRequest("VALIDATION_ERROR", "connectionUrl must be a postgres:// DSN.");
  }

  const isReadOnly = body.isReadOnly !== false; // default true
  if (isReadOnly && !/default_transaction_read_only/i.test(connectionUrl)) {
    return badRequest(
      "READ_ONLY_DSN_REQUIRED",
      "Read-only connections must include defaultTransactionReadOnly=true in the DSN. " +
        "Add ?default_transaction_read_only=true or &default_transaction_read_only=true to the DSN."
    );
  }

  const encrypted = encryptConnectionUrl(connectionUrl);

  const db = getDb();
  try {
    const rows = await db`
      INSERT INTO adapter_connections (tenant_id, pms_type, connection_url_encrypted, is_read_only)
      VALUES (${tenantId}, ${pmsType}, ${encrypted}, ${isReadOnly})
      RETURNING connection_id, pms_type, is_read_only, created_at
    `;
    const row = rows[0] as { connection_id: string; pms_type: string; is_read_only: boolean; created_at: string };

    await writeAuditLog(db, {
      tenantId,
      actorUserId: claims.sub,
      action: "CREATE",
      entityType: "adapter_connection",
      entityId: row.connection_id,
      before: null,
      after: { pmsType: row.pms_type, isReadOnly: row.is_read_only },
    });

    return ok({ connectionId: row.connection_id, pmsType: row.pms_type, isReadOnly: row.is_read_only });
  } catch (err) {
    console.error("[POST /api/adapter/connection] Failed:", err);
    return serverError();
  }
}
