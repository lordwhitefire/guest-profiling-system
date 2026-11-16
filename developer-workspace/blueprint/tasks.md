# Blueprint Tasks — Guest Profiling System

**Date:** 2026-11-16
**Purpose:** turn the 21 Pending Blueprint areas and the local findings into an ordered task list, with a real acceptance check for every task.
**Related:** `checklist.md` (the 80-area map), `verification.md` (one check per area), `../issues/TASK-009-data-consistency.md`.

## Rules

1. **P0** must be done before the local demo. **P1** must be done before the app is public on Render. **P2** is quality work after the demo.
2. A task is **not done** until its acceptance check passes and the matching row in `verification.md` is updated.
3. **No control is removed or hidden without the owner's explicit approval.** A dead control is wired or labelled.
4. **No hardcoded data.** If a value is not tracked, say “not tracked” — do not show `0`.
5. Local commits only; the owner pushes.
6. Every task keeps the production build green: `pnpm lint`, `pnpm typecheck`, `pnpm test:unit`, `pnpm build`.

## Status at a glance

| Priority | Tasks | Focus |
|---|---:|---|
| P0 — before the local demo | 10 | data consistency, sync behaviour, tests, honesty fixes, extension ZIP |
| P1 — before the public URL | 7 | Render, cron, security, monitoring/backup, legal, phone/browser |
| P2 — after the demo | 12 | accessibility, performance, timezone, docs, scalability, real PMS |
| **Total** | **29** | |

---

## P0 — before the local demo

### BP-01 — Make visit counts consistent

- **Areas:** 49, D8, 17
- **Status:** Open
- **What:** `/profile/[guestId]` and every visit display must use the same `guest_id` **and** `tenant_id` as the row clicked, and read visits from `guest_profile_links`. Remove the legacy `reservations`/`loyalty_profiles` path from the visit display.
- **Acceptance check:** Grand Vista Zainab shows **3** on the directory, dashboard, profile, and visit history; Lakeside Zainab shows **1**; opening one never shows the other. The same guest ID is used in the URL and the API.
- **Evidence:** browser + SQL; add the cross-screen test in BP-03.

### BP-02 — Decide and document the sync behaviour

- **Areas:** 58, 32
- **Status:** Open
- **What:** Choose **manual Sync Now** or **auto-sync after registration** for the demo. Recommendation: manual Sync Now, shown in the demo script. Write the choice in the demo script and the UI copy.
- **Acceptance check:** The demo script matches the product. If manual: register → click **Sync Now** → visit appears once. If auto: register → visit appears without a click. Re-running sync does not duplicate the visit.
- **Evidence:** demo script + browser.

### BP-03 — Add three focused data tests

- **Areas:** 17, 49, D8
- **Status:** Open
- **What:** Add a local-Postgres integration suite (no downloads/testcontainers) with three tests:
  1. Same guest shows the same count on directory, profile, and visits.
  2. Registration → sync → visit count increments once.
  3. Same name in two tenants stays two separate profiles; no cross-tenant read.
- **Acceptance check:** The three tests pass against the local Postgres. Breaking the tenant filter or the link source makes at least one test fail.
- **Evidence:** `pnpm test:integration` output (new script) + test files.

### BP-04 — Remove the fake zero metrics

- **Areas:** 46, 52, 24
- **Status:** Open
- **What:** `syncErrors: 0`, “Pending Invites: 0”, and audit “Errors: 0” are hardcoded. Derive them from real data, or display “Not tracked” with a short reason.
- **Acceptance check:** `grep` finds no hardcoded zero metric in the workspace/API. With a sync error or no invite system, the screen says so; it never claims `0` without evidence.
- **Evidence:** code + browser.

### BP-05 — Label or wire the decorative settings

- **Areas:** 24, 48, 55
- **Status:** Open
- **What:** MFA, email notifications, and auto-sync toggles currently store values but do nothing. Either wire the behaviour, or show “Not enforced in demo” next to the toggle. Do not leave a silent no-op.
- **Acceptance check:** Toggling each setting produces a visible, truthful effect or explanation. Reloading keeps the saved value.
- **Evidence:** browser + `/api/settings`.

### BP-06 — Fix the demo-path empty and error states

