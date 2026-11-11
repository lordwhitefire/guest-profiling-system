# TASK-001 — Testing

**Phase**: 0 (Foundation)
**Status**: ready to verify
**Pairs with**: `task.md` in this folder

This file defines what must be checked before TASK-001 can be marked `done` in `openspec/tasks-registry.md`. The Architect runs these checks; the Builder self-checks before reporting complete.

## Test categories

### 1. Static checks (CI must pass)

- [ ] `pnpm install` exits 0 on a fresh clone (no node_modules present)
- [ ] `pnpm typecheck` exits 0 — `tsc --noEmit` across all five packages
- [ ] `pnpm lint` exits 0 — ESLint with the configured ruleset
- [ ] No `console.log` statements outside test files (enforced by ESLint rule)
- [ ] No `any` types outside test fixtures (enforced by ESLint rule)
- [ ] No `// TODO` without a linked issue number (enforced by ESLint rule, format `// TODO(#NNN): ...`)

### 2. Database migration tests (Vitest + pg-mem)

Located in `packages/shared/db/__tests__/migration.test.ts`:

- [ ] `pnpm db:migrate` against a fresh pg-mem instance creates all 9 tables: `tenants`, `users`, `guests`, `reservations`, `guest_identity_documents`, `loyalty_profiles`, `audit_logs`, `sync_state`, `adapter_connections`, plus `schema_migrations` (node-pg-migrate's tracking table)
- [ ] Every domain table has `tenant_id UUID NOT NULL REFERENCES tenants(tenant_id)` (except `tenants` itself)
- [ ] Every domain table has `created_at` and `updated_at` TIMESTAMPTZ columns with `DEFAULT NOW()`
- [ ] Every domain table has `deleted_at TIMESTAMPTZ NULL` EXCEPT `audit_logs` (must not have `deleted_at`)
- [ ] The shared `update_updated_at_column()` function exists and is referenced by `BEFORE UPDATE` triggers on every domain table
- [ ] Triggering an UPDATE on `guests` causes `updated_at` to advance without explicit set
- [ ] `guests.email` is unique per tenant — inserting two rows with the same email but different `tenant_id` succeeds; inserting two rows with the same email and the same `tenant_id` fails with a unique violation
- [ ] `guests.guest_phase` CHECK constraint accepts all 12 Card 3 phases and rejects any other value
- [ ] `guest_identity_documents.document_number` is `BYTEA` (not text — encrypted at rest)
- [ ] `adapter_connections.connection_url_encrypted` is `BYTEA`
- [ ] `sync_state` primary key is composite `(tenant_id, table_name)`
- [ ] The pg_trgm extension is created (the migration must `CREATE EXTENSION IF NOT EXISTS pg_trgm`)
- [ ] Trigram indexes exist on `guests(email)`, `guests(first_name)`, `guests(last_name)`
- [ ] Btree indexes exist on `guests(phone)`, `guests(tenant_id, deleted_at)`, `reservations(guest_id, check_in desc)`, `audit_logs(tenant_id, created_at)`, `sync_state(tenant_id, table_name)`

### 3. Auth scaffolding tests (Vitest)

Located in `packages/shared/auth/__tests__/`:

- [ ] `password.test.ts` — Argon2id hash+verify roundtrip works. Hashing the same password twice produces different hashes (salt is random). Verifying with the correct password returns true; with the wrong password returns false. Hashing parameters: memory cost 19456, time cost 2, parallelism 1 (assert via `argon2` library's parameter inspection).
- [ ] `jwt.test.ts` — issue+verify roundtrip works. Claims `sub`, `tenant_id`, `groups[]`, `iat`, `exp` are present after verify. Token expires after 24h (assert `exp - iat === 86400`). Tampered token (changed signature) fails verification. Expired token fails verification.
- [ ] `tenant-scope.test.ts` — the resolver returns the correct scope for each input:
  - Caller has `tenant_id` claim and any group → returns `single-tenant` scope with that `tenant_id`
  - Caller has `Admin` group and no `tenant_id` claim → returns `chain-level` scope
  - Caller has `RegionalManager` group and no `tenant_id` claim and no region claim → returns `denied`
  - Caller has no `tenant_id` claim and no qualifying group → returns `denied` (fail-closed)
  - Caller has no `tenant_id` claim and `Receptionist` group only → returns `denied` (receptionist cannot list across tenants)

### 4. API endpoint tests (Vitest against Next.js route handlers)

Located in `packages/core/src/server/auth/__tests__/`:

- [ ] `login.test.ts` — POST /api/auth/login with valid email+password returns 200 and sets an httpOnly cookie containing a valid JWT. With invalid password returns 401. With non-existent email returns 401 (same response shape, no user enumeration).
- [ ] `logout.test.ts` — POST /api/auth/logout returns 200 and clears the cookie.
- [ ] `register.test.ts` — POST /api/auth/register without admin group returns 403. With admin group + valid body creates user and returns 201. Duplicate email within same tenant returns 409.
- [ ] Middleware test — `middleware.ts` redirects unauthenticated requests to `/admin/*` to `/login?redirect=<original>`. Authenticated requests with `Admin` group pass through. Authenticated requests without `Admin` group return 403.

### 5. E2E test (Playwright)

Located in `packages/core/e2e/login.spec.ts`:

- [ ] Playwright can navigate to `http://localhost:3000/login` and the page renders within 5 seconds. The form contains an email input, a password input, and a submit button. (The form does not need to authenticate successfully in TASK-001 — that's covered by the unit tests above. This test only verifies the page renders.)

### 6. Documentation checks (manual review)

- [ ] `README.md` exists and includes: project description, install instructions, dev-run instructions, test instructions, link to `ARCHITECTURE.md`
- [ ] `ARCHITECTURE.md` exists and links to the three upstream deliverables (Discovery Report, Behavioral Specification, PM Plan — file names match what's in `/home/z/my-project/download/`)
- [ ] `PROGRESS.md` exists with the format specified in `task.md`. Initial content: "Last session: <date>. Completed: TASK-001 foundation. In progress: none. Next: TASK-003 (or TASK-002 if first-hotel decision resolved). Blockers: first-hotel-customer pending (blocks TASK-002)."
- [ ] `.env.example` exists and lists every env var the project needs with placeholder values
- [ ] `docs/openapi.yaml` exists as an OpenAPI 3.1 stub with the six guest endpoints from Card 2 declared but returning `501 Not Implemented` (responses section)
- [ ] `docs/runbook/` directory exists with five stub files: `deploy.md`, `sync-job-manual.md`, `dsr-handling.md`, `schema-drift.md`, `new-tenant.md`. Each contains a "TODO: document <procedure>" placeholder and a one-paragraph summary of what the procedure is.

### 7. Design system checks (manual review or Storybook)

- [ ] Tailwind 4 config exists with custom tokens: color (primary, body, secondary, accent, surface), typography (font-family, sizes), spacing (4px base scale), radius, shadow
- [ ] Base components exist in `packages/core/components/ui/`: Button (variants: primary, secondary, ghost, destructive), Input, Card, DataTable (using @tanstack/react-table), Toast (using sonner), Badge
- [ ] A `/design-system` preview page exists in `packages/core/app/design-system/page.tsx` that renders every base component
- [ ] The `/design-system` page passes Playwright e2e smoke test (loads within 5 seconds, renders without errors)

### 8. CI pipeline checks (manual review)

- [ ] `.github/workflows/ci.yml` exists and is valid YAML
- [ ] CI runs on push to main and on pull_request to main
- [ ] CI jobs: `lint-typecheck`, `unit-tests`, `e2e-tests` (in this order, e2e depends on unit passing)
- [ ] CI uses Node.js 20 and caches pnpm store
- [ ] CI installs pnpm via `pnpm/action-setup@v3` with version 9

### 9. Repo hygiene checks (manual review)

- [ ] `.gitignore` exists and ignores: `node_modules/`, `.next/`, `.env`, `.env.local`, `dist/`, `coverage/`, `*.log`, `.turbo/` (if using turborepo), `.DS_Store`
- [ ] `.nvmrc` exists and pins Node.js 20 (`20` or `20.x.x`)
- [ ] `package.json` root `engines` field pins `node: ">=20.0.0"` and `pnpm: ">=9.0.0"`
- [ ] `LICENSE` file exists with MIT license text (copyright holder TBD by owner; placeholder "Guest Profiling System contributors" for now)
- [ ] No secrets, API keys, or real credentials anywhere in the repo (including `.env.example` — placeholders only)

## Verification procedure

The Architect verifies TASK-001 by:

1. Cloning the patch into a fresh directory
2. Running `pnpm install` — must complete with zero errors
3. Running `pnpm typecheck && pnpm lint` — both must pass
4. Running `pnpm test:unit` — all unit tests must pass
5. Running `pnpm test:e2e` — Playwright smoke test must pass
6. Starting a Postgres 15 Docker container and running `pnpm db:migrate` against it — must complete cleanly
7. Starting the dev server (`pnpm dev`) and loading `/design-system` in a browser — must render
8. Manual review of the documentation files per Section 6 above
9. Manual review of the CI YAML per Section 8 above
10. Manual review of repo hygiene per Section 9 above

If all checks pass, the Architect:

- Marks TASK-001 as `done` in `openspec/tasks-registry.md`
- Updates `PROGRESS.md` at the repo root
- Informs the user the patch is ready to apply
- Hands off to the Builder for the next pending task (TASK-003 if first-hotel is still Pending; TASK-002 otherwise)

If any check fails, the Architect:

- Reports the failure with the exact error message
- Returns the task to the Builder with the specific failing check
- Does NOT mark the task `done` until all checks pass

## What this testing file does NOT cover

- Performance benchmarks (deferred to TASK-003 acceptance: p95 search < 300ms)
- Real source PMS connectivity (deferred to TASK-002)
- Browser extension behavior (deferred to TASK-006)
- Production deployment verification (deferred to a separate deploy-validation task)
- Accessibility audit (deferred to TASK-004 acceptance — full WAI-ARIA pass on the receptionist screen)
- Security audit (deferred to a separate security-review task before any production deploy)
