// =============================================================================
// Adapter-read worker — main entry point
// =============================================================================
// Runs the SSLR-pattern sync per Card 1's contract.
//
// Usage:
//   pnpm --filter @gps/adapter-read start -- --tenant=<uuid>
//   pnpm --filter @gps/adapter-read start -- --tenant=<uuid> --continuous
//
// Per Card 1 §3.3 (Job.Run):
//   1. Connect (source + target)
//   2. Validate tables (schema validation)
//   3. Update tables (xmin cursor walk + chunked upsert)
//   4. Sync deletions (divide-and-conquer on PK ranges)
//   5. Done — log summary
//
// The worker is one-tenant-per-process. Multi-tenant deployments run separate
// worker processes per tenant (documented constraint per Card 1 §3.7).

import postgres from "postgres";
import { loadConfig, type AdapterConfig } from "./config.js";
import { getMapping } from "./mappings/index.js";
import { SyncStateStore } from "./sync-state.js";
import { Throttle } from "./throttle.js";
import { UpdateSync, type UpdateSyncResult } from "./update-sync.js";
import { DeleteSync, type DeleteSyncResult } from "./delete-sync.js";
import { SchemaValidator, type ValidationResult } from "./schema-validation.js";

interface CliArgs {
  tenant: string | null;
  continuous: boolean;
  throttle?: number;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { tenant: null, continuous: false };
  for (const arg of argv.slice(2)) {
    if (arg.startsWith("--tenant=")) {
      args.tenant = arg.slice("--tenant=".length);
    } else if (arg === "--continuous" || arg === "-c") {
      args.continuous = true;
    } else if (arg.startsWith("--throttle=")) {
      const n = Number(arg.slice("--throttle=".length));
      if (!isNaN(n) && n > 0 && n <= 100) {
        args.throttle = n;
      }
    } else if (arg === "--help" || arg === "-h") {
      console.log(`Usage: pnpm --filter @gps/adapter-read start -- --tenant=<uuid> [--continuous] [--throttle=<0-100>]

Options:
  --tenant=<uuid>   (required) The tenant ID to sync.
  --continuous, -c  Run in a loop with SYNC_INTERVAL_SECONDS between passes.
  --throttle=<0-100>  Override the throttle percentage for this run.
  --help, -h         Show this help message.
`);
      process.exit(0);
    }
  }
  return args;
}

