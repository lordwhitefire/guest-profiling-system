# Blueprint Checklist — Guest Profiling System

**Date:** 2026-11-16
**Mode:** Plan-mode review of an existing build
**Scope:** The whole product — web app, clean database, PMS adapter, Chrome extension, deployment, and the work around it.
**Status words:** **Decided** (a choice exists and is implemented; gaps are listed), **Skip** (not applicable; reason given), **Pending** (no choice yet, or the current state contradicts the requirement).
**Evidence rule:** every claim below comes from a file in this repository, or from the database evidence recorded in `developer-workspace/issues/TASK-009-data-consistency.md`. Nothing is inferred from memory.

---

## 1. Summary

| Section | Areas | Decided | Pending | Skip |
|---|---:|---:|---:|---:|
| A — all projects | 33 | 18 | 13 | 2 |
| B — sells products | 9 | 0 | 0 | 9 |
| C — web app | 22 | 11 | 4 | 7 |
| D — mobile / desktop | 8 | 1 | 2 | 5 |
| E — all projects | 8 | 6 | 2 | 0 |
| **Total** | **80** | **36** | **21** | **23** |

**Count by Home (must total 80):** UI 7 · UX Thread 8 · Data 4 · Business logic 6 · Functionality 18 · Engine 25 (Architecture 4, Integration 3, Communication between parts 1, Runtime environment 0, Deployment 3, Configuration 1, Security 4, Reliability 5, Scalability 1, Resource management 3) · Project Ring 12 = **80**.

**Engine:** 10 parts — 3 Decided, 7 Pending. Detailed in §9.
**Project Ring:** 12 areas — 8 Decided, 4 Pending. Detailed in §6.
**Gap questions:** 17 (D1–D9, R1–R5, C1–C3) — 11 answered, 6 Pending. Detailed in §7.
**Feature Cards:** 9. Detailed in §8.
**ISO 25010 double-check:** 4 pass with gaps, 5 gaps. Detailed in §10.

### What this means in one paragraph

The product is built and the core demo flow exists: two hotels, a clean profile database, derived visit history, a working registration write, and a Chrome extension that fills the hotel form. The **decided** areas are the product shape, stack, data model, tenancy, search, audit, settings, auth, and the extension's fill behaviour. The **pending** areas are not missing features — they are the unglamorous parts that decide whether the demo survives contact with the internet: Render deployment, the cron/sync path, data consistency across screens, real-Postgres and cross-screen tests, security hardening, monitoring/backup, legal pages, and the extension distribution path for the manager. The **skipped** areas are commerce, native mobile, offline, real-time, collaboration, webhooks, and other things this product does not do.

---

## 2. What needs your call first

### Before the demo (must)

1. **Render deployment** (areas 18, 58; Engine 5). `render.yaml` is declared but not deployed. The cron worker runs the old `adapter-read` path, not the core sync used by **Sync Now**. The extension's `externally_connectable` does not include the Render URL. Without these three, the “everything online” demo does not work.
2. **Manager's extension install** (areas 66, 70). ZIP + Load unpacked works now; Chrome Web Store (unlisted) gives a clean link but adds review time. The extension cannot be installed from a plain web link. Phones cannot run extensions at all — the form-fill demo needs a laptop.
3. **Visit-count consistency** (areas 49, D8; issue `TASK-009-data-consistency.md`). The list shows Grand Vista Zainab with 3 visits; the profile page can show the Lakeside Zainab with 1. The profile page must use the same `guest_id` + `tenant_id` as the clicked row and derive visits from `guest_profile_links`, not legacy `reservations`/`loyalty_profiles`.
4. **Minimum security for a public URL** (areas 28, 63, 77). At minimum: strong secrets, HTTPS, login rate limiting, and no real guest PII in the demo. The known gaps are field encryption is a XOR placeholder, no CSRF token (sameSite only), no rate limiting, no RLS, and MFA is UI-only.
5. **Phone/browser check** (areas 09, 10). The manager may open the app on a phone. Chrome is the demo browser; phone Safari is unverified. Decide the supported device/browser pair and test it.

### After the demo (should)

6. **Test strategy** (area 17): real-Postgres integration, registration → sync → visit count, cross-screen consistency, tenant isolation, extension-in-browser, accessibility, performance, security.
7. **Operations** (areas 19, 31): DB health probe, structured logs, error tracking, sync-error table/alerting, backup retention and a restore test.
8. **Legal** (area 20): privacy policy, terms, retention policy, DSR procedure; the login page's legal links are `href="#"`.
9. **Accessibility and performance** (areas 11, 08, 30): choose WCAG target, run an audit, set speed/bundle budgets.
10. **Docs, naming, handoff** (areas 21, 22, 33): fix README drift, write naming conventions, write a handoff/support note.
11. **Internationalization/timezone** (areas 26, 62): English-only is acceptable for the demo, but the stored timezone/date-format settings are not applied consistently — dates are hardcoded `en-GB`/UTC in several screens.

### Accepted for v1 (Skip)

No commerce (34–42), no native mobile app (67–72), no offline/PWA (27), no real-time (47), no collaboration (60), no outgoing webhooks (61), no file management (50), no subscriptions (54), no multi-step wizards (64), no public landing page (78), no SEO (07). These are deliberate, not forgotten.

---

## 3. Constraints and setup (decide-first areas)

### Area 75 — Constraint identification — **Decided**

The real limits, as they stand:

| Constraint | State |
|---|---|
| Money | Render starter tier for web + Postgres + cron; no other paid services. |
| Hosting | Render, declared in `render.yaml`; **not deployed**. |
| Connectivity | Local demo works. For Render, the messy PMS database must be reachable from the server. |
| Client devices | Web app on desktop and phone; extension on desktop Chrome/Edge only; phones cannot run extensions. |
| Demo deadline | ASAP; presentation-driven. |
| Installation | Manager must install the extension without a Chrome Web Store review wait → ZIP + Load unpacked is the current path. |
| Source schema | The hotel PMS schema cannot change: `ps_customer` has no visit table/columns, no room/check-in/check-out fields. |
| Data | Real database data, no hardcoded UI data; one source of truth is the clean DB. |
| Scope | Two hotels, two messy source DBs, two registration forms; visit history derived, not stored as a visit table. |
| Repository | One project folder; local commits only; owner pushes. |
| Legal | No privacy policy/terms yet; demo uses fake guest data. |

