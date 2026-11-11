// =============================================================================
// Bulk import — first-load seed from a QloApps source PMS into our guests table
// =============================================================================
// Per the TASK-002 brief (line 147 of openspec/tasks/TASK-002/task.md):
//   "The owner can run the worker locally against a seeded QloApps fixture DB;
//    CI runs the unit tests."
//
// And per packages/adapter-read/src/worker.ts:
//   "Full table sync not yet implemented. Run the seeding script first
//    (docs/runbook/new-tenant.md) to populate sync_state.last_seen_xmin."
//
// This module IS that seeding script. It does the first-load bulk copy that
// the worker's incremental sync cannot do yet, and it sets sync_state so the
// worker can pick up from there with incremental syncs.
//
// CONTRACT:
//   - Reads ONLY the QloApps allow-listed columns from ps_customer
//   - Never reads passwd, secure_key, ip_registration_newsletter, last_passwd_gen
//   - Idempotent: re-running deletes + re-inserts guests with matching
//     (tenant_id, source_ref).
//   - Sets sync_state.last_seen_xmin = max(xmin) on source — so the next
//     worker run will only pick up *new* changes.
//   - Soft-deleted source rows (deleted=1) ARE imported, with deleted_at set.
//     This matches Card 1's "deletions are events, not absences" rule.
//
// Testability:
//   The `bulkImport` function takes injected `source` and `target` postgres
//   clients, so unit tests can use pg-mem to verify the full flow without a
//   real Postgres install.

import type { Db } from "@gps/shared";
import { qloappsMapping } from "../mappings/qloapps.js";
import type { MappedGuest } from "../mappings/types.js";

export interface BulkImportResult {
  rowsRead: number;
  rowsInserted: number;
  rowsSkipped: number;
  finalXmin: bigint;
  tableName: string;
  durationMs: number;
}

export interface BulkImportOptions {
  tenantId: string;
  tableName?: string;            // default: ps_customer (QloApps)
  chunkSize?: number;            // default: 500
  onProgress?: (done: number, total: number) => void;
}

/**
 * Run the first-load bulk import.
 *
 * Steps:
 *   1. SELECT count(*) FROM ps_customer (for progress reporting)
 *   2. Stream rows in chunks of `chunkSize`
 *   3. For each row: mapRow() → MappedGuest, then INSERT into guests
 *      with idempotent DELETE of existing (tenant_id, source_ref) first
 *   4. SELECT max(xmin::text::bigint) FROM ps_customer
 *   5. UPSERT sync_state (tenant_id, table_name) with new xmin
 *
 * Returns a summary object for logging.
 */
export async function bulkImport(
  source: Db,
  target: Db,
  opts: BulkImportOptions,
): Promise<BulkImportResult> {
  const startTime = Date.now();
  const tableName = opts.tableName ?? qloappsMapping.schema.tableName;
  const chunkSize = opts.chunkSize ?? 500;
  const tenantId = opts.tenantId;

  // 1. Count source rows
  const countRows = await source.unsafe(
    `SELECT count(*)::int AS n FROM ${tableName}`,
  );
  const totalRows = (countRows[0] as unknown as { n: number }).n;

  // 2. Stream in chunks. We use OFFSET/LIMIT for simplicity. For 100k+ rows
  // a cursor would be better, but the fixture is ~210 rows and even a real
  // hotel PMS rarely has more than 50k guests.
  let rowsRead = 0;
  let rowsInserted = 0;
  let rowsSkipped = 0;
  const selectColumns = qloappsMapping.schema.columns
    .map((c) => c.name)
    .join(", ");

  for (let offset = 0; offset < totalRows; offset += chunkSize) {
    const chunkRows = await source.unsafe(
      `SELECT ${selectColumns} FROM ${tableName}
       ORDER BY id_customer
       LIMIT ${chunkSize} OFFSET ${offset}`,
    );

    if (chunkRows.length === 0) break;

    // 3. For each row: map → MappedGuest → idempotent INSERT
    for (const row of chunkRows as Record<string, unknown>[]) {
      const mapped: MappedGuest = qloappsMapping.mapRow(row);

      // Skip rows with empty source_ref (shouldn't happen for QloApps but
      // defensive — id_customer is the PK and is NOT NULL)
      if (mapped.source_ref === "") {
        rowsSkipped++;
        continue;
      }

      // Idempotent: delete existing row with same (tenant_id, source_ref)
      // before inserting. This makes the script safe to re-run.
      await target`
        DELETE FROM guests
        WHERE tenant_id = ${tenantId}
          AND source_ref = ${mapped.source_ref}
      `;

      // Insert the new/updated row
      await target`
        INSERT INTO guests
          (tenant_id, source_ref, first_name, last_name, email, phone,
           date_of_birth, preferences, comm_prefs, guest_phase,
           deleted_at, created_at, updated_at)
        VALUES
          (${tenantId},
           ${mapped.source_ref},
           ${mapped.first_name},
           ${mapped.last_name},
           ${mapped.email},
           ${mapped.phone},
           ${mapped.date_of_birth},
           ${JSON.stringify(mapped.preferences)}::jsonb,
           ${JSON.stringify(mapped.comm_prefs)}::jsonb,
           'UNKNOWN_CONTACT',
           ${mapped.deleted_at},
           ${mapped.created_at},
           ${mapped.updated_at})
      `;
      rowsInserted++;
    }

    rowsRead += chunkRows.length;
    opts.onProgress?.(rowsRead, totalRows);
  }

  // 4. Get final max(xmin) from source — this is the cursor the worker will
  // use on its next incremental run.
  const maxRows = await source.unsafe(
    `SELECT max(xmin::text::bigint) AS max_xmin FROM ${tableName}`,
  );
  const maxVal = (maxRows[0] as unknown as { max_xmin: string | bigint | null }).max_xmin;
  const finalXmin =
    maxVal === null || maxVal === undefined ? 0n : BigInt(String(maxVal));

  // 5. Upsert sync_state so the worker's next run picks up only new changes
  await target`
    INSERT INTO sync_state (tenant_id, table_name, last_seen_xmin)
    VALUES (${tenantId}, ${tableName}, ${finalXmin.toString()})
    ON CONFLICT (tenant_id, table_name)
    DO UPDATE SET last_seen_xmin = ${finalXmin.toString()}
  `;

  return {
    rowsRead,
    rowsInserted,
    rowsSkipped,
    finalXmin,
    tableName,
    durationMs: Date.now() - startTime,
  };
}
