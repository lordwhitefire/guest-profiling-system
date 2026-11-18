# Build Tracker

**Last updated:** 2026-11-18 12:50 UTC
**Current phase:** Free-tier Neon migration — data loaded, deploy waiting on a push
**Rule:** updated after every task.

## Where I am right now

| Step | Status | Notes |
|---|---|---|
| Render CLI + skills | **Done** | v2.37.0, 22 skills, logged in as `victormakuo2002@gmail.com` |
| Render free Blueprint | **Validates clean** | `{"valid": true}`, no billing needed |
| Three Neon projects (Frankfurt, PG 18) | **Done** | gps / pms / pms_lakeside |
| Hotel schemas on Neon | **Done** | 207 rows each |
| Clean DB schema on Neon | **Done** | migrations 001–006 |
| Adapter connections on Neon | **Done** | read + write per hotel |
| First sync into Neon | **Done** | GV 161 links, LS ~161 |
| Render deploy | **Blocked on you** | needs `git push` |
| Neon cron function | **Not started** | optional; demo uses manual Sync Now |

## What I found and fixed

1. **Two migrations were incomplete** — a fresh database could not be built:
   - `tenants.settings` was updated by `003` but never created → `001` fixed + `005`
   - `data_requests` table never existed → `006`
2. **`connect_timeout` was 5s**; Neon cold start measured **6.1s**, so sync reported a false
   `CONNECT_TIMEOUT`. Now **30s**.
3. **Sync now retries** up to 3× on network drops (Neon reset a long connection mid-sync).
4. **Neon connection rule:** use the **direct** endpoint with
   `options=-c%20search_path%3Dpublic`. The pooler silently drops `search_path` and every
   query fails with "relation does not exist".

## Important performance finding

From this laptop to Frankfurt, each query is **~600 ms** (40 queries took 24 s, 0 failures).
A full sync is ~500 queries ≈ 5 minutes, and long connections get reset.

**The sync belongs on Render, not on the laptop.** From Render (Frankfurt) to Neon (Frankfurt)
the same sync should take seconds. Do not judge sync speed from a local run.

## Commits (local, unpushed)

- `7db5f83` migrations + connect timeout + render.yaml
- `35bc96d` docs
- `c01a6ff` sync retry

## What I need from you

**`git push`** — Render deploys from `main`. Until then the Blueprint I validated is not what
Render would deploy.

Then I will:
1. Create the free web service from the Blueprint
2. Set `DATABASE_URL`, `SOURCE_PMS_URL`, `JWT_SECRET`, `ARGON2_PEPPER`, `FIELD_ENCRYPTION_KEY`
3. First deploy, then set `NEXT_PUBLIC_APP_URL`
4. Run the first sync from Render and verify GV Zainab = 3, LS = 1

## Neon project ids

| Purpose | Project id | Database |
|---|---|---|
| Clean DB | `cool-dream-05740578` | `gps` |
| Grand Vista PMS | `frosty-dream-43239778` | `pms` |
| Lakeside PMS | `super-dawn-79003967` | `pms_lakeside` |

DSNs: `~/.config/gps/neon.env` (chmod 600, not in git).