// =============================================================================
// Sync state management — Card 1 §3.2 contract
// =============================================================================
// Reads/writes the sync_state table (created in TASK-001).
//
// Per Card 1:
//   - Primary key is composite (tenant_id, table_name)
//   - last_seen_xmin advances only after a complete source transaction is
//     consumed (Card 1 §3.4: a transaction with row count > updateChunkSize
//     is fetched across multiple chunks; state advances only when ALL rows
//     for a given xmin are read)
//   - where_clause tracks the per-table filter (Card 1's filteredTables)
//
// TODO(TASK-002): handle xmin wrapping (Card 1 known issue). When the source
// DB's xmin wraps, last_seen_xmin becomes invalid. v1 does not handle this;
// documented as a known issue.

import type { Db } from "@gps/shared";

export interface SyncState {
  tenantId: string;
  tableName: string;
  lastSeenXmin: bigint;
  whereClause: string | null;
  updatedAt: Date;
}

export class SyncStateStore {
  constructor(private db: Db, private tenantId: string) {}

  /**
   * Read the sync state for a table. Returns a fresh state (xmin=0) if
   * no row exists yet — this signals "first run, do full sync".
   */
  async get(tableName: string): Promise<SyncState> {
    const rows = await this.db`
      SELECT last_seen_xmin, coalesce(where_clause, '') as where_clause, updated_at
      FROM sync_state
      WHERE tenant_id = ${this.tenantId}
        AND table_name = ${tableName}
    `;
    if (rows.length === 0) {
      return {
        tenantId: this.tenantId,
        tableName,
        lastSeenXmin: 0n,
        whereClause: null,
        updatedAt: new Date(),
      };
    }
    const row = rows[0] as {
      last_seen_xmin: string | bigint;
      where_clause: string;
      updated_at: Date;
    };
    return {
      tenantId: this.tenantId,
      tableName,
      lastSeenXmin: typeof row.last_seen_xmin === "string"
        ? BigInt(row.last_seen_xmin)
        : BigInt(row.last_seen_xmin as bigint),
      whereClause: row.where_clause || null,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Set the xmin cursor. Idempotent: INSERT ... ON CONFLICT DO UPDATE.
   * Per Card 1: this is called after each chunk's transaction commits,
   * so a crash mid-sync resumes from the last committed xmin.
   */
  async setXmin(tableName: string, xmin: bigint): Promise<void> {
    await this.db`
      INSERT INTO sync_state (tenant_id, table_name, last_seen_xmin)
      VALUES (${this.tenantId}, ${tableName}, ${xmin.toString()})
      ON CONFLICT (tenant_id, table_name)
      DO UPDATE SET last_seen_xmin = ${xmin.toString()}
    `;
  }

  /**
   * Set the where_clause for a filtered table. Per Card 1: changing the
   * where_clause triggers a re-sync if resyncOnSchemaChange=true, otherwise
   * aborts.
   */
  async setWhere(tableName: string, whereClause: string | null): Promise<void> {
    await this.db`
      INSERT INTO sync_state (tenant_id, table_name, where_clause)
      VALUES (${this.tenantId}, ${tableName}, ${whereClause})
      ON CONFLICT (tenant_id, table_name)
      DO UPDATE SET where_clause = ${whereClause}
    `;
  }

  /**
   * Returns all table names registered in sync_state for this tenant.
   * Useful for the admin UI's sync status dashboard.
   */
  async listTables(): Promise<string[]> {
    const rows = await this.db`
      SELECT table_name FROM sync_state
      WHERE tenant_id = ${this.tenantId}
      ORDER BY table_name
    `;
    return rows.map((r: unknown) => (r as { table_name: string }).table_name);
  }
}
