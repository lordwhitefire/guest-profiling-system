# PROGRESS — Guest Profiling System

**Updated:** 2026-11-15

## Current state

**Phase 0 (Foundation)**: ✅ DONE — TASK-001
**Phase 1 (Core)**: ✅ DONE — TASK-002, TASK-003, TASK-004, TASK-005a, TASK-005b, TASK-005c
**Phase 2 (Form-fill)**: ✅ DONE — TASK-006
**Phase 3 (Multiple PMS adapters)**: PENDING (deferred to v2)

**Blueprint:** full 80-area checklist complete — `developer-workspace/blueprint/checklist.md` (36 Decided / 21 Pending / 23 Skip).

## Where the demo stands

- Local production build on `:3100`; clean database `gps`; two messy source databases `pms` and `pms_lakeside`.
- Two hotels: Grand Vista and Lakeside; real memberships and active-tenant switch.
- Registration writes one raw row to the active hotel's messy database; sync reads it back into the clean profile database.
- The Chrome extension is installed in the automation Chrome on `:9222` (profile `google-chrome-automation`, ID `ednclpjlmnijooahfdmmelhfjcooiolb`).
- Extension fill verified: **Full Name = “Final Check Grand”**, email and phone correct.
- Click pass on the production build: **160 PASS, 35 NOT RUN, 0 DEAD, 0 FAKE** after the targeted visit-history re-run.
- GitHub CI passed after the seeding-test fix (commit `50b52ca`). The full-name fix (`4180a86`) is local and not pushed yet.

## Tasks status

| ID | Status | Notes |
|---|---|---|
| TASK-001 | done (verified) | Foundation, monorepo, schema, design system, auth scaffold, CI |
| TASK-002 | done (verified) | Adapter-read SSLR worker; QloApps mapping; 77 tests |
| TASK-003 | done (verified) | Guest profile API, 6 endpoints, tenant scope resolver |
| TASK-004 | done (verified) | Receptionist web UI, 2-pane search + profile |
| TASK-005 | done (verified) | Admin UI wired to real endpoints |
| TASK-005a | done (verified) | Messy guest fixture + seeding script |
| TASK-005b | done (verified) | Workspace UI wired to real guest API |
| TASK-005c | done (verified) | All admin screens wired to real endpoints |
| TASK-006 | done (verified) | FormFilla extension (Card 5 algorithm); 69 tests |
| TASK-007 | done (code) | Patch stack + fixes |
| TASK-008 | done (verified) | Real DB, persisted settings, real analytics chart, live pg_trgm search; remaining work moved to TASK-009 |
| TASK-009 | done (software scope) | Two hotels, real registration loop, clean DB, click pass, extension bridge/fill, CI. Owner-dependent: install the extension in the everyday Chrome; connect a real hotel PMS when a customer exists. |

**Total tests workspace-wide: 334 passing, 0 failing, 1 skipped**

## Decisions captured (no longer Pending)

Per owner directive (2026-11-12):

- **Hosting provider (Blueprint area 18)**: **Render** — declared in `render.yaml`.
  One web service (Next.js core + API) + one managed Postgres + one cron
  worker (sync). **Declared, not deployed yet.**
- **Brand identity (Blueprint area 04)**: **DECIDED** — the workspace UI
  ships its own visual identity (gps-brand-mark in the sidebar, "Guest
  Profiling System" wordmark, Grand Vista Hotel as the demo hotel name).
- **License (Blueprint area 20)**: **MIT**.
- **First hotel customer (area 75)**: Not needed for production-grade
  software. The integration layer is separate; the software reads any PMS
  matching the QloApps schema or a new mapping.

## Production-grade checklist (Blueprint area 75)

- ✅ Money: v1 infra fits Render's starter tier.
- ⚠️ Hosting: Render declared; deployment and both databases not provisioned yet.
- ⚠️ Connectivity: local demo source DBs work. For Render, the messy PMS database must be reachable from the server.
- ⚠️ Client devices: web app works on a phone; the extension is desktop Chrome/Edge only.
- ✅ Constraints documented in ARCHITECTURE.md.

## What is still pending external

1. Push the local full-name fix (`4180a86`).
2. Deploy to Render:
   - create the clean database and a second messy PMS database;
   - set `JWT_SECRET`, `ARGON2_PEPPER`, `FIELD_ENCRYPTION_KEY`, `DEFAULT_TENANT_ID`;
   - make the messy database reachable from Render.
3. Fix the `render.yaml` cron worker: it runs `adapter-read` (incremental, one tenant, needs seeded `sync_state`), not the current core sync. Until fixed, use **Sync Now** in the app.
4. Install the extension in the everyday Chrome: ZIP + Load unpacked, or Chrome Web Store.
5. Connect a real hotel PMS when a customer is identified.
6. Room / check-in / check-out remain audit-only: `ps_customer` has no such columns and the source schema must not change.

## Known limitations

- The Kuhn-Munkres solver is O(n³). For 500 fields × 200 keys it is under 1 second; real hotel forms are 20–50 fields.
- The popup fills medium-confidence matches along with high-confidence ones. Card 5 §7.7 wants amber highlighting and a click; UI follow-up.
- Cross-origin iframes are skipped silently. If a hotel form is in a cross-origin iframe, `host_permissions` must be extended.
- The extension bridge works without `NEXT_PUBLIC_GPS_EXTENSION_ID`; setting it enables the direct `chrome.runtime` path.
- The Analytics 30-day chart is wired to the real `/api/analytics/activity` endpoint.
- The guest search fuzzy tier (`pg_trgm`) is unit-tested and was verified against the live Postgres.
- The extension is installed only in the automation Chrome profile. The everyday Chrome needs the updated ZIP loaded manually.