# Guest Profiling System — Complete Bundle

This bundle contains **everything** needed to understand, build, and continue
developing the Guest Profiling System. Nothing was excluded.

## What's in here

### 1. Original repo artifacts (from lordwhitefire/guest-profiling-system)

- `agents/` — the 3 custom agent definitions:
  - `reverse-engineering-agent.md`
  - `product-management-agent.md`
  - `openspec-architect.md`
- `skills/` — the 16+ skill files organized into:
  - `re/` — reverse engineering (triage, static-analysis, dynamic-lab, reporting, external-references)
  - `product-management/` — CIRCLES method (comprehend, identify, report, cut, list, evaluate, summarize)
  - `openspec/` — OpenSpec workflow (explore, propose, update-change, sync-specs, archive-change)
  - `blueprint/` — Victor's build model with 80-area Checklist
- `guest-profiling-system-explained.md` — the plain-English plan for the system
- `repomix-output.xml` — the single context bundle for the builder agent
- `README.md` — original README (augmented with new install instructions)

### 2. Build artifacts (3 OpenSpec tasks, all verified)

- `openspec/tasks-registry.md` — the master task list (status of all 6 tasks)
- `openspec/tasks/TASK-001/` — Foundation (DONE, verified):
  - `task.md` — implementation brief
  - `testing.md` — acceptance criteria
- `openspec/tasks/TASK-002/` — Adapter-read sync worker (DONE, verified)
- `openspec/tasks/TASK-003/` — Guest profile API (DONE, verified)
- (TASK-004, TASK-005, TASK-006 are pending in the registry)

### 3. Code (Phase 0 + Phase 1 partial — 3 tasks shipped)

```
packages/
├── core/                       Next.js 16 app + API (13 routes compiled)
│   ├── app/api/auth/{login,logout,register}/route.ts
│   ├── app/api/guests/route.ts                  POST + GET (list)
│   ├── app/api/guests/search/route.ts           GET (live search, Feature F1)
│   ├── app/api/guests/[guestId]/route.ts        GET + PUT
│   ├── app/api/guests/[guestId]/reservations/route.ts
│   ├── app/api/guests/[guestId]/loyalty/route.ts
│   ├── app/{login,design-system,page}/...
│   ├── components/ui/{button,input,card,badge,toast}.tsx
│   ├── src/server/{response,auth-helpers}.ts
│   ├── src/server/guests/{repository,phase-derivation,sensitive-fields,search-ranking}.ts
│   ├── src/server/audit/log.ts
│   └── middleware.ts
├── adapter-read/               SSLR-pattern sync worker (TASK-002, verified)
│   └── src/{worker,config,encryption,sync-state,throttle,update-sync,delete-sync,schema-validation}.ts
│       mappings/{qloapps,index,types}.ts
├── adapter-fill-extension/     Chrome MV3 stub (TASK-006, pending)
└── shared/                     Types + Zod schemas + DB migrations + auth
    ├── src/{types,schemas,index}.ts
    ├── src/auth/{password,jwt,tenant-scope,index}.ts
    ├── src/db/{client,index}.ts
    └── src/db/migrations/001_initial_schema.sql (9 tables, 11 indexes, 7 triggers)
```

### 4. Planning documents (in `planning-docs/` folder)

These are the 4 deliverables from the planning conversation. Each is in both
Word (.docx) and PDF (.pdf) format:

1. **Discovery Report** (`Guest-Profiling-System_Discovery-Report`)
   - Step 1 of 5: 5 open-source reference repositories identified
2. **Behavioral Specification** (`Guest-Profiling-System_Behavioral-Specification`)
   - Step 2 of 5: 5 reverse-engineered spec cards (no code copied; stack-agnostic)
3. **PM Plan** (`Guest-Profiling-System_PM-Plan`)
   - Step 3 of 5: CIRCLES recommendation + Blueprint 80-area checklist
4. **OpenSpec Design** (`Guest-Profiling-System_OpenSpec-Design`)
   - Step 4 of 5: TASK-001 patch manifest + how to apply

### 5. Documentation

- `ARCHITECTURE.md` — high-level architecture overview; references the 4 planning docs
- `PROGRESS.md` — Blueprint area 73 (session recovery); current task status
- `README.md` — install + run instructions (augmented from original)
- `.env.example` — every env var the project needs
- `docs/openapi.yaml` — OpenAPI 3.1 spec for the guest API (6 endpoints)
- `docs/runbook/` — 5 runbook files:
  - `deploy.md`, `sync-job-manual.md`, `dsr-handling.md`, `schema-drift.md`, `new-tenant.md`
- `LICENSE` — MIT
- `.github/workflows/ci.yml` — GitHub Actions (lint, typecheck, unit, e2e)

## How to verify everything works

```bash
pnpm install
pnpm typecheck       # PASS — all 4 packages, 0 errors
pnpm test:unit       # 175 tests pass, 1 skipped (with documented reason), 0 fail
pnpm build           # Next.js build: 13 routes compiled
```

## How to apply the patches (alternative to this bundle)

If you prefer to apply my work to your existing repo via git:

```bash
cd guest-profiling-system
git checkout -b task-001-to-003
git am < 0001-TASK-001-foundation.patch
git am < 0002-TASK-002-adapter-read.patch
git am < 0003-TASK-003-guest-api.patch
pnpm install
pnpm test:unit
```

The patches are also in this bundle's parent directory (the zip's siblings).

## OpenSpec task registry status

- ✅ TASK-001 — Foundation (Phase 0): DONE, verified
- ✅ TASK-002 — Adapter-read sync worker (Phase 1): DONE, verified
- ✅ TASK-003 — Guest profile API (Phase 1): DONE, verified
- ⏳ TASK-004 — Receptionist web UI (Phase 1): pending
- ⏳ TASK-005 — Admin UI (Phase 1): pending
- ⏳ TASK-006 — Browser extension form-fill (Phase 2): pending

## What was NOT excluded

- All 3 original agent files (reverse-engineering, product-management, openspec-architect)
- All 16+ original skill files (re/, product-management/, openspec/, blueprint/)
- The plain-English plan (guest-profiling-system-explained.md)
- The repomix context bundle (repomix-output.xml)
- All 4 planning documents (Discovery, Behavioral Spec, PM Plan, OpenSpec Design)
- All 3 OpenSpec task briefs (task.md + testing.md for each)
- All source code (4 packages: core, adapter-read, adapter-fill-extension, shared)
- All tests (175 passing)
- All documentation (ARCHITECTURE.md, PROGRESS.md, README, runbooks, OpenAPI spec)
- CI pipeline (.github/workflows/ci.yml)
- LICENSE (MIT)
- pnpm-lock.yaml (for reproducible installs)

Nothing was excluded. Your agent has the complete picture.
