// =============================================================================
// GET /api/sync-status — adapter-read sync status for the caller's tenant
// =============================================================================
// Returns the sync_state rows for the tenant's adapter(s), plus the most
// recent audit log entries with action='SYNC' for context.
//
// Used by the workspace UI's PMS Integration screen to show:
//   - Connection status (which tables are being synced)
//   - Last sync time per table
//   - Recent sync events

import { NextResponse, type NextRequest } from "next/server";
import { getDb, resolveTenantScope } from "@gps/shared";
import type { SyncState } from "@gps/shared";
import { authenticate } from "@/src/server/auth-helpers";
import { ok, forbidden, serverError } from "@/src/server/response";

export const runtime = "nodejs";

export interface SyncStatusResponse {
  states: Array<Omit<SyncState, "lastSeenXmin"> & { lastSeenXmin: string }>;
  recentEvents: Array<{
    logId: string;
    action: string;
    entityType: string;
    entityId: string | null;
    createdAt: string;
  }>;
  hasAdapterConnection: boolean;
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
    const [stateRows, eventRows, connRows] = await Promise.all([
      db`
        SELECT tenant_id, table_name, last_seen_xmin, where_clause, updated_at
        FROM sync_state
        WHERE tenant_id = ${tenantId}
        ORDER BY table_name
      `,
      db`
        SELECT log_id, action, entity_type, entity_id, created_at
        FROM audit_logs
        WHERE tenant_id = ${tenantId} AND action = 'SYNC'
        ORDER BY created_at DESC
        LIMIT 10
      `,
      db`
        SELECT connection_id, pms_type, is_read_only, created_at, updated_at
        FROM adapter_connections
        WHERE tenant_id = ${tenantId} AND deleted_at IS NULL
        LIMIT 1
      `,
    ]);

    const states: SyncStatusResponse["states"] = stateRows.map((r: Record<string, unknown>) => ({
      tenantId: String(r.tenant_id),
      tableName: String(r.table_name),
      lastSeenXmin: String(r.last_seen_xmin),
      whereClause: r.where_clause as string | null,
      updatedAt: new Date(r.updated_at as string),
    }));

    const recentEvents = eventRows.map((r: Record<string, unknown>) => ({
      logId: String(r.log_id),
      action: String(r.action),
      entityType: String(r.entity_type),
      entityId: r.entity_id ? String(r.entity_id) : null,
      createdAt: new Date(r.created_at as string).toISOString(),
    }));

    const hasAdapterConnection = connRows.length > 0;

    const response: SyncStatusResponse = {
      states,
      recentEvents,
      hasAdapterConnection,
    };

    return ok(response);
  } catch (err) {
    console.error("[GET /api/sync-status] Failed:", err);
    return serverError();
  }
}