Evidence: `developer-workspace/MANIFESTO.md`, `PROGRESS.md`, `render.yaml`, `.env.example`, `packages/shared/src/db/migrations/002_task009_two_hotels_and_raw_links.sql`, issue `TASK-009-data-consistency.md`.

### Area 01 — Project setup — **Decided**

- **Name:** Guest Profiling System (GPS).
- **Client:** the owner (Victor); this is a demo product, not a signed hotel contract.
- **Audience:** hotel receptionists and managers; admin/regional roles exist but the demo is receptionist-first.
- **Hosting target:** Render (`gps-core` web, `gps-db` Postgres, `gps-sync-worker` cron).
- **Environments:** local development + Render production. **No staging.**
- **Domain:** not purchased. The app runs on `localhost:3100` for the production build; Render will provide a URL.
- **Currency:** not applicable; no payments.
- **Deadline:** presentation-driven, ASAP.

Gap: no domain, no staging, no written acceptance/sign-off. The Render URL will need to be added to the extension allowlist.

---

## 4. Build Layers

Build order confirmed by Victor on 2026-11-08: **Functionality → Business logic → Data → UI**. The UX Thread runs through each layer.

### 4.1 Functionality

**Who the users are**

| User | Can do |
|---|---|
| Receptionist | Log in; search guests; open a profile; view derived visit history; register a guest (writes one raw row); use the extension to fill the hotel form; export visit history/directory. |
| Admin | Everything a receptionist can do, plus users, tenants, hotel settings, audit logs, data requests, PMS sync, analytics. |
| RegionalManager | Defined in the role model, but regional scope is denied by default in v1; treat as not demo-ready. |

**Must-have features (demo)**

1. Login and tenant session.
2. Live guest search and directory.
3. Guest profile with derived visit history.
4. Registration that writes one raw row to the active hotel's source DB.
5. PMS sync from the messy source DB into the clean DB.
6. Multi-hotel switch with a re-issued JWT.
7. Chrome extension that recognises the guest and fills the registration form.
8. CSV export (directory, visit history, audit logs).
9. Settings/hotel settings that persist.

**Can wait:** email notifications, MFA enforcement, identity-document UI, user invitations/password reset, public landing page, mobile app, i18n, advanced analytics.

**UX Thread — where a user can get lost:** search with no results; a profile with no visits; registration on the wrong hotel; sync says “no state” before seeding; extension not installed; disabled “Fill registration form” with no explanation; phone user expecting the extension to work.

### 4.2 Business logic

Rules that exist in code:

- **Guest matching:** email first, then phone; name alone is not an identity signal. This avoids merging different people with the same name.
- **Visits:** one registration = one raw source row = one `guest_profile_links` row; visits are derived by grouping links per guest. `guests.total_stays` is recomputed from links after sync.
- **Tenant scope:** a JWT carries `tenant_id`; records are filtered by tenant; a member can switch only to a tenant in `tenant_memberships`; the switch re-issues the JWT. Regional scope is denied without a `region` claim.
- **Registration:** writes to the active hotel's write connection; the read adapter stays read-only; the write is separate.
- **Idempotent sync:** `guest_profile_links` has `UNIQUE (tenant_id, source_table, source_row_id)` and uses `ON CONFLICT DO NOTHING`; re-syncing the same row does not create a second visit.
- **Soft delete:** most records have `deleted_at`; queries filter it; audit logs are append-only.
- **Feature settings:** the settings JSON accepts flags such as `autoSync`, `emailNotifications`, `multiFactorAuth`, `matchingSensitivity`; not all are enforced.
- **No hardcoded counts:** the list/dashboard should read the clean DB. The known violation is the standalone profile page's legacy path, not the list.

**Conflict/exception rule:** when the same email exists in two tenants, they are two separate guests by design; the UI must never merge them. The current profile-page bug is a failure to respect that rule, not a database ambiguity.

**UX Thread — when a rule says no:** the API returns `{success:false,error:{code,message}}`; the UI shows a toast or inline message. Gaps: some “no” cases (disabled extension button, sync not seeded, empty profile) do not explain why.

### 4.3 Data

**D1 — What is stored:** tenants, users, guests, `guest_profile_links`, reservations, loyalty profiles, identity documents, audit logs, sync state, adapter connections, tenant memberships, data requests (lazy-created).

**D2 — How they connect:** tenant 1–N users/guests/links; guest 1–N links/reservations/loyalty; `guest_profile_links` is the visit ledger; memberships connect users to tenants.

**D3 — Required/unique:** UUID primary keys; `tenant_id` on every tenant-owned record; `UNIQUE (tenant_id,email)` on users and guests; `UNIQUE (tenant_id,source_table,source_row_id)` on links; `UNIQUE (user_id,tenant_id)` on memberships.

**D4 — IDs:** UUIDs for internal records; `source_ref`/`source_row_id` keep the hotel PMS id as text; `link_id` is a UUID.

**D5 — States:** `guest_phase` has 12 values; `vip_level` NONE/SILVER/GOLD/PLATINUM; reservation status; user `active`; adapter `is_read_only`; data-request status.

**D6 — Ownership:** `tenant_id` owns every record; isolation is enforced in application code, **not** Postgres RLS.

**D7 — Immutable:** `audit_logs` is append-only (no `updated_at`/`deleted_at`); `created_at` timestamps; link uniqueness; source payload is kept as received.

**D8 — Stored vs derived:** `guests.total_stays` is stored but recomputed from links; `last_stay_date` from `MAX(source_created_at)`; visits are derived on read. **Pending:** the standalone profile page still reads legacy `reservations`/`loyalty_profiles`, so the derivation is not the only data path yet.

**D9 — Schema change:** forward-only numbered SQL migrations (`001`–`003`); custom runner with `up`/`status`; no down migrations. **Pending:** `003` assumes `tenants.settings` exists, but `001` does not create it; the app adds it lazily, so a clean `001→002→003` can fail. `data_requests` is also lazy-created.

**UX Thread — no data yet / slow data:** empty tables show plain text (“No data yet”, “No sync state recorded”); directory uses skeletons; some panels show “—”. No global loading/error boundary.

### 4.4 UI

