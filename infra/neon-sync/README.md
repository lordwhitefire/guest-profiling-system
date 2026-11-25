# Automatic sync (Neon Function)

A Neon schedule trigger calls this function every 5 minutes. The function logs in to the
Render app and runs the existing sync endpoint for both hotels — no sync logic is duplicated.

## Files

- `index.ts` — the function source (plain `fetch`, no dependencies)
- `index.mjs` — build output, **gitignored**

## Build

```bash
pnpm --filter @gps/adapter-fill-extension exec esbuild \
  "$PWD/infra/neon-sync/index.ts" --bundle --format=esm --platform=node \
  --target=node24 --outfile="$PWD/infra/neon-sync/index.mjs"
```

## Deploy (Neon MCP or CLI)

- project `cool-dream-05740578`, branch `br-young-surf-bafbh037`
- slug `gpssync`
- runtime `nodejs24`
- env: `RENDER_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `TRIGGER_KEY`

## Trigger

- type `schedule`, cron `*/5 * * * *`
- path `/sync/<TRIGGER_KEY>` (the key travels as a path segment; Neon trigger paths
  cannot carry a query string)
- `TRIGGER_KEY` is a secret — keep it out of git

## Verify

```bash
curl -sS "https://br-young-surf-bafbh037-gpssync.compute.c-8.eu-central-1.aws.neon.tech/sync/<TRIGGER_KEY>"
```

Expected: `{"ok":true,"results":[...200...200...]}`.
Without the key: `403 {"ok":false,"error":"forbidden"}`.

## Limits

- Render free sleeps after 15 min idle → the first sync of a run may take ~50 s.
- Neon cron may drift slightly under load.
- Free tier: no backups, no uptime promise.