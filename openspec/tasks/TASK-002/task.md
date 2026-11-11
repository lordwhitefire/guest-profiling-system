# TASK-002 — Adapter-Read (SSLR-pattern sync worker)

**Phase**: 1 (Core)
**Status**: in_progress
**Estimated effort**: 1–2 weeks single-dev
**Depends on**: TASK-001 (foundation) — applied and verified
**Assumption per owner**: read-only access to the source PMS; no specific hotel customer yet. Using QloApps (Card 4) as the reference source PMS shape; other PMS mappings (Mews, Cloudbeds, Apaleo) are deferred to TASK-002 extensions once a real customer is identified.

## What this task produces

A working sync worker that pulls guest data from a source PMS database (read-only) into our own profile database. The worker implements the behavioral contract captured in Behavioral Specification Card 1 (SSLR) — re-implemented from scratch in TypeScript. It is a separate process from the Next.js core; it runs on cron.

This is the first piece of "real product" — without it, the receptionist screen would have no profiles to show.

## Scope

### In scope

1. **Adapter-read worker process** (`packages/adapter-read/src/worker.ts`) — runs as a standalone Node.js process; one tenant per run; cron-triggered (every 5 min default). Implements the full SSLR-pattern sync per Card 1.
2. **Sync state management** — reads/writes the `sync_state` table (created in TASK-001). Per-table xmin cursor, persisted after each chunk's transaction commits.
3. **Schema validation** — per Card 1: extract source table schema (CREATE TABLE statement + indices + PK), compare to expected shape. On mismatch: abort unless `resyncOnSchemaChange` flag is set (in which case full re-sync).
4. **Update sync** — xmin-cursor tracking. Walk from `last_seen_xmin + 1` to current max(xmin) in chunks of `updateChunkSize` rows. Idempotent upsert (DELETE matching PKs + CopyFrom per chunk). State advances only after a complete source transaction is consumed.
5. **Delete sync** — divide-and-conquer on PK ranges. Hash source and target PK lists (md5 of `array_agg(pk::varchar)`) in chunks of `deleteChunkSize`. Where they differ and chunk > `minDeleteChunkSize`, halve and recurse. Where they differ at `minDeleteChunkSize`, re-sync the exact range.
6. **Throttling** — per Card 1's 2× overshoot-sleep formula. Tracks source-DB utilization (time spent reading source / total elapsed time). Sleeps `2 × (utilization - target_level)` milliseconds when over budget. Configurable per-tenant via `sync_throttle_percent` env var (default 75%).
7. **QloApps source mapping** (`packages/adapter-read/src/mappings/qloapps.ts`) — Card 4 → our schema. Maps `PREFIX_customer.*` columns to our `guests.*` columns per the table in Section 6.6 of the Behavioral Specification.
8. **Configurable source mapping** — per-tenant `pms_type` field in `adapter_connections` table drives which mapping module is loaded. v1 ships only `qloapps`; others throw `not_implemented`.
9. **Source connection** — read-only postgres.js connection with `default_transaction_read_only=true` enforced on the URL. Connection URL stored encrypted in `adapter_connections`; decrypted at runtime with `FIELD_ENCRYPTION_KEY`.
10. **Tests** — Vitest unit tests for: throttle formula, chunking algorithm, divide-and-conquer delete detection, QloApps column mapping (with all the edge cases from Card 4 — 0000-00-00 birthday, soft-delete mirroring, phone normalization, password column never read).
11. **CLI** — `pnpm --filter @gps/adapter-read start -- --tenant=<uuid>` triggers a single sync pass for one tenant. `--continuous` flag runs in a loop with `SYNC_INTERVAL_SECONDS` between passes.

### Out of scope

