# Plan — Put as many tests as possible into GitHub Actions

**Date:** 2026-11-16
**Goal:** CI runs lint, typecheck, unit tests, production build, Playwright smoke, and the 3 local-Postgres integration tests. No Render or external service is needed.

## What CI runs today

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test:unit -- --coverage`
- `pnpm test:e2e` (Playwright; builds the app through its webServer)

## What is missing

- `pnpm test:integration` — the 3 real-Postgres tests are local-only.
- No explicit `pnpm build` step outside Playwright.

## Plan

1. Add an `integration-tests` job to `.github/workflows/ci.yml`.
2. Give it a `postgres:15` service container with:
   - user `postgres`
   - password `choose-a-password`
   - default database `gps`
3. After the service is healthy:
   - create `pms` and `pms_lakeside` databases;
   - load `packages/adapter-read/fixtures/source-pms-seed.sql` into both;
   - run `pnpm db:migrate` against `gps`;
   - run `seed-connections.ts` to create the two read/write adapter connections;
   - run `pnpm test:integration`.
4. Add a `build` job that runs `pnpm build` with dummy env values, so build breakage is caught independently of Playwright.
5. Keep the existing lint/typecheck, unit, and E2E jobs.
6. Verify:
   - `pnpm typecheck`
   - `pnpm lint`
   - `pnpm test:unit`
   - `pnpm test:integration` locally
   - YAML parses

## Why this is safe

- The CI Postgres is a throwaway service container, not the owner's real database.
- The source fixture is the existing `source-pms-seed.sql`; no hotel data is used.
- The integration tests clean up their temporary rows.
- No Render, no external network, no owner credentials.

## Result (2026-11-16)

- `.github/workflows/ci.yml` now has **5 jobs**: lint/typecheck, build, unit, integration, E2E.
- Integration job uses a `postgres:15` service and loads `source-pms-seed.sql` into `pms` and `pms_lakeside`.
- `seed-connections.ts` now accepts `SOURCE_PMS_BASE_URL` so CI can point at the service.
- YAML parsed successfully with 5 jobs.
- Fixture load tested against a throwaway local database: **207 rows** loaded.
- `pnpm typecheck` passes.
- Local `pnpm test:integration` already passes (3 tests).