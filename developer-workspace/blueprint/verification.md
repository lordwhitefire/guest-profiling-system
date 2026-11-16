# Blueprint Verification — Guest Profiling System

**Date:** 2026-11-16
**Purpose:** one concrete check for every one of the 80 Blueprint areas, so no area is only a label.
**Related:** `checklist.md` (status and evidence), `tasks.md` (the work and acceptance checks), `check-blueprint.mjs` (coverage checker).

## How to use this file

- Every row has a **check**, a **pass condition**, and a **task** where work is needed.
- **Result** starts at `Not run`. It becomes `Pass`, `Fail`, or `Skip confirmed` only when the check is actually performed.
- A `Skip` area is still checked: the check confirms the feature is absent and the skip is still valid.
- A `Pending` area's check is the acceptance test for its task; do not mark it Pass because the code exists.
- Update `checklist.md` and `tasks.md` when a result changes. BP-29 is the final gate that runs all 80.

## Coverage at a glance

| Measure | Value |
|---|---:|
| Areas with a check | 80 / 80 |
| Decided | 36 |
| Pending | 21 |
| Skip | 23 |
| Results recorded | 9 |
| Results not run | 71 |

**Check types:** `Auto` = command/test; `DB` = SQL against local Postgres; `Manual` = browser/device; `Code` = inspect/grep; `Skip` = confirm absence.

## A — applies to all projects