- **Screens:** 21 pages — login, dashboard, guest search, guest profile, directory, registration, visit history, PMS sync, processing, analytics, audit logs, data requests, users, tenants, settings, hotel settings, error demo, standalone profile, design system, root/search redirects.
- **Components:** shared `Button`, `Input`, `Card`, `Badge`, `Avatar`, `PhaseBadge`, `Metric`, `Panel`, workspace tables/dialogs.
- **Type/colour/spacing:** Tailwind theme in `packages/core/tailwind.config.ts`; `ink`/`accent` palettes; 4px spacing base; `gps-*` classes; light mode only.
- **Dark mode:** not implemented (`color-scheme: light`).
- **Responsive:** Tailwind breakpoints; phone viewing intended; form-fill demo is laptop Chrome.
- **Browsers:** Chrome is the demo target; the extension is Chrome-only; phone Safari untested.
- **Images/icons:** `lucide-react` icons; initials avatars; no uploaded images; `public/` is empty.
- **Motion:** subtle hover/focus transitions; `prefers-reduced-motion: no-preference` gate; skeleton shimmer.
- **UX Thread — empty/loading/failed/success:** empty states exist as plain table rows; loading uses text/skeletons; failed states are inconsistent (toast on some actions, silent on others); success uses toasts and banners.

---

## 5. The 80 areas

Status is the decision state, not the code quality. Gaps are listed even when the area is Decided.

### Section A — applies to all projects

| # | Area | Home | Status | Decision / reason | Evidence and gap |
|---|---|---|---|---|---|
| 01 | Project setup | Project Ring | **Decided** | Guest Profiling System; owner as client; hotel staff audience; Render target; local + production. | `package.json`, `render.yaml`, `PROGRESS.md`. Gap: no domain, no staging, no written sign-off. |
| 02 | Stack decisions | Engine: Architecture | **Decided** | pnpm monorepo; Next.js 16 App Router; React 18; TypeScript; Tailwind 4; PostgreSQL via `postgres`; Node 20; MV3 extension; Vitest + Playwright. | Root/core `package.json`, `.nvmrc`, `packages/*`. No material gap. |
| 03 | Design system | UI | **Decided** | Tailwind theme + shared primitives + `design-system` preview page. | `components/ui/`, `app/design-system/page.tsx`, `globals.css`, `tailwind.config.ts`. Gap: no published token file, no visual regression. |
| 04 | Brand and identity | UI | **Decided** | “Guest Profiling System” wordmark + GPS mark; demo hotels Grand Vista and Lakeside Suites. | `PROGRESS.md` decisions, `MANIFESTO.md`, sidebar. Gap: “Lakeside Suites” name not explicitly confirmed by owner. |
| 05 | Frontend architecture | Engine: Architecture | **Decided** | App Router; server pages + client workspace shell; typed API client; route handlers under `app/api`. | `packages/core/app`, `components/workspace`, `src/server`. Gap: no route-level error/loading boundaries. |
| 06 | Routing and navigation | UX Thread | **Decided** | 21 pages; `/` → dashboard; `/search` → guest-search; sidebar; middleware guards `/admin/*`. | Route inventory; `middleware.ts`. Gap: `/admin/*` guard has no pages; workspace not in matcher; no custom 404. |
| 07 | SEO and discoverability | Functionality | **Skip** | Authenticated back-office; no public content or marketing pages. | `/` redirects to dashboard; no landing page. Reopen only if a public demo page is wanted. |
| 08 | Performance | Engine: Resource management | **Pending** | No speed target, budget, or measurement. | No Lighthouse/bundle/perf script. Gap: set demo target; measure search/directory/profile. |
| 09 | Responsive and cross-device | UI | **Decided** | Responsive Tailwind layout; phone viewing intended; form-fill on laptop Chrome. | Responsive classes; `PROGRESS.md`. Gap: not tested on a real phone; no device matrix. |
| 10 | Cross-browser compatibility | UI | **Pending** | Chrome is the demo browser; extension Chrome-only; phone Safari unverified. | MV3 manifest; no cross-browser config. Gap: decide supported browsers; test phone. |
| 11 | Accessibility | UX Thread | **Pending** | No standard chosen; some aria labels and focus rings exist. | `focus-visible` in `globals.css`; aria labels; no axe/audit. Gap: choose WCAG 2.1 AA or equivalent; audit keyboard/reader/contrast. |
| 12 | Assets and media | UI | **Decided** | `lucide-react` icons, initials avatars, no uploaded media. | `public/` empty; `lucide-react`; `Avatar`. Gap: no pipeline because there are no assets; revisit for hotel logos/photos. |
| 13 | Error handling | Engine: Reliability | **Pending** | API error envelope exists; UI error boundaries do not. | `src/server/response.ts`; no `error.tsx`/`global-error.tsx`; `/workspace/error` is a demo. Gap: add boundaries, DB/sync failure states, retry guidance. |
| 14 | Environment and configuration | Engine: Configuration | **Decided** | Env vars per environment; Render production; local `.env`; secure cookie in production; tenant setting flags. | `.env.example`, `render.yaml`, `jwt.ts`, `/api/settings`. Gap: no staging/key-rotation plan; `LOG_LEVEL`, `SENTRY_DSN`, `NEXT_PUBLIC_GPS_EXTENSION_ID` absent from `.env.example`; some flags UI-only. |
| 15 | Version control conventions | Project Ring | **Decided** | Git; `main`; small local commits; owner pushes. | `git log`, `PROGRESS.md`. Gap: no commit format, tags, protected main, or release process documented. |
| 16 | Development workflow | Project Ring | **Decided** | pnpm scripts for lint/typecheck/unit/e2e; GitHub Actions CI; production-build E2E. | `package.json`, `.github/workflows/ci.yml`. Gap: no pre-commit hook/format check; CI lacks real-Postgres integration. |
| 17 | Testing | Project Ring | **Pending** | Unit tests + 4 Playwright smoke tests only. | 26 unit files; `e2e/smoke.spec.ts`; 334 passing. Gap: real-Postgres integration, registration→sync→visit count, cross-screen consistency, tenant isolation e2e, extension-in-browser, a11y/perf/visual/security. |
| 18 | Deployment and DevOps | Engine: Deployment | **Pending** | Render Blueprint declared; not deployed. | `render.yaml`; `PROGRESS.md`. Gap: deploy, secrets, both DBs, reachable messy DB, cron path, rollback, migrations in deploy. |
| 19 | Monitoring and observability | Engine: Reliability | **Pending** | `/api/health` only; logger unused; Sentry placeholder. | `app/api/health/route.ts`; `src/server/logger.ts`; `syncErrors` hardcoded. Gap: DB probe, request logs, error tracking, sync-error table/alerting, uptime monitor. |
| 20 | Legal and compliance | Project Ring | **Pending** | MIT license; DSR API/audit actions; no privacy policy/terms/cookie banner. | `LICENSE`; `data_requests`; login links `href="#"`. Gap: privacy, terms, retention, DSR procedure, cookie notice, GDPR/NDPR review. |
| 21 | Documentation | Project Ring | **Decided** | README, PROGRESS, OpenSpec, runbooks, developer-workspace, MANIFESTO. | `README.md`, `PROGRESS.md`, `openspec/`, `docs/runbook/`. Gap: README drift (`ARCHITECTURE.md`, `docs/openapi.yaml`, `ARGON2_SECRET` vs `ARGON2_PEPPER`, five runbooks vs three); deploy/new-tenant/DSR runbooks are stubs. |
| 22 | Naming conventions | Project Ring | **Pending** | No written convention; code follows common patterns. | Kebab files, camelCase functions, snake_case DB. Gap: write a short guide; otherwise new contributors/agents guess. |
| 23 | Animation and interactions | UI | **Decided** | Subtle hover/focus transitions; respects `prefers-reduced-motion`; no animation library. | `globals.css` media query. Gap: no motion spec; skeleton shimmer still runs under reduced motion. |
| 24 | Notifications and feedback | UX Thread | **Decided** | In-app toasts, inline errors, loading states; no email/SMS. | `sonner`; workspace `onAction`; form errors. Gap: `emailNotifications` stored but no sender; some empty/loading states are plain text. |
| 25 | Forms and validation | UX Thread | **Decided** | Registration form + Zod; client/server validation; extension fills the form. | `shared/src/schemas/index.ts`; registration route/form. Gap: no formal field-error matrix; native validation not standardized. |
| 26 | Internationalization | UX Thread | **Pending** | English only; settings store `defaultLanguage` (en-US/en-GB) but no translation layer. | `/api/settings`; hardcoded English strings. Gap: decide English-only for demo; otherwise add i18n. |
| 27 | Offline and PWA | Engine: Reliability | **Skip** | Back-office app requires server + Postgres; no offline requirement; no service worker. | No manifest/service worker. Reopen if front-desk connectivity is unreliable. |
| 28 | Cookie and session management | Engine: Security | **Decided** | Stateless JWT in `gps-jwt`; httpOnly; sameSite strict; secure in production; 24h; logout clears. | `shared/src/auth/jwt.ts`; login/logout routes. Gap: no refresh/rotation/revocation; no CSRF token (sameSite only); no “remember me”. |
| 29 | Redirect and URL management | UX Thread | **Decided** | `/` → dashboard; `/search` → guest-search; unauthenticated `/admin` → login. | `app/page.tsx`, `app/search/page.tsx`, `middleware.ts`. Gap: dead `/admin`; no custom 404. |
| 30 | Code splitting and bundle size | Engine: Resource management | **Pending** | Next.js automatic splitting only; no budget/measurement. | No bundle analyzer/config; extension built separately. Gap: set budget; measure first load; lazy-load heavy admin screens. |
| 31 | Backup and recovery | Engine: Reliability | **Pending** | Runbook only; no automated backup/restore in repo/Render config. | `docs/runbook/backup-and-recovery.md`. Gap: confirm Render retention; test restore; document RPO/RTO. |
| 32 | Client communication | Project Ring | **Decided** | Owner is the client; reviews in chat; demo presentation. | Conversation history; `MANIFESTO.md`. Gap: no written sign-off/acceptance record; presentation plan not in repo. |
| 33 | Handoff and maintenance | Project Ring | **Pending** | No handoff doc/support period; PROGRESS + runbooks + MANIFESTO are the trail. | Docs above. Gap: credentials, deploy, extension install, support window, known limitations, maintenance owner. |

