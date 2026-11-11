#!/usr/bin/env node
// =============================================================================
// seed-from-source.ts — CLI entry point for the first-load bulk import.
// =============================================================================
// Usage:
//   pnpm --filter @gps/adapter-read seed:source -- --tenant=<uuid>
//
// Reads env vars:
//   - DATABASE_URL              — our profiling DB (target)
//   - SOURCE_PMS_URL            — the source PMS DB (read-only)
//   - FIELD_ENCRYPTION_KEY      — required only if --from-adapter-connection
//                                 flag is used (decrypts URL from DB)
//
// The script does NOT use the adapter_connections table by default — it reads
// SOURCE_PMS_URL from the env directly, because for a demo fixture there's no
// value in encrypting the URL. For real-hotel deployments, the worker's
// existing config.ts path handles decryption; this seed script is the
// short-circuit for first-load.
//
// Card 1 contract is still honored: the script appends
// `default_transaction_read_only=true` to the source URL to refuse any
// accidental write.

import postgres from "postgres";
import { bulkImport } from "./bulk-import.js";

interface CliArgs {
  tenant: string | null;
  help: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { tenant: null, help: false };
  for (const arg of argv.slice(2)) {
    if (arg.startsWith("--tenant=")) {
      args.tenant = arg.slice("--tenant=".length);
    } else if (arg === "--help" || arg === "-h") {
      args.help = true;
    }
  }
  return args;
}

function usage(): string {
  return `Usage: pnpm --filter @gps/adapter-read seed:source -- --tenant=<uuid>

Required:
  --tenant=<uuid>   The tenant ID to seed guests for.

Environment:
  DATABASE_URL        Our profiling DB URL (postgres://...)
  SOURCE_PMS_URL      Source PMS DB URL (read-only). Will be enforced
                      read-only via default_transaction_read_only=true.

This script does the first-load bulk copy that the worker's incremental
sync cannot do yet. After it runs, sync_state.last_seen_xmin is set, and
the worker can take over for subsequent incremental syncs.
`;
}

function ensureReadOnlyFlag(url: string): string {
  if (url.includes("default_transaction_read_only=true")) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}default_transaction_read_only=true`;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(usage());
    process.exit(0);
  }
  if (!args.tenant) {
    console.error("[ERROR] --tenant=<uuid> is required.");
    console.error(usage());
    process.exit(1);
  }

  const targetUrl = process.env.DATABASE_URL;
  if (!targetUrl) {
    console.error("[ERROR] DATABASE_URL env var is required.");
    process.exit(1);
  }
  const sourceUrlRaw = process.env.SOURCE_PMS_URL;
  if (!sourceUrlRaw) {
    console.error("[ERROR] SOURCE_PMS_URL env var is required.");
    process.exit(1);
  }
  const sourceUrl = ensureReadOnlyFlag(sourceUrlRaw);

  console.info(`[INFO] Seeding source PMS → profiling DB for tenant ${args.tenant}`);
  console.info(`[INFO] Source: ${sourceUrl.replace(/:[^:@]+@/, ":***@")}`);
  console.info(`[INFO] Target: ${targetUrl.replace(/:[^:@]+@/, ":***@")}`);

  const source = postgres(sourceUrl, { max: 5 });
  const target = postgres(targetUrl, { max: 5 });

  try {
    const result = await bulkImport(source, target, {
      tenantId: args.tenant,
      onProgress: (done, total) => {
        if (done % 50 === 0 || done === total) {
          console.info(`[INFO] Progress: ${done}/${total} rows`);
        }
      },
    });
    console.info(`[INFO] Done in ${result.durationMs}ms`);
    console.info(`[INFO]   Rows read:     ${result.rowsRead}`);
    console.info(`[INFO]   Rows inserted: ${result.rowsInserted}`);
    console.info(`[INFO]   Rows skipped:  ${result.rowsSkipped}`);
    console.info(`[INFO]   Table:         ${result.tableName}`);
    console.info(`[INFO]   Final xmin:    ${result.finalXmin}`);
    console.info(`[INFO] sync_state cursor set — worker's next run will only pick up new changes.`);
  } catch (err) {
    console.error(`[ERROR] ${(err as Error).message}`);
    console.error((err as Error).stack);
    process.exit(1);
  } finally {
    await source.end();
    await target.end();
  }
}

main().catch((err) => {
  console.error(`[FATAL] ${err?.stack ?? err}`);
  process.exit(1);
});