| # | Area | Status | Check | Pass condition | Task | Result |
|---|---|---|---|---|---|---|
| 01 | Project setup | Decided | Code — compare `package.json`, `render.yaml`, `PROGRESS.md`, `.env.example` for name, client, audience, hosting, environments, domain. | All agree; local + Render are the only environments; the missing domain is stated. | BP-11 | Not run |
| 02 | Stack decisions | Decided | Auto — `pnpm install --frozen-lockfile && pnpm typecheck && pnpm build`; inspect Node, pnpm, Next, React versions. | Commands exit 0; versions match the documented stack. | — | Not run |
| 03 | Design system | Decided | Manual — open `/design-system`; inspect Button, Input, Card, Badge, Avatar, PhaseBadge, Metric, Panel; grep theme tokens. | All primitives render; colours/spacing come from tokens, not one-off values. | — | Not run |
| 04 | Brand and identity | Decided | Manual — inspect the sidebar wordmark/mark and hotel badge; confirm both hotel names with the owner. | Brand renders; Grand Vista and Lakeside Suites names are explicitly confirmed. | — | Not run |
| 05 | Frontend architecture | Decided | Auto — `pnpm --filter @gps/core build`; compare the route inventory to the checklist. | Build clean; every listed screen has a route; no unexplained route. | — | Not run |
| 06 | Routing and navigation | Decided | Manual — click every sidebar item; visit `/`, `/search`, `/admin`, `/workspace`, and a bad URL. | No dead navigation; redirects are intentional; `/admin` behaviour is documented. | BP-21 | Not run |
| 07 | SEO and discoverability | Skip | Skip — find sitemap, robots, landing, and marketing routes under `packages/core/app`. | No SEO or public marketing code; `/` still redirects into the app. | — | Not run |
| 08 | Performance | Pending | Auto — `next build`; run Lighthouse or PSI on login, search, and profile; record LCP, INP, and first-load JS. | Targets are written and met, or the gap is documented with a plan. | BP-19 | Not run |
| 09 | Responsive and cross-device | Decided | Manual — Chrome DevTools at 390, 768, 1440; real phone Safari and Chrome; check scroll and form use. | No horizontal scroll on demo screens; profile readable; form usable. | BP-16 | Not run |
| 10 | Cross-browser compatibility | Pending | Manual — test desktop Chrome, Edge, phone Safari, phone Chrome; record the extension limitation. | Supported matrix is written; every listed browser is checked. | BP-16 | Not run |
| 11 | Accessibility | Pending | Auto + Manual — run axe on login, search, profile, registration; keyboard-only pass; screen-reader spot check. | WCAG target chosen; no critical issues; remaining issues listed. | BP-18 | Not run |
| 12 | Assets and media | Decided | Code — inspect `public/`, icons, avatars; watch the browser network panel for 404 assets. | No missing assets; icons and initials avatars render. | — | Not run |
| 13 | Error handling | Pending | Manual — stop the DB, force an API error, throw in a component; inspect boundary, toast, retry, and stack exposure. | Friendly boundary; actionable message; no stack or secret leak; health returns 503. | BP-07 | Pass |
| 14 | Environment and configuration | Decided | Code — diff `.env.example`, `render.yaml`, and code references for every required env var. | Every required var is documented; no secret is committed; optional vars are labelled. | BP-09 | Not run |
| 15 | Version control conventions | Decided | Code — `git status`, `git log --oneline`, `git branch`; check for secrets and unexpected pushes. | Local `main` commits; no secrets; owner still owns the push. | — | Not run |
| 16 | Development workflow | Decided | Auto — `pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e`; inspect the CI run. | All commands pass; CI is green. | — | Not run |
| 17 | Testing | Pending | Auto — run every suite; compare coverage to this matrix; list the missing layers. | Three P0 tests added; missing layers named; no claim of full coverage. | BP-03 | Pass |
| 18 | Deployment and DevOps | Pending | Manual — deploy the Blueprint; open the public URL; run migrations; check health; roll back a deploy. | Login, data, and health work; rollback documented; secrets set outside git. | BP-11 | Not run |
| 19 | Monitoring and observability | Pending | Auto + Manual — `curl -i /api/health` with DB up and down; inspect logs; force a sync failure; check the alert. | 503 on DB down; error logged; alert fires. | BP-14 | Not run |
| 20 | Legal and compliance | Pending | Code + Manual — check `/privacy`, `/terms`, login links, retention, and the DSR runbook. | Pages exist and are linked; DSR flow works end to end. | BP-15 | Not run |
| 21 | Documentation | Decided | Manual — follow the README on a clean clone; click every doc link; compare env names. | Quick start works; links resolve; env names match. | BP-09 | Pass |
| 22 | Naming conventions | Pending | Code — read the naming guide; sample files, components, functions, tables, tests, and env vars. | Guide exists; the sample review has no unexplained exception. | BP-22 | Not run |
| 23 | Animation and interactions | Decided | Manual — hover and focus; enable `prefers-reduced-motion`; watch skeleton shimmer. | Reduced motion stops movement/shimmer; no feedback depends on motion alone. | — | Not run |
| 24 | Notifications and feedback | Decided | Manual — trigger success, error, loading, and empty states on every demo action; toggle settings. | Every action gives feedback; no silent no-op; labels are truthful. | BP-05 | Pass |
| 25 | Forms and validation | Decided | Auto + Manual — submit invalid and valid registration; test extension fill; inspect client/server Zod errors. | Field errors are shown; server rejects bad payloads; fill maps correctly. | BP-06 | Not run |
| 26 | Internationalization | Pending | Manual — switch `defaultLanguage` between en-US and en-GB; inspect strings and dates. | English-only is documented, or translations/format actually change. | BP-27 | Not run |
| 27 | Offline and PWA | Skip | Skip — confirm there is no manifest, service worker, or offline cache; grep “offline”. | No offline claim; skip remains valid. | — | Not run |
| 28 | Cookie and session management | Decided | Auto — `curl -i` login; inspect `gps-jwt` flags and expiry; logout; call a protected route. | httpOnly, SameSite, Secure in production, 24h; logout clears; no token leak. | BP-13 | Not run |
| 29 | Redirect and URL management | Decided | Manual — visit `/`, `/search`, `/admin`, `/workspace`, `/nope`; inspect status and redirects. | Redirects and 404s are intentional; dead `/admin` is tracked. | BP-21 | Not run |
| 30 | Code splitting and bundle size | Pending | Auto — `next build`; use the build output or a bundle analyzer; record first-load JS. | Budget written; heavy admin screens are lazy-loaded or justified. | BP-19 | Not run |
| 31 | Backup and recovery | Pending | DB + Manual — confirm Render backup retention; restore to a test DB; run the app against it. | Restore works; RPO, RTO, and retention documented. | BP-14 | Not run |
| 32 | Client communication | Decided | Manual — owner reviews the demo script and records sign-off. | A written acceptance/demo record exists. | BP-10 | Not run |
| 33 | Handoff and maintenance | Pending | Manual — write the handoff note; a new maintainer follows deploy, install, and support steps. | Handoff complete; support owner named. | BP-23 | Not run |

## B — only if the project sells products

All nine are skipped. The check is the same shape: confirm the feature is absent, and confirm the skip is still valid.

| # | Area | Status | Check | Pass condition | Task | Result |
|---|---|---|---|---|---|---|
| 34 | Payment integration | Skip | Skip — grep routes, tables, and packages for payment, Stripe, checkout. | No payment code; skip valid. | — | Not run |
| 35 | Product catalog | Skip | Skip — grep for product, catalogue, SKU. | No catalogue code; skip valid. | — | Not run |
| 36 | Inventory management | Skip | Skip — grep for inventory, stock, warehouse. | No inventory code; skip valid. | — | Not run |
| 37 | Cart and checkout | Skip | Skip — grep for cart, basket, checkout. | No cart code; skip valid. | — | Not run |
| 38 | Shipping and delivery | Skip | Skip — grep for shipping, delivery, tracking. | No shipping code; skip valid. | — | Not run |
| 39 | Discount and promotions | Skip | Skip — grep for discount, coupon, promotion. | No promotion code; skip valid. | — | Not run |
| 40 | Order management | Skip | Skip — grep for orders and order items. | No order code; skip valid. | — | Not run |
| 41 | CMS integration | Skip | Skip — grep for CMS, Contentful, Sanity, WordPress. | No CMS integration; skip valid. | — | Not run |
| 42 | Reviews and testimonials | Skip | Skip — grep for reviews, ratings, testimonials. | No review code; skip valid. | — | Not run |

