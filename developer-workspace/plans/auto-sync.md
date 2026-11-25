# Plan — automatic sync

**Date:** 2026-11-25
**Goal:** the clean profile database stays in sync without anyone clicking **Sync Now**.

## Approach

A **Neon Function** on the `gps` branch, triggered by a **cron schedule** every 5 minutes.
The function calls the already-working Render sync endpoint for both hotels. No sync logic is
duplicated — the app stays the single implementation.

```
Neon trigger (*/5 * * * *)
   → Neon Function `gpssync`
      → POST https://gps-core.onrender.com/api/auth/login
      → POST /api/auth/switch-tenant   (Lakeside)
      → POST /api/sync-status/now      (Grand Vista)
      → POST /api/sync-status/now      (Lakeside)
```

## Why this shape

- **No duplicate sync code** — the function is a thin caller.
- **No Render cron** — Render free has none.
- **No GitHub Actions dependency.**
- The function is idempotent: a second run links nothing new.

## Steps

1. Write `infra/neon-sync/index.ts` (plain `fetch`, no dependencies).
2. Deploy it to the `gps` Neon branch as slug `gpssync`.
3. Set env: `RENDER_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `TRIGGER_KEY`.
4. Create the schedule trigger `*/5 * * * *` with `?key=<TRIGGER_KEY>`.
5. Invoke the function URL once and verify both tenants sync.
6. Watch `next_run_at` and confirm the trigger is enabled.
7. Update the tracker.

## Guard

The function checks `?key=` against `TRIGGER_KEY`, so the public URL cannot be used by
someone who does not have the key.

## Limits to state

- Render free sleeps after 15 min idle → the first sync of a run may take ~50 s.
- Neon cron may drift a little under load.
- This is still the free tier: no backups, no uptime promise.