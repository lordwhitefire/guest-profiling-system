# TASK-002 — Testing

**Phase**: 1 (Core)
**Status**: ready to verify
**Pairs with**: `task.md` in this folder

## Test categories

### 1. Static checks (CI must pass)

- [ ] `pnpm install` exits 0 (argon2 + postgres native modules build)
- [ ] `pnpm typecheck` exits 0 across all packages, including adapter-read
- [ ] No `console.log` outside test files (ESLint rule)
- [ ] No `any` types outside test fixtures (ESLint rule)
- [ ] No `// TODO` without a linked issue (ESLint rule)

### 2. Throttle formula tests (`__tests__/throttle.test.ts`)

- [ ] At `target_level=0.75`, after a 100ms source operation in a 200ms total elapsed window (50% utilization), throttle does NOT sleep (50% < 75% target)
- [ ] At `target_level=0.75`, after a 200ms source operation in a 200ms total elapsed window (100% utilization), throttle sleeps `2 × (1.0 - 0.75) × 200ms = 100ms`
- [ ] At `target_level=1.0` (100% / disabled), throttle never sleeps regardless of utilization
- [ ] Throttle clamps `target_level` to `[0.01, 1.0]` — values outside this range are clamped
- [ ] Throttle tracks `totalJobDuration` across multiple chunks (cumulative), not per-chunk
- [ ] `wait()` is a no-op if `totalDuration` is zero (avoids divide-by-zero)

### 3. Chunking algorithm tests (`__tests__/chunking.test.ts`)

- [ ] `getUpdateRange` returns `fullTable=true` when `state.last_seen_xmin=0` (first run)
- [ ] `getUpdateRange` returns `startXmin = last_seen_xmin + 1`, `endXmin = current max(xmin)` for subsequent runs
- [ ] `getUpdateRange` returns `fullTable=true` when target row count drops below `fullCopyThreshold × source count` (default 0.5)
- [ ] Chunk walk: with `updateChunkSize=1000` and a source table of 2500 changed rows, the walk produces 3 chunks (1000, 1000, 500)
- [ ] Offset tracking: when a chunk's last row has the same xmin as the next row (transaction spans chunks), the offset counter increments and the cursor stays put
- [ ] State advances only after a complete transaction is consumed (xmin changes between consecutive rows)
- [ ] Empty source table (0 rows): no chunks produced; state set to current max(xmin)=null; treated as `fullTable=false` on next run

### 4. Divide-and-conquer delete tests (`__tests__/delete-dac.test.ts`)

