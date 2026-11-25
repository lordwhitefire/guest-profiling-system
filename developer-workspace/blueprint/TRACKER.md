# Build Tracker

**Last updated:** 2026-11-25 05:15 UTC
**Current phase:** making the registration panel the fill-adapter UI
**Rule:** updated before and after every task.

## Current task

**Plan:** `developer-workspace/plans/panel-as-fill-adapter.md`

| Step | Status |
|---|---|
| Write plan + tracker | **done** |
| Panel click hands guest to extension | **done** |
| Content script fills without the popup | **done** |
| Badge shows real extension status | **done** — Ready / Connected / Not detected |
| Verify with `@browser-attach` | **done locally** — panel check passed |
| Deploy + push | **done** — `739ddd5` is live |
| Re-verify on the live site | **blocked** — no Chrome on CDP `:9222` |

## Panel check result

| Check | Result |
|---|---|
| Badge before | `Ready` |
| Typing "Zainab Wang" | match appears (read path) |
| Click match | form filled: Zainab Wang / zwang@proton.me / 0746350685 |
| Badge after | `Connected` |
| Toast | `Extension connected` |

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
| 4. Automatic sync on Neon | **done** — Function + 5-minute trigger |
| 5. Final check | **done** |

## Automatic sync (live)

| Check | Result |
|---|---|
| Function | `gpssync` on branch `br-young-surf-bafbh037` |
| Trigger | `every-five-minutes` · `*/5 * * * *` · enabled |
| Manual invoke | `200` in 4.8 s · both tenants synced |
| Guard | wrong key → `403 {"ok":false,"error":"forbidden"}` |
| Idempotent | second run: `newLinks: 0` |
| **Scheduled run** | **04:10:03 / 04:10:04 UTC — SYNC audit rows for both tenants, no human involved** |

Source: `infra/neon-sync/` (build output gitignored).

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