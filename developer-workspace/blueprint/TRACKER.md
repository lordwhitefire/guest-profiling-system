# Build Tracker

**Last updated:** 2026-11-16 11:50 UTC
**Current phase:** P0 complete + CI expanded
**Rule:** this file is updated after every task. If a task is not listed here, it is not being worked on.

## Where I am right now

| Task | Status | Verification |
|---|---|---|
| BP-01 visit counts | **Done** | API + CDP browser: GV=3, LS=1, cross-tenant 404 |
| BP-02 sync decision | **Done** | Manual Sync Now in UI copy + `demo-script.md` |
| BP-03 data tests | **Done** | `pnpm test:integration`: 3 passed |
| BP-04 fake metrics | **Done** | Browser: “Not tracked” on dashboard, PMS, audit, users, tenants |
| BP-05 settings labels | **Done** | Browser notes + toggle persistence |
| BP-06 empty/error states | **Done** | Browser: search empty, registration validation, extension missing/ready, no-visit profile, 404 |
| BP-07 error boundary + health | **Done** | Bad DB health = 503; forced error route showed friendly boundary |
| BP-08 extension ZIP | **Done** | ZIP loaded unpacked; Full Name/email/phone filled |
| BP-09 README | **Done** | Env names, doc paths, runbooks, production command corrected |
| BP-10 demo script | **Done** | `demo-script.md` written and dry-run in parts |
| CI expansion | **Done in repo, not yet run on GitHub** | CI now has lint/typecheck, build, unit, integration, E2E jobs |
| BP-11–BP-29 | **Not started / deferred** | P1 external work and P2 quality work |

## CI now runs

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm build` (dummy env)
4. `pnpm test:unit -- --coverage`
5. `pnpm test:integration` against a `postgres:15` service with seeded `pms` / `pms_lakeside`
6. `pnpm test:e2e` (Playwright)

Integration CI uses the existing `source-pms-seed.sql` fixture and a throwaway CI Postgres. No Render or owner credentials.

## Current build state

- `pnpm typecheck` — passed
- `pnpm lint` — passed with warnings only
- `pnpm test:unit` — 334 passed, 1 skipped
- `pnpm test:integration` — 3 passed
- `pnpm build` — passed
- Fixture load test — 207 rows loaded into a throwaway DB
- CI YAML — parsed with 5 jobs
- Production server on `:3100` — running the final build
- Health: `200 {"status":"ok","database":"ok"}`
- Blueprint checker: **PASS** — 80/80 areas, 9 results recorded, 71 not run

## Next

1. Owner pushes the local commits; then GitHub Actions runs the full CI.
2. **BP-11 Render** remains external and owner-dependent.
3. BP-12–BP-15 are external/security work before a public URL.
4. BP-16 phone/browser testing needs the owner's phone.
5. BP-17–BP-29 can start after the public URL or as quality work.

## Notes

- Extension ZIP: `packages/adapter-fill-extension/gps-fill-extension-v0.1.0.zip`
- Install note: `developer-workspace/blueprint/extension-install.md`
- Demo script: `developer-workspace/blueprint/demo-script.md`
- CI plan: `developer-workspace/plans/ci-test-coverage.md`
- Verification matrix: `developer-workspace/blueprint/verification.md`