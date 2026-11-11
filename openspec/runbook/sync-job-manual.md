# Runbook — Sync Job Manual Trigger

**Status**: documented (TASK-002)

## Summary

The adapter-read sync job runs on a cron (default every 5 minutes). The admin UI exposes a "Trigger sync now" button at `/admin/sync` for manual triggers (e.g., after a schema migration, or to verify the adapter is healthy).

You can also trigger a sync from the CLI:

```bash
# Single sync pass for one tenant
pnpm --filter @gps/adapter-read start -- --tenant=<tenant-uuid>

# Continuous mode (runs every SYNC_INTERVAL_SECONDS, default 300 = 5 min)
pnpm --filter @gps/adapter-read start -- --tenant=<tenant-uuid> --continuous

# Override throttle percentage for this run only
pnpm --filter @gps/adapter-read start -- --tenant=<tenant-uuid> --throttle=50
```

## Expected output

```
[INFO] Starting sync for tenant <uuid> with throttle at 0.75%
[INFO] PMS type: qloapps
[INFO] Connecting to source PMS (read-only)
[INFO] Loaded mapping for qloapps (table: ps_customer)
[INFO] Validating tables
[INFO] Fetching update range for table ps_customer
[INFO] Updating table ps_customer (xmin 12345 → 12400, 55 rows)
[INFO] Updated 55 row(s); cursor at xmin 12400
[INFO] Syncing deletions for table ps_customer
[INFO] Deletions: 0 range(s) re-synced, 0 row(s) updated
[INFO] Done: 55 row(s) updated in update sync; 0 in delete sync
```

## Troubleshooting

### "No adapter connection found for tenant"

The tenant has no row in `adapter_connections`. Create one via the admin UI at `/admin/tenants`, or via SQL:

```sql
INSERT INTO adapter_connections (tenant_id, pms_type, connection_url_encrypted, is_read_only)
VALUES (
  '<tenant-uuid>',
  'qloapps',
  encrypt_field('postgres://readonly_user:password@pms-host:5432/pms?default_transaction_read_only=true', current_setting('app.field_encryption_key')),
  true
);
```

### "Adapter connection is not marked read-only"

The `is_read_only` flag is `false`. The adapter refuses to sync — Card 1 contract requires read-only source access. Fix the flag:

```sql
UPDATE adapter_connections SET is_read_only = true WHERE tenant_id = '<tenant-uuid>';
```

### "Schema mismatch detected"

The source PMS's schema changed (column added, removed, or type changed). See [schema-drift.md](./schema-drift.md).

### "Full table sync not yet implemented"

`sync_state.last_seen_xmin` is 0 (first run for this table). v1 does not implement the one-time full sync — you must seed the sync state manually:

```sql
-- Find the current max(xmin) on the source PMS and set it as the cursor
-- (skipping the initial historical data). For a real first-time load,
-- write a one-off script that copies all source rows into the target.
UPDATE sync_state
SET last_seen_xmin = (SELECT max(xmin::text::bigint) FROM <source_table>)
WHERE tenant_id = '<tenant-uuid>' AND table_name = 'ps_customer';
```

### Sync hangs (no output for >1 minute)

Likely causes:
- Source PMS unreachable (network issue, credentials changed)
- Throttle set too low (e.g., `--throttle=1` means 99% sleep — extremely slow)
- Source PMS under heavy load (the throttle is doing its job)

Cancel with Ctrl+C. Check the source PMS connection:

```bash
psql "$SOURCE_PMS_URL" -c "SELECT 1"
```

### Cancelling a running sync

Ctrl+C is safe. The sync job is idempotent — the next run resumes from the last committed `last_seen_xmin` cursor. No data corruption risk.
