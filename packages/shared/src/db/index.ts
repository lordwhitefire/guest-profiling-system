// =============================================================================
// @gps/shared/db — public exports
// =============================================================================

export * from "./client.js";
// Migration runner is invoked via node-pg-migrate CLI (see package.json scripts).
// No programmatic migration API is exposed in v1 — keeps the surface small.
