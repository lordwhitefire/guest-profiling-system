# TASK-009 — patch build-out plan

**Goal:** take the useful parts of `TASK-009-incremental-2026-11-13.patch` and make them build and
run correctly against two real hotel source databases. Do not apply the patch's corrupt
click-pass data or its overclaiming status report.

## Rules for this pass

- Work from the current repo at `4a58795`; the external patch is a draft, not an authority.
- Never remove a button or screen.
- Keep the adapter connection read-only; registration gets its own write connection.
- The hotel source DB has no visit table and no visit count. One registration = one raw row.
- Verify with `next build` and the production server, not dev.
- Commits stay local.

## Steps

1. **Audit merge, first.** Apply/replace `merge-retries.mjs` with a control-id + occurrence key,
   remove the `/tmp/gps-check` hardcode, merge the 7 retry files, and reconcile 7 unmatched
   rows. Recheck the total is 251.

2. **Apply only the safe patch files.** Exclude `clickpass.json`, the 2026-11-13 status report,
   and the corrupt merge audit. Keep migration, API routes, profile-page change, workspace UI
   change, manifest, and the retry script (rewritten).

3. **Restore the build.** Add core dependencies and use the existing
   `encryptField`/`decryptField` helpers with `FIELD_ENCRYPTION_KEY`. Add a small core
   connection-crypto helper rather than importing non-existent functions.

4. **Fix migration 002.** Seed memberships from real `users` rows (admin gets both hotels;
   receptionist stays home), remove the empty seed connection, make the trigger idempotent.

5. **Fix connection selection.** Always select the newest active read-only connection. Make
   `Test Connection` use the same selection and return an honest result.

6. **Use the real source shape.** Grand Vista's source is QloApps `ps_customer` (confirmed: 207
   rows, `firstname`, `lastname`, `email`, `phone`, `birthday`, `date_add`, `date_upd`,
   `deleted`). Use `ps_customer` for registration writes and sync reads. Seed a second messy
   source DB with the same shape; do not build the product around `guests_raw`.

7. **Fix sync ordering.** Check `guest_profile_links` before creating a profile. Contactless
   rows must remain new raw rows without duplicate clean profiles. Derive visit count and last
   stay in the clean DB only.

8. **Wire the controls already in the patch:** hotel badge/name refresh after switch, Save
   Defaults with real payload, check-in and check-out on registration, double-submit guards,
   Test Connection, Sync Now, exports.

9. **Verify:** `next build`; production server; two-hotel registration → sync → profile loop;
   click the affected controls; update the audit and report honestly.

## Status — 2026-11-13

All nine steps are implemented and verified on the production build.

- Two hotels, two source DBs (`pms`, `pms_lakeside`), real memberships, active-tenant switch.
- Registration writes one raw row to the active hotel; adapter stays read-only.
- Live search, sync, derived visits and all visible controls wired.
- Full click pass: 159 PASS, 0 DEAD, 0 FAKE, 36 NOT RUN, 24 NATIVE (219 unique rows); one targeted re-run covers the visit-history select (PASS), giving effective 160 PASS, 35 NOT RUN.
- Two-hotel E2E: Grand Vista row 1010, Lakeside row 1009; each syncs to one clean profile with one link; loop guest still has 2 visits.
- Remaining: owner must load the extension for the real form-fill test; room/check-in/check-out cannot be persisted without a forbidden source-schema change.
- CI: fixed the failing adapter-read seeding tests; E2E now builds and runs the production server with dummy build-time env (including `ARGON2_PEPPER`). Local lint, typecheck, unit and Playwright smoke all pass.

See `reports/TASK-009-status-2026-11-13.md`.

## Excluded from this pass

- Applying the patch's `clickpass.json` (corrupt merge key).
- Applying the patch's 2026-11-13 status report (overclaims).
- Removing any button or control.
