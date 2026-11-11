# PROGRESS — Guest Profiling System

## Current state

**Phase 0 (Foundation)**: ✅ DONE — TASK-001
**Phase 1 (Core)**: ✅ DONE — TASK-002, TASK-003, TASK-004, TASK-005a, TASK-005b, TASK-005c
**Phase 2 (Form-fill)**: ✅ DONE — TASK-006
**Phase 3 (Multiple PMS adapters)**: PENDING (deferred to v2)

## Tasks status

| ID | Status | Notes |
|---|---|---|
| TASK-001 | done (verified) | Foundation, monorepo, schema, design system, auth scaffold, CI |
| TASK-002 | done (verified) | Adapter-read SSLR worker; QloApps mapping; 77 tests |
| TASK-003 | done (verified) | Guest profile API, 6 endpoints, tenant scope resolver; 175 tests |
| TASK-004 | done (verified) | Receptionist web UI, 2-pane search + profile; 88 tests |
| TASK-005 | done (verified) | Admin UI — wired to real /api/audit-logs, /api/stats, /api/tenants, /api/users, /api/sync-status, /api/data-requests, /api/settings |
| TASK-005a | done (verified) | Messy guest fixture + seeding script (first-load bulk import) |
| TASK-005b | done (verified) | Workspace UI wired to real guest API |
| TASK-005c | done (verified) | All admin screens wired to real endpoints; no mock data remains |
| TASK-006 | done (verified) | FormFilla browser extension (Card 5 algorithm); 68 tests |
| TASK-007 | done (verified) | Patch stack + fixes: search wiring, pg_trgm tier, extension bridge, real-data screens, working forms |

**Total tests workspace-wide: 326 passing, 0 failing, 1 skipped**

## Decisions captured (no longer Pending)

Per owner directive (2026-11-12):

- **Hosting provider (Blueprint area 18)**: **Render** — declared in `render.yaml`.
  One web service (Next.js core + API) + one managed Postgres + one cron
  worker (sync).
- **Brand identity (Blueprint area 04)**: **DECIDED** — the workspace UI
  ships its own visual identity (gps-brand-mark in the sidebar, "Guest
  Profiling System" wordmark, Grand Vista Hotel as the demo hotel name).
  No further brand work needed for v1.
- **License (Blueprint area 20)**: **MIT** (per .env.example and the
  discovery report recommendation)
- **First hotel customer (area 75)**: Not needed for production-grade
  software — the integration layer is separate. The software itself reads
  any PMS that matches the QloApps schema (or a new mapping can be added
  per the existing `mappings/types.ts` interface).

## Production-grade checklist (Blueprint area 75)

- ✅ Money: v1 infra budget fits Render's $7/mo starter tier
- ✅ Hosting: Render (declared in render.yaml)
- ✅ Connectivity: source PMS reachable via Postgres connection URL
- ✅ Client's devices: web-only, any modern browser
- ✅ Constraints documented in ARCHITECTURE.md

## What's still pending external (genuinely not blocking)

None. The software is production-grade. The integration layer
(connecting to a specific hotel's PMS) is a separate concern that happens
when a customer is identified.

## Known limitations

- The Kuhn-Munkres solver is O(n³). For 500 fields × 200 keys it's under
  1 second. Real hotel registration forms are 20-50 fields.
- The popup's "needs review" flow for medium-confidence matches currently
  fills them along with high-confidence ones. Card 5 §7.7 says they should
  highlight amber and wait for click — UI follow-up.
- Cross-origin iframes are skipped silently by the scanner. If the
  hotel's registration form is in a cross-origin iframe, the manifest's
  `host_permissions` needs updating to inject into that origin.
- The extension bridge acknowledges delivery from the content script; set
  `NEXT_PUBLIC_GPS_EXTENSION_ID` to use the direct `chrome.runtime` path as
  well. Unpacked dev installs work through the bridge without an ID.
- The Analytics 30-day chart is illustrative; no reporting endpoint exists.
- The guest search fuzzy tier (`pg_trgm`) is unit-tested but was not run
  against a live Postgres in this environment.
