# Database backup and recovery runbook

This runbook covers backing up and restoring the Guest Profiling System
Postgres database on Render.

## Automated backups (Render-managed)

Render's managed Postgres includes automatic daily backups for paid plans
(Starter and above). The retention window is:
- Starter: 7 days
- Standard: 14 days
- Pro: 30 days

To restore from a Render-managed backup:
1. Open the Render dashboard
2. Navigate to your `gps-db` Postgres service
3. Click the "Backups" tab
4. Select the snapshot to restore from
5. Click "Restore" — Render creates a new Postgres instance from the snapshot
6. Update the `DATABASE_URL` environment variable on the `gps-core` and
   `gps-sync-worker` services to point at the new instance

## Manual backups (additional safety)

For NDPR/GDPR/CCPA compliance, we also take manual weekly backups and
store them outside Render's managed backups. Run this from your laptop
or a CI job:

```bash
# Set these from your Render dashboard or `render env:list`
export DATABASE_URL="postgres://..."

# Create a timestamped backup
TIMESTAMP=$(date -u +%Y%m%dT%H%M%SZ)
BACKUP_FILE="gps-backup-${TIMESTAMP}.sql.gz"

# Dump the database (gzip-compressed)
pg_dump --no-owner --no-acl "$DATABASE_URL" | gzip > "$BACKUP_FILE"

# Verify the backup is non-empty
ls -la "$BACKUP_FILE"

# Upload to your backup target (S3, GCS, Azure Blob, etc.)
# Example using AWS CLI:
aws s3 cp "$BACKUP_FILE" s3://your-backup-bucket/gps/$BACKUP_FILE \
  --sse AES256 \
  --metadata "tenant=gps,backup-type=manual,timestamp=$TIMESTAMP"

# Clean up local file
rm "$BACKUP_FILE"

echo "Backup complete: s3://your-backup-bucket/gps/$BACKUP_FILE"
```

## Restore procedure

To restore from a manual backup:

```bash
# Download the backup
aws s3 cp s3://your-backup-bucket/gps/gps-backup-YYYYMMDDTHHMMSSZ.sql.gz .

# Decompress and restore to a new database (NEVER restore over production directly)
gunzip -c gps-backup-YYYYMMDDTHHMMSSZ.sql.gz | \
  psql "postgres://user:pass@new-host:5432/gps_restore"

# Verify the restore
psql "postgres://user:pass@new-host:5432/gps_restore" -c "
  SELECT count(*) FROM guests;
  SELECT count(*) FROM audit_logs;
  SELECT count(*) FROM sync_state;
"

# Once verified, point the app at the restored database by updating
# DATABASE_URL on Render, then redeploy.
```

## Retention policy (NDPR/GDPR/CCPA)

Per the project plan, we honor:
- **NDPR (Nigeria)**: 7-year retention for guest records
- **GDPR (EU)**: Right to erasure honored via the data-requests endpoint
- **CCPA (US)**: Right to deletion honored via the data-requests endpoint

Manual backups are retained for 7 years (matching NDPR). After 7 years,
manual backups are deleted via a lifecycle policy on the backup bucket.

To DELETE a guest record from a backup (NDPR/GDPR/CCPA right to erasure):
1. Restore the backup to a temporary database (per "Restore procedure" above)
2. Run: `DELETE FROM guests WHERE guest_id = '<guest_id>';`
3. Re-dump the modified database to a new backup file
4. Replace the original backup file in S3 with the modified one
5. Document the deletion in the audit log: `INSERT INTO audit_logs (...)
   VALUES (..., 'DELETE', 'guest', '<guest_id>', ...)`

## Disaster recovery (RTO/RPO)

- **Recovery Time Objective (RTO)**: 1 hour from incident detection
  - Render-managed backups restore in ~15 minutes
  - Manual backups add ~30 minutes (download + restore)
  - DNS / app config adds ~15 minutes
- **Recovery Point Objective (RPO)**: 24 hours (Render-managed backup
  interval) or 7 days (manual backup interval, whichever is freshest)

For tighter RPO, increase the manual backup frequency to daily in your CI.

## What to back up

- ✅ `guests`, `tenants`, `users`, `audit_logs`, `sync_state`,
  `adapter_connections`, `data_requests`, `reservations`,
  `guest_identity_documents`, `loyalty_profiles`
- ❌ `ps_customer` (the source PMS database — it's not ours; the hotel
  owns it and is responsible for its own backups)

## What NOT to back up

- Encrypted adapter connection URLs (`adapter_connections.connection_url_encrypted`)
  are backed up as-is. The `FIELD_ENCRYPTION_KEY` environment variable
  must be preserved separately (in a secrets manager like AWS Secrets
  Manager, Doppler, or 1Password) — without it, the encrypted URLs cannot
  be decrypted.
- Password hashes (`users.password_hash`) are backed up as-is. The
  `ARGON2_PEPPER` env var must be preserved separately.

If either env var is lost, the affected data is unrecoverable. Treat
them as critical secrets.
