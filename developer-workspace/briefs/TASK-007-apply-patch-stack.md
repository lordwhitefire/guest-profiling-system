# TASK-007 — Apply the four-patch stack and fix its bugs

**Date:** 2026-11-11
**Asked by owner:** apply `0001`–`0004`, fix the bugs, commit as we go.

## Done looks like

1. All four patches applied in order, one commit each.
2. CI green: `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test:unit`, `pnpm build`, `pnpm test:e2e`.
3. Live guest search actually returns results (verified in a real browser), and uses `pg_trgm` at the DB level.
4. No screen silently shows hardcoded data without a visible notice, and the working forms write to the DB.
5. Extension bridge actually delivers a guest to the extension, or says plainly that it could not.
6. One final fix commit with an honest report.

## Non-goals

- No redesign of the 17 screens.
- No new product features beyond wiring what is already on screen.