## C — web app

| # | Area | Status | Check | Pass condition | Task | Result |
|---|---|---|---|---|---|---|
| 43 | Authentication and authorization | Decided | Auto + Manual — log in as each role; call an admin route as receptionist; switch tenant; inspect MFA. | Roles enforced; tenant scope fail-closed; MFA enforced or labelled. | BP-13 | Not run |
| 44 | User management | Decided | Manual — open `/workspace/users`; list, edit, deactivate; call `/api/users` as a non-admin. | Admin-only; changes persist; no privilege leak. | — | Not run |
| 45 | Onboarding flow | Skip | Skip — confirm there is no `/signup` or self-serve route; users are seeded. | No onboarding code; skip valid. | — | Not run |
| 46 | Dashboard and data visualization | Decided | DB + Manual — compare dashboard and analytics numbers to SQL; grep hardcoded metrics. | Every value derives from the DB or is labelled “not tracked”. | BP-04 | Pass |
| 47 | Real-time features | Skip | Skip — grep for WebSocket, EventSource, SSE. | No real-time code; skip valid. | — | Not run |
| 48 | Notification system | Pending | Manual — inspect the emailNotifications toggle; search for a mail sender; toggle it. | Wired and tested, or labelled “not enforced in demo”. | BP-26 | Not run |
| 49 | Multi-tenancy | Decided | Auto + DB — open both Zainabs; compare list, profile, visits, and SQL; switch tenants. | GV shows 3, LS shows 1; no cross-tenant read; same guest_id in URL and API. | BP-01 | Pass |
| 50 | File management | Skip | Skip — grep for upload, multipart, S3; confirm no upload endpoint. | No file management; skip valid. | — | Not run |
| 51 | Search and filtering | Decided | Auto + Manual — search exact email, phone, name, and fuzzy; paginate; inspect order. | Ranked results, no duplicates, stable pages. | — | Not run |
| 52 | Audit logs and activity history | Decided | DB + Manual — mutate a guest; query audit_logs; export CSV. | Audit row written; export tenant-scoped; log is append-only. | BP-04 | Not run |
| 53 | Import and export | Decided | Manual — download directory, visit, and audit CSVs; open them; check rows and tenant. | Valid CSV; correct columns; no cross-tenant data. | — | Not run |
| 54 | Subscription and feature gating | Skip | Skip — grep for subscription, billing, plan, entitlement. | No billing code; skip valid. | — | Not run |
| 55 | Settings and configuration | Decided | Manual — change each setting; save; reload; inspect the effect. | Values persist; effects are real or labelled. | BP-05 | Pass |
| 56 | Admin panel | Decided | Manual — open every admin screen; check `/admin`; inspect middleware. | Admin functions reachable; dead `/admin` fixed or tracked. | BP-21 | Not run |
| 57 | API design | Decided | Auto + Manual — compare `openspec/openapi.yaml` to routes; send an invalid payload; inspect envelope and status. | Spec matches implemented routes; errors consistent. | — | Not run |
| 58 | Background jobs and queues | Pending | Auto + Manual — click Sync Now; run the cron; repeat; force a failure; inspect state and errors. | Both paths use core sync; idempotent; failure visible. | BP-12 | Not run |
| 59 | Soft delete vs hard delete | Decided | DB + Manual — soft-delete a guest; list and search; re-register the same email. | Deleted guest hidden; email reuse behaviour documented and tested. | — | Not run |
| 60 | Collaboration features | Skip | Skip — grep for comments, mentions, presence. | No collaboration code; skip valid. | — | Not run |
| 61 | Webhooks (outgoing) | Skip | Skip — grep for webhook, subscription, event delivery. | No outgoing webhooks; skip valid. | — | Not run |
| 62 | Timezone and localization | Pending | Manual — change timezone and date format; view dates across screens; test DST. | Display follows tenant settings; storage stays UTC. | BP-20 | Not run |
| 63 | Rate limiting and abuse prevention | Pending | Auto + Manual — burst login and API requests; inspect 429, backoff, and lockout. | Limit works; no account enumeration. | BP-13 | Not run |
| 64 | Multi-step flows and wizards | Skip | Skip — grep for wizard, stepper, multi-step. | Registration and sync are single-step; skip valid. | — | Not run |

## D — mobile / desktop

