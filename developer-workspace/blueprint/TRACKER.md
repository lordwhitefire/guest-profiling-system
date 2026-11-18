# Build Tracker

**Last updated:** 2026-11-18 12:35 UTC
**Current phase:** Free-tier migration to Neon — app not yet deployed
**Rule:** updated after every task.

## Where I am right now

| Step | Status | Notes |
|---|---|---|
| Render CLI installed | **Done** | v2.37.0, `~/.local/bin/render` |
| Render skills installed | **Done** | 22 skills in `~/.agents/skills/` |
| Render login | **Done** | `victormakuo2002@gmail.com`, workspace `My Workspace` |
| Render free Blueprint | **Validates clean** | `{"valid": true}`, no billing needed |
| Three Neon projects | **Done** | Frankfurt, PG 18 |
| Hotel schemas on Neon | **Done** | `ps_customer` = 207 rows each |
| Clean DB schema on Neon | **Done** | migrations 001–006 |
| Adapter connections on Neon | **Done** | read + write for both hotels |
| Data sync to Neon | **In progress** | GV done, LS running |
| Render deploy | **Not started** | needs env vars + first deploy |

## Neon project ids

| Purpose | Project id | Database |
|---|---|---|
| Clean DB | `cool-dream-05740578` | `gps` |
| Grand Vista PMS | `frosty-dream-43239778` | `pms` |
| Lakeside PMS | `super-dawn-79003967` | `pms_lakeside` |

DSNs: `~/.config/gps/neon.env` (chmod 600, not in git).

## Fixed along the way

- `tenants.settings` was never created by a migration → `001` fixed + `005`
- `data_requests` table was never created by a migration → `006`
- source `connect_timeout` 5s → 30s (Neon cold start is 6.1s)

Commits: `7db5f83` (code), `35bc96d` (docs).

## Next

1. Wait for the Lakeside sync to finish; verify GV = 3 visits, LS = 1.
3. Set the Render env vars and deploy the free web service.
4. Add the Neon cron function (or keep manual Sync Now).
5. Update the demo script for cold starts.

## Known free-tier limits

- Render web service sleeps after 15 min idle → ~50s first visit
- 750 instance-hours/month
- No Render database, no Render cron, no backups
- Neon scale-to-zero after 5 min