// =============================================================================
// GET /api/audit-logs — list audit log entries for the caller's tenant
// =============================================================================
// Per Card 2's tenant scope resolver: caller sees only their tenant's logs.
// Supports pagination + optional filters:
//   ?page=1&limit=20
//   ?action=READ|CREATE|UPDATE|DELETE|DSR_EXPORT|DSR_DELETE|SYNC
//   ?entityType=guest|reservation|user|tenant|adapter_connection
//
// Returns { success, data: AuditLog[], metadata: { page, limit, total } }.

import { NextResponse, type NextRequest } from "next/server";
import { getDb, resolveTenantScope } from "@gps/shared";
import type { AuditLog } from "@gps/shared";
import { authenticate, getIntQuery } from "@/src/server/auth-helpers";
import { ok, forbidden, serverError } from "@/src/server/response";

export const runtime = "nodejs";

const VALID_ACTIONS = new Set([
  "READ", "CREATE", "UPDATE", "DELETE", "DSR_EXPORT", "DSR_DELETE", "SYNC",
]);

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;
  const claims = auth.claims;

  const scope = resolveTenantScope(claims);
  if (scope.kind === "denied") {
    return forbidden(scope.reason);
  }
  if (scope.kind !== "single-tenant") {
    return forbidden("Chain-level scope not supported in v1.");
  }

  const tenantId = scope.tenantId;
  const page = getIntQuery(request, "page", 1, Number.MAX_SAFE_INTEGER);
  const limit = getIntQuery(request, "limit", 20, 100);
  const actionFilter = request.nextUrl.searchParams.get("action");
  const entityTypeFilter = request.nextUrl.searchParams.get("entityType");

  const db = getDb();

  try {
    // Build WHERE conditions dynamically. postgres.js's tagged template
    // composes parameterized SQL safely.
    let whereClause = "tenant_id = $1";
    const params: unknown[] = [tenantId];
    let paramIdx = 2;

    if (actionFilter && VALID_ACTIONS.has(actionFilter)) {
      whereClause += ` AND action = $${paramIdx++}`;
      params.push(actionFilter);
    }
    if (entityTypeFilter) {
      whereClause += ` AND entity_type = $${paramIdx++}`;
      params.push(entityTypeFilter);
    }

    const countSql = `SELECT count(*)::int AS n FROM audit_logs WHERE ${whereClause}`;
    const countRows = await db.unsafe(countSql, params as any[]);
    const total = (countRows[0] as unknown as { n: number }).n;

    const listSql = `
      SELECT log_id, tenant_id, actor_user_id, action, entity_type, entity_id,
             before, after, created_at
      FROM audit_logs
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    `;
    params.push(limit, (page - 1) * limit);
    const rows = await db.unsafe(listSql, params as any[]) as Array<Record<string, unknown>>;

    const logs: AuditLog[] = rows.map((row) => ({
      logId: String(row.log_id),
      tenantId: String(row.tenant_id),
      actorUserId: row.actor_user_id ? String(row.actor_user_id) : null,
      action: String(row.action) as AuditLog["action"],
      entityType: String(row.entity_type),
      entityId: row.entity_id ? String(row.entity_id) : null,
      before: row.before as Record<string, unknown> | null,
      after: row.after as Record<string, unknown> | null,
      createdAt: new Date(row.created_at as string),
    }));

    return ok<AuditLog[]>(logs, { page, limit, total });
  } catch (err) {
    console.error("[GET /api/audit-logs] Failed:", err);
    return serverError();
  }
}
