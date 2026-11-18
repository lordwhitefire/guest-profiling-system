# Plan — Install Render CLI + Render agent skills

**Date:** 2026-11-18
**Owner instruction:** "write it down and start"
**Scope:** Phase A only (install + verify). Phase B (deploy) waits for owner credentials and the source-DB decision.

## Phase A — I do this now

1. Install the Render CLI on Linux x64 via the official installer.
   - Expected binary: `~/.local/bin/render`
   - Fallback: direct download from `github.com/render-oss/cli/releases`
2. Verify: `render --version` (need 2.35+), `render --help | grep skills`.
3. Preview: `render skills install --tool opencode --scope user --dry-run`.
4. Install: `render skills install --tool opencode --scope user`.
5. Verify: `render skills list`.
6. Record the installed skill names and target directory.

## Phase A — RESULT (2026-11-18)

- ✅ CLI installed: **`render v2.37.0`** at `~/.local/bin/render` (already on PATH).
- ✅ Dry run: `Would install 22 skill(s) to 1 tool(s)`.
- ✅ Installed: `Installed 22 skill(s) to 1 tool(s)`.
- ✅ Skills landed in **`~/.agents/skills/`** (user scope, shared agent skills dir):
  `render-background-workers`, `render-blueprints`, `render-cli`, `render-cron-jobs`,
  `render-debug`, `render-deploy`, `render-disks`, `render-docker`, `render-domains`,
  `render-env-vars`, `render-keyvalue`, `render-mcp`, `render-migrate-from-heroku`,
  `render-monitor`, `render-networking`, `render-postgres`, `render-private-services`,
  `render-sandboxes`, `render-scaling`, `render-static-sites`, `render-web-services`,
  `render-workflows`.
- ✅ Recorded in `~/.render/skills.yaml` (scope: user).
- ✅ `SKILL.md` frontmatter valid; OpenCode now lists all 22.
- ⚠️ `render skills list` **panics** (nil pointer in `pkg/tui/stack.go:105`) — a CLI bug
  in v2.37.0. Install/remove/update work; only `list` is affected. Verified installs
  by reading `~/.agents/skills/` and `~/.render/skills.yaml` instead.

## Phase B — blocked, needs owner

7. `render login` — owner clicks "Authorize CLI", or owner supplies `RENDER_API_KEY`.
8. `render blueprints validate` on `render.yaml`.
9. First deploy / service create.

## Known blockers to a real Render deploy

- `SOURCE_PMS_URL` and the Lakeside source are **local Postgres**; Render cannot reach them.
- `render.yaml` cron runs `adapter-read` (incremental, needs seeded `sync_state`), not the core sync used by **Sync Now** (BP-12).
- Extension `externally_connectable` needs the Render URL added.

## Rollback

- CLI: remove `~/.local/bin/render`.
- Skills: `render skills remove --all` or delete `~/.config/opencode/skills/render-*`.