### Section B — only if the project sells products

All nine are **Skip**: this is a guest-profiling back office, not a shop. There is no product catalogue, cart, checkout, stock, shipping, discount engine, order management, CMS, or public review system.

| # | Area | Home | Status | Reason |
|---|---|---|---|---|
| 34 | Payment integration | Functionality | **Skip** | No payments or subscriptions. |
| 35 | Product catalog | Functionality | **Skip** | Profiles are records, not products. |
| 36 | Inventory management | Business logic | **Skip** | No stock/inventory. |
| 37 | Cart and checkout | Functionality | **Skip** | No cart. |
| 38 | Shipping and delivery | Business logic | **Skip** | No physical goods. |
| 39 | Discount and promotions | Business logic | **Skip** | No pricing/promotions. |
| 40 | Order management | Business logic | **Skip** | No orders. |
| 41 | CMS integration | Functionality | **Skip** | No CMS/public content; copy is in code. |
| 42 | Reviews and testimonials | Functionality | **Skip** | No public reviews. |

### Section C — web app

| # | Area | Home | Status | Decision / reason | Evidence and gap |
|---|---|---|---|---|---|
| 43 | Authentication and authorization | Engine: Security | **Decided** | Email+password, Argon2id, JWT, roles Admin/RegionalManager/Receptionist, tenant memberships; fail-closed tenant scope. | `shared/src/auth/*`, login route, `middleware.ts`, `tenant-scope.ts`. Gap: MFA not enforced; no JWT revocation; login tenant disambiguation TODO; RegionalManager denied by default. |
| 44 | User management | Functionality | **Decided** | `/workspace/users` + `/api/users`; list/edit/active; admin-gated; seeded accounts. | Users page/API; migration. Gap: no invite/email, password reset, or `/admin` pages. |
| 45 | Onboarding flow | UX Thread | **Skip** | Internal demo with seeded accounts; no self-serve signup or guided onboarding. | Seeded logins. Reopen for a real hotel rollout. |
| 46 | Dashboard and data visualization | Functionality | **Decided** | Dashboard + analytics + `/api/stats` + `/api/analytics/activity`; real data mostly. | Workspace dashboard/analytics; API routes. Gap: `syncErrors` hardcoded 0; metric definitions/empty/error states. |
| 47 | Real-time features | Functionality | **Skip** | No websockets/SSE; search and sync are request/response; not required. | No real-time code. |
| 48 | Notification system | Functionality | **Pending** | In-app toasts only; `emailNotifications` setting exists but no email sender. | Settings API/UI; no mail integration. Gap: decide if demo needs email; otherwise mark the setting UI-only. |
| 49 | Multi-tenancy | Data | **Decided** | `tenant_id` on records; JWT tenant; memberships; switch-tenant reissues JWT; application-level isolation (no RLS). | Migrations; `tenant-scope.ts`; switch route. Gap: no RLS; profile page wrong-tenant/legacy path (issue); no cross-tenant e2e. |
| 50 | File management | Functionality | **Skip** | No uploads/file storage; exports are CSV streams (area 53). | No upload endpoint. Identity-document table exists but no API/UI. |
| 51 | Search and filtering | Functionality | **Decided** | Live search with ranking (exact/phone/email/name/fuzzy), directory filters, pg_trgm GIN indexes, pagination. | `search-ranking.test.ts`, `/api/guests/search`, migration indexes. Gap: no search analytics/saved filters; large-data test. |
| 52 | Audit logs and activity history | Data | **Decided** | Append-only `audit_logs`; `/workspace/audit-logs`; CSV export; DSR actions. | Migration; `audit/log.ts`; page/API/export. Gap: not every mutation logged; no trigger/middleware; no tamper-evident chain. |
| 53 | Import and export | Functionality | **Decided** | CSV exports for directory, visit history, audit logs; import is PMS sync, not file upload. | Three export routes; adapter sync. Gap: no file import; no large-export job; no PII-redaction option. |
| 54 | Subscription and feature gating | Business logic | **Skip** | No billing/subscriptions; tenant settings flags exist but no entitlement system. | No payment code. |
| 55 | Settings and configuration | Functionality | **Decided** | `/workspace/settings` + `/workspace/hotel-settings`; tenant `settings` JSON; persisted selects; defaults/validation. | `/api/settings`; settings UI; `003_repair_tenant_settings.sql`. Gap: `settings` created lazily; some settings UI-only; timezone/date format not applied. |
| 56 | Admin panel | Functionality | **Decided** | Admin functions live under `/workspace/*`; no `/admin` tree. | Workspace pages; `middleware.ts` guards `/admin/*` only. Gap: dead `/admin` guard; no admin layout; workspace routes not in middleware matcher. |
| 57 | API design | Engine: Integration | **Decided** | REST route handlers; `{success,data,error}` envelope; Zod; OpenAPI spec. | `openspec/openapi.yaml`, `response.ts`, routes. Gap: spec drift; no versioning/generated client; some 501/stubs. |
| 58 | Background jobs and queues | Engine: Communication between parts | **Pending** | Render cron + adapter-read worker + “Sync Now”; no queue/retry/DLQ; cron path differs from core sync. | `render.yaml`, `adapter-read`, `PROGRESS.md`. Gap: unify cron with core sync; retries/backoff, dead-letter, run history, error table. |
| 59 | Soft delete vs hard delete | Data | **Decided** | Soft delete on tenants/users/guests/reservations/documents/loyalty/adapter/memberships; append-only audit; no delete on links/sync. | Migrations; queries filter `deleted_at IS NULL`. Gap: no partial unique indexes (soft-deleted rows block email reuse); no retention job; no DSR erase procedure. |
| 60 | Collaboration features | Business logic | **Skip** | No comments/mentions/shared editing; staff use separate accounts but do not collaborate in-app. | No collaboration code. |
| 61 | Webhooks (outgoing) | Engine: Integration | **Skip** | No outgoing webhooks/event subscriptions. | No webhook code. |
| 62 | Timezone and localization | Data | **Pending** | Timestamps stored; settings expose timezone/dateFormat; display hardcoded `en-GB`/UTC in many places. | `workspace-app.tsx` date formatting; settings API. Gap: apply tenant timezone/date format; decide UTC storage/display; test DST. |
| 63 | Rate limiting and abuse prevention | Engine: Security | **Pending** | None implemented. | No middleware/rate-limit package; login/API unprotected. Gap: login/API limits, lockout/backoff, bot protection. |
| 64 | Multi-step flows and wizards | UX Thread | **Skip** | Registration is a single form; sync is a button + status; no wizard. | No wizard code. |

