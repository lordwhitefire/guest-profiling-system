# Build Tracker

**Last updated:** 2026-11-18 13:26 UTC
**Current phase:** LIVE on Render free tier
**Rule:** updated after every task.

## The demo is live

**https://gps-core.onrender.com**

| Check | Result |
|---|---|
| `GET /api/health` | `200` · `{"status":"ok","database":"ok"}` |
| Admin login | works |
| Grand Vista → Zainab Wang | **3** visits |
| Lakeside → Zainab Wang | **2** visits |
| `/profile/<guestId>` | `200`, renders visit history |
| Sync from Render | **1.9 s** (was ~5 min from the laptop) |

Admin: `admin@grandvista.test` / `Admin123!`
Receptionist: `receptionist@grandvista.test` / `Reception123!`

## Architecture now

- **Render free web service** `gps-core` (Frankfurt, 512 MB)
- **Neon** (Frankfurt, PG 18): `gps`, `pms`, `pms_lakeside`
- No Render database, no Render cron
- Manual **Sync Now** for the demo

## Free-tier behaviour to state out loud

- The service **sleeps after 15 minutes idle**; first visit takes ~50 s.
- 750 instance-hours/month.
- No backups, no uptime promise.
- Neon scale-to-zero after 5 min.

## Decisions made during the deploy

1. **Passwords were reset on Neon** with Render’s `ARGON2_PEPPER`. The local hashes came
   from the laptop’s pepper, so the copied users could not log in on Render.
2. **Build command forces dev dependencies**:
   `pnpm install --frozen-lockfile --prod=false && pnpm --filter @gps/core build`
   Render sets `NODE_ENV=production`, which made pnpm skip `typescript` and `next build` fail.
3. **Neon connections use the direct endpoint** with `options=-c%20search_path%3Dpublic`.
   The pooler silently drops `search_path`.
4. **Profile page falls back to `RENDER_EXTERNAL_URL`** so no dashboard variable is needed
   (`4955bce`, committed locally, not yet pushed).

## Commits

| Commit | State |
|---|---|
| `7db5f83` | pushed |
| `35bc96d` | pushed |
| `c01a6ff` | pushed |
| `310b5e4` | pushed |
| `5958064` | pushed — **this is what is deployed** |
| `4955bce` | local, **not pushed** |

## Remaining

1. **Push `4955bce`** so the `RENDER_EXTERNAL_URL` fallback goes live (optional but correct).
2. **Neon cron function** if you want automatic sync (optional; demo is manual).
3. **Extension `externally_connectable`** needs `https://gps-core.onrender.com/*` added for
   `chrome.runtime.sendMessage`; the content-script bridge already works.
4. **Custom domain** if you want one (optional).

## Neon project ids

| Purpose | Project id | Database |
|---|---|---|
| Clean DB | `cool-dream-05740578` | `gps` |
| Grand Vista PMS | `frosty-dream-43239778` | `pms` |
| Lakeside PMS | `super-dawn-79003967` | `pms_lakeside` |

DSNs: `~/.config/gps/neon.env` · Render secrets: `~/.config/gps/render.env` (chmod 600)