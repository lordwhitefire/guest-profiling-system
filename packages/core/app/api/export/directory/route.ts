// =============================================================================
// GET /api/export/directory — real CSV export of the active tenant's directory
// =============================================================================
// Streams a CSV file. No toasts. The response is text/csv with
// Content-Disposition: attachment; so the browser downloads it.

import { NextResponse, type NextRequest } from "next/server";
import { resolveTenantScope } from "@gps/shared";
import { authenticate } from "@/src/server/auth-helpers";
import { forbidden, serverError } from "@/src/server/response";
import { getDb } from "@gps/shared";

export const runtime = "nodejs";

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;
  const claims = auth.claims;

  const scope = resolveTenantScope(claims);
  if (scope.kind === "denied") return forbidden(scope.reason);
  if (scope.kind !== "single-tenant") return forbidden("Chain-level scope not supported in v1.");
  const tenantId = scope.tenantId;

  const db = getDb();
  try {
    const rows = await db`
      SELECT guest_id, first_name, last_name, email, phone,
             vip_level, total_stays, last_stay_date, guest_phase,
             created_at, updated_at
      FROM guests
      WHERE tenant_id = ${tenantId}
        AND deleted_at IS NULL
      ORDER BY last_name, first_name
    `;

    const header = [
      "guest_id", "first_name", "last_name", "email", "phone",
      "vip_level", "total_stays", "last_stay_date", "guest_phase",
      "created_at", "updated_at",
    ];
    const lines = [header.join(",")];
    for (const r of rows as Record<string, unknown>[]) {
      lines.push(header.map(h => csvEscape(r[h])).join(","));
    }
    const csv = lines.join("\r\n") + "\r\n";

    const filename = `directory-${tenantId}-${new Date().toISOString().slice(0, 10)}.csv`;
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[GET /api/export/directory] Failed:", err);
    return serverError();
  }
}
