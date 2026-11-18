# Build Tracker

**Last updated:** 2026-11-18 13:00 UTC
**Current phase:** Neon data live and verified — deploy waiting on a push
**Rule:** updated after every task.

## Where I am right now

| Step | Status | Notes |
|---|---|---|
| Render CLI + skills | **Done** | v2.37.0, 22 skills, logged in |
| Render free Blueprint | **Validates clean** | `{"valid": true}`, no billing needed |
| Three Neon projects (Frankfurt, PG 18) | **Done** | gps / pms / pms_lakeside |
| Hotel DBs on Neon | **Done** | real local data: 212 and 210 rows |
| Clean DB on Neon | **Done** | migrations 001–006 + data |
| Adapter connections on Neon | **Done** | read + write per hotel |
| Sync into Neon | **Done** | GV 166 links, LS 164 links |
| App verified against Neon | **Done** | search, guest, visits, stats all correct |
| Render deploy | **Blocked on you** | needs `git push` |
| Neon cron function | **Optional** | demo uses manual Sync Now |

## Verified on Neon

| Hotel | Guest | Visits |
|---|---|---|
| Grand Vista | Zainab Wang (`31e19df0-…`) | **3** |
| Lakeside | Zainab Wang (`d9035c0c-…`) | **2** |

Both confirmed through `/api/guests/search`, `/api/guests/{id}` and
`/api/guests/{id}/visits`. (Lakeside is 2, not 1 — the Lakeside source DB gained a second
Zainab row on 2026-11-16.)

## What I found and fixed

1. **Two migrations were incomplete** — a fresh database could not be built:
   - `tenants.settings` updated by `003` but never created → `001` fixed + `005`
   - `data_requests` table never existed → `006`
2. **`connect_timeout` 5s → 30s** (Neon cold start measured 6.1s).
3. **Sync retries** up to 3× on network drops.
4. **Neon connection rule:** direct endpoint + `options=-c%20search_path%3Dpublic`.
   The pooler silently drops `search_path` and every query fails.

## Performance finding

Laptop → Frankfurt is **~600 ms per query**. A full sync is ~500 queries ≈ 5 minutes and
Neon resets long connections. **The sync belongs on Render**, where the same work takes
seconds. Do not judge sync speed from a local run.

## Commits (local, unpushed)

- `7db5f83` migrations + connect timeout + render.yaml
- `35bc96d` docs
- `c01a6ff` sync retry
- `310b5e4` tracker
- demo-script edits (uncommitted)

## What I need from you

**`git push`** — Render deploys from `main`.

Then I will:
1. Create the free web service from the Blueprint
2. Set `DATABASE_URL`, `SOURCE_PMS_URL`, `JWT_SECRET`, `ARGON2_PEPPER`, `FIELD_ENCRYPTION_KEY`
3. Deploy, then set `NEXT_PUBLIC_APP_URL`
4. Run the first sync from Render and verify the same counts

Secrets are prepared in `~/.config/gps/render.env` (chmod 600).

## Neon project ids

| Purpose | Project id | Database |
|---|---|---|
| Clean DB | `cool-dream-05740578` | `gps` |
| Grand Vista PMS | `frosty-dream-43239778` | `pms` |
| Lakeside PMS | `super-dawn-79003967` | `pms_lakeside` |

DSNs: `~/.config/gps/neon.env` (chmod 600, not in git).