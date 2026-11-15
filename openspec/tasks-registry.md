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
| TASK-005 | Admin UI — tenants, sync status, audit, users, DSR | done (verified) | 1 | Admin screens call the real endpoints; analytics and settings use real data. Verified against the live DB under TASK-008/009. |
| TASK-005a | Demo slice — messy guest fixture + seeding script (first-load bulk import) | done (verified) | 1 | `pnpm seed:source` + 207-row QloApps fixture; `pms` and `pms_lakeside` seeded and used by the two-hotel demo. |
| TASK-005b | Wire workspace UI to the real guest API | done (verified) | 1 | Adapter layer + React hooks + `api.listGuests()`. Mock fallbacks were removed in TASK-009; the workspace renders real API data only. |
| TASK-006 | Browser extension form-fill — Card 5 algorithm | done (verified) | 2 | FormFilla Chrome MV3 extension: scanner + scorer + solver + native setter. 69 tests. Loaded in Chrome; bridge and fill verified (Full Name, email, phone). |
| TASK-008 | Make the build real: DB, live verification, settings/analytics gaps, records | done (verified) | 1 | Real `gps` DB, persisted settings, real analytics chart, live pg_trgm search. Registration write path + production verification moved to TASK-009 and completed there. |
| TASK-009 | Runtime map + clickability/behaviour audit on the production build | done (software scope) | 1 | Two hotels, real registration loop, clean DB, full click pass (0 DEAD / 0 FAKE), extension bridge + fill verified. Owner-dependent: install the extension in the everyday Chrome; connect a real hotel PMS. |

## Resolved decisions (previously Pending)

Per owner directive (2026-11-12 IM session):

- **First hotel customer** — NOT NEEDED for production-grade software.
  The software reads any PMS that matches the QloApps schema (or a new
  mapping can be added per the existing `mappings/types.ts` interface).
  The integration layer (connecting to a specific hotel's PMS) is a
  separate concern that happens when a customer is identified.
- **Hosting provider** — **Render**. Declared in `render.yaml` (one web
  service + one managed Postgres + one cron worker). See PROGRESS.md.
- **Brand identity** — **DECIDED**. The workspace UI ships its own visual
  identity: gps-brand-mark in the sidebar, "Guest Profiling System"
  wordmark, hotel-name placeholders throughout. No further brand work
  needed for v1.
- **License** — **MIT** (per the discovery report recommendation and
  the existing LICENSE file).

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