- API-based PMS sources (Mews, Cloudbeds, Apaleo). Those are TASK-002 extensions for after a real hotel customer is identified.
- Windows desktop PMS support. Companion application, future task.
- Push-based real-time sync. v1 is periodic (cron); push is a future enhancement.
- The `__sslr_state` table name itself — we already created `sync_state` in TASK-001 (composite PK on `(tenant_id, table_name)`); adapter reads/writes that table.
- xmin wrapping (Card 1's known issue). Documented as a TODO comment in the worker; not handled in v1.

## Implementation brief

### File layout

```
packages/adapter-read/
├── src/
│   ├── worker.ts                    (entry point; CLI parsing; main loop)
│   ├── config.ts                    (env var loading; per-tenant config from DB)
│   ├── source-connection.ts         (postgres.js read-only connection setup)
│   ├── target-connection.ts         (postgres.js connection to our DB)
│   ├── sync-state.ts                (read/write sync_state table)
│   ├── schema-validation.ts         (extract source schema; compare to expected)
│   ├── update-sync.ts               (xmin-cursor tracking; chunked upsert)
│   ├── delete-sync.ts               (divide-and-conquer on PK ranges)
│   ├── throttle.ts                  (2× overshoot-sleep formula)
│   ├── encryption.ts                (decrypt adapter_connections.connection_url_encrypted)
│   └── mappings/
│       ├── index.ts                 (mapping registry; loads by pms_type)
│       ├── types.ts                 (SourceMapping interface)
│       └── qloapps.ts               (Card 4 → our guests schema)
├── __tests__/
│   ├── throttle.test.ts             (2× formula; clamping; bypass at 100%)
│   ├── chunking.test.ts             (xmin walk; chunk boundaries; offset tracking)
│   ├── delete-dac.test.ts           (divide-and-conquer; halving; min chunk floor)
│   ├── qloapps-mapping.test.ts      (all Card 4 edge cases)
│   └── sync-state.test.ts           (cursor persistence; idempotent writes)
├── package.json
└── tsconfig.json
```

### The QloApps source mapping (Card 4 → our schema)

From Behavioral Specification Section 6.6:

| QloApps `PREFIX_customer` column | Our `guests` column | Transformation |
|---|---|---|
| `id_customer` (INT) | `source_ref` (VARCHAR) | `String(...)` |
| `firstname` (VARCHAR 32) | `first_name` (VARCHAR 32) | Pass through; truncate to 32 if longer |
| `lastname` (VARCHAR 32) | `last_name` (VARCHAR 32) | Pass through; truncate to 32 if longer |
| `email` (VARCHAR 128) | `email` (VARCHAR 128) | Lowercase + trim |
| `phone` (VARCHAR 32) | `phone` (VARCHAR 32) | Normalize to E.164 (strip non-digits; prepend country code if missing) |
| `birthday` (DATE) | `date_of_birth` (DATE) | `0000-00-00` → null; otherwise pass through |
| `newsletter` (TINYINT) | `comm_prefs.email_opt_in` (JSONB) | Map to comm_prefs object |
| `optin` (TINYINT) | `comm_prefs.marketing_opt_in` (JSONB) | Map to comm_prefs object |
| `deleted` (TINYINT) | `deleted_at` (TIMESTAMPTZ) | `1` → `NOW()`; `0` → null (clear) |
| `date_add` (DATETIME) | `created_at` (TIMESTAMPTZ) | Pass through; convert to ISO |
| `date_upd` (DATETIME) | `updated_at` (TIMESTAMPTZ) | Pass through; convert to ISO |
| `is_guest` (TINYINT) | — | NOT stored (analytics only; not in our schema) |
| `passwd`, `secure_key`, `ip_registration_newsletter`, `last_passwd_gen` | — | NEVER READ (security/privacy) |

The mapping also handles `tenant_id` (from the adapter connection record) and `guest_phase` (default `UNKNOWN_CONTACT` for new guests; existing guests keep their current phase).

### The throttle formula (Card 1 §3.6)

```
For each chunk operation:
  jobStartTime = now
  // (do source DB read)
  // (apply to target)
  totalJobDuration += (now - jobStartTime)

At end of chunk:
  totalDuration = now - startTime
  utilization = totalJobDuration / totalDuration

  if utilization > target_level:
    waitTime = 2 × (utilization - target_level) × totalDuration
    sleep(waitTime)
```

If `target_level >= 1.0` (i.e., 100%), throttle is bypassed entirely (no sleep).

### The divide-and-conquer delete algorithm (Card 1 §3.5)

Recursive function. Pseudocode:

```
syncDeletedRowRange(table, primaryKeys, startKey, chunkSize, where):
  endKey = getKeyAtOffset(source, table, primaryKeys, startKey, chunkSize)
  sourceHash = md5(array_agg(pk::varchar) on source where pk in [startKey, endKey])
  targetHash = md5(array_agg(pk::varchar) on target where pk in [startKey, endKey])

  if sourceHash == targetHash:
    return endKey  # no change; move on

  if chunkSize <= minDeleteChunkSize:
    # at the floor; re-sync this exact range
    delete from target where pk in [startKey, endKey]
    insert into target select * from source where pk in [startKey, endKey]
    return endKey

  # split and recurse
  midKey = syncDeletedRowRange(table, primaryKeys, startKey, chunkSize/2, where)
  syncDeletedRowRange(table, primaryKeys, midKey, chunkSize/2, where)
  return endKey
```

### CLI

```bash
# Single sync pass for one tenant
pnpm --filter @gps/adapter-read start -- --tenant=<uuid>

# Continuous mode (every SYNC_INTERVAL_SECONDS)
pnpm --filter @gps/adapter-read start -- --tenant=<uuid> --continuous

# Override throttle percentage for this run
pnpm --filter @gps/adapter-read start -- --tenant=<uuid> --throttle=50
```

## Acceptance criteria

1. `pnpm install` succeeds; argon2 + postgres native modules build
2. `pnpm typecheck` passes (no new errors in adapter-read)
3. `pnpm test:unit` passes — all new tests for throttle, chunking, delete-dac, qloapps-mapping, sync-state. At least 30 new test cases.
4. The worker can be invoked via `pnpm --filter @gps/adapter-read start -- --tenant=<uuid>` and produces structured log output:
   - `[INFO] Starting sync for tenant <uuid> with throttle at 75.00%`
   - `[INFO] Connecting to source PMS (read-only)`
   - `[INFO] Validating tables`
   - `[INFO] Updating table ps_customer (xmin 12345 → 12400, 55 rows)`
   - `[INFO] Syncing deletions for table ps_customer`
   - `[INFO] Done: 55 rows updated in 1.2s`
5. Schema drift detection: if the source PMS schema changes, the worker aborts (default) or full-resyncs (if `resyncOnSchemaChange=true` is set in `adapter_connections` config).
6. Idempotent re-runs: running the worker twice in a row produces zero updates on the second run (xmin cursor advances; delete scan finds no changes).
7. Throttle: when `throttle_percent=50`, the worker spends no more than 50% of wall-clock time in the source DB. Verifiable via the structured log output.
8. Never reads the forbidden columns (`passwd`, `secure_key`, `ip_registration_newsletter`, `last_passwd_gen`) — the SELECT statement explicitly excludes them.

## What this task does NOT verify

- Real source PMS connectivity (no real hotel customer yet — TASK-002 was unblocked by owner's "assume read-only access" decision; tests use seeded fixture data)
- Performance against a large (100k+ guest) source PMS (Card 1's reported latency is the reference; load testing is deferred)
- Concurrent workers for the same tenant (documented constraint: one worker per tenant; no locking added in v1)

## Out-of-scope edge cases to note for later

- **xmin wrapping** (Card 1 known issue): documented as TODO in sync-state.ts; not handled in v1
- **Multiple workers for the same tenant**: documented in adapter_connections table comment; enforced at app level via a `worker_lease` column (future task; v1 trusts the operator)
- **Source PMS dropped column**: schema-validation step detects; aborts unless `resyncOnSchemaChange=true`
- **Source PMS added column**: same — schema-validation detects; aborts or resyncs per flag

## Hand-off

When TASK-002 is `done`:

1. Architect verifies against `testing.md`
2. Architect marks `done` in `openspec/tasks-registry.md`
3. Architect updates `PROGRESS.md` at repo root
4. The owner can run the worker locally against a seeded QloApps fixture DB; CI runs the unit tests