| # | Area | Status | Check | Pass condition | Task | Result |
|---|---|---|---|---|---|---|
| 65 | Platform targets | Decided | Code — inspect the Next app and MV3 manifest; confirm there is no native target. | Web and MV3 only; phone limitation documented. | — | Not run |
| 66 | App store and distribution | Pending | Manual — build the ZIP; load it unpacked in a fresh Chrome; test fill; record the Web Store decision. | Manager can install; allowlist correct; review time known. | BP-08 | Pass |
| 67 | Push notifications (mobile) | Skip | Skip — grep for FCM, APNs, push. | No mobile push; skip valid. | — | Not run |
| 68 | Device features | Skip | Skip — grep for camera, geolocation, Bluetooth. | No device APIs; skip valid. | — | Not run |
| 69 | Offline mode (mobile) | Skip | Skip — confirm there is no mobile offline mode; the web app needs the server. | No offline claim; skip valid. | — | Not run |
| 70 | App updates | Pending | Manual — bump the extension version; reload unpacked; follow the update path. | Update path and version policy written; manager can update. | BP-17 | Not run |
| 71 | Deep linking | Skip | Skip — grep for deep links and universal links. | No deep-link code; skip valid. | — | Not run |
| 72 | Performance (mobile specific) | Skip | Skip — confirm there is no mobile app; use 08 and 09 for web performance. | No mobile-specific claim; skip valid. | — | Not run |

## E — all projects

| # | Area | Status | Check | Pass condition | Task | Result |
|---|---|---|---|---|---|---|
| 73 | Progress tracking | Decided | Code — check `PROGRESS.md`, the task registry, `tasks.md`, and this file after each change. | Current; no stale next step. | — | Pass |
| 74 | Session recovery | Decided | Manual — open a fresh session; read PROGRESS, MANIFESTO, notes, and reports; state the next move. | Next move is obvious; no missing context. | — | Not run |
| 75 | Constraint identification | Decided | Code + Manual — review the constraints table against code, `render.yaml`, and env; owner confirms. | Constraints accurate; no contradiction. | — | Not run |
| 76 | Scalability planning | Pending | Manual — estimate launch traffic; review indexes and pooling; run a small load test. | Plan written; no errors under expected load. | BP-24 | Not run |
| 77 | Security | Pending | Auto + Manual — run the security checklist: AES-GCM, CSRF/Origin, rate limit, tenant checks, MFA, secrets, dependencies. | Critical gaps closed or explicitly accepted; tests exist. | BP-13 | Not run |
| 78 | Landing page vs app shell | Decided | Code + Manual — visit `/`; inspect the redirect; confirm there is no public landing page. | `/` goes to login/dashboard; no public landing. | — | Not run |
| 79 | Design tokens and theming | Decided | Code + Manual — inspect Tailwind tokens and globals; grep raw colours; check dark mode. | Tokens used; dark mode is absent and documented. | — | Not run |
| 80 | Third party integrations | Decided | Code + Manual — list PMS, extension, Render, GitHub, Sentry; check allowlists and env. | List complete; no unexpected calls; Render URL is tracked. | BP-11 | Not run |

## Current result log

| Date | Check | Result | Evidence |
|---|---|---|---|
| 2026-11-16 | Coverage: 80 areas, 80 checks, 36 Decided / 21 Pending / 23 Skip | Pass | `node developer-workspace/blueprint/check-blueprint.mjs` |
| 2026-11-16 | BP-01 visit counts | Pass | API + CDP browser: GV=3, LS=1, cross-tenant 404 |
| 2026-11-16 | BP-02 manual sync | Pass | UI copy + `demo-script.md`; integration test covers register→sync→1 visit |
| 2026-11-16 | BP-03 data tests | Pass | `pnpm test:integration`: 3 passed |
| 2026-11-16 | BP-04 fake metrics | Pass | CDP browser: “Not tracked” on dashboard, PMS, audit, users, tenants |
| 2026-11-16 | BP-05 settings labels | Pass | CDP browser: notes visible; toggle persisted after reload |
| 2026-11-16 | BP-06 empty/error states | Pass | CDP browser: search empty, registration validation, extension missing/ready, no-visit profile, 404 |
| 2026-11-16 | BP-07 error boundary + health | Pass | Bad DB health = 503; forced error route showed friendly boundary |
| 2026-11-16 | BP-08 extension ZIP | Pass | ZIP loaded unpacked; Full Name/email/phone filled |
| 2026-11-16 | BP-09 README | Pass | Env names, doc paths, runbooks, local production command corrected |
| 2026-11-16 | BP-10 demo script | Pass | `demo-script.md` written; manual sync + phone/local-only limits stated |
| 2026-11-16 | Product checks in this matrix | 9 recorded / 71 not run | BP-29 runs the remaining checks after P1 |
