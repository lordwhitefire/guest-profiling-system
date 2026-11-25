# Plan — finish the live demo

**Date:** 2026-11-25
**Status:** app is live at https://gps-core.onrender.com (free tier, Neon databases)

## Step 0 — update the tracker first

`developer-workspace/blueprint/TRACKER.md` is the single place you look to see where I am.
It gets updated **before** I start and **after** each step below.

## Step 1 — point the extension at the live site  (I can do)

The extension only accepts messages from `localhost:3000` and `*.guestprofiling.com`.
Add `https://gps-core.onrender.com/*` so the deployed workspace can hand a guest to the
extension.

- edit `packages/adapter-fill-extension/manifest.json`
- rebuild the ZIP
- update the install note

## Step 2 — rebuild and re-verify the extension ZIP  (I can do)

- `pnpm build:extension`
- rezip `gps-fill-extension-v0.1.0.zip`
- load it unpacked in the automation Chrome via `@browser-attach` only
- confirm Full Name / email / phone still fill

## Step 3 — push the two local commits  (only you can do)

```
98204a0 docs: app is live
4955bce RENDER_EXTERNAL_URL fallback
```

Render deploys from `main`. Until you push, the deployed code is `5958064`.

## Step 4 — optional: automatic sync on Neon  (I can do, but it is a rewrite)

Today sync is manual (**Sync Now**). A Neon Function with a cron trigger would do it every
5 minutes. This is a new HTTP handler, not a config change. Only worth doing if you want
automatic sync.

## Step 5 — final check

- `GET /api/health` → 200
- GV Zainab = 3, LS Zainab = 2
- extension fills the form
- tracker updated with the result

## Not in this plan

- Custom domain
- Paid Render / always-on
- Render backups
- Real hotel PMS