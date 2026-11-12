# TASK-008 — Make the build real: DB, verification, UI gaps, records

Owner decision 2026-11-12: **persist** the hotel-settings selects (do not delete
them). Everything below is in scope for this task.

## Tracker

| # | Item | Status |
|---|------|--------|
| 1 | Get local Postgres connecting (owner supplies `postgres` password for `localhost:5432`) | blocked on owner |
| 2 | Fix `db:migrate` — runner at `packages/shared/scripts/migrate.mjs`; scripts updated; error paths tested | done |
| 3 | Create `gps` database + apply `001_initial_schema.sql` (+ pg_trgm extension) | pending (needs 1) |
| 4 | Point `SOURCE_PMS_URL` at a real (or seeded) source and run `pnpm seed:source` | pending (needs 1) |
| 5 | Run adapter-read worker so `gps` holds real guests | pending (needs 3–4) |
| 6 | Verify live in browser, no route interception: search incl. pg_trgm typo case, all 16 endpoints, write paths (invite user, add hotel, add/edit guest, new DSR, settings save) | pending (needs 5) |
| 7 | Persist Analytics reporting: `GET /api/analytics/activity` + real chart | done |
| 8 | Persist Settings General fields: default language, timezone, date format | done |
| 9 | Persist Hotel Settings "System Defaults": matching sensitivity, sync frequency, data retention | done |
| 10 | Unit tests for 7–9 (settings sanitizer, daily series) | done |
| 11 | Real extension test: load unpacked extension in the system Chrome, click Prepare Registration end-to-end | needs owner to load extension |
| 12 | Correct `openspec/tasks-registry.md` and `PROGRESS.md` — statuses and test counts to the truth | done |

## Order of execution

2 → 3 → 4 → 5 → 6 (chain: all need the password) and 7 → 8 → 9 → 10 → 12 in
parallel with the above. 11 last, needs the owner to load the extension.

## Verified after this task (exit criteria)

- `gps` exists with the full schema; `pnpm db:migrate` works from clean.
- Seeded real guests; search returns real rows including a typo case
  ("adebolla" → "adebola") that proves pg_trgm works.
- Admin write paths hit the real API in a real browser.
- Analytics chart, Settings General, Hotel Settings defaults all persist
  across reload.
- Registry and PROGRESS match reality.
