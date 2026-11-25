# Build Tracker

**Last updated:** 2026-11-25 03:45 UTC
**Current phase:** live on Render free tier — finishing the extension hand-off
**Rule:** updated before and after every task.

## The demo is live

**https://gps-core.onrender.com**

| Check | Result |
|---|---|
| `GET /api/health` | `200` · `{"status":"ok","database":"ok"}` |
| Cold start after a week idle | **54 s** (free tier sleeps after 15 min) |
| Admin login | works |
| Grand Vista → Zainab Wang | **3** visits |
| Lakeside → Zainab Wang | **2** visits |
| Sync from Render | **1.9 s** |

Admin: `admin@grandvista.test` / `Admin123!`
Receptionist: `receptionist@grandvista.test` / `Reception123!`

## Plan being executed now

`developer-workspace/plans/next-steps.md`

| Step | Status |
|---|---|
| 0. Update this tracker | **done** |
| 1. Extension allow Render URL | **done** — manifest + rebuilt ZIP |
| 2. Rebuild + re-verify ZIP | **blocked** — no Chrome on CDP `:9222` |
| 3. Push two commits | **waiting on you** |
| 4. Optional Neon cron sync | not started (optional) |
| 5. Final check | not started |

## Architecture

- **Render free web service** `gps-core` (Frankfurt, 512 MB)
- **Neon** (Frankfurt, PG 18): `gps`, `pms`, `pms_lakeside`
- No Render database, no Render cron
- Manual **Sync Now**

## Commits

| Commit | State |
|---|---|
| `5958064` | pushed — **deployed** |
| `4955bce` | local, not pushed (RENDER_EXTERNAL_URL fallback) |
| `98204a0` | local, not pushed (tracker) |

## Neon project ids

| Purpose | Project id | Database |
|---|---|---|
| Clean DB | `cool-dream-05740578` | `gps` |
| Grand Vista PMS | `frosty-dream-43239778` | `pms` |
| Lakeside PMS | `super-dawn-79003967` | `pms_lakeside` |

DSNs: `~/.config/gps/neon.env` · Render secrets: `~/.config/gps/render.env` (chmod 600)