# UI Work Report — 17-Screen Hotel Workspace

**Date:** 2026-11-11
**Source:** `guest-profiling-system-ui.patch` (17 screens, applied then committed as `91f383b`)

## What was built

Complete frontend UI for the Guest Profiling System workspace:

- **Login screen** — branded with hotel story, password show/hide toggle, "forgot password" help modal, SSO placeholder, terms/privacy links.
- **Workspace shell** — collapsible sidebar nav, topbar with global search (⌘K), notifications, profile dropdown, hotel switcher.
- **15 screens under `/workspace/`:**
  - dashboard, guest-search, guest-directory, guest-profile, visit-history, registration
  - pms-sync, data-requests, audit-logs, users, tenants, settings, hotel-settings, analytics
  - processing, error
- **CSS:** `workspace.css` + `login.css` — self-contained, responsive (desktop/tablet/mobile breakpoints).
- **Routes:** all 15 route files under `packages/core/app/workspace/*/page.tsx`, each rendering `<WorkspaceApp initialScreen="..." />`.

## What is wired vs not wired

**Wired:**
- Navigation between screens via sidebar + topbar.
- Search input, filters, pagination, status pills — all functional UI interactions (modals, toasts, toggles).
- Responsive layouts (mobile sidebar drawer, stacked grids).
- All build/lint/test/e2e checks pass (verified after applying the patch).

**Not wired (initial state):**
- All data is **mock/hardcoded** — a static `GUESTS` array of 6 fake guests inside `workspace-app.tsx`. No calls to the real guest API (`/api/guests/search`, etc.) built in TASK-003.
- No connection to the tenant scope resolver, auth cookie, or real backend.
- Registration form, PMS sync, data requests, audit logs — all show static content, no backend writes.
- The old two-pane real search screen (`/search`) was replaced with a redirect to the mock-data guest-search screen.

## Verification after applying

- `pnpm typecheck` — PASS (all 4 packages)
- `pnpm lint` — PASS (0 errors, warnings only — unused vars in new workspace code)
- `pnpm test:unit` — PASS (206 passed, 1 skipped)
- `pnpm build` — PASS (28 routes compiled, all 15 workspace routes included)
- `pnpm test:e2e` — PASS (4/4, after fixing a missing `type="submit"` on the login button)

## Notes

- Two syntax errors in the supplied patch had to be fixed before build would pass: a broken `calc()` in `workspace.css` and a missing `type="submit"` attribute on the login submit button.
- Blueprint build order is Functionality → Business logic → Data → UI (confirmed). This UI sits on top of the existing Data/Business logic layers but does not yet consume them — the next step to make it real is wiring the screens to the TASK-003 guest API.
