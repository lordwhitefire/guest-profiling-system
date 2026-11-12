# TASK-009 — Runtime map + clickability / behaviour audit

Owner directive 2026-11-12: **there is no reference site. Capture the map first** — every
element that is *supposed* to be clickable — then check every one of those, then every
behaviour. Use `runtime-parity` for the runtime map; use `browser-attach` for the browser.
Never audit the dev server: build and serve the production build.

## What "supposed to be clickable" means

Every element a user would reasonably try to interact with:

- `<button>`, `<a href>`, `[role=button]`, `[role=menuitem]`, `select`, checkbox, switch;
- icon-only controls (three dots, chevron, bell, avatar) even when they are a `<div>` or `<svg>`;
- visual affordances: hotel badge with a chevron, user row, nav items, table row actions;
- inputs whose value triggers an action (search-as-you-type, filters);
- decorative elements must either lose the affordance (no chevron/hover/cursor) or be declared
  static in the map — they may not *look* clickable and do nothing.

## Tracker

| # | Item | Status |
|---|------|--------|
| 1 | Write the inventory map: every route, every supposed-clickable element, its selector, label, and expected outcome | done — 20 routes + 5 modal/popover states, 236 rows; `developer-workspace/parity/clickability/map.md` + `map.json`; report `developer-workspace/reports/TASK-009-clickability-map.md` |
| 2 | Build the production app (`pnpm build`) and serve it with `next start` (runtime-parity forbids a dev URL) | done — production on `:3100` |
| 3 | Capture the runtime baseline map of the production build with `runtime-parity` (all routes/states, auth included) | pending — clickability map captured first; runtime-parity capture still to run |
| 4 | Click every mapped control on the production build; record PASS / FAIL / NOT RUN with evidence (route, DOM, network, toast) | pending |
| 5 | Clickability verdict: list every dead control and every fake action (toast-only where work is claimed) | pending |
| 6 | Behaviour verdict: live search-as-you-type, profile selection, complete-registration write, hotel/user menus, settings saves, modals, filters, exports | pending |
| 7 | Fix the dead controls and fake actions; re-run 4–6 | pending |
| 8 | Gate the fixed build against the baseline map with `runtime-parity`; report PASS / FAIL with the first split | pending |
| 9 | Save the report and update TASK-008, the registry and PROGRESS | pending |

## Rules

- **Map first, fix second.** No control is declared working because the code has an `onClick`;
  it is working only when the click produces the mapped effect on the production build.
- **A toast is not an action.** "Export started", "Sync queued", "Connection tested" are FAILs
  unless a real request/state change follows.
- **NOT RUN is never a pass.** If a control needs an external service (extension, PMS), say so.
- **No screenshots** (browser-attach rule). Evidence is DOM text, route, and network log.
- **No visual redesign in this task.** Dead affordances are either wired or declared static;
  the visual language is not changed.
- Multi-hotel switching is **not** built here. The current architecture is single-tenant per
  install (`users.tenant_id`, JWT `tenant_id`); making the hotel badge real is an architecture
  decision that must be taken separately.

## Exit criteria

- A saved inventory map exists with one row per supposed-clickable control.
- Every row has a verdict backed by evidence from the production build.
- Every dead control is either wired, or explicitly declared static and stripped of its
  affordance in the map and the UI.
- The core loop is proven on the production build: typing a name shows matching profiles,
  selecting one carries the guest identity, and completing registration records something
  against that guest — or the gap is reported as a FAIL, not hidden.
- `runtime-parity` gate result is recorded; a FAIL names the first split.
