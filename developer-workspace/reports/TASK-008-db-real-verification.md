# TASK-008 — Make the build real (in progress)

**Date:** 2026-11-12
**Tracker:** `developer-workspace/briefs/TASK-008-db-real-verification.md`

## Done and verified

- **Migration runner** — `packages/shared/scripts/migrate.mjs`; `db:migrate`
  and `db:migrate:status` now read `src/db/migrations/*.sql` (node-pg-migrate
  was never installed and pointed at a missing directory). "no DATABASE_URL"
  and "bad credentials" both fail with a clear message and exit 1.
- **Settings persistence** — `TenantSettings` now lives once in
  `@gps/shared` and carries `defaultLanguage`, `timezone`, `dateFormat`,
  `matchingSensitivity`, `syncFrequencyMinutes`. `PUT /api/settings`
  sanitises unknown keys and invalid values. Settings General and Hotel
  Settings "System Defaults" read and save them; data retention is a real
  select (90 / 365 / 1095 / 2555 days).
- **Real analytics chart** — `GET /api/analytics/activity?days=N` returns
  guest creations per day for the tenant, zero-filled. The chart renders the
  real series; the "illustrative" label is gone.
- **Tests** — core 127 (settings sanitizer, daily series + the previous
  suite). Workspace total 333 passing, 1 skipped. Typecheck, lint (0
  errors), build all pass.
- **Records** — registry and PROGRESS corrected: false "verified / no mock
  data" claims removed, TASK-008 recorded, test count fixed.
- **Browser-verified with intercepted routes** — General selects save
  `{defaultLanguage, timezone, dateFormat}` in the PUT body; Hotel Settings
  saves `syncFrequencyMinutes` and retention; Analytics renders 30 real
  points.

## Blocked on the owner

Creating the `gps` database, running the migration, seeding the 207-row
fixture, running the adapter worker, and live verification all need the local
Postgres password. `.env` `DATABASE_URL` is still the template placeholder
(`postgres:<placeholder>@localhost:5432/gps`), and `sudo` is unavailable.

## Not done yet

- Live DB run: migration, seed, worker, search typo case, write paths.
- Real Chrome extension load ("Prepare Registration" with the unpacked
  extension; only a simulated ack was tested).
- Notifications/Security settings tabs still contain rows that only toast
  (guest match alerts, session timeout, login alerts, account fields). They
  were outside the approved persist scope for this pass.