### Section D — mobile / desktop

There is no native mobile or desktop app. The Chrome MV3 extension is a real distribution target, so 65/66/70 are used for it; the rest are skipped.

| # | Area | Home | Status | Decision / reason | Evidence and gap |
|---|---|---|---|---|---|
| 65 | Platform targets | Engine: Architecture | **Decided** | Web app (desktop + mobile browser) + Chrome MV3 extension; no native iOS/Android/desktop app. | Next app; extension manifest. Gap: phones cannot run the extension; state this in the demo. |
| 66 | App store and distribution | Engine: Deployment | **Pending** | ZIP + Load unpacked now; Chrome Web Store unlisted later; `.crx` enterprise policy rejected as overkill. | `PROGRESS.md`; conversation decisions. Gap: choose/document manager install; review time; add Render URL to `externally_connectable`. |
| 67 | Push notifications (mobile) | Functionality | **Skip** | No mobile app; no push. | No push code. |
| 68 | Device features | Functionality | **Skip** | No camera/geolocation/Bluetooth; extension only reads/writes DOM. | No device APIs. |
| 69 | Offline mode (mobile) | Engine: Reliability | **Skip** | No mobile app; web app requires server. | No offline code. |
| 70 | App updates | Engine: Deployment | **Pending** | Unpacked extension updates manually; Web Store would auto-update; not decided. | Extension build/ZIP; manifest `0.1.0`. Gap: choose update path with distribution; versioning policy. |
| 71 | Deep linking | Functionality | **Skip** | Web URLs only; no app deep links. | No deep-link code. |
| 72 | Performance (mobile specific) | Engine: Resource management | **Skip** | No mobile app; responsive web performance is 08/09. | — |

### Section E — all projects

