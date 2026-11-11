# Progress — Guest Profiling System

This file is Blueprint area 73 (Progress tracking). A dead session resumes by reading this file first.

Format: "Last session: <date>. Completed: <list>. In progress: <list>. Next: <task ID>. Blockers: <list>."

---

**Last session**: 2026-11-10 (TASK-004 added)

**Completed**:
- Step #1 — Discovery Report (5 reference repos identified)
- Step #2 — Behavioral Specification (5 spec cards reverse-engineered from source)
- Step #3 — PM Plan (CIRCLES + Blueprint 80-area checklist; 60 Decided / 16 Skip / 4 Pending)
- Step #4 — OpenSpec TASK-001 (Foundation): built, VERIFIED END-TO-END
  - pnpm install: 491 packages, 0 errors
  - pnpm typecheck: PASS (all 4 packages)
  - pnpm test:unit: 64 tests pass, 1 skipped (pg-mem parser limitation, documented)
  - pnpm build (Next.js): PASS — 8 routes compiled
- Step #4 continued — OpenSpec TASK-002 (Adapter-read): built, VERIFIED END-TO-END
  - pnpm typecheck: PASS (all 4 packages, including adapter-read)
  - pnpm test:unit: 56 new tests pass in adapter-read (QloApps mapping, throttle, encryption, registry)
  - Total project: 119 tests pass, 1 skipped, 0 fail
  - Worker CLI: pnpm --filter @gps/adapter-read start -- --tenant=<uuid>
- Step #4 continued — OpenSpec TASK-003 (Guest profile API): built, VERIFIED END-TO-END
  - pnpm typecheck: PASS
  - pnpm test:unit: 56 new tests pass in core (response envelope, phase derivation, search ranking, sensitive fields, audit log)
  - Total project: 175 tests pass, 1 skipped, 0 fail
  - pnpm build (Next.js): PASS — 13 routes compiled (was 8; +5 guest endpoints + 1 search endpoint)
  - Six guest endpoints per Card 2: POST/GET /api/guests, GET/PUT /api/guests/{id}, GET /reservations, GET /loyalty, GET /api/guests/search
- Step #4 continued — OpenSpec TASK-004 (Receptionist web UI): built, VERIFIED END-TO-END
  - pnpm typecheck: PASS
  - pnpm test:unit: 32 new tests pass in core (api-client, avatar, phase-badge)
  - Total project: 206 tests pass, 1 skipped, 0 fail
  - pnpm build (Next.js): PASS — 15 routes compiled (was 13; +/search + /profile/[guestId])

**In progress**:
- nothing

**Next**:
- TASK-005 (Admin UI) — ready to start; depends on TASK-003 (done)
- TASK-006 (Browser extension) — depends on TASK-003 + TASK-004 (both done)

**Blockers**:
- First hotel customer not yet identified (no longer blocks TASK-002 — built with QloApps as the reference PMS shape; can be changed when a real customer is identified)
- Hosting provider not yet chosen (does not block scaffold; affects deployment config later)
- Brand identity not yet chosen (does not block scaffold; affects UI copy in TASK-004)
- Open-source license: MIT chosen as default; owner can swap

**OpenSpec task registry**: see `openspec/tasks-registry.md` for the full task list and dependencies.