async function runOnce(tenantId: string, throttleOverride?: number): Promise<void> {
  const config = await loadConfig(tenantId);
  const effectiveThrottle = throttleOverride ?? config.throttlePercent;

  console.info(`[INFO] Starting sync for tenant ${tenantId} with throttle at ${(effectiveThrottle / 100).toFixed(2)}%`);
  console.info(`[INFO] PMS type: ${config.pmsType}`);
  console.info(`[INFO] Connecting to source PMS (read-only)`);

  const source = postgres(config.sourceUrl, { max: 5 });
  const target = postgres(config.targetUrl, { max: 5 });

  try {
    const mapping = getMapping(config.pmsType);
    console.info(`[INFO] Loaded mapping for ${config.pmsType} (table: ${mapping.schema.tableName})`);

    // Validate source schema (Card 1 §3.3).
    console.info(`[INFO] Validating tables`);
    const validator = new SchemaValidator(source, mapping.schema);
    const validationResult: ValidationResult = await validator.validate(config.resyncOnSchemaChange);
    if (!validationResult.valid) {
      if (validationResult.resync) {
        console.warn(`[WARN] Schema mismatch: ${validationResult.reason}. resyncOnSchemaChange=true — full re-sync will follow.`);
        // TODO: implement full re-sync (drop + recreate target table, mark for fullCopy).
        // v1 aborts with a clear message — full re-sync is a follow-up task.
        throw new Error(
          `Schema mismatch detected and resyncOnSchemaChange=true, but full re-sync ` +
          `is not yet implemented in v1. Aborting. Reason: ${validationResult.reason}`
        );
      } else {
        throw new Error(
          `Schema mismatch detected. Reason: ${validationResult.reason}. ` +
          `Set resyncOnSchemaChange=true on the adapter_connection to allow full re-sync.`
        );
      }
    }

    // Sync state.
    const stateStore = new SyncStateStore(target, tenantId);
    const state = await stateStore.get(mapping.schema.tableName);

    // Update sync (Card 1 §3.4).
    const updateThrottle = new Throttle({ name: "updates", targetLevel: effectiveThrottle / 100 });
    const updateSync = new UpdateSync(
      source, target, mapping, tenantId, config.updateChunkSize, updateThrottle,
    );

    console.info(`[INFO] Fetching update range for table ${mapping.schema.tableName}`);
    const updateRange = await updateSync.getUpdateRange(state.lastSeenXmin, mapping.schema.whereClause);

    let updateResult: UpdateSyncResult | null = null;
    if (updateRange.fullTable) {
      console.info(`[INFO] Performing full table sync for ${mapping.schema.tableName}`);
      // TODO: implement copyFullTable (Card 1 §3.3). v1 throws — full sync is
      // a follow-up task. The owner must run a one-time seeding script first.
      throw new Error(
        `Full table sync not yet implemented. Run the seeding script first ` +
        `(docs/runbook/new-tenant.md) to populate sync_state.last_seen_xmin.`
      );
    } else if (updateRange.startXmin <= updateRange.endXmin) {
      console.info(`[INFO] Updating table ${mapping.schema.tableName} (xmin ${updateRange.startXmin} → ${updateRange.endXmin})`);
      updateResult = await updateSync.sync(
        updateRange.startXmin,
        updateRange.endXmin,
        mapping.schema.whereClause,
      );

      // Persist the new xmin cursor.
      await stateStore.setXmin(mapping.schema.tableName, updateResult.endXmin);
      console.info(`[INFO] Updated ${updateResult.rowsUpdated} row(s); cursor at xmin ${updateResult.endXmin}`);
    } else {
      console.info(`[INFO] No updates to sync (cursor already at max xmin)`);
    }

    // Delete sync (Card 1 §3.5).
    console.info(`[INFO] Syncing deletions for table ${mapping.schema.tableName}`);
    const deleteThrottle = new Throttle({ name: "deletes", targetLevel: effectiveThrottle / 100 });
    const deleteSync = new DeleteSync(
      source, target, mapping, tenantId,
      config.deleteChunkSize, config.minDeleteChunkSize, deleteThrottle,
    );
    const deleteResult: DeleteSyncResult = await deleteSync.sync();
    console.info(`[INFO] Deletions: ${deleteResult.rangesResynced} range(s) re-synced, ${deleteResult.rowsResynced} row(s) updated`);

    console.info(`[INFO] Done: ${updateResult?.rowsUpdated ?? 0} row(s) updated in update sync; ${deleteResult.rowsResynced} in delete sync`);
  } finally {
    await source.end();
    await target.end();
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  if (!args.tenant) {
    console.error("[ERROR] --tenant=<uuid> is required.");
    console.error("Run with --help for usage.");
    process.exit(1);
  }

  if (args.continuous) {
    const intervalMs = Number(process.env.SYNC_INTERVAL_SECONDS ?? 300) * 1000;
    console.info(`[INFO] Continuous mode: running every ${intervalMs / 1000}s`);
    while (true) {
      const start = Date.now();
      try {
        await runOnce(args.tenant, args.throttle);
      } catch (err) {
        console.error(`[ERROR] Sync pass failed: ${(err as Error).message}`);
      }
      const elapsed = Date.now() - start;
      const waitMs = Math.max(0, intervalMs - elapsed);
      if (waitMs > 0) {
        await new Promise((r) => setTimeout(r, waitMs));
      }
    }
  } else {
    try {
      await runOnce(args.tenant, args.throttle);
    } catch (err) {
      console.error(`[ERROR] ${(err as Error).message}`);
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error(`[FATAL] ${err?.stack ?? err}`);
  process.exit(1);
});

export { runOnce, parseArgs, type CliArgs };
