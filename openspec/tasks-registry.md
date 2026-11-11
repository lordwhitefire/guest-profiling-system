# Tasks Registry — Guest Profiling System

Source of truth for build tasks. Each entry is one OpenSpec change proposal.
The Architect writes this file; the Builder picks entries one at a time.

Status legend: `pending` (not started), `in_progress` (Builder has the task),
`done` (Builder reports complete + Architect confirmed), `blocked` (waiting on external input).

## Active tasks

| ID | Title | Status | Phase | Notes |
|----|-------|--------|-------|-------|
| TASK-001 | Foundation — monorepo, schema, design system, auth scaffold, CI | done (verified) | 0 | Patch 0001-TASK-001-foundation.patch; typecheck + tests + Next.js build all pass |
| TASK-002 | Adapter-read — SSLR-pattern sync worker (Card 1 contract) | done (verified) | 1 | QloApps source mapping; typecheck + 56 tests pass; ready to apply |
| TASK-003 | Guest profile API — six endpoints + tenant scope resolver (Card 2) | done (verified) | 1 | Six guest endpoints + live search + audit log; typecheck + 175 tests pass; Next.js build OK |
| TASK-004 | Receptionist web UI — search screen + profile view | done (verified) | 1 | Two-pane search + profile detail; typecheck + 88 tests pass; 15 routes compiled |
| TASK-005 | Admin UI — tenants, sync status, audit, users, DSR | pending | 1 | Depends on TASK-003 |
| TASK-005a | Demo slice — messy guest fixture + seeding script (first-load bulk import) | done (verified) | 1 | Adds `pnpm seed:source` CLI + 207-row QloApps fixture + 21 new tests (227 total); first-load path that `worker.ts` throws on. See `developer-workspace/reports/TASK-005a-demo-slice.md` |
| TASK-005b | Wire workspace UI to the real guest API | done (verified) | 1 | Adds adapter layer + React hooks (useGuestSearch, useGuestDirectory, useGuest, useGuestCount) + `api.listGuests()`; falls back to mock GUESTS array with visible "demo data" banner when API unreachable. 29 new tests (256 total). Next.js build clean. See `developer-workspace/reports/TASK-005b-ui-wiring.md` |
| TASK-006 | Browser extension form-fill — Card 5 algorithm | pending | 2 | Depends on TASK-003 + TASK-004 |

## Pending external decisions (owner's call)

These block specific tasks but not all of Step #4:

- **First hotel customer** — must be identified before TASK-002 ships to production. The adapter-read code is verified against a 207-row QloApps-style fixture (TASK-005a); a real hotel is needed only to validate against a real PMS schema and real data volumes. Recommendation: identify before Phase 1 ships, but not before demoing.
- **Hosting provider** — Render / Fly.io / Railway / VPS. Affects TASK-001's deployment config but NOT the scaffold itself. Patch 0001 is hosting-agnostic.
- **Brand identity** — name beyond "Guest Profiling System" + logo. Affects TASK-004 (UI copy) but not the scaffold.
- **Open-source license** — MIT (recommended) or Apache 2.0. Affects the LICENSE file. Patch 0001 ships MIT by default; trivially changeable.

## Architecture decisions already made (do not re-litigate)

Captured in detail in `Guest-Profiling-System_PM-Plan.docx`. Summary:

1. **Stack**: TypeScript 5 / Node.js 20 LTS / Next.js 16 (App Router) / PostgreSQL 15+ / Tailwind 4 / shadcn/ui
2. **Multi-tenancy**: `tenant_id` on every domain table from day one; v1 deploys single-tenant per hotel install
3. **Delete policy**: soft delete throughout (`deleted_at`); manual hard-delete for retention window only
4. **Build order** (Victor confirmed 2026-11-08): Functionality → Business logic → Data → UI
5. **Adapter split**: Adapter-Read and Adapter-Fill are separate components with a shared guest-data contract
6. **Auth**: JWT with group claims (no Cognito); Argon2id password hashing
7. **Browser extension**: Chrome Manifest V3 only for v1
8. **No code reuse** from any of the 5 reference repos — re-implement from behavioral spec

## How to use this file

1. The Builder picks one `pending` task whose dependencies are satisfied
2. Reads `tasks/TASK-XXX/task.md` for the implementation brief
3. Reads `tasks/TASK-XXX/testing.md` for the acceptance tests
4. Implements, tests, reports back
5. The Architect verifies against `testing.md`, marks the task `done` here

A dead session resumes by reading this file first. Progress is also tracked in `PROGRESS.md` at the repo root.