- [ ] Source and target hashes match → no recursion; chunk marked clean
- [ ] Hashes differ at chunkSize > minDeleteChunkSize → halve and recurse on both halves
- [ ] Hashes differ at chunkSize <= minDeleteChunkSize → re-sync the exact range (DELETE + re-INSERT in single transaction)
- [ ] Recursion terminates: a chunk with no changes returns immediately; no infinite recursion
- [ ] PK range query uses closed interval [startKey, endKey] (per Card 1's `whereClauseFromKeyRange`)
- [ ] Hash function is `md5(array_agg((pk_cols)::varchar)::varchar)` — empty array produces empty string (coalesce to '')
- [ ] Multi-column PK: hash uses all PK columns concatenated, sorted by column name

### 5. QloApps mapping tests (`__tests__/qloapps-mapping.test.ts`)

- [ ] Maps `id_customer=42` → `source_ref="42"`
- [ ] Maps `firstname="John"` → `first_name="John"`
- [ ] Truncates `firstname` > 32 chars to 32 chars
- [ ] Maps `email="John@Example.COM"` → `email="john@example.com"` (lowercase + trim)
- [ ] Maps `phone="+234 800 123 4567"` → `phone="2348001234567"` (E.164 without +; stored as digits-only)
- [ ] Maps `phone="08001234567"` (no country code) → `phone="08001234567"` (we don't guess country code in v1; TODO: tenant-configurable default country code)
- [ ] Maps `birthday="1990-05-15"` → `date_of_birth=1990-05-15`
- [ ] Maps `birthday="0000-00-00"` → `date_of_birth=null` (legacy MySQL zero date)
- [ ] Maps `birthday=null` → `date_of_birth=null`
- [ ] Maps `newsletter=1` → `comm_prefs.email_opt_in=true`
- [ ] Maps `optin=0` → `comm_prefs.marketing_opt_in=false`
- [ ] Maps `deleted=1` → `deleted_at=NOW()` (set on this sync)
- [ ] Maps `deleted=0` → `deleted_at=null` (clear if previously set)
- [ ] Maps `is_guest=1` → NOT stored (column not in our schema; verify the INSERT statement does not reference it)
- [ ] Maps `date_add="2026-01-15 10:30:00"` → `created_at=2026-01-15T10:30:00Z`
- [ ] Existing guest's `guest_phase` is NOT overwritten by sync (only set on first insert; subsequent updates leave it alone)
- [ ] `tenant_id` is always set from the adapter connection's `tenant_id`, not from any source column
- [ ] The SELECT statement NEVER includes `passwd`, `secure_key`, `ip_registration_newsletter`, `last_passwd_gen` (assert via the SQL string)

### 6. Sync state tests (`__tests__/sync-state.test.ts`)

- [ ] `getSyncState(tenant, "ps_customer")` returns `{last_seen_xmin: 0, where_clause: null}` for a fresh tenant (no row yet)
- [ ] `setSyncStateXmin(tenant, "ps_customer", 12345)` inserts a new row with `last_seen_xmin=12345`
- [ ] Calling `setSyncStateXmin` again with 12400 updates the existing row (no duplicate)
- [ ] `setSyncStateWhere(tenant, "ps_customer", "id_customer > 100")` updates `where_clause` without touching `last_seen_xmin`
- [ ] Concurrent writes (two workers, same tenant + table) — last writer wins; no row locking in v1 (documented constraint)

### 7. Schema validation tests (`__tests__/schema-validation.test.ts`)

- [ ] Source schema matches expected → returns `{valid: true}`
- [ ] Source has an extra column not in expected → returns `{valid: false, reason: "extra column: foo"}`
- [ ] Source is missing an expected column → returns `{valid: false, reason: "missing column: bar"}`
- [ ] Source column type changed (e.g., VARCHAR → TEXT) → returns `{valid: false, reason: "type changed: bar"}`
- [ ] With `resyncOnSchemaChange=true`, schema mismatch returns `{valid: false, resync: true}` instead of just `valid: false`

### 8. Worker integration tests (`__tests__/worker.test.ts`)

Uses a seeded pg-mem fixture simulating a QloApps source DB and our target DB.

- [ ] First run (empty target, 100 source rows): worker syncs all 100 rows; sync_state.last_seen_xmin advances to source's max(xmin)
- [ ] Second run (no source changes): worker produces 0 updates; delete scan finds no changes; completes in < 100ms
- [ ] Source adds 50 new rows between runs: worker syncs the 50 new rows only
- [ ] Source updates 10 existing rows (same id_customer, changed email): worker upserts the 10 rows (DELETE + INSERT per chunk)
- [ ] Source soft-deletes 5 rows (sets `deleted=1`): worker sets `deleted_at` on the 5 corresponding target rows
- [ ] Source hard-deletes 3 rows (DROP from source): worker's delete-dac detects via PK hash mismatch and re-syncs the range
- [ ] Schema drift: source adds a column → worker aborts with `SCHEMA_MISMATCH` error (default `resyncOnSchemaChange=false`)
- [ ] Schema drift with `resyncOnSchemaChange=true`: worker drops + recreates target table, marks for full re-sync, syncs all rows

### 9. CLI tests (`__tests__/worker.test.ts`)

- [ ] `pnpm --filter @gps/adapter-read start -- --tenant=<uuid>` runs a single sync pass and exits 0
- [ ] Missing `--tenant` flag → exits 1 with usage message
- [ ] Unknown tenant UUID → exits 1 with "tenant not found" error
- [ ] `--continuous` flag → runs in a loop with `SYNC_INTERVAL_SECONDS` between passes (test uses a short interval like 1s and asserts at least 2 passes ran)

### 10. Documentation checks

- [ ] `packages/adapter-read/README.md` exists with: how to run, CLI flags, env vars, troubleshooting
- [ ] `docs/runbook/sync-job-manual.md` updated from stub to real procedure (commands, expected output, troubleshooting)
- [ ] `docs/runbook/schema-drift.md` updated with the actual abort/resync decision tree

### 11. CI checks (manual review)

- [ ] `.github/workflows/ci.yml` runs adapter-read unit tests (already covered by `pnpm -r test:unit`)
- [ ] CI does NOT run the worker against a real source PMS (no real PMS in CI)

## Verification procedure

The Architect verifies TASK-002 by:

1. Reading the patch
2. Running `pnpm install && pnpm typecheck && pnpm test:unit` — all must pass
3. Inspecting the worker's structured log output format against Section 4 of the implementation brief
4. Manual review of the QloApps SELECT statement to verify forbidden columns are not read
5. Manual review of the divide-and-conquer algorithm for correctness (no infinite recursion; PK range closed intervals)
6. Manual review of the throttle formula against Card 1 §3.6

If all checks pass, the Architect:

- Marks TASK-002 as `done` in `openspec/tasks-registry.md`
- Updates `PROGRESS.md` at the repo root
- Informs the user the patch is ready to apply

## What this testing file does NOT cover

- Real source PMS connectivity (no real hotel customer)
- Performance under load (no benchmark)
- Multi-tenant concurrent runs (documented constraint; no locking)
- xmin wrapping (Card 1 known issue; TODO in source)
