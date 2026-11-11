# Demo: End-to-end run with messy fixture data

This runbook walks through the full Guest Profiling System loop **without
needing a real hotel**. We use the bundled messy guest fixture (207 rows,
covering every Card 4 edge case) as the "source PMS," run the seeding
script, and verify that profiles land in the profiling DB.

The whole flow takes ~5 minutes once Postgres is running.

## What you need

- Postgres 15+ running locally
- Node.js 20 LTS + pnpm 9+
- This repo cloned, deps installed (`pnpm install`)

## Architecture (reminder)

```
┌─────────────────────────┐         ┌────────────────────────────────┐
│  Source PMS DB          │         │  Profiling DB (our DB)          │
│  (gps_source_pms)       │         │  (gps)                          │
│                         │         │                                 │
│  ps_customer            │ ← read  │  tenants                        │
│  (QloApps schema,       │   only  │  users                          │
│   207 messy rows)       │         │  guests (207 rows after seed)   │
│                         │         │  sync_state (cursor set)        │
└─────────────────────────┘         │  adapter_connections            │
                                    │  ...                            │
                                    └────────────────────────────────┘
           ▲                                    ▲
           │                                    │
           └──── seed-from-source.ts ──────────┘
                  (this slice's new code)
```

After seeding, the receptionist web UI can list/search guests from our DB.

## Step 1 — Create the two databases

```bash
createdb gps_source_pms   # the fake hotel PMS
createdb gps              # the profiling system's own DB
```

## Step 2 — Load the messy fixture into the source PMS

From the repo root:

```bash
psql -d gps_source_pms \
  -f packages/adapter-read/fixtures/source-pms-seed.sql
```

You should see output like:

```
ps_customer row count: 207
--- edge case sanity ---
zero-date birthdays: 22
soft-deleted rows: 31
null emails: 18
long first names > 32: 11
long last names > 32: 9
duplicate emails (same email, different id): 4
```

That's 207 rows of messy realistic data, ready to be read.

## Step 3 — Apply the profiling DB migration

```bash
cp .env.example .env
# Edit .env:
#   DATABASE_URL=postgres://postgres:dev@localhost:5432/gps
#   SOURCE_PMS_URL=postgres://postgres:dev@localhost:5432/gps_source_pms
#   JWT_SECRET=$(openssl rand -hex 32)
#   ARGON2_PEPPER=$(openssl rand -hex 32)
#   FIELD_ENCRYPTION_KEY=$(openssl rand -hex 32)
#   DEFAULT_TENANT_ID=<a UUID, e.g. from: uuidgen>

pnpm db:migrate
```

## Step 4 — (Optional) Add a user so you can log in to the receptionist UI

```bash
psql -d gps -c "
  INSERT INTO tenants (tenant_id, name)
  VALUES ('$DEFAULT_TENANT_ID', 'Demo Hotel')
  ON CONFLICT DO NOTHING;
"
```

(A proper admin UI for creating users is TASK-005 — not done yet. For now,
you can insert a user row directly. The receptionist web UI requires auth.)

## Step 5 — Run the seeding script

This is the new code from this slice. It reads `ps_customer` from the source
DB, maps every row via the existing QloApps mapping, inserts into our
`guests` table (idempotently), and sets `sync_state.last_seen_xmin` so the
worker's next incremental sync picks up only new changes.

```bash
pnpm --filter @gps/adapter-read seed:source -- --tenant=$DEFAULT_TENANT_ID
```

Expected output:

```
[INFO] Seeding source PMS → profiling DB for tenant <uuid>
[INFO] Source: postgres://postgres:***@localhost:5432/gps_source_pms?default_transaction_read_only=true
[INFO] Target: postgres://postgres:***@localhost:5432/gps
[INFO] Progress: 207/207 rows
[INFO] Done in 234ms
[INFO]   Rows read:     207
[INFO]   Rows inserted: 207
[INFO]   Rows skipped:  0
[INFO]   Table:         ps_customer
[INFO]   Final xmin:    <some bigint>
[INFO] sync_state cursor set — worker's next run will only pick up new changes.
```

## Step 6 — Verify the loop worked

Check the profiling DB:

