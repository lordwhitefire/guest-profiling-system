# TASK-008 — Make the build real: DB, verification, UI gaps, records

Owner decision 2026-11-12: **persist** the hotel-settings selects (do not delete
them). Everything below is in scope for this task.

## Tracker

| # | Item | Status |
|---|------|--------|
| 1 | Get local Postgres connecting | done (password set; `gps` DB created) |
| 2 | Fix `db:migrate` — runner at `packages/shared/scripts/migrate.mjs`; scripts updated; error paths tested | done |
| 3 | Create `gps` database + apply `001_initial_schema.sql` | done (10 tables, pg_trgm indexes present) |
| 4 | Seed source PMS fixture and run `pnpm seed:source` | done (207 read, 206 inserted, 1 duplicate skipped) |
| 5 | `gps` holds real guests | done (first-load bulk import; worker cursor set) |
| 6 | Verify live: search incl. pg_trgm typo case | done (SQL: 'zainba' matches 'Zainab' at 0.40, LIKE 0); browser + write paths need a login user |
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
