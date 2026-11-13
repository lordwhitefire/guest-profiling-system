# TASK-009 — clickability map (real-data UI)

**Date:** 2026-11-13
**Site:** production build on `http://localhost:3100` (not the dev server).
**Browser:** visible Chrome on CDP `127.0.0.1:9222`, automation profile.
**Supersedes:** `TASK-009-clickability-map.md` (the 2026-11-12 mock-data map).

## What was captured

- 20 routes: 16 workspace pages, `/login`, `/design-system`, `/search`, `/profile/[guestId]`.
- 5 modal/popover states: account menu, Add Guest, New Request, Invite User, Add Hotel.
- The guest-profile and visit-history screens are captured with a real selected guest, not the empty state.
- Directory rows are unique: View/Edit buttons and pagination arrows carry `aria-label`, so no `(icon)` aliases are needed.

## Counts

| Status | Rows | Meaning |
|---|---:|---|
| WIRED | 186 | handler, `href`, form submit, or native field |
| STATIC | 4 | design-system demo buttons |
| INPUT | 3 | editable native field (search, global search, password) |
| DISABLED | 4 | disabled by design (first-page previous, current page, transient refresh, design-system field) |
| NATIVE | 22 | native control that changes only its own visual state (checkboxes, selects) |
| DEAD | 0 | nothing supposed-to-be-clickable is unwired |

**Total unique controls:** 219 (23 shared shell + 196 page/state rows).

## What changed since the old map

- Hotel switcher and user menu are real controls, not dead `div`s.
- Directory row actions have accessible names.
- Visit History has a period select with real year options.
- The profile page renders the selected guest's tabs, Edit Profile and Prepare Registration.
- The old 251-row mock-data map and its 3 dead controls are superseded by this run.

## Artifacts

- `developer-workspace/parity/clickability/map.json`
- `developer-workspace/parity/clickability/map.md`
- Generator: `developer-workspace/parity/clickability/map.mjs`

## Click pass against this map

See `TASK-009-status-2026-11-13.md` §3: **159 PASS, 0 DEAD, 0 FAKE, 36 NOT RUN, 24 NATIVE** on the full run (219 unique rows); the one missing visit-history control was verified in a targeted re-run (PASS), giving effective **160 PASS, 35 NOT RUN**.