| # | Area | Home | Status | Decision / reason | Evidence and gap |
|---|---|---|---|---|---|
| 73 | Progress tracking | Project Ring | **Decided** | `PROGRESS.md`, `openspec/tasks-registry.md`, developer-workspace notes/plans/reports, this checklist. | Files. Gap: keep updated after each task; this checklist is the snapshot. |
| 74 | Session recovery | Project Ring | **Decided** | Notes/reports/MANIFESTO + PROGRESS provide a resume trail. | `developer-workspace/`, `PROGRESS.md`. Gap: no automated log; write “done/next/decided” at each meaningful action. |
| 75 | Constraint identification | Project Ring | **Decided** | Render starter budget; online demo; phone viewing; laptop extension; no Web Store wait; source schema immutable; no mock data; one project folder; local commits; two hotels. | `MANIFESTO.md`, `PROGRESS.md`, issue, conversation. Gap: Render not deployed; messy DB reachability; domain; deadline. |
| 76 | Scalability planning | Engine: Scalability | **Pending** | Demo-scale only; no traffic estimate, load test, CDN, or replica. | Render starter; no load tests. Gap: estimate launch traffic; index review; pooling; upgrade path. |
| 77 | Security | Engine: Security | **Pending** | Argon2id, JWT, Zod, tenant scope, sensitive-field masking; XOR encryption, no CSRF/rate limit/RLS, MFA UI-only, no revocation. | `encryption.ts` TODO; auth files; no rate limiter. Gap: AES-GCM, CSRF/Origin checks, rate limits, RLS/stronger tenant checks, MFA or remove setting, key rotation, security tests. |
| 78 | Landing page vs app shell | Engine: Architecture | **Decided** | No public landing page; `/` → dashboard; login is the entry. | `app/page.tsx`, `app/login`. Gap: add a public demo link only if wanted. |
| 79 | Design tokens and theming | UI | **Decided** | Tailwind theme tokens (ink/accent, fonts, spacing, radii, shadows); light mode only. | `tailwind.config.ts`, `globals.css`, design-system page. Gap: no dark mode; no published token reference; no visual regression. |
| 80 | Third party integrations | Engine: Integration | **Decided** | PMS source DBs (QloApps shape), Chrome extension, Render, GitHub; no payments/email/SMS/maps. | Adapter mapping; extension; `render.yaml`; CI. Gap: Sentry placeholder; source-write DSN unclear; Render URL missing from extension allowlist. |

---

## 6. Project Ring

The 12 Ring areas are included in the 80 table (01, 75, 32, 15, 16, 17, 22, 21, 73, 74, 20, 33). The narrative:

**Start**
- **01 Project setup — Decided.** Name, client, audience, hosting, environments are set; domain and sign-off are open.
- **75 Constraint identification — Decided.** The real limits are documented in §3; Render deployment is the main unmet constraint.
- **32 Client communication — Decided.** The owner reviews in chat; there is no separate client approval board. No written acceptance record.

**While building**
- **15 Version control — Decided.** Git on `main`; local commits; owner pushes. No PR/release/tag convention.
- **16 Development workflow — Decided.** Lint/typecheck/unit/e2e in CI. No pre-commit hook, no real-Postgres integration in CI.
- **17 Testing — Pending.** The biggest Ring gap: unit tests are broad, but the product's data/integration paths are not tested.
- **22 Naming conventions — Pending.** No written guide.
- **21 Documentation — Decided.** Broad docs exist; README drift and stub runbooks need correction.
- **73 Progress tracking — Decided.** PROGRESS + task registry + workspace reports.
- **74 Session recovery — Decided.** MANIFESTO, notes, reports, PROGRESS; no automated log.

**End**
- **20 Legal and compliance — Pending.** No privacy/terms; DSR procedure partial.
- **33 Handoff and maintenance — Pending.** No handoff/support note; credentials and install steps are spread across docs.

**Ring counts:** 8 Decided, 4 Pending, 0 Skip.

---

## 7. Gap questions

These 17 questions are extras, not part of the 80 areas. They fill the known gaps in Data, Runtime, and Communication.

### Data (D1–D9)

| ID | Question | Answer | Status |
|---|---|---|---|
| D1 | What are the main things stored? | Tenants, users, guests, guest-profile links, reservations, loyalty profiles, identity documents, audit logs, sync state, adapter connections, tenant memberships, data requests (lazy). | **Decided** |
| D2 | How do they connect? | Tenant 1–N users/guests/links; guest 1–N links/reservations/loyalty; memberships connect users to tenants; links point to source rows. | **Decided** |
| D3 | Required/unique fields? | UUID keys; `tenant_id` on owned records; unique `(tenant_id,email)` for users/guests; unique `(tenant_id,source_table,source_row_id)` for links; unique `(user_id,tenant_id)` for memberships. | **Decided** |
| D4 | What kind of ID? | UUID internal IDs; source PMS id kept as text in `source_ref`/`source_row_id`; UUID `link_id`. | **Decided** |
| D5 | What states, in what order? | `guest_phase` 12 values; VIP 4 levels; reservation status; user active; adapter read-only; data-request status. | **Decided** |
| D6 | Who owns each record? | `tenant_id`; enforced in application code, not RLS. | **Decided** (gap: no RLS) |
| D7 | What can never change? | Audit log entries (append-only); `created_at`; source payload as received; link identity. | **Decided** |
| D8 | Stored vs derived? | `total_stays` stored but recomputed from links; `last_stay_date` from max link date; visits derived on read; legacy loyalty `total_stays` is a second path. | **Pending** — issue `TASK-009-data-consistency.md` |
| D9 | How will the shape change? | Forward-only migrations; no down migrations; lazy tables/columns. | **Pending** — `003` depends on lazy `tenants.settings`; `data_requests` not in migrations |

### Runtime (R1–R5)

| ID | Question | Answer | Status |
|---|---|---|---|
| R1 | Where does it run? | Browser (Next client), Node server on Render, Postgres on Render, extension in Chrome. | **Decided** |
| R2 | Which runtime versions? | Node 20 (`.nvmrc`), pnpm 9.12, Next 16, React 18, Postgres 15+. | **Decided** |
| R3 | What are the limits? | Render starter; not measured; sync can be long. | **Pending** — measure memory/time per request and sync duration |
| R4 | Real user conditions? | Hotel front desk, laptop Chrome; manager phone browser; possibly slow network; no offline. | **Pending** — not validated on real devices/networks |
| R5 | Which environments? | Local development + Render production. | **Pending** — no staging; production not deployed yet |

