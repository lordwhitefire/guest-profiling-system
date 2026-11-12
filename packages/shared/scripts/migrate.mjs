// =============================================================================
// Migration runner — applies src/db/migrations/*.sql in filename order.
// =============================================================================
// Replaces node-pg-migrate, which was never installed and pointed at a
// migrations/ directory that does not exist. The schema is plain SQL, so this
// runner only has to do three things:
//   1. remember which files have been applied (a `_migrations` table)
//   2. apply each new file inside a transaction
//   3. report applied vs pending
//
// Usage:
//   DATABASE_URL=postgres://... node scripts/migrate.mjs up
//   DATABASE_URL=postgres://... node scripts/migrate.mjs status
//
// Rollback is deliberately not automated: dropping schema is destructive and
// should be an explicit, reviewed psql session.

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, "..", "src", "db", "migrations");

const command = process.argv[2] ?? "up";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Export it (e.g. `set -a && . ./.env`) and retry.");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });

function migrationFiles() {
  return readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));
}

async function appliedNames() {
  await sql`
    CREATE TABLE IF NOT EXISTS _migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  const rows = await sql`SELECT name FROM _migrations ORDER BY name`;
  return new Set(rows.map((r) => r.name));
}

const files = migrationFiles();
let applied;
try {
  applied = await appliedNames();
} catch (err) {
  console.error(
    "Could not reach the database:",
    err instanceof Error ? err.message : String(err),
  );
  await sql.end();
  process.exit(1);
}
const pending = files.filter((name) => !applied.has(name));

if (command === "status") {
  for (const name of files) {
    console.log(`${applied.has(name) ? "applied " : "pending "} ${name}`);
  }
  await sql.end();
  process.exit(0);
}

if (command !== "up") {
  console.error(`Unknown command "${command}". Use "up" or "status".`);
  await sql.end();
  process.exit(1);
}

if (pending.length === 0) {
  console.log(`No pending migrations (${files.length} applied).`);
  await sql.end();
  process.exit(0);
}

for (const name of pending) {
  const contents = readFileSync(join(migrationsDir, name), "utf8");
  console.log(`Applying ${name} ...`);
  try {
    await sql.begin(async (tx) => {
      await tx.unsafe(contents);
      await tx`INSERT INTO _migrations (name) VALUES (${name})`;
    });
    console.log(`Applied ${name}`);
  } catch (err) {
    console.error(`Failed ${name}:`, err instanceof Error ? err.message : err);
    await sql.end();
    process.exit(1);
  }
}

await sql.end();
console.log(`Done. ${pending.length} migration(s) applied.`);
