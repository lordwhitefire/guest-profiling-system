# TASK-001 — Foundation

**Phase**: 0 (Foundation)
**Status**: ready to build
**Estimated effort**: 1–2 weeks single-dev
**Depends on**: nothing (this is the foundation)

## What this task produces

The Phase 0 foundation: a pnpm monorepo with five packages, a PostgreSQL schema migration covering all tables from the PM Plan (Section 14.3), a custom design system on Tailwind 4, JWT-based auth scaffolding with the tenant-scope resolver (Card 2 pattern), and a CI pipeline. No user-visible product ships from this task — every later task builds on it.

This task captures decisions in code so that Phase 1 work can start from a known base rather than from a blank repo.

## Scope

### In scope

1. **Monorepo scaffold** — pnpm workspaces; five packages: `core`, `adapter-read`, `adapter-fill-extension`, `web` (inside `core`), `shared`
2. **Database schema migration** — all tables in PM Plan Table 14: `tenants`, `users`, `guests`, `reservations`, `guest_identity_documents`, `loyalty_profiles`, `audit_logs`, `sync_state`, `adapter_connections`; plus `schema_migrations` (auto-managed by node-pg-migrate)
3. **Indexes** — pg_trgm extension on `guests(email)`, `guests(first_name)`, `guests(last_name)`; btree on `guests(phone)`, `guests(tenant_id, deleted_at)`; btree on `reservations(guest_id, check_in desc)`; btree on `audit_logs(tenant_id, created_at)`; btree on `sync_state(tenant_id, table_name)`
4. **Triggers** — `BEFORE UPDATE` trigger on every domain table to maintain `updated_at` automatically (per Card 2 pattern)
5. **Design system** — Tailwind 4 config; custom token set (color, type, spacing, radius, shadow); base components: Button, Input, Card, DataTable, Toast, Badge
6. **Auth scaffolding** — JWT issue + verify (jose library); Argon2id password hashing (argon2 library); group-claim resolver implementing Card 2's `resolve_property_scope` pattern (fail-closed); `/login`, `/logout`, `/register` API routes; Next.js middleware for `/admin/*` auth check
7. **CI pipeline** — GitHub Actions: typecheck (tsc --noEmit), lint (ESLint), unit tests (Vitest), Playwright smoke test against `/login`
8. **Documentation skeleton** — README.md, ARCHITECTURE.md (links to PM Plan + Behavioral Spec + Discovery Report), PROGRESS.md (Blueprint area 73 — session recovery), `.env.example`, OpenAPI 3.1 stub
9. **LICENSE** — MIT by default (owner can swap to Apache 2.0 if open-sourced)
10. **Runbook stub** — `docs/runbook/` with empty sections for: deploy, sync job manual trigger, DSR handling, schema drift handling, adding a new tenant

### Out of scope

- Any business logic beyond auth (live search ranking, source → profile mapping, sync cursor advancement, form-fill scoring, phase derivation, sensitive-field stripping, consent enforcement, audit logging, DSR handling). All of these belong to TASK-002 through TASK-005.
- Any UI beyond the design system primitives. The receptionist screen, admin screens, and extension popup belong to TASK-004, TASK-005, TASK-006.
- The actual adapter-read worker. Belongs to TASK-002.
- Any deployment configuration beyond the `.env.example` template. Hosting is Pending the owner's call.

## Implementation brief

### Repository layout

