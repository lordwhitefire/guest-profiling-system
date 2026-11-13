// Local TASK-009 fixture setup: create the two hotel adapter connections.
// Run from the repo root with DATABASE_URL and FIELD_ENCRYPTION_KEY set:
//   pnpm --filter @gps/adapter-read exec tsx scripts/seed-connections.ts
//
// The source databases are the two QloApps-shaped fixtures:
//   pms            -> Grand Vista Hotel
//   pms_lakeside   -> Lakeside Suites
//
// Each hotel has a read-only adapter connection and a separate write
// connection used only by the registration form.

import postgres from "postgres";
import { encryptField } from "../src/encryption.ts";

const key = process.env.FIELD_ENCRYPTION_KEY;
const databaseUrl = process.env.DATABASE_URL;
if (!key || key.length !== 64) {
  throw new Error("FIELD_ENCRYPTION_KEY must be a 32-byte hex string (64 chars).");
}
if (!databaseUrl) throw new Error("DATABASE_URL is required.");

const base = "postgres://postgres:choose-a-password@localhost:5432";

const fixtures = [
  {
    tenantId: "11111111-1111-1111-1111-111111111111",
    pmsType: "qloapps",
    readUrl: `${base}/pms?default_transaction_read_only=true`,
    writeUrl: `${base}/pms`,
  },
  {
    tenantId: "22222222-2222-2222-2222-222222222222",
    pmsType: "qloapps",
    readUrl: `${base}/pms_lakeside?default_transaction_read_only=true`,
    writeUrl: `${base}/pms_lakeside`,
  },
];

const db = postgres(databaseUrl, { max: 1 });

try {
  for (const fixture of fixtures) {
    for (const [isReadOnly, url] of [
      [true, fixture.readUrl],
      [false, fixture.writeUrl],
    ] as const) {
      const encrypted = encryptField(url, key);
      const existing = await db`
        SELECT connection_id
        FROM adapter_connections
        WHERE tenant_id = ${fixture.tenantId}
          AND pms_type = ${fixture.pmsType}
          AND is_read_only = ${isReadOnly}
          AND connection_url_encrypted = ${encrypted}
          AND deleted_at IS NULL
        LIMIT 1
      `;
      if (existing.length > 0) {
        console.log(`already present: ${fixture.tenantId} ${isReadOnly ? "read" : "write"}`);
        continue;
      }
      const inserted = await db`
        INSERT INTO adapter_connections
          (tenant_id, pms_type, connection_url_encrypted, is_read_only)
        VALUES
          (${fixture.tenantId}, ${fixture.pmsType}, ${encrypted}, ${isReadOnly})
        RETURNING connection_id
      `;
      console.log(`inserted: ${inserted[0].connection_id} ${fixture.tenantId} ${isReadOnly ? "read" : "write"}`);
    }
  }

  const rows = await db`
    SELECT tenant_id, pms_type, is_read_only, created_at
    FROM adapter_connections
    WHERE deleted_at IS NULL
    ORDER BY tenant_id, is_read_only DESC
  `;
  console.log(rows);
} finally {
  await db.end();
}
