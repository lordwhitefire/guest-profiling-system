// =============================================================================
// Delete sync — Card 1 §3.5 (divide-and-conquer on PK ranges)
// =============================================================================
// Detects source row deletions by comparing PK-set hashes between source
// and target in chunks. Where hashes differ, recurse (halve the chunk size)
// until reaching minDeleteChunkSize, then re-sync that exact range.

import type { Db } from "@gps/shared";
import type { Throttle } from "./throttle.js";
import type { SourceMapping, MappedGuest } from "./mappings/types.js";

export type PrimaryKeySet = (string | number)[];

export interface DeleteSyncResult {
  rangesResynced: number;
  rowsResynced: number;
}

export class DeleteSync {
  constructor(
    private source: Db,
    private target: Db,
    private mapping: SourceMapping,
    private tenantId: string,
    private chunkSize: number,
    private minChunkSize: number,
    private throttle: Throttle,
  ) {}

  /**
   * Walk the entire PK range, chunk by chunk, syncing deletions.
   * Per Card 1: starts from the minimum PK and walks forward in chunks of
   * chunkSize. Each chunk's hashes are compared; if they differ, recurse.
   */
  async sync(): Promise<DeleteSyncResult> {
    const schema = this.mapping.schema;

    // Get the source PK range (min).
    const rangeStart = await this.getSourcePkRangeStart();
    if (rangeStart === null) {
      // Source table is empty; nothing to sync.
      return { rangesResynced: 0, rowsResynced: 0 };
    }

    let startKey = rangeStart;
    let totalRanges = 0;
    let totalRows = 0;

    while (true) {
      this.throttle.start();
      const endKey = await this.getKeyAtOffset(startKey, this.chunkSize);
      this.throttle.end();

      const sourceHash = await this.hashRange(startKey, endKey, "source");
      const targetHash = await this.hashRange(startKey, endKey, "target");

      if (sourceHash !== targetHash) {
        // Mismatch — re-sync this range.
        // TODO: implement true divide-and-conquer halving per Card 1 §3.5.
        // v1 simplification: re-sync the entire mismatched range.
        // Functionally equivalent; less efficient for large mismatched ranges.
        const rowsReSynced = await this.resyncRange(startKey, endKey);
        totalRanges++;
        totalRows += rowsReSynced;
      }

      // Move to next chunk.
      if (this.keysEqual(startKey, endKey)) {
        break;
      }
      startKey = endKey;
      await this.throttle.wait();
    }

    return {
      rangesResynced: totalRanges,
      rowsResynced: totalRows,
    };
  }

  /**
   * Get the minimum PK from the source table. Returns null if source is empty.
   */
  private async getSourcePkRangeStart(): Promise<PrimaryKeySet | null> {
    const schema = this.mapping.schema;
    const pks = schema.primaryKeys;
    const orderBy = pks.map((k) => `${k} asc`).join(", ");

    const rows = await this.source.unsafe(
      `SELECT ${pks.join(", ")} FROM ${schema.tableName} ORDER BY ${orderBy} LIMIT 1`
    );

    if (rows.length === 0) return null;
    const row = rows[0] as Record<string, unknown>;
    return pks.map((k) => row[k] as string | number);
  }

  /**
   * Get the PK at a given offset from startKey. Per Card 1's getKeyAtOffset.
   */
  private async getKeyAtOffset(startKey: PrimaryKeySet, offset: number): Promise<PrimaryKeySet> {
    const schema = this.mapping.schema;
    const pks = schema.primaryKeys;
    const orderByAsc = pks.map((k) => `${k} asc`).join(", ");
    const orderByDesc = pks.map((k) => `${k} desc`).join(", ");

    // Build WHERE pk >= startKey clause.
    const whereParts = pks.map((k, i) => `${k} >= ${this.escapeValue(startKey[i]!)}`);
    const whereStr = whereParts.join(" AND ");

    const rows = await this.source.unsafe(
      `SELECT ${pks.join(", ")} FROM (`
      + ` SELECT ${pks.join(", ")} FROM ${schema.tableName}`
      + ` WHERE ${whereStr}`
      + ` ORDER BY ${orderByAsc} LIMIT ${offset}`
      + `) ids ORDER BY ${orderByDesc} LIMIT 1`
    );

    if (rows.length === 0) {
      return startKey;
    }
    const row = rows[0] as Record<string, unknown>;
    return pks.map((k) => row[k] as string | number);
  }

