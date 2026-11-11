# TASK-007 — Patch stack applied + fixes

**Date:** 2026-11-11
**Owner:** apply `0001`–`0004`, fix the bugs, commit as we go.

## Applied (one commit each)

| Patch | Commit |
|---|---|
| `0001` demo slice (messy fixture + seeding) | `1edb5ca` |
| `0002` workspace UI → real guest API | `80d3b56` |
| `0003` FormFilla extension | `a44dcc9` |
| `0004` admin screens + endpoints | `f2c4cf6` |

The four `.patch` files are left untracked in the repo root as inputs.

## Fixes in this pass

### CI / install
- Regenerated `pnpm-lock.yaml` for the `jsdom` dev dependency; `pnpm install
  --frozen-lockfile` now passes.
- Fixed all 9 lint errors in `adapter-fill-extension/src/messaging/messages.ts`
  (type aliases + `Record<string, never>`), and removed the cast in
  `content.ts` by typing the optional `error` field.

### Guest search
- `useGuestSearch` now takes the caller's query instead of keeping a private
  copy — typing actually fires the request. Added `refetch`.
- Search screen shows the demo banner whenever it is displaying `GUESTS`
  (before typing or after an API error); no more silent fallback.
- Selecting a search result now stores the guest object + guest id instead
  of an index into a different list, so the correct profile opens.
- `pg_trgm`: added a tier-5 fuzzy match (`%` on `lower(first_name)`,
  `lower(last_name)`, `lower(email)`), lowercase expression GIN indexes in
  `001_initial_schema.sql`, `DISTINCT ON (guest_id)` dedupe at the best rank,
  and NULL-safe exclusion predicates (guests without a phone/email are no
  longer dropped from lower tiers).

### FormFilla extension
- Added a content-script `window.postMessage` bridge: verifies origin and
  source, forwards `GPS_STORE_GUEST` to the background worker, and posts an
  acknowledgement. The workspace only claims success when the ack arrives;
  otherwise it says the extension was not detected.
- The old `chrome.runtime.sendMessage("")` path is now optional and uses
  `NEXT_PUBLIC_GPS_EXTENSION_ID` when configured.
- `dateOfBirth` is coerced through `isoDate()` instead of calling
  `.toISOString()` on an API string (which would throw).

### Screens now reading real data
- Guest profile: guest id, member since, nationality, date of birth, total
  spend, VIP level, guest phase, preferences/tags, per-guest audit activity.
- Dashboard: date, recent guest matches, recent activity, sync summary
  (last sync, profile count, errors, 24h audit events).
- Visit history: real reservations from `/api/guests/{id}/reservations`
  (nights computed from check-in/check-out).
- Registration: real tenant name, today's check-in date, real match list.
- Analytics: live `/api/health` status, process uptime, PMS connection,
  real tenant count. The 30-day chart is labelled as illustrative.
- Settings + hotel settings: toggles load from `/api/settings` and Save
  writes back through `PUT /api/settings`.

### Forms that previously only toasted
- Invite user → `POST /api/users` (password field added, valid role values).
- Add hotel → `POST /api/tenants`.
- Add guest → `POST /api/guests` (new `api.createGuest`).
- Edit guest → `PUT /api/guests/{id}`.
- New data request → `POST /api/data-requests`.
- Errors from the API are surfaced in the toast; the modal stays open.

## Verified

| Check | Result |
|---|---|
| `pnpm install --frozen-lockfile` | pass |
| `pnpm typecheck` | pass (4 packages) |
| `pnpm lint` | pass, 0 errors (warnings only) |
| `pnpm test:unit` | 326 passed, 1 skipped |
| `pnpm build` | pass, 28 routes |
| `PLAYWRIGHT_CHANNEL=chrome pnpm test:e2e` | 4/4 pass |
| `pnpm --filter @gps/adapter-fill-extension build` | pass |
| Browser check: search + banner + selection | pass (real response, 1 card, correct modal) |
| Browser check: extension bridge | pass (no extension → honest error; simulated ack → success) |
| Browser check: settings/users/DSR/tenants forms | pass (intercepted API, success toasts) |
| Browser check: profile/dashboard/visit history/registration | pass (real fields rendered) |

## Not verified / still open

- No live Postgres in this environment, so the new SQL was not executed
  against a real database. The SQL builder is unit-tested for shape, dedupe,
  NULL safety, and the `%` tier; execution remains unproven here.
- `packages/shared` `db:migrate` still points at the default `migrations/`
  directory while the schema lives in `src/db/migrations/`, and
  `node-pg-migrate` is not installed. Pre-existing; not changed.
- The Analytics 30-day chart is labelled illustrative — there is no
  reporting endpoint yet.
- Settings General still shows non-tenant defaults (language, timezone,
  date format) that are not stored by the API; hotel-settings "System
  Defaults" selects are not persisted.
- The `render.yaml` Postgres `ipAllowList: 0.0.0.0/0` from `0004` is still
  present — this needs an owner decision before deploying.
- `/workspace/*` still has no client-side auth guard (APIs are protected).