```bash
psql -d gps -c "
  SELECT count(*) AS total_guests FROM guests WHERE tenant_id = '$DEFAULT_TENANT_ID';
  SELECT count(*) AS soft_deleted FROM guests WHERE tenant_id = '$DEFAULT_TENANT_ID' AND deleted_at IS NOT NULL;
  SELECT count(*) AS with_email FROM guests WHERE tenant_id = '$DEFAULT_TENANT_ID' AND email IS NOT NULL;
  SELECT count(*) AS with_phone FROM guests WHERE tenant_id = '$DEFAULT_TENANT_ID' AND phone IS NOT NULL;
  SELECT source_ref, first_name, last_name, email, phone, date_of_birth
    FROM guests WHERE tenant_id = '$DEFAULT_TENANT_ID'
    ORDER BY source_ref::int LIMIT 10;
  SELECT * FROM sync_state WHERE tenant_id = '$DEFAULT_TENANT_ID';
"
```

You should see:

- `total_guests` = 207 (every messy row imported)
- `soft_deleted` matches the fixture's deleted count
- `with_email` < 207 (NULL and whitespace-only emails correctly mapped to NULL)
- `with_phone` < 207 (NULL phones preserved)
- The 10 sample rows look clean — emails lowercased, phones digits-only,
  zero-date birthdays shown as NULL
- `sync_state.last_seen_xmin` is set (so the worker's next incremental run
  won't re-process these rows)

## Step 7 — Run the receptionist UI against the real data

```bash
pnpm dev
# Open http://localhost:3000/login
# Log in with the user you created in Step 4
# Go to /workspace/guest-search
# Type the first few letters of any guest's name — the live-filter should work
# against real data, not mock data.
```

If the UI still shows mock data, that's because wiring the 17-screen
workspace to the real API is **not in this slice**. This slice only
completes the **adapter → DB → profiles** loop. The next slice wires the UI.

## Step 8 — Verify the worker picks up only new changes

Add a new row to the source PMS:

```bash
psql -d gps_source_pms -c "
  INSERT INTO ps_customer
    (firstname, lastname, email, phone, birthday, newsletter, optin, deleted, date_add, date_upd)
  VALUES
    ('BrandNew', 'Guest', 'new@example.com', '+234 999 888 7777', '1995-03-15', 0, 0, 0, NOW(), NOW());
"
```

Now run the worker's incremental sync:

```bash
pnpm --filter @gps/adapter-read start -- --tenant=$DEFAULT_TENANT_ID
```

Expected:

```
[INFO] No updates to sync (cursor already at max xmin)    # if no xmin changes detected
# OR
[INFO] Updating table ps_customer (xmin N → M, 1 rows)   # if xmin advanced
```

After the worker run, the new guest should appear in `guests` (211 rows total).
The original 207 are NOT re-inserted — that's the proof the seeding cursor
worked.

## Troubleshooting

- **`ECONNREFUSED`** — Postgres isn't running, or DATABASE_URL/SOURCE_PMS_URL
  in `.env` points at the wrong host/port.
- **`relation "ps_customer" does not exist`** — you skipped Step 2. Load the
  fixture first.
- **`relation "guests" does not exist`** — you skipped Step 3. Run
  `pnpm db:migrate` first.
- **`No adapter connection found for tenant`** — that's the worker's error,
  not the seeding script's. The seeding script reads `SOURCE_PMS_URL` from
  env directly (no encryption), so it doesn't need an `adapter_connections`
  row. Only the worker does.
- **`Decrypted source URL does not look like a Postgres connection string`** —
  worker error, not seeding-script error. Means `FIELD_ENCRYPTION_KEY` in
  `.env` doesn't match the key used to encrypt the URL in the
  `adapter_connections` row. For the demo, just use the seeding script
  (`seed:source`) instead of the worker for the first load.

## What this slice delivers

- `packages/adapter-read/fixtures/messy-guests.csv` — 207 rows of messy
  QloApps-style guest data, hitting every Card 4 edge case
- `packages/adapter-read/fixtures/source-pms-seed.sql` — loads the fixture
  into a fresh `gps_source_pms` database
- `packages/adapter-read/src/seeding/bulk-import.ts` — the bulk import logic,
  fully unit-tested with pg-mem (no real DB required to run the tests)
- `packages/adapter-read/src/seeding/seed-from-source.ts` — the CLI entry
  point: `pnpm --filter @gps/adapter-read seed:source -- --tenant=<uuid>`
- `packages/adapter-read/__tests__/seeding.test.ts` — 11 unit tests covering
  every Card 4 edge case + idempotency + sync_state + forbidden columns
- This runbook

## What this slice does NOT do

- Wire the 17-screen receptionist UI to the real guest API — that's the next
  slice. The UI still uses mock data.
- Implement the worker's `fullTable` sync path — the worker still throws
  on first run. This slice routes around that with a separate seeding
  script. After seeding, the worker's incremental sync works correctly.
- Handle xmin wrapping (Card 1 known issue, documented as TODO in
  `sync-state.ts`).
