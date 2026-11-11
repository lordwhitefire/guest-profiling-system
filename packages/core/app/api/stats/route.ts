// =============================================================================
// GET /api/stats — dashboard metrics for the caller's tenant
// =============================================================================
// Returns aggregate counts for the dashboard. Per Card 2 §4.5, this is
// tenant-scoped via the JWT claims.
//
// Returns:
//   { success, data: { totalGuests, totalVip, totalReturning, totalNew,
//                      totalThisMonth, lastSyncAt, syncErrors, auditEvents24h } }

import { NextResponse, type NextRequest } from "next/server";
import { getDb, resolveTenantScope } from "@gps/shared";
import { authenticate } from "@/src/server/auth-helpers";
import { ok, forbidden, serverError } from "@/src/server/response";

export const runtime = "nodejs";

export interface TenantStats {
  totalGuests: number;
  totalVip: number;
  totalReturning: number;
  totalNew: number;
  totalThisMonth: number;
  lastSyncAt: string | null;
  syncErrors: number;
  auditEvents24h: number;
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
    // Run all count queries in parallel
    const [
      totalRows,
      vipRows,
      returningRows,
      newRows,
      thisMonthRows,
      syncRows,
      audit24hRows,
    ] = await Promise.all([
      // Total guests (active, not soft-deleted)
      db`
        SELECT count(*)::int AS n FROM guests
        WHERE tenant_id = ${tenantId} AND deleted_at IS NULL
      `,
      // VIP guests
      db`
        SELECT count(*)::int AS n FROM guests
        WHERE tenant_id = ${tenantId} AND deleted_at IS NULL
          AND vip_level != 'NONE'
      `,
      // Returning guests (total_stays >= 2)
      db`
        SELECT count(*)::int AS n FROM guests
        WHERE tenant_id = ${tenantId} AND deleted_at IS NULL
          AND total_stays >= 2
      `,
      // New guests (total_stays <= 1)
      db`
        SELECT count(*)::int AS n FROM guests
        WHERE tenant_id = ${tenantId} AND deleted_at IS NULL
          AND total_stays <= 1
      `,
      // New this month
      db`
        SELECT count(*)::int AS n FROM guests
        WHERE tenant_id = ${tenantId} AND deleted_at IS NULL
          AND created_at >= date_trunc('month', NOW())
      `,
      // Last sync state
      db`
        SELECT table_name, last_seen_xmin, updated_at
        FROM sync_state
        WHERE tenant_id = ${tenantId}
        ORDER BY updated_at DESC
        LIMIT 1
      `,
      // Audit events in the last 24h
      db`
        SELECT count(*)::int AS n FROM audit_logs
        WHERE tenant_id = ${tenantId}
          AND created_at >= NOW() - INTERVAL '24 hours'
      `,
    ]);

    const total = (totalRows[0] as unknown as { n: number }).n;
    const lastSyncRow = syncRows[0] as { updated_at: string } | undefined;

    const stats: TenantStats = {
      totalGuests: total,
      totalVip: (vipRows[0] as unknown as { n: number }).n,
      totalReturning: (returningRows[0] as unknown as { n: number }).n,
      totalNew: (newRows[0] as unknown as { n: number }).n,
      totalThisMonth: (thisMonthRows[0] as unknown as { n: number }).n,
      lastSyncAt: lastSyncRow ? new Date(lastSyncRow.updated_at).toISOString() : null,
      syncErrors: 0,  // v1: no error tracking table; would need a separate sync_errors table
      auditEvents24h: (audit24hRows[0] as unknown as { n: number }).n,
    };

    return ok(stats);
  } catch (err) {
    console.error("[GET /api/stats] Failed:", err);
    return serverError();
  }
}
