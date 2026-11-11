# Runbook — Schema Drift Handling

**Status**: documented (TASK-002)

## Summary

The adapter-read sync job (Card 1 contract) detects when the source PMS's schema changes — a column added, removed, or type-changed. The behavior depends on the `resyncOnSchemaChange` flag.

## Detection

The adapter's `SchemaValidator` reads the source table's column list and primary keys from `information_schema.columns` and `pg_index`, then compares to the expected schema declared in the source mapping (e.g., `packages/adapter-read/src/mappings/qloapps.ts`).

Mismatch cases detected:
- **Missing column** — source PMS dropped a column the mapping expects
- **Missing primary key** — source PMS changed its primary key (rare; usually indicates a schema migration)
- **Extra column** — source PMS added a column (tolerated in v1; the mapping only SELECTs the columns it explicitly lists)

Type changes (VARCHAR → TEXT, INT → BIGINT) are NOT detected in v1. TODO.

## Behavior on mismatch

The default `resyncOnSchemaChange` flag is `false`. On mismatch:

```
[ERROR] Schema mismatch detected. Reason: missing columns: email.
Set resyncOnSchemaChange=true on the adapter_connection to allow full re-sync.
```

The sync job aborts. The maintainer must:

1. Investigate the change on the source PMS (was it intentional? did the vendor push an update?)
2. Update the source mapping in `packages/adapter-read/src/mappings/qloapps.ts` if the mapping needs to change
3. Set `resyncOnSchemaChange=true` on the adapter_connection if a full re-sync is needed
4. Re-run the sync

## Setting `resyncOnSchemaChange=true`

The flag is per-tenant, stored in `adapter_connections`. v1 stores it as a column; in a future task it moves to a `config JSONB` column:

```sql
-- v1: the column doesn't exist yet; the flag is hardcoded to false in the adapter.
-- When the column is added (TASK-002 followup), use:
-- UPDATE adapter_connections SET resync_on_schema_change = true WHERE tenant_id = '<uuid>';
```

## Full re-sync procedure (manual)

v1 does not implement programmatic full re-sync. To force a full re-sync:

1. Stop the sync worker.
2. Truncate the target table for the tenant:

   ```sql
   DELETE FROM guests WHERE tenant_id = '<uuid>';
   ```

3. Reset the sync state cursor:

   ```sql
   DELETE FROM sync_state WHERE tenant_id = '<uuid>' AND table_name = 'ps_customer';
   ```

4. Re-run the sync worker. It will detect `last_seen_xmin = 0` and attempt a full sync — which v1 throws on. The maintainer must seed the target table manually via a one-off SQL script (e.g., `pg_dump | psql` filtered to the source table), then set the cursor to the current max(xmin):

   ```sql
   INSERT INTO sync_state (tenant_id, table_name, last_seen_xmin)
   VALUES ('<uuid>', 'ps_customer', (SELECT max(xmin::text::bigint) FROM <source_table>))
   ON CONFLICT (tenant_id, table_name) DO UPDATE SET last_seen_xmin = EXCLUDED.last_seen_xmin;
   ```

5. Subsequent sync runs will be incremental from the new cursor.

TODO(TASK-002 followup): implement programmatic full re-sync per Card 1's `copyFullTable` algorithm. The current manual procedure is documented for completeness; the adapter does not perform it.
