# Developer workspace — guest-profiling-system-builder-bundle

This folder is the Developer agent's home base: briefs, notes, plans, and honest reports.

## 2026-11-11 — Bundle setup + build fix

**Task**: Unpack the delivered bundle into this git-connected folder, get install/typecheck/tests/build green.

**Result**: All green.

- `pnpm install` — 573 packages (network to registry.npmjs.org was broken; installed via `https://registry.npmmirror.com` with store `/tmp/opencode/pnpm-store`).
- `pnpm typecheck` — PASS (shared, adapter-read, adapter-fill-extension, core).
- `pnpm test:unit` — 206 passed, 1 skipped (documented pg-mem parser limitation).
- `pnpm build` — PASS, 15 routes.

**Real bug found and fixed**

`.env.example` shipped `NODE_ENV=development`. Next 16 loads `.env` during build; that value
overrides the build's production mode and crashes prerendering of the auto-generated
`/_global-error` route with `TypeError: Cannot read properties of null (reading 'useContext')`.

- Fixed `.env.example` (removed the line, added a warning comment).
- Local `.env` created with generated secrets; `NODE_ENV` removed.

**Not verified**

- `pnpm test:e2e` — Playwright browsers not downloaded (network).
- `pnpm db:migrate` — no PostgreSQL instance running.
- Dev server run.

**Note**: React stays at 18.3.1 as pinned in the lockfile; the build passes with it once the
`NODE_ENV` trap is removed. React 19 was tested and does not fix the crash by itself.
