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
| 2. Rebuild + re-verify ZIP | **done** — loaded unpacked, fill verified live |
| 3. Push commits | **done** — `7406773` deployed |
| 4. Optional Neon cron sync | not started (optional) |
| 5. Final check | **done** |

## Live extension check (2026-11-25)

| Check | Result |
|---|---|
| Extension loaded | `ednclpjlmnijooahfdmmelhfjcooiolb` |
| Prepare Registration | **Guest prepared** (extension acknowledged) |
| Fill result | 7 fields · 2 high confidence · 1 needs review |
| Full Name | **Zainab Wang** |
| Email | **zwang@proton.me** |
| Phone | **0746350685** |

## Deploy of `7406773`

| Check | Result |
|---|---|
| Deploy status | **live** |
| `GET /api/health` | `200` · `{"status":"ok","database":"ok"}` in 0.63 s |
| GV Zainab visits | **3** |
| `/profile/<guestId>` | `200`, renders visit history (RENDER_EXTERNAL_URL fallback works) |

## Architecture

- **Render free web service** `gps-core` (Frankfurt, 512 MB)
- **Neon** (Frankfurt, PG 18): `gps`, `pms`, `pms_lakeside`
- No Render database, no Render cron
- Manual **Sync Now**

## Commits

| Commit | State |
|---|---|
| `5958064` | pushed — previous live version |
| `4955bce` | **pushed** |
| `98204a0` | **pushed** |
| `7406773` | **pushed — deploying now** |

## Neon project ids

| Purpose | Project id | Database |
|---|---|---|
| Clean DB | `cool-dream-05740578` | `gps` |
| Grand Vista PMS | `frosty-dream-43239778` | `pms` |
| Lakeside PMS | `super-dawn-79003967` | `pms_lakeside` |

DSNs: `~/.config/gps/neon.env` · Render secrets: `~/.config/gps/render.env` (chmod 600)