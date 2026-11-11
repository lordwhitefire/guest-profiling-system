// =============================================================================
// Update sync — Card 1 §3.4 (xmin-cursor tracking)
// =============================================================================
// Walks from last_seen_xmin + 1 to current max(xmin) in chunks of
// updateChunkSize rows. Idempotent upsert per chunk: DELETE matching PKs +
// INSERT in a single transaction.
//
// Critical detail (Card 1 §3.4): a transaction with row count > chunk size
// is fetched across multiple chunks, but the state.last_seen_xmin only
// advances past a transaction when ALL of that transaction's rows have been
// read. We detect this by tracking when the xmin value changes between
// consecutive rows — until it changes, the offset counter increments and
// the cursor stays put.

import type { Db } from "@gps/shared";
import type { Throttle } from "./throttle.js";
import type { MappedGuest, SourceMapping } from "./mappings/types.js";

export interface UpdateRange {
  fullTable: boolean;
  startXmin: bigint;
  endXmin: bigint;
}

export interface UpdateSyncResult {
  rowsUpdated: number;
  xminAdvanced: boolean;
  startXmin: bigint;
  endXmin: bigint;
}

export class UpdateSync {
  constructor(
    private source: Db,
    private target: Db,
    private mapping: SourceMapping,
    private tenantId: string,
    private chunkSize: number,
    private throttle: Throttle,
  ) {}

  /**
   * Determine the range to sync. Per Card 1:
   *   - If last_seen_xmin is 0 (first run): fullTable=true
   *   - If target row count < fullCopyThreshold × source count: fullTable=true (TODO)
   *   - Otherwise: startXmin = last_seen_xmin + 1, endXmin = current max(xmin)
   */
  async getUpdateRange(lastSeenXmin: bigint, whereClause: string | null): Promise<UpdateRange> {
    const schema = this.mapping.schema;
    const whereSql = whereClause ? `WHERE ${whereClause}` : "";

    // Get current max(xmin). Use unsafe() for the dynamic table name and
    // WHERE clause — postgres.js's typed template literals don't accept
    // arbitrary identifiers as parameters.
    const rows = await this.source.unsafe(
      `SELECT max(xmin::text::bigint) as max_xmin FROM ${schema.tableName} ${whereSql}`
    );

    const row = rows[0] as { max_xmin: string | bigint | null } | undefined;
    const endXmin =
      row === undefined || row.max_xmin === null
        ? 0n
        : typeof row.max_xmin === "string"
          ? BigInt(row.max_xmin)
          : BigInt(row.max_xmin as bigint);

    if (lastSeenXmin === 0n) {
      return { fullTable: true, startXmin: 0n, endXmin };
    }

    // Check target row count for fullCopyThreshold logic.
    // v1 simplification: skip the threshold check; just do incremental.
    // The threshold is documented in the OpenSpec brief but not implemented here.
    // TODO: implement fullCopyThreshold check after the first load test.
    return {
      fullTable: false,
      startXmin: lastSeenXmin + 1n,
      endXmin,
    };
  }

  /**
   * Walk from startXmin to endXmin in chunks of chunkSize rows.
   * Returns the total rows updated and the final xmin value reached.
   */
  async sync(startXmin: bigint, endXmin: bigint, whereClause: string | null): Promise<UpdateSyncResult> {
    const schema = this.mapping.schema;
    let totalRows = 0;
    let currentXmin = startXmin;
    let offset = 0;

    while (currentXmin <= endXmin) {
      this.throttle.start();

      const orderBy = schema.primaryKeys.map((k) => `${k} asc`).join(", ");
      const colList = schema.columns.map((c) => c.name).join(", ");
      const whereExtra = whereClause ? `AND ${whereClause}` : "";
      // Use unsafe() for the full query — dynamic identifiers (table name,
      // column list, ORDER BY). xmin/offset/limit are integers we control.
      const sql =
        `SELECT xmin, ${colList} FROM ${schema.tableName} `
        + `WHERE xmin::text::bigint >= ${currentXmin.toString()} ${whereExtra} `
        + `ORDER BY xmin::text::bigint asc, ${orderBy} `
        + `OFFSET ${offset} LIMIT ${this.chunkSize}`;
      const rows = await this.source.unsafe(sql);

      this.throttle.end();

      if (rows.length === 0) {
        // No more rows in range.
        currentXmin = endXmin + 1n;
        offset = 0;
        break;
      }

      // Track xmin transitions within this chunk.
      let lastCompleteXmin = 0n;
      const mappedRows: MappedGuest[] = [];
      let lastXminInChunk = currentXmin;

      for (const row of rows as Array<Record<string, unknown>>) {
        const rowXmin =
          typeof row.xmin === "string" ? BigInt(row.xmin) : BigInt(row.xmin as number);
        lastXminInChunk = rowXmin;

        if (rowXmin === currentXmin) {
          // Same transaction as cursor; offset increments.
          offset++;
        } else {
          // Transaction boundary crossed; previous transaction is complete.
          lastCompleteXmin = currentXmin;
          currentXmin = rowXmin;
          offset = 1;
        }

        mappedRows.push(this.mapping.mapRow(row));
      }

      // Apply the chunk to target.
      if (mappedRows.length > 0) {
        await this.applyChunk(mappedRows);
        totalRows += mappedRows.length;
        await this.throttle.wait();
      }

      // Less than a full chunk — we've exhausted the range.
      if (lastXminInChunk === currentXmin && rows.length < this.chunkSize) {
        break;
      }

      // Suppress unused-variable warning.
      void lastCompleteXmin;
    }

    return {
      rowsUpdated: totalRows,
      xminAdvanced: totalRows > 0,
      startXmin,
      endXmin: currentXmin,
    };
  }

  /**
   * Apply a chunk of mapped rows to the target DB. Idempotent upsert:
   * DELETE matching source_refs + INSERT in a single transaction.
   */
  private async applyChunk(rows: MappedGuest[]): Promise<void> {
    if (rows.length === 0) return;

    const sourceRefs = rows.map((r) => r.source_ref);

    await this.target.begin(async (tx) => {
      // DELETE existing rows with these source_refs for this tenant.
      await tx`
        DELETE FROM guests
        WHERE tenant_id = ${this.tenantId}
          AND source_ref = ANY(${sourceRefs}::text[])
      `;

      // INSERT the mapped rows one at a time.
      // Slower than CopyFrom but type-safe and easy to verify.
      // Note: guest_id auto-generated; guest_phase defaults to 'UNKNOWN_CONTACT'.
      //
      // TODO(TASK-002 followup): preserve guest_phase across syncs. Current
      // implementation resets it on every sync pass because we DELETE + INSERT.
      for (const r of rows) {
        await tx`
          INSERT INTO guests
            (tenant_id, source_ref, first_name, last_name, email, phone,
             date_of_birth, preferences, comm_prefs, deleted_at, created_at, updated_at)
          VALUES
            (${this.tenantId}, ${r.source_ref}, ${r.first_name}, ${r.last_name},
             ${r.email}, ${r.phone}, ${r.date_of_birth},
             ${JSON.stringify(r.preferences)}::jsonb,
             ${JSON.stringify(r.comm_prefs)}::jsonb,
             ${r.deleted_at}, ${r.created_at}, ${r.updated_at})
        `;
      }
    });
  }
}