### Communication (C1–C3)

| ID | Question | Answer | Status |
|---|---|---|---|
| C1 | How do parts talk? | HTTP JSON; shared Postgres; adapter reads source DB; extension page bridge; sync is a direct call. | **Decided** |
| C2 | What if a message is late/lost? | No queue/retry/dead-letter; sync failure is silent; health is shallow. | **Pending** — add retries/backoff, run history, error visibility |
| C3 | What if the same message arrives twice? | Links are unique and `ON CONFLICT DO NOTHING`; re-sync is idempotent. Registration intentionally writes one row per submission. | **Decided** |

---

## 8. Feature Cards

### Card 1 — Login and tenant session

- **Feature:** A staff user can log in and act inside one hotel.
- **UI:** `/login`; email/password; error message; redirect to dashboard.
- **UX Thread:** one form, one error state, one redirect.
- **Data:** user record, password hash, JWT claims (`tenant_id`, `groups`), membership.
- **Business logic:** Argon2id verify; tenant scope; switch-tenant re-issues JWT; RegionalManager denied without region.
- **Engine:** secure cookie; JWT secret; no revocation.
- **Evidence:** `app/api/auth/login/route.ts`, `shared/src/auth/*`, `tenant-scope.ts`.
- **Not seen:** MFA enforcement; login tenant disambiguation for duplicate emails; real-device session expiry.

### Card 2 — Registration writes a raw row

- **Feature:** A receptionist can register a guest; one submission writes one raw row to the active hotel's source DB.
- **UI:** `/workspace/registration`; form; submit; success toast with source table/row.
- **UX Thread:** fill → submit → success/failure; no auto-sync.
- **Data:** source `ps_customer` row; clean DB sync later; `guest_profile_links` on sync.
- **Business logic:** active tenant chooses the write connection; read adapter stays read-only; matching is email/phone; no visit table.
- **Engine:** separate write connection; tenant scope; source schema unchanged.
- **Evidence:** `src/server/adapters/service.ts`; registration route; `002` migration; `PROGRESS.md`.
- **Not seen:** room/check-in/check-out persistence (source has no columns); automatic sync after registration.

### Card 3 — Live guest search and directory

- **Feature:** A receptionist can type and see matching profiles, then open one.
- **UI:** `/workspace/guest-search`, `/workspace/directory`; search input; result rows; pagination.
- **UX Thread:** type → ranked results → click; empty state; loading skeleton.
- **Data:** guests; pg_trgm indexes; tenant filter.
- **Business logic:** exact/phone/email/name/fuzzy ranking; email-first identity; no cross-tenant merge.
- **Engine:** Postgres GIN indexes; API pagination; stable ordering.
- **Evidence:** `search-ranking.test.ts`, `/api/guests/search`, `001` indexes, directory pagination fix.
- **Not seen:** large-data performance; search analytics; saved filters.

### Card 4 — Guest profile and derived visit history

- **Feature:** A user can open a guest and see the visits derived from repeated raw rows.
- **UI:** `/workspace/guest-profile`, `/workspace/visit-history`, `/profile/[guestId]`.
- **UX Thread:** profile loads; visit list; empty/legacy state.
- **Data:** `guest_profile_links`; `guests.total_stays`; legacy `reservations`/`loyalty_profiles`.
- **Business logic:** one link = one visit; derive by grouping; do not use a visit table.
- **Engine:** visits API; payload parsing; tenant filter.
- **Evidence:** `getVisitsForGuest`, `/api/guests/[guestId]/visits`, `002`.
- **Not seen:** **cross-screen consistency** — the standalone page still reads legacy data; this is the open issue.

### Card 5 — PMS sync

- **Feature:** An admin can sync raw PMS rows into the clean DB.
- **UI:** `/workspace/pms-sync`; **Sync Now**; sync state table; events.
- **UX Thread:** click → running → success/failure; no state before seeding.
- **Data:** source `ps_customer`; clean `guests`; `guest_profile_links`; `sync_state`.
- **Business logic:** read-only adapter; mapping/validation; idempotent links; recompute `total_stays`/`last_stay_date`.
- **Engine:** core sync path; Render cron is a different path (gap); no queue/retry.
- **Evidence:** `src/server/adapters/service.ts`, `/api/adapter/sync`, `/api/sync-status/now`.
- **Not seen:** cron parity; automatic sync after registration; failure recovery.

### Card 6 — Multi-hotel switch

- **Feature:** An admin can switch active hotel; data and JWT follow.
- **UI:** tenant switcher/menu; badge; dashboard changes.
- **UX Thread:** switch → reload → new tenant data; no stale selected guest.
- **Data:** `tenant_memberships`; tenant-scoped guests/links.
- **Business logic:** membership check; re-issue JWT; fail-closed scope.
- **Engine:** cookie update; API tenant filter.
- **Evidence:** `/api/auth/switch-tenant`, `tenant-scope.ts`, workspace shell.
- **Not seen:** selected guest reset on switch; cross-tenant profile selection bug (issue).

### Card 7 — Extension prefill

- **Feature:** A receptionist can select a profile and fill the hotel registration form.
- **UI:** extension popup/content bridge; “Fill registration form” button; native form fields.
- **UX Thread:** select profile → bridge → fill; confidence highlighting; errors.
- **Data:** selected profile payload; field rules; form DOM.
- **Business logic:** weighted scoring; Hungarian assignment; email/phone/name matching; full-name rule.
- **Engine:** MV3; `externally_connectable`; `activeTab`/`scripting`; no DB connection.
- **Evidence:** `packages/adapter-fill-extension/`; 69 tests; CDP fill verified.
- **Not seen:** automated in-browser test; Render URL allowlist; manager's everyday Chrome install; cross-origin iframe forms.

### Card 8 — CSV export

- **Feature:** A user can export directory, visit history, or audit logs.
- **UI:** export buttons on directory/visit history/audit pages.
- **UX Thread:** click → download; empty state.
- **Data:** tenant-scoped rows; CSV response.
- **Business logic:** auth/tenant checks; columns; no PII redaction option.
- **Engine:** route handlers; CSV download response.
- **Evidence:** `/api/export/{directory,visit-history,audit-logs}`.
- **Not seen:** large-export performance; export audit trail; redaction.

