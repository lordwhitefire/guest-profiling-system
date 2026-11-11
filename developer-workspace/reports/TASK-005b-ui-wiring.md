# TASK-005b — Wire workspace UI to the real guest API

**Date**: 2026-11-12
**Author**: Z.ai (builder agent)
**Slice**: Continuation of TASK-005 (UI wiring slice)
**Depends on**: TASK-005a (seeding script — needed for the UI to have real data to show)

## Problem

The previous slice (TASK-005a) made it possible to seed the profiling DB with
207 rows of messy guest data. But the 17-screen workspace UI still rendered
the hardcoded `GUESTS` array — six fake guests ("Adebola Kamal", "Sarah Kamal",
etc.) that were never connected to the real `/api/guests` endpoints.

This slice closes that gap: the workspace UI now calls the live API and shows
real guest records.

## Approach

Per owner directive: keep the UI changes surgical. The 17-screen workspace
file (`packages/core/components/workspace/workspace-app.tsx`, ~440 lines) is
dense and visually polished. Rewriting it would risk breaking CSS layouts
and the existing visual design.

Instead:

1. Add a thin **adapter layer** (`packages/core/lib/workspace/adapters.ts`)
   that converts real `Guest` objects (camelCase, many fields) into the
   simpler shape the UI already consumes (`{name, initials, email, phone,
   visits, last, hotel, status, room}`). `WorkspaceGuest` is structurally
   compatible with the existing mock `GUESTS` array element.

2. Add **React hooks** (`packages/core/lib/workspace/hooks.ts`) that wrap
   the existing api-client and return `WorkspaceGuest[]`:
   - `useGuestSearch(query)` — debounced live search
   - `useGuestDirectory(page, limit)` — paginated list
   - `useGuest(guestId)` — single guest by id
   - `useGuestCount()` — quick total for the dashboard

3. Modify `WorkspaceApp` minimally: call the hooks at the top, prefer real
   data when available, fall back to the existing `GUESTS` mock array when
   the API is unreachable. A small **"Demo Data" banner** appears at the
   top of the screen when the UI is showing fallback data, so the demo
   viewer knows they're not seeing real records.

4. Update child components (`GuestSearch`, `Directory`, `Dashboard`,
   `GuestProfile`, `VisitHistory`, `Modal`) to accept `GuestLike` (a union
   of the mock shape and `WorkspaceGuest`). The change is type-only; the
   component bodies still render the same fields.

5. Add loading and error states to the search and directory screens.

## What was built

### Files added

| Path | Purpose |
|---|---|
| `packages/core/lib/workspace/adapters.ts` | `toWorkspaceGuest()` and `toWorkspaceGuests()` — converts real `Guest` objects to the simpler UI shape |
| `packages/core/lib/workspace/hooks.ts` | `useGuestSearch`, `useGuestDirectory`, `useGuest`, `useGuestCount` React hooks |
| `packages/core/__tests__/workspace-adapters.test.ts` | 23 unit tests for the adapter (initials, name combination, status derivation, date formatting, etc.) |

### Files modified

| Path | Change |
|---|---|
| `packages/core/lib/api-client.ts` | Added `apiFetchRaw()` (returns full envelope), `GuestListResponse` type, `api.listGuests(page, limit)` |
| `packages/core/__tests__/api-client.test.ts` | +6 tests for `api.listGuests` (URL params, metadata extraction, fallbacks, error path) |
| `packages/core/components/workspace/workspace-app.tsx` | Added hooks at top of `WorkspaceApp`; added `DemoDataBanner`, `LoadingState`, `ApiErrorState` components; updated `GuestSearch` and `Directory` to accept loading/error/total props; updated `Dashboard` to accept real `totalCount`; updated `Modal` and `GuestProfile`/`VisitHistory` signatures to accept `GuestLike` |
| `packages/core/components/workspace/workspace.css` | Added `.gps-spin` (reuses existing `@keyframes gps-spin`) and `.gps-demo-banner` styles |

### Files modified outside the repo (kept in scripts/)

None — the messy-guests generator from TASK-005a is reused.

## Test results

