# TASK-009 — clickability map report

Date: 2026-11-12. Site: production build on `http://localhost:3100` (not the dev server).
Browser: visible Chrome on CDP `127.0.0.1:9222`. Method: `PROCEDURE.md` in this folder.

## Scope captured

- **20 routes**: 16 workspace pages, `/login`, `/design-system`, `/search` (redirects to
  `/workspace/guest-search`), `/profile/[guestId]`.
- **5 modal / popover states**: account menu, notifications, Add Guest, New Request,
  Invite User, Add Hotel.
- **236 control rows** after deduplicating the shared sidebar/topbar shell.

## Counts

| Status | Rows | Meaning |
|---|---:|---|
| WIRED | 198 | handler, `href`, form submit, or native field |
| DEAD | 3 | supposed-clickable but no handler/`href` |
| NATIVE | 24 | native control that changes only its own visual state, no app state |
| INPUT | 5 | editable native field |
| STATIC | 4 | design-system demo buttons |
| DISABLED | 2 | disabled controls |

## What is dead

1. **Hotel switcher** — `div.gps-hotel-badge` + ChevronDown, on 16 routes. No role, no
   handler, no `href`, `tabIndex=-1`, `cursor:auto`. Supposed to open the hotel menu.
2. **User menu** — `div.gps-sidebar-user` + three dots, on 16 routes. Same: no role, no
   handler, no focus. Supposed to open the account/user menu.
3. **Directory page number “1”** — a `<button>` with no handler.

## What only pretends to work

24 native controls change their own value but nothing else:

- 21 Directory checkboxes (“Select all” + 20 rows) — toggle visually, not wired to selection
  or a bulk action.
- Visit History period select — changes the option, no filter.
- Analytics “Last 30 days” select — changes the option, no range change.
- Registration confirmation checkbox — toggles, not connected to the submit action.

## Wired, but suspect

21 rows have a handler whose source looks toast-like. These need the click pass to confirm:

Download Report, Directory Export, Visit History Export, Audit Logs Export, Sync Now,
Test Connection, Save Defaults, Save Changes, Edit Hotel Information, Complete Registration,
Hotel PMS, View Quick Guide, View permissions, and the dashboard guest “View” buttons.

`Save Settings` on Hotel Settings is the one settings save that actually calls the API.

## Other findings

- **Registration**: 13 controls. The three suggestion rows are wired to fill name/email/phone
  only; they are not live search results. “Complete Registration” is handler-wired but looks
  toast-only. The date inputs are native and work.
- **`/profile/[guestId]`**: only “Back to search” rendered. The server page fetches the API
  without forwarding the login cookie, so the guest profile does not render on the production
  server. This is a real page bug, not a clickability one.
- **`/login`**: 9 controls, form submit wired.
- **Design-system buttons**: four demo variants have no handler; marked STATIC (demo), not
  product controls.

## Not done yet

- The click pass (PASS / DEAD / FAKE / NOT RUN per row) on the production build.
- The `runtime-parity` baseline capture and gate.

## Files

- `PROCEDURE.md` — how supposed-clickable is established.
- `map.md` — the human-readable map.
- `map.json` — machine-readable rows.
- `findings.md` — the signal research and the live evidence.
