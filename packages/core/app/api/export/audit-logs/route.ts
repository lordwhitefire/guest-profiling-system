// =============================================================================
// GET /api/export/audit-logs — real CSV export of audit logs
// =============================================================================

import { NextResponse, type NextRequest } from "next/server";
import { resolveTenantScope, getDb } from "@gps/shared";
import { authenticate } from "@/src/server/auth-helpers";
import { forbidden, serverError } from "@/src/server/response";

export const runtime = "nodejs";

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;
  const claims = auth.claims;

  if (!claims.groups?.includes("Admin")) {
    return forbidden("Only admins can export audit logs.");
  }

  const scope = resolveTenantScope(claims);
  if (scope.kind === "denied") return forbidden(scope.reason);
  if (scope.kind !== "single-tenant") return forbidden("Chain-level scope not supported in v1.");
  const tenantId = scope.tenantId;

  const db = getDb();
  try {
    const rows = await db`
      SELECT log_id, actor_user_id, action, entity_type, entity_id,
             before::text AS before_json, after::text AS after_json,
             created_at
      FROM audit_logs
      WHERE tenant_id = ${tenantId}
      ORDER BY created_at DESC
      LIMIT 10000
    `;

    const header = [
      "log_id", "actor_user_id", "action", "entity_type", "entity_id",
      "before_json", "after_json", "created_at",
    ];
    const lines = [header.join(",")];
    for (const r of rows as Record<string, unknown>[]) {
      lines.push(header.map(h => csvEscape(r[h])).join(","));
    }
    const csv = lines.join("\r\n") + "\r\n";

    const filename = `audit-logs-${tenantId}-${new Date().toISOString().slice(0, 10)}.csv`;
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[GET /api/export/audit-logs] Failed:", err);
    return serverError();
  }
}