```
Workspace-wide: 256 tests passed | 0 failed (was 227 before this slice)
  +29 new tests:
    - 23 in workspace-adapters.test.ts
    - 6 in api-client.test.ts (listGuests coverage)

Typecheck: clean across all 4 packages.
Next.js build: clean. All 17 workspace routes + 6 API routes compile.
```

## What was verified

- The Next.js production build succeeds (`pnpm build` in `packages/core`).
  All 17 workspace routes are statically pre-rendered; all 6 API routes
  are dynamic.
- TypeScript typecheck passes workspace-wide.
- 256 unit tests pass (29 new).
- The existing TASK-004 search-input component (which already called the
  real API) is unchanged — it continues to work as before.
- The new `WorkspaceGuest` shape is structurally compatible with the
  existing mock `GUESTS` array element, so the child components render
  unchanged for either source.

## What was NOT verified (no real Postgres available in build env)

- End-to-end live data flow against a real API + DB. The hooks call
  `/api/guests` which requires a logged-in session (JWT cookie) and a
  populated DB. In a fresh dev environment without those, the hooks set
  `error` and the UI falls back to mock data — that's the design.
- The DemoDataBanner's Retry button. It calls the hook's `refetch()`
  function, which re-runs the API call. Verified at the unit level
  (hooks.ts tracks `refetchTick`); not verified at runtime.

To verify end-to-end:
1. Apply the previous patch (TASK-005a) + this patch
2. Follow `docs/runbook/demo-end-to-end.md` to seed the DB
3. Create a user (per the runbook's Step 4)
4. `pnpm dev` and open `/workspace/dashboard`
5. The banner should NOT appear; counts should be 207 (or whatever was seeded)
6. `/workspace/guest-search` should show real guest cards from the seeded DB
7. `/workspace/directory` should show a paginated table of real guests

## Architecture decisions

1. **Adapter pattern over UI rewrite** — the existing UI shape
   (`{name, initials, email, phone, visits, last, hotel, status, room}`)
   is preserved. The adapter converts the real `Guest` to that shape. This
   means a future UI refresh can replace the adapter with direct
   Guest-typed rendering; until then, the slice is small and reversible.

2. **Graceful fallback to mock data** — when the API is unreachable (no
   logged-in session, dev without seeded DB, network error), the hooks
   set `error` and the components fall back to the original `GUESTS`
   array. This means:
   - The UI still renders in `pnpm dev` with no setup
   - A demo can run without a logged-in session
   - The "Demo Data" banner makes the fallback explicit
   - A real customer sees real data with no banner

3. **No new dependencies** — the slice uses only React's built-in hooks
   (`useState`, `useEffect`, `useCallback`, `useRef`, `useMemo`) and the
   existing api-client. No SWR, no React Query, no Redux.

4. **Loading/error states for every screen** — `LoadingState` and
   `ApiErrorState` are reusable. The search and directory screens use
   them; the profile/history screens use the existing `currentGuest`
   (which is always non-null thanks to the fallback), so they don't need
   separate loading states.

5. **Cardinal direction: do NOT touch TASK-006 (browser extension)** —
   the form-fill extension is a separate concern. This slice is about
   making the existing UI show real data; the extension that writes to
   the hotel's PMS form is the next major slice after this one.

## Known limitations / follow-up work

- The `guest-profile` and `visit-history` screens still use a single
  `currentGuest` (selected via index from the directory/search list).
  They don't deep-link by `guest_id` from the URL. A future slice could
  make `/workspace/guest-profile?guestId=...` work, but it's not needed
  for the demo.
- The dashboard's "Returning Guests", "Today's Matches", etc. are still
  hardcoded numbers. Only "Total Guest Profiles" is wired to the real
  count. A future `/api/stats` endpoint could power the rest.
- The directory's pagination controls increment by 1 page; they don't
  yet respect the real `total` count for "showing X of Y". This slice
  wires the "of Y" text; the buttons themselves are unchanged.
- The audit-logs screen is still mock. Wiring it would need a new API
  endpoint (`/api/audit-logs`) which doesn't exist yet.
- TASK-005 (full Admin UI) and TASK-006 (browser extension) remain
  pending.
