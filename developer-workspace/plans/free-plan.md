# The Free Plan

**Date:** 2026-11-18
**Goal:** run the demo without paying for hosting.

## The short version

- **Neon** holds the three databases (all free).
- **Render** runs the website (free).
- **A timer on Neon** runs the sync job instead of Render's cron.
- **You** click **Sync Now** in the demo anyway.

## Why

| Problem | Fix |
|---|---|
| Render's free database dies after 30 days | Put all databases on Neon |
| Render free has no cron jobs | Put the timer on Neon |
| Render free website falls asleep | Say so in the demo; first click wakes it |

## The three databases on Neon

1. `gps` — our clean database
2. `pms` — Grand Vista hotel
3. `pms_lakeside` — Lakeside hotel

Each gets its own Neon project. Free gives you 100 projects, 1 GB each.

Two logins per hotel database:
- **read** login — the app may only look
- **write** login — registration may only add one row

## The website on Render

- One free web service.
- It sleeps after 15 minutes with no visitors.
- First visit takes about 50 seconds to wake up.
- That is normal on the free plan.

## The sync timer

Right now the sync runs in two ways:
- **Sync Now** button — you click it
- a background worker — runs on a timer

The background worker becomes a small **Neon Function**. Neon wakes it on a timer, it syncs, it stops.

This is a rewrite of the worker, not a setting. Roughly:
- one new file that answers an HTTP request
- one timer line: every 5 minutes
- the sync code stays the same

## What you will see in the demo

1. Open the site. If it is asleep, wait ~50 seconds.
2. Search a guest. See their visits.
3. Register a guest.
4. Click **Sync Now**.
5. See the visit appear.

## What is not included (free plan)

- No backups you control
- No cron on Render
- No always-on database
- No uptime promise

That is fine for a demo. It is not fine for a real hotel desk.

## Order of work

1. Create three Neon projects.
2. Load the two hotel databases.
3. Point Render at Neon.
4. Move the sync worker into a Neon Function.
5. Test the whole flow.
6. Update the demo script.

---

# What was actually done (2026-11-18)

## Neon projects created (Frankfurt, PG 18)

| Purpose | Project id | Database | Owner role |
|---|---|---|---|
| Clean DB | `cool-dream-05740578` | `gps` | `gps_owner` |
| Grand Vista PMS | `frosty-dream-43239778` | `pms` | `pms_owner` |
| Lakeside PMS | `super-dawn-79003967` | `pms_lakeside` | `pms_lakeside_owner` |

Connection strings live in `~/.config/gps/neon.env` (chmod 600, outside git).

## Two things I had to fix to make a fresh database work

These were real bugs, invisible locally because the dev DB had been patched by hand:

1. **`tenants.settings` was never created by any migration.** `001` now declares it, and
   `005_add_tenants_settings.sql` adds it for older databases.
2. **`data_requests` table was never created by any migration.** `006_add_data_requests.sql`
   adds it. Without it, `/api/data-requests` fails on a fresh install.

## One runtime fix

- `connect_timeout` for the source PMS was **5s**. Neon cold start measured **6.1s**, so sync
  reported a false `CONNECT_TIMEOUT`. Raised to **30s**.

## Neon connection rules learned

- Use the **direct** endpoint (`ep-…`), not `-pooler`, and pass
  `options=-c%20search_path%3Dpublic`. The pooler silently drops `search_path`, and every
  query then fails with "relation does not exist".
- `default_transaction_read_only=true` is appended for the read connection.

## Render Blueprint

`render.yaml` is now the free shape and **validates clean**:

```json
{ "valid": true, "plan": { "services": ["gps-core"], "totalActions": 1 } }
```

- one free web service in Frankfurt
- no Render database
- no Render cron
- `NEXT_PUBLIC_APP_URL` and secrets are set in the dashboard after the first deploy