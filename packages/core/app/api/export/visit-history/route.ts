// =============================================================================
// GET /api/export/visit-history — real CSV export of visit history
// =============================================================================
// Streams a CSV file. Visit count is derived from guest_profile_links
// (COUNT of linked raw rows), per owner directive. We do NOT read any
// visit_count column from the hotel DB.

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

  const scope = resolveTenantScope(claims);
  if (scope.kind === "denied") return forbidden(scope.reason);
  if (scope.kind !== "single-tenant") return forbidden("Chain-level scope not supported in v1.");
  const tenantId = scope.tenantId;
  const guestId = request.nextUrl.searchParams.get("guestId");

  const db = getDb();
  try {
    // One row per (guest, linked source row) — the visit history is the set
    // of grouped raw rows, not a separate visit table. A guestId narrows the
    // export to the profile the operator is viewing.
    const rows = guestId
      ? await db`
          SELECT g.guest_id,
                 g.first_name,
                 g.last_name,
                 g.email,
                 g.phone,
                 l.source_table,
                 l.source_row_id,
                 l.source_created_at,
                 l.linked_at
          FROM guest_profile_links l
          JOIN guests g ON g.guest_id = l.guest_id
          WHERE l.tenant_id = ${tenantId}
            AND g.deleted_at IS NULL
            AND g.guest_id = ${guestId}
          ORDER BY l.source_created_at DESC NULLS LAST
        `
      : await db`
          SELECT g.guest_id,
                 g.first_name,
                 g.last_name,
                 g.email,
                 g.phone,
                 l.source_table,
                 l.source_row_id,
                 l.source_created_at,
                 l.linked_at
          FROM guest_profile_links l
          JOIN guests g ON g.guest_id = l.guest_id
          WHERE l.tenant_id = ${tenantId}
            AND g.deleted_at IS NULL
          ORDER BY l.source_created_at DESC NULLS LAST, g.last_name, g.first_name
        `;

    const header = [
      "guest_id", "first_name", "last_name", "email", "phone",
      "source_table", "source_row_id", "source_created_at", "linked_at",
    ];
    const lines = [header.join(",")];
    for (const r of rows as Record<string, unknown>[]) {
      lines.push(header.map(h => csvEscape(r[h])).join(","));
    }
    const csv = lines.join("\r\n") + "\r\n";

    const filename = `visit-history-${guestId ? `${guestId}-` : ""}${new Date().toISOString().slice(0, 10)}.csv`;
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[GET /api/export/visit-history] Failed:", err);
    return serverError();
  }
}