### Card 9 — Settings persistence

- **Feature:** An admin can change hotel settings and have them persist.
- **UI:** `/workspace/settings`, `/workspace/hotel-settings`; toggles/selects; save.
- **UX Thread:** edit → save → toast; reload shows saved value.
- **Data:** `tenants.settings` JSON; defaults; validation.
- **Business logic:** allowed keys/values; per-tenant; some flags not enforced.
- **Engine:** `/api/settings`; lazy column; `003` repair.
- **Evidence:** settings route/UI; `003_repair_tenant_settings.sql`.
- **Not seen:** timezone/date-format application; MFA/email enforcement; settings audit.

---

## 9. Engine — 10 parts

| Part | Status | What exists | Gap |
|---|---|---|---|
| 1. Architecture | **Decided** | Next.js web/API, Postgres clean DB, adapter-read worker, MV3 extension, shared package; pnpm monorepo. | No RLS; lazy tables; dead `/admin`; no ORM (intentional). |
| 2. Integration | **Decided** | Two PMS source DBs (QloApps shape), REST API + OpenAPI, Render, GitHub; no payments/email/SMS. | Source-write DSN unclear; extension allowlist missing Render URL; Sentry placeholder. |
| 3. Communication between parts | **Pending** | HTTP JSON, shared Postgres, direct sync, extension page bridge. | Cron vs core sync divergence; no queue/retry/dead-letter; silent sync failure. |
| 4. Runtime environment | **Pending** | Browser + Node/Render + Postgres; Chrome extension; Node 20. | Limits not measured; phone/network conditions untested; no staging. |
| 5. Deployment | **Pending** | `render.yaml` web + Postgres + cron; autoDeploy `main`; native Node; health path. | Not deployed; no rollback; migrations not run; cron wrong path; extension distribution pending. |
| 6. Configuration | **Decided** | Env vars on Render; `.env.example`; secure cookie in production; tenant flags. | No staging; no key-leak/rotation plan; missing env names; flags partly UI-only. |
| 7. Security | **Pending** | Argon2id, JWT, Zod, tenant scope, masking, append-only audit. | XOR encryption placeholder; no CSRF/rate limit/RLS; MFA UI-only; no revocation; no security tests. |
| 8. Reliability | **Pending** | API error envelope; idempotent links; health endpoint; backup runbook. | No error boundaries; shallow health; unused logger; Sentry placeholder; no backup automation/restore test. |
| 9. Scalability | **Pending** | Render starter; indexes for search/tenant; stable pagination. | No traffic estimate/load test/CDN/replica/pooling plan. |
| 10. Resource management | **Pending** | Next.js automatic splitting; extension built separately. | No speed target; no bundle budget; no profiling. |

**Engine UX Thread:** when something is slow or fails, the user sees a toast in some places and nothing in others. There is no global error/loading boundary, no retry, and no status page. This is the main Engine UX gap.

---

## 10. ISO 25010 quality double-check

| Quality | Verdict | Note |
|---|---|---|
| Functional suitability | **Pass with gaps** | Core demo flow exists; cross-screen visit consistency is the open defect. |
| Performance efficiency | **Gap** | No targets, budgets, or measurements. |
| Compatibility | **Gap** | Chrome-only extension; phone Safari unverified; no cross-browser test. |
| Interaction capability | **Pass with gaps** | Screens are usable; no accessibility audit; some empty/error states are plain. |
| Reliability | **Gap** | No error boundaries, shallow health, no backup automation, silent sync failures. |
| Security | **Gap** | XOR encryption, no CSRF/rate limit/RLS, MFA UI-only, no revocation. |
| Maintainability | **Pass with gaps** | Typed monorepo and tests; docs drift and no naming guide. |
| Flexibility | **Pass with gaps** | Adapter mapping is separate; multi-PMS is deferred to v2; Render-native. |
| Safety | **Gap** | No privacy/terms/retention policy; fake demo data lowers immediate risk but does not close it. |

---

## 11. Verification and maintenance

**Task list and checks**

- `tasks.md` — 29 ordered tasks: 10 before the local demo, 7 before the public URL, 12 after the demo. Each has an acceptance check.
- `verification.md` — one concrete check for every one of the 80 areas, with a pass condition, task link, and result slot.
- `check-blueprint.mjs` — structural checker: 80 areas exactly once, status counts, Pending coverage, task structure, and task references. Run `node developer-workspace/blueprint/check-blueprint.mjs`.

**How this checklist was produced**

1. Read the Blueprint skill and its four references (`areas.md`, `build-layers.md`, `engine.md`, `project-ring.md`).
2. Inventory of the repository: product, routes, stack, migrations, auth/security, config, deploy, reliability, tests, docs, known gaps. Read-only; no secret values opened.
3. Spot-checked key facts in `package.json`, `packages/core/package.json`, `.nvmrc`, `LICENSE`, `PROGRESS.md`, `MANIFESTO.md`, `README.md`, `globals.css`, `health/route.ts`, `tailwind.config.ts`, migrations, and the issue.
4. Counted all 80 areas from the section tables and verified the totals with a script. The totals are 36 Decided / 21 Pending / 23 Skip; 80 rows; every area 01–80 appears exactly once.

**How to keep it current**

- Update this file whenever an area moves from Pending to Decided, or a Skip is reopened.
- Update the matching row in `verification.md` with the result and evidence, and the task status in `tasks.md`.
- Add the date and the evidence path to the row you change.
- Keep `PROGRESS.md` as the short status; this file is the full Blueprint snapshot.
- Run `node developer-workspace/blueprint/check-blueprint.mjs` after every edit; it must print PASS.
- The next review should happen after Render deployment and after the data-consistency fix, because those two change several rows at once (18, 58, 49, D8, 17, 19, 66, 70, 80). BP-29 is the final 80-area re-run.

**What this checklist does not claim**

- It does not claim the product is production-ready. It is a demo-ready product with known gaps.
- It does not claim every UI control was re-tested here. The click pass is a separate artifact (`developer-workspace/parity/clickability/`).
- It does not close the data-consistency issue. That issue remains open until the profile page and the list read the same guest/tenant and the same derived visit source.