- **Areas:** 13, 24, 25
- **Status:** Open
- **What:** Cover the states the demo will actually hit: search with no results; a profile with no visits; sync before seeding; extension not installed; registration failure; API/DB failure.
- **Acceptance check:** Each state shows a plain message and the next action. No blank panel, no silent failure, no raw stack trace.
- **Evidence:** browser walkthrough.

### BP-07 — Add an error boundary and a real health check

- **Areas:** 13, 19
- **Status:** Open
- **What:** Add a friendly `error.tsx`/`global-error.tsx`; make `/api/health` run a short DB check and return 503 when the DB is unavailable. Do not leak secrets or stack traces.
- **Acceptance check:** Stopping the DB makes `/api/health` return 503; forcing a component error shows the friendly screen. With the DB up, both return healthy.
- **Evidence:** `curl` output + browser.

### BP-08 — Build the extension ZIP and install note

- **Areas:** 66, 70, 80
- **Status:** Open
- **What:** Build a versioned ZIP of `packages/adapter-fill-extension`; write a one-page “Load unpacked” note for the manager's Chrome. The Render URL in `externally_connectable` waits for BP-11.
- **Acceptance check:** A fresh Chrome profile loads the ZIP, opens the local registration form, and fills Full Name, email, and phone from a selected profile.
- **Evidence:** ZIP + install note + browser.

### BP-09 — Fix the README quick start

- **Areas:** 21
- **Status:** Open
- **What:** Correct `ARGON2_SECRET` → `ARGON2_PEPPER`; point to `openspec/ARCHITECTURE.md` and `openspec/openapi.yaml`; make the runbook list match the three files that exist; state the local production-build command.
- **Acceptance check:** A clean-clone reader can follow the README to install, migrate, build, and start without a broken link or wrong env name.
- **Evidence:** README + link check.

### BP-10 — Write and dry-run the local demo script

- **Areas:** 32, 75
- **Status:** Open
- **What:** One page: login → search → open profile → register → **Sync Now** (if BP-02 is manual) → show visit history → extension fill. Include the phone limitation and the local-only URL.
- **Acceptance check:** A full dry run passes every step on the production build; the presenter can follow it without improvising.
- **Evidence:** script + dry-run notes.

---

## P1 — before the public URL

### BP-11 — Deploy to Render

- **Areas:** 18, 01, 80
- **Status:** Open
- **What:** Push the commits; create the Blueprint; provision the clean Postgres and the messy PMS database; set secrets; run migrations; add the Render URL to the extension allowlist; verify the health path.
- **Acceptance check:** The public URL loads login and data; the clean DB and messy DB are reachable; the extension bridge works from the Render origin; no secret is in git.
- **Evidence:** Render dashboard + browser + `curl`.

### BP-12 — Make the cron use the core sync path

- **Areas:** 58, 18
- **Status:** Open
- **What:** Replace the `adapter-read` cron command with the same core sync path used by **Sync Now**; handle all active tenants; keep link writes idempotent; add run history/errors.
- **Acceptance check:** One cron run updates `sync_state` and visits once; a second run adds no duplicates; a failure is visible.
- **Evidence:** Render cron logs + SQL.

### BP-13 — Security hardening before public access

- **Areas:** 77, 63, 28, 43
- **Status:** Open
- **What:** Replace XOR with AES-GCM for stored connection URLs; add login/API rate limiting; add an Origin/CSRF check; decide MFA (enforce or label); document key rotation. No real guest PII in the demo.
- **Acceptance check:** Ciphertext is AES-GCM; a burst of bad logins returns 429/lockout; a foreign Origin is rejected; MFA is truthful; secrets rotate without code changes.
- **Evidence:** security tests + `curl`.

### BP-14 — Monitoring, alerting, and backup

- **Areas:** 19, 31
- **Status:** Open
- **What:** Wire error tracking (Sentry or equivalent); add a DB health probe; add a sync-error table/alert; confirm Render Postgres backup retention; restore a backup into a test DB.
- **Acceptance check:** A forced DB failure alerts; the health check shows 503; a restore completes and the app reads the restored data.
- **Evidence:** alert screenshot/log + restore notes.

### BP-15 — Legal pages and DSR procedure