```
guest-profiling-system/                    (the existing repo)
├── README.md                              (existing — preserve, augment)
├── guest-profiling-system-explained.md    (existing — preserve)
├── repomix-output.xml                     (existing — preserve)
├── agents/                                (existing — preserve)
├── skills/                                (existing — preserve)
├── openspec/                              (NEW — created by Step #4)
│   ├── tasks-registry.md
│   └── tasks/TASK-001/{task.md, testing.md}
├── packages/                              (NEW — TASK-001 scaffold)
│   ├── core/                              (Next.js 16 app + API)
│   ├── adapter-read/                      (sync worker — separate process)
│   ├── adapter-fill-extension/            (Chrome MV3 extension)
│   └── shared/                            (types + Zod schemas + contracts)
├── pnpm-workspace.yaml
├── package.json                           (root — workspace scripts)
├── tsconfig.base.json
├── .github/workflows/ci.yml
├── .env.example
├── ARCHITECTURE.md
├── PROGRESS.md
├── LICENSE                                (MIT)
└── docs/
    ├── runbook/
    │   ├── deploy.md
    │   ├── sync-job-manual.md
    │   ├── dsr-handling.md
    │   ├── schema-drift.md
    │   └── new-tenant.md
    └── openapi.yaml                       (3.1 stub)
```

### Stack versions (pin these)

- Node.js 20 LTS (specify in `.nvmrc` and `engines` field)
- pnpm 9.x
- TypeScript 5.4+
- Next.js 16 (App Router)
- React 18.3+
- Tailwind CSS 4 (new V4 engine)
- shadcn/ui (latest — install via CLI into `packages/core/components/ui`)
- postgres.js 3.4+ (driver)
- Kysely 0.27+ (query builder — type-safe, no ORM lock-in)
- node-pg-migrate 7.x (migrations)
- jose 5.x (JWT)
- argon2 0.40+ (password hashing)
- Zod 3.23+ (schema validation, shared between API and client)
- Vitest 1.6+ (unit tests)
- Playwright 1.45+ (e2e)
- pg-mem 0.16+ (in-memory Postgres for DB unit tests)
- ESLint 9.x + Prettier 3.x
- esbuild (extension bundler)

### Database migration — file `001_initial_schema.sql`

The migration must produce exactly the tables and indexes listed in PM Plan Table 14. Specifics:

