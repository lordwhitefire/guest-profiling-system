# TASK-009 — Control audit, honest behaviour, two-hotel registration loop

Owner directives:

- **2026-11-12:** there is no reference site. Capture the map first — every element that is
  *supposed* to be clickable — then check every one, then every behaviour. Use
  `runtime-parity` for the runtime map; use `browser-attach` for the browser. Never audit the
  dev server: build and serve the production build.
- **2026-11-12:** never delete, hide or remove any button without the owner's explicit
  knowledge and approval. Dead buttons are wired, not removed.
- **2026-11-12:** two hotels, two messy source databases, two working registration forms.
  Nothing in the product flow is mock: the form writes, the adapter reads, the profile updates.
- **2026-11-12:** the hotel database has **no visit table and no visit count**. Every
  registration is one new raw row. The same person may appear three or four times with
  different details. The visit count is derived in **our clean database** by grouping the
  repeated raw rows. Never add visit columns or visit tables to the hotel database.

## What "supposed to be clickable" means

Every element a user would reasonably try to interact with:

- `<button>`, `<a href>`, `[role=button]`, `[role=menuitem]`, `select`, checkbox, switch;
- icon-only controls (three dots, chevron, bell, avatar) even when they are a `<div>` or `<svg>`;
- visual affordances: hotel badge with a chevron, user row, nav items, table row actions;
- inputs whose value triggers an action (search-as-you-type, filters);
- decorative elements must either lose the affordance (no chevron/hover/cursor) or be declared
  static in the map — they may not *look* clickable and do nothing.

## Phases

### Phase 1 — Audit (no code changes)

1. Map every route and state. **Done:** 20 routes + 5 modal/popover states, 236 rows
   (`developer-workspace/parity/clickability/map.md` + `map.json`).
2. Serve the production build. **Done:** `:3100`.
3. Click every mapped row on the production build; record PASS / DEAD / FAKE / NOT RUN with
   route, DOM, network and toast evidence.
4. Produce the fix list: dead controls, fake (toast-only) actions, wrong behaviours.

### Phase 2 — Two-hotel foundation

5. Create two messy source databases, Hotel 1 and Hotel 2, same schema as the current PMS
   fixture, similar data. **No schema changes** — no visit table, no visit count.
6. Create two tenants in our clean database, one per hotel; link each tenant to its own source
   database. Adapter connection is read-only.
7. Build real multi-hotel switching: membership, active-tenant switch endpoint, re-issued JWT,
   working hotel badge/menu. Each hotel's users, data and registration page stay isolated.
8. Per-hotel registration form branding — same design, different hotel name.

### Phase 3 — Real registration loop

9. Registration form live search: typing queries **our clean database** for that hotel, shows
   matching profiles. Clicking a match fills the form. No match means a blank form.
10. Pressing Register inserts **one raw row** into that hotel's messy database. Nothing else.
    The form has its own write connection because it represents the hotel's PMS; the adapter
    stays read-only.
11. Adapter sync: read the hotel's raw rows, group repeated entries into one clean profile,
    link each source row to that profile. Visit count = number of linked rows; last stay =
    newest row. The link tables live in **our database only**.
12. Idempotent re-sync: running the adapter twice must not double counts. Both hotels isolated.

### Phase 4 — Wire the controls (no removals)

13. Shell: user menu, real logout, hotel switcher.
14. Directory: row checkboxes, select-all, pagination, bulk action.
15. Filters: Visit History period, Analytics range.
16. Exports: real CSV from real data (Directory, Visit History, Audit Logs, Report).
17. Sync Now / Test Connection: real checks against the source database.
18. Guest profile tabs, Save Defaults, View Quick Guide, permissions, and every other
    toast-only action. Every button must navigate, open a panel, save, download, or run a job.

### Phase 5 — Re-verify

19. Full click pass again on the production build; every row re-verdicted.
20. Full loop on both hotels: type → suggest → select → fill → register → raw row in source
    database → adapter sync → clean profile visit count increases and last stay updates.
21. `runtime-parity` baseline and gate. Record PASS / FAIL with the first split.
22. Save the honest report; update this tracker, TASK-008, the registry and PROGRESS.

## Tracker

| # | Item | Status |
|---|------|--------|
| 1 | Inventory map: every route, state and supposed-clickable row | done — 20 routes + 5 states, 236 rows |
| 2 | Production build served | done — `:3100` |
| 3 | Click every mapped row; PASS / DEAD / FAKE / NOT RUN | in progress |
| 4 | Fix list: dead controls, fake actions, wrong behaviours | pending |
| 5 | Two messy source DBs + seed | pending |
| 6 | Two tenants + source links + read-only adapter connections | pending |
| 7 | Multi-hotel membership, switch endpoint, JWT, working switcher | pending |
| 8 | Per-hotel registration branding | pending |
| 9 | Registration live search + prefill | pending |
| 10 | Register writes one raw row to the hotel's messy DB | pending |
| 11 | Adapter grouping + visit count + last stay (clean DB only) | pending |
| 12 | Idempotent re-sync, two-hotel isolation | pending |
| 13 | Shell controls: user menu, logout, switcher | pending |
| 14 | Directory checkboxes, select-all, pagination, bulk action | pending |
| 15 | Visit History and Analytics filters | pending |
| 16 | Real CSV exports | pending |
| 17 | Sync Now / Test Connection real checks | pending |
| 18 | Profile tabs and remaining toast-only actions | pending |
| 19 | Full click pass again | pending |
| 20 | Full two-hotel loop on production | pending |
| 21 | runtime-parity baseline + gate | pending |
| 22 | Report + tracker/registry/PROGRESS updates | pending |

## Rules

- **Map first, fix second.** A control is working only when the click produces the mapped
  effect on the production build.
- **A toast is not an action.** "Export started", "Sync queued", "Connection tested" are FAILs
  unless a real request, download or state change follows.
- **NOT RUN is never a pass.** State why (destructive, external service, missing fixture).
- **No screenshots** (browser-attach rule). Evidence is DOM text, route, network log.
- **No button is deleted or hidden.** Dead affordances are wired. If a control truly cannot
  be wired, stop and ask the owner.
- **No visual redesign in this task.**
- **Never add visit columns or tables to the hotel database.** The visit count is derived in
  our clean database from repeated rows.
- The adapter connection is read-only. Only the registration form (acting as the hotel's PMS)
  writes to the hotel database.

## Exit criteria

- Every mapped row has a verdict backed by evidence from the production build.
- No button deleted or hidden.
- Two hotels exist, isolated, each with a working registration form.
- Registration writes one raw row to the correct hotel database; the adapter groups it into
  the right clean profile; visit count and last stay update; re-sync does not double count.
- No toast-only action remains in the product flow.
- `runtime-parity` gate result recorded; a FAIL names the first split.
