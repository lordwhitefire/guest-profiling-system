# TASK-002 Brief — Adapter-read

**What was asked:** Build the SSLR-pattern sync worker (Card 1 contract) — stateful, throttled, background, eventually-consistent, batched sync from QloApps PMS shape into our DB.

**Done looks like:** `pnpm typecheck` PASS, 56 new unit tests pass in adapter-read (QloApps mapping, throttle, encryption, registry), worker CLI runnable with `--tenant=<uuid>`.