- **Areas:** 20
- **Status:** Open
- **What:** Add privacy policy and terms pages; replace the `href="#"` links; document retention and the data-subject request flow; add a cookie notice if cookies require one.
- **Acceptance check:** Both pages exist and are linked from login; the DSR flow is written and works end to end.
- **Evidence:** pages + DSR runbook.

### BP-16 — Test the manager's phone and browser

- **Areas:** 09, 10
- **Status:** Open
- **What:** Test the app on a real phone (Safari and Chrome) and on the demo laptop. Confirm profiles are readable on the phone; state that form-fill needs the laptop.
- **Acceptance check:** No horizontal scroll on the demo screens; login, search, and profile work on the phone; the limitation is in the demo script.
- **Evidence:** device notes.

### BP-17 — Finalise extension distribution and updates

- **Areas:** 66, 70
- **Status:** Open
- **What:** Choose ZIP + Load unpacked or Chrome Web Store (unlisted). Document the update path (manual reload vs store auto-update) and version bump rule.
- **Acceptance check:** The manager installs/updates without the developer; the chosen path and review time are written down.
- **Evidence:** install note + version tag.

---

## P2 — after the demo

### BP-18 — Accessibility audit

- **Areas:** 11
- **What:** Choose a target (WCAG 2.1 AA or equivalent); run axe/keyboard/screen-reader checks; fix critical issues.
- **Check:** No critical axe violations on login, search, profile, registration; keyboard reaches every action.

### BP-19 — Performance and bundle budget

- **Areas:** 08, 30
- **What:** Set speed and bundle targets; measure search, directory, and profile; record LCP/INP; lazy-load heavy admin screens if needed.
- **Check:** Targets are written and met, or the gap is documented with a plan.

### BP-20 — Apply timezone and date-format settings

- **Areas:** 62, 26
- **What:** Use the tenant's timezone/date format consistently; keep storage in UTC; test a DST boundary.
- **Check:** Changing the setting changes the displayed dates; stored timestamps stay UTC.

### BP-21 — Resolve the `/admin` guard

- **Areas:** 06, 56
- **What:** Either add the `/admin` pages the middleware expects, or remove the dead guard and document that admin lives under `/workspace`. No dead route.
- **Check:** `/admin` either works or is gone; the middleware matcher matches reality.

### BP-22 — Write naming conventions

- **Areas:** 22
- **What:** A short guide for files, components, functions, DB tables/columns, tests, and env vars.
- **Check:** The guide exists; a sample review finds no unexplained exceptions.

### BP-23 — Handoff and support note

- **Areas:** 33
- **What:** Credentials handoff, deploy steps, extension install, support window, known limitations, maintenance owner.
- **Check:** A new maintainer can deploy and support from the note.

### BP-24 — Scalability plan

- **Areas:** 76
- **What:** Estimate launch traffic; review indexes/pooling; document when the Render starter breaks and the upgrade path.
- **Check:** The plan is written; a small load test does not error.

### BP-25 — Extension-in-browser E2E

- **Areas:** 17, 66
- **What:** Automate the installed-extension fill against the real local form (CDP or Playwright with the existing Chrome); keep it out of the critical demo path if flaky.
- **Check:** The test fills Full Name, email, and phone; failure is visible in CI.

### BP-26 — Email notification decision

- **Areas:** 48
- **What:** Either add a test-mode email provider or label the setting “not enforced in demo”.
- **Check:** The toggle is truthful; no silent no-op.

### BP-27 — Internationalisation decision

- **Areas:** 26
- **What:** Confirm English-only for v1 or add a translation layer. Keep the stored language setting honest.
- **Check:** The decision is written; the UI does not pretend to switch languages.

### BP-28 — Real PMS integration

- **Areas:** 80, 75
- **What:** Connect a real hotel PMS using the existing mapping interface; keep the read path read-only and the registration write separate.
- **Check:** A real source row maps, syncs, and appears in the clean DB; no schema change to the source.

### BP-29 — Final 80-area verification re-run

- **Areas:** all 80
- **What:** After P0/P1, run every check in `verification.md`; update `checklist.md` statuses and this task list.
- **Check:** All 80 rows have a pass/fail result; every Pending area has either moved to Decided or has a dated reason; `node developer-workspace/blueprint/check-blueprint.mjs` passes.