- All UUID PKs use `DEFAULT gen_random_uuid()` (Postgres 13+)
- `tenant_id UUID NOT NULL REFERENCES tenants(tenant_id)` on every domain table
- `deleted_at TIMESTAMPTZ NULL` on every domain table EXCEPT `audit_logs` (append-only)
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` and `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` on every domain table
- `updated_at` maintained by a single shared trigger function `update_updated_at_column()` referenced by `BEFORE UPDATE` triggers on every domain table
- `guests.email` is `UNIQUE (tenant_id, email)` — email uniqueness is per-tenant, not global
- `guests.guest_phase` is a VARCHAR with a CHECK constraint listing Card 3's 12 phases (UNKNOWN_CONTACT, ACQUIRING, BOOKING_RECEIVED, WELCOME_SENT, INFO_SENT, IDLE, UPSELL, PRE_CHECKIN, CHECKIN_DAY, IN_HOUSE, POST_STAY, ESCALATED)
- `audit_logs` is append-only: NO `deleted_at` column, NO UPDATE/DELETE trigger grants (enforced at role level if possible, otherwise by convention)
- `guest_identity_documents.document_number` is `BYTEA` (encrypted at rest via pgcrypto, with the encryption key from env)
- `adapter_connections.connection_url_encrypted` is `BYTEA` (same encryption pattern)
- `sync_state.table_name` and `sync_state.tenant_id` together form the PK (composite)

### Auth scaffolding

Implement in `packages/shared/auth/`:

- `jwt.ts` — issue and verify JWTs using jose. Claims: `sub` (user_id), `tenant_id`, `groups[]`, `iat`, `exp`. 24h sliding expiration.
- `password.ts` — Argon2id hashing. Parameters: memory cost 19456 (19 MiB), time cost 2, parallelism 1.
- `tenant-scope.ts` — the tenant scope resolver. Implements Card 2's `resolve_property_scope` pattern. Three resolution outcomes: `single-tenant` (caller has `tenant_id` claim), `chain-level` (caller has `Admin` group and no `tenant_id` claim narrowing), `denied` (no qualifying scope). Never widens.

Implement in `packages/core/src/server/auth/`:

- `login/route.ts` — POST /api/auth/login; accepts email + password; returns JWT in httpOnly cookie
- `logout/route.ts` — POST /api/auth/logout; clears cookie
- `register/route.ts` — POST /api/auth/register; admin-only; creates a user in a tenant
- `middleware.ts` — Next.js middleware; checks JWT on `/admin/*` paths; redirects to `/login` if missing or expired

### CI pipeline (`.github/workflows/ci.yml`)

Triggers: push to main, pull_request to main. Jobs:

1. `lint-typecheck` — pnpm install, pnpm lint, pnpm typecheck (tsc --noEmit across all packages)
2. `unit-tests` — pnpm test:unit (Vitest + pg-mem)
3. `e2e-tests` — pnpm test:e2e (Playwright against a seeded pg-mem instance)

All jobs run on ubuntu-latest with Node.js 20. Cache pnpm store.

### Documentation skeleton

- `README.md` — augment existing with: how to install pnpm, how to install deps, how to run migrations, how to start dev server, how to run tests. Reference ARCHITECTURE.md and PROGRESS.md.
- `ARCHITECTURE.md` — high-level architecture overview. Links to the three Step #1–#3 deliverables (Discovery Report, Behavioral Specification, PM Plan) as the authoritative spec.
- `PROGRESS.md` — Blueprint area 73. Format: "Last session: <date>. Completed: <list>. In progress: <list>. Next: <task ID>. Blockers: <list>."
- `.env.example` — every env var the project needs, with placeholder values. Includes DATABASE_URL, JWT_SECRET (placeholder "CHANGE_ME"), ARGON2_SECRET (placeholder), SOURCE_PMS_URL (placeholder), PORT (3000).
- `docs/openapi.yaml` — OpenAPI 3.1 stub with the six guest endpoints from Card 2 (Section 4.2), unimplemented (returns 501 Not Implemented in this task).

## Acceptance criteria

The patch is acceptable when ALL of the following are true on a fresh clone after `pnpm install`:

1. `pnpm install` completes with zero errors across all five packages
2. `pnpm typecheck` passes (tsc --noEmit, no errors)
3. `pnpm lint` passes (ESLint, no errors)
4. `pnpm test:unit` passes — at minimum: the Argon2id hash+verify roundtrip works; the JWT issue+verify roundtrip works; the tenant-scope resolver returns the correct scope for each of the three cases (single-tenant, chain-level, denied); the migration applies cleanly to a pg-mem instance and produces all expected tables and indexes
5. `pnpm test:e2e` passes — at minimum: Playwright can load `/login` and submit a form (the form does not need to succeed in this task; the page must render)
6. `pnpm db:migrate` applies the schema cleanly to a fresh Postgres instance (tested locally against Docker postgres:15)
7. The design system base components render in Storybook or a `/design-system` preview page

## What this task does NOT verify

- Performance (no benchmarks in this task — that's TASK-003's acceptance criterion)
- Real source PMS connectivity (no real source PMS in this task — TASK-002)
- Form-fill behavior (no extension in this task — TASK-006)
- Multi-tenant behavior at runtime (single-tenant deploy in v1 — TASK-005 admin UI tests the resolver, not the deploy)

## Out-of-scope edge cases to note for later tasks

- **xmin wrapping** (Card 1's known issue): documented in `sync_state` table's `last_seen_xmin` column comment; not handled in TASK-001; deferred to TASK-002 with a TODO comment
- **Concurrent sync workers for the same tenant**: documented in `adapter_connections` table comment ("one worker per tenant; constraint"); enforced at app level in TASK-002
- **Schema drift in source PMS**: detected by TASK-002's sync job per Card 1's `resyncOnSchemaChange` flag; not handled in TASK-001

## Hand-off

When TASK-001 is `done`:

1. Architect verifies against `testing.md`
2. Architect marks `done` in `openspec/tasks-registry.md`
3. Architect updates `PROGRESS.md` at repo root
4. Builder picks the next `pending` task whose dependencies are satisfied (TASK-003 if first-hotel decision is still Pending; TASK-002 otherwise)
