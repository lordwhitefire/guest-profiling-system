# Plan — the panel is the fill adapter

**Date:** 2026-11-25
**Owner's call:** keep the panel. It reads while you type and fills when you click. That panel **is** the adapter UI. The extension popup is not wanted.

## What changes

**Behaviour only — the panel layout stays exactly as it is.**

1. **Typing** — unchanged. The panel keeps reading the clean database.
2. **Clicking a match** — fills the form **and** hands that guest to the extension in the same click.
3. **The extension fills the page** — the content script fills the active page as soon as it receives the guest, so no popup click is needed.
4. **The green badge becomes real** — same position, same style, but it shows `Connected` or `Extension not detected` instead of a hardcoded `Active`.
5. **If the extension is missing** — the form still fills locally and the panel says so. No silent failure.

## What does not change

- Panel layout, colours, copy, or position.
- The extension popup stays in the build as a fallback. It is not removed.
- The read adapter, the clean database, and the sync path.

## Files

- `packages/core/components/workspace/workspace-app.tsx` — match click calls the bridge; badge shows status.
- `packages/adapter-fill-extension/src/content/content.ts` — fill on `GPS_STORE_GUEST`.
- `packages/core/lib/extension-bridge.ts` — may need a status probe.

## Verify

1. `pnpm typecheck`, `pnpm lint`, `pnpm test:unit`, `pnpm build`.
2. `@browser-attach` against the live site:
   - type a name → matches appear (read path)
   - click a match → form fills and extension acknowledges
   - badge shows `Connected`
3. Rebuild the extension ZIP.

## Rollback

One commit; revert it to return to the popup-driven flow.