  /**
   * Compute the md5 hash of array_agg(pk::varchar) for a PK range.
   * Per Card 1: SELECT coalesce(md5(array_agg((pk_cols)::varchar)::varchar), '')
   */
  private async hashRange(startKey: PrimaryKeySet, endKey: PrimaryKeySet, which: "source" | "target"): Promise<string> {
    const schema = this.mapping.schema;
    const pks = schema.primaryKeys;
    const db = which === "source" ? this.source : this.target;

    // Build WHERE clause for the closed interval [startKey, endKey].
    const startParts = pks.map((k, i) => `${k} >= ${this.escapeValue(startKey[i]!)}`);
    const endParts = pks.map((k, i) => `${k} <= ${this.escapeValue(endKey[i]!)}`);
    const whereStr = [...startParts, ...endParts].join(" AND ");

    const pkConcat = pks.length === 1
      ? `(${pks[0]})::varchar`
      : `(${pks.join(",")})::varchar`;

    // For target, also filter by tenant_id.
    const targetFilter = which === "target"
      ? `AND tenant_id = '${this.tenantId}'`
      : "";

    const rows = await db.unsafe(
      `SELECT coalesce(md5(array_agg(${pkConcat})::varchar), '') as hash`
      + ` FROM ${schema.tableName}`
      + ` WHERE ${whereStr} ${targetFilter}`
    );

    const row = rows[0] as { hash: string } | undefined;
    return row?.hash ?? "";
  }

  /**
   * Re-sync a specific PK range: DELETE from target + INSERT from source.
   * Per Card 1's updateChangedRange: single transaction.
   */
  private async resyncRange(startKey: PrimaryKeySet, endKey: PrimaryKeySet): Promise<number> {
    const schema = this.mapping.schema;
    const pks = schema.primaryKeys;

    // Build WHERE clause for the range.
    const startParts = pks.map((k, i) => `${k} >= ${this.escapeValue(startKey[i]!)}`);
    const endParts = pks.map((k, i) => `${k} <= ${this.escapeValue(endKey[i]!)}`);
    const whereStr = [...startParts, ...endParts].join(" AND ");

    // Read all source rows in this range.
    const sourceRows = await this.source.unsafe(
      `SELECT ${schema.columns.map((c) => c.name).join(", ")}`
      + ` FROM ${schema.tableName}`
      + ` WHERE ${whereStr}`
    );

    const mappedRows: MappedGuest[] = (sourceRows as Array<Record<string, unknown>>).map(
      (r) => this.mapping.mapRow(r),
    );

    await this.target.begin(async (tx) => {
      // Delete target rows in this range for this tenant.
      // We match by source_ref (which is the source PK as string) since our
      // target table doesn't carry the source PK columns directly.
      const sourceRefs = mappedRows.map((r) => r.source_ref);
      if (sourceRefs.length > 0) {
        await tx`
          DELETE FROM guests
          WHERE tenant_id = ${this.tenantId}
            AND source_ref = ANY(${sourceRefs}::text[])
        `;
      } else {
        // No source rows in this range — delete target rows in the PK range.
        // We use a subquery on the source DB's PK range.
        // For v1 simplicity, delete by matching source_ref against the range.
        await tx`
          DELETE FROM guests
          WHERE tenant_id = ${this.tenantId}
            AND source_ref >= ${String(startKey[0])}
            AND source_ref <= ${String(endKey[0])}
        `;
      }

      // Insert mapped source rows.
      for (const r of mappedRows) {
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

    return mappedRows.length;
  }

  /**
   * Escape a value for embedding in unsafe() SQL. Numbers pass through;
   * strings get single-quoted with embedded quotes doubled.
   */
  private escapeValue(v: string | number): string {
    if (typeof v === "number") return String(v);
    // Replace ' with '' (Postgres SQL string literal escaping).
    return `'${String(v).replace(/'/g, "''")}'`;
  }

  private keysEqual(a: PrimaryKeySet, b: PrimaryKeySet): boolean {
    if (a.length !== b.length) return false;
    return a.every((v, i) => String(v) === String(b[i]));
  }
}
