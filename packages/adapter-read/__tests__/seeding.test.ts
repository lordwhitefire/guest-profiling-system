// =============================================================================
// Seeding tests (mock-based)
// =============================================================================
// Verifies the bulkImport() function's SQL behavior with a hand-written mock
// of the postgres.js interface. We don't use pg-mem because its
// createPostgresJsTag adapter doesn't work with the ESM-only `postgres` package.
//
// What we test:
//   1. bulkImport issues SELECT count(*) and SELECT <columns> on the source
//   2. For each source row, it issues DELETE then INSERT on the target
//      with the correct (tenant_id, source_ref) match
//   3. It sets sync_state.last_seen_xmin to the source's max(xmin)
//   4. It honors the QloApps allow-list (forbidden columns never read)
//   5. Edge cases from the messy-guests.csv fixture are mapped correctly
//      when fed into bulkImport (verified via the captured INSERT params)
//
// What we DON'T test (because we'd need a real Postgres):
//   - Actual row insertion (the mock just records SQL + params)
//   - JSONB serialization (postgres.js handles this)
//   - Trigger firing (updated_at trigger, etc.)
//
// For a full end-to-end test, see docs/runbook/demo-end-to-end.md —
// the runbook walks through running the real script against a real
// Postgres with the fixture data.

import { describe, it, expect } from "vitest";
import { bulkImport } from "../src/seeding/bulk-import.js";
import { qloappsMapping, ALLOWED_COLUMNS } from "../src/mappings/qloapps.js";

// ── Mock postgres.js interface ──────────────────────────────────────────────

interface CapturedStatement {
  sql: string;
  params: unknown[];
}

interface MockDbConfig {
  // A function that returns rows for a given SQL statement.
  // Default: returns [].
  queryHandler?: (sql: string) => unknown[];
}

/**
 * Create a mock that mimics postgres.js's sql tag.
 * - Template literals: `mock\`SELECT ${x}\`` → records + returns rows
 * - .unsafe(string, params?) → records + returns rows
 * - .end() → no-op
 *
 * The mock records every statement issued, so tests can assert on SQL text
 * and parameter values.
 */
function makeMockDb(config: MockDbConfig = {}): {
  db: any;
  statements: CapturedStatement[];
} {
  const statements: CapturedStatement[] = [];
  const handler = config.queryHandler ?? (() => []);

  const sql: any = (strings: TemplateStringsArray | string, ...values: unknown[]) => {
    let sqlText: string;
    if (typeof strings === "string") {
      sqlText = strings;
    } else {
      sqlText = strings.join("?");
    }
    statements.push({ sql: sqlText, params: values });
    return Promise.resolve(handler(sqlText));
  };

  sql.unsafe = (sqlText: string, params: unknown[] = []) => {
    statements.push({ sql: sqlText, params });
    return Promise.resolve(handler(sqlText));
  };

  sql.end = async () => { /* no-op */ };

  return { db: sql, statements };
}

/**
 * Build a query handler that pattern-matches SQL against regexes.
 * Tries patterns in order; first match wins. Use specific, non-overlapping
 * patterns to avoid ambiguity.
 */
function matchQuery(
  cases: Array<{ match: RegExp; rows: unknown[] }>,
): (sql: string) => unknown[] {
  return (sql: string) => {
    for (const c of cases) {
      if (c.match.test(sql)) return c.rows;
    }
    return [];
  };
}

// ── Helpers to build QloApps source rows ────────────────────────────────────

interface QloAppsRow {
  id_customer: number;
  firstname: string;
  lastname: string;
  email: string | null;
  phone: string | null;
  birthday: string | null;
  newsletter: number;
  optin: number;
  deleted: number;
  date_add: string;
  date_upd: string;
}

function makeRow(over: Partial<QloAppsRow> = {}): QloAppsRow {
  return {
    id_customer: 1,
    firstname: "John",
    lastname: "Doe",
    email: "john@example.com",
    phone: "+234 801 234 5678",
    birthday: "1990-01-01",
    newsletter: 0,
    optin: 0,
    deleted: 0,
    date_add: "2024-01-15 09:30:00",
    date_upd: "2024-06-20 14:22:11",
    ...over,
  };
}

// Convenience: a "default source" mock that returns a single clean row
function makeSourceMockWithRows(rows: QloAppsRow[], count?: number, maxXmin = "12345") {
  return makeMockDb({
    queryHandler: matchQuery([
      { match: /count\(\*\)/i, rows: [{ n: count ?? rows.length }] },
      { match: /ORDER BY id_customer/i, rows },
      { match: /max\(xmin/i, rows: [{ max_xmin: maxXmin }] },
    ]),
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────

const TENANT_ID = "00000000-0000-0000-0000-000000000001";

describe("Seeding — bulkImport SQL behavior", () => {
  it("issues SELECT count(*) and SELECT <columns> FROM ps_customer on the source", async () => {
    const { db: sourceMock, statements: sourceStmts } = makeSourceMockWithRows([makeRow()]);
    const { db: targetMock } = makeMockDb();

    await bulkImport(sourceMock, targetMock, { tenantId: TENANT_ID });

    const sourceSql = sourceStmts.map((s) => s.sql).join("\n");
    expect(sourceSql).toMatch(/SELECT count\(\*\)::int AS n FROM ps_customer/i);
    expect(sourceSql).toMatch(/SELECT .* FROM ps_customer[\s\S]*ORDER BY id_customer/i);
    expect(sourceSql).toMatch(/SELECT max\(xmin::text::bigint\) AS max_xmin FROM ps_customer/i);
  });

  it("never selects the forbidden columns (passwd, secure_key, etc.)", async () => {
    const { db: sourceMock, statements: sourceStmts } = makeSourceMockWithRows([makeRow()]);
    const { db: targetMock } = makeMockDb();

    await bulkImport(sourceMock, targetMock, { tenantId: TENANT_ID });

    const selectStmt = sourceStmts.find((s) => /SELECT .* FROM ps_customer[\s\S]*ORDER BY/i.test(s.sql))!;
    const forbidden = ["passwd", "secure_key", "ip_registration_newsletter", "last_passwd_gen"];
    for (const col of forbidden) {
      expect(selectStmt.sql.toLowerCase()).not.toContain(col.toLowerCase());
    }
    for (const col of ALLOWED_COLUMNS) {
      expect(selectStmt.sql.toLowerCase()).toContain(col.toLowerCase());
    }
  });

  it("issues DELETE then INSERT on the target for each source row", async () => {
    const { db: sourceMock } = makeSourceMockWithRows([
      makeRow({ id_customer: 1 }),
      makeRow({ id_customer: 2 }),
    ]);
    const { db: targetMock, statements: targetStmts } = makeMockDb();

    await bulkImport(sourceMock, targetMock, { tenantId: TENANT_ID });

    const deletes = targetStmts.filter((s) => /DELETE FROM guests/i.test(s.sql));
    const inserts = targetStmts.filter((s) => /INSERT INTO guests/i.test(s.sql));
    expect(deletes.length).toBe(2);
    expect(inserts.length).toBe(2);
  });

  it("DELETE matches on (tenant_id, source_ref) — never deletes other tenants' rows", async () => {
    const { db: sourceMock } = makeSourceMockWithRows([makeRow({ id_customer: 42 })]);
    const { db: targetMock, statements: targetStmts } = makeMockDb();

    await bulkImport(sourceMock, targetMock, { tenantId: TENANT_ID });

    const deleteStmt = targetStmts.find((s) => /DELETE FROM guests/i.test(s.sql))!;
    expect(deleteStmt.sql).toMatch(/tenant_id\s*=\s*\?/i);
    expect(deleteStmt.params).toContain(TENANT_ID);
    expect(deleteStmt.params).toContain("42");
  });

  it("INSERT includes the mapped guest fields and 'UNKNOWN_CONTACT' phase as a SQL literal", async () => {
    const { db: sourceMock } = makeSourceMockWithRows([makeRow({
      id_customer: 1,
      firstname: "John",
      lastname: "Doe",
      email: "  John@Example.COM  ",
      phone: "+234 801 234 5678",
      birthday: "0000-00-00",
      deleted: 0,
    })]);
    const { db: targetMock, statements: targetStmts } = makeMockDb();

    await bulkImport(sourceMock, targetMock, { tenantId: TENANT_ID });

    const insertStmt = targetStmts.find((s) => /INSERT INTO guests/i.test(s.sql))!;
    expect(insertStmt.sql).toMatch(/guest_phase/i);
    expect(insertStmt.sql).toMatch(/UNKNOWN_CONTACT/);
    expect(insertStmt.params).toContain(TENANT_ID);
    expect(insertStmt.params).toContain("1");
    expect(insertStmt.params).toContain("John");
    expect(insertStmt.params).toContain("Doe");
    expect(insertStmt.params).toContain("john@example.com");
    expect(insertStmt.params).toContain("2348012345678");
  });

  it("truncates names exceeding 32 chars via the QloApps mapping", async () => {
    const longFirst = "A".repeat(50);
    const longLast = "B".repeat(60);
    const { db: sourceMock } = makeSourceMockWithRows([
      makeRow({ firstname: longFirst, lastname: longLast }),
    ]);
    const { db: targetMock, statements: targetStmts } = makeMockDb();

    await bulkImport(sourceMock, targetMock, { tenantId: TENANT_ID });

    const insertStmt = targetStmts.find((s) => /INSERT INTO guests/i.test(s.sql))!;
    const firstNameParam = insertStmt.params.find(
      (p) => typeof p === "string" && p.length === 32 && p.startsWith("A"),
    );
    const lastNameParam = insertStmt.params.find(
      (p) => typeof p === "string" && p.length === 32 && p.startsWith("B"),
    );
    expect(firstNameParam).toBeDefined();
    expect(lastNameParam).toBeDefined();
  });

  it("sets deleted_at when source row has deleted=1 (soft-delete mirroring)", async () => {
    const { db: sourceMock } = makeSourceMockWithRows([makeRow({ deleted: 1 })]);
    const { db: targetMock, statements: targetStmts } = makeMockDb();

    await bulkImport(sourceMock, targetMock, { tenantId: TENANT_ID });

    const insertStmt = targetStmts.find((s) => /INSERT INTO guests/i.test(s.sql))!;
    const deletedAtParam = insertStmt.params.find((p) => p instanceof Date);
    expect(deletedAtParam).toBeDefined();
  });

  it("preserves NULL and whitespace-only emails as NULL", async () => {
    const { db: sourceMock } = makeSourceMockWithRows([
      makeRow({ id_customer: 1, email: "   " }),
      makeRow({ id_customer: 2, email: null }),
    ]);
    const { db: targetMock, statements: targetStmts } = makeMockDb();

    await bulkImport(sourceMock, targetMock, { tenantId: TENANT_ID });

    const inserts = targetStmts.filter((s) => /INSERT INTO guests/i.test(s.sql));
    expect(inserts.length).toBe(2);
    for (const ins of inserts) {
      expect(ins.params).toContain(null);
    }
  });

  it("sets sync_state.last_seen_xmin to the source's max(xmin)", async () => {
    const { db: sourceMock } = makeSourceMockWithRows([makeRow()], undefined, "99999");
    const { db: targetMock, statements: targetStmts } = makeMockDb();

    const result = await bulkImport(sourceMock, targetMock, { tenantId: TENANT_ID });

    expect(result.finalXmin).toBe(99999n);
    const syncStmt = targetStmts.find((s) => /INSERT INTO sync_state/i.test(s.sql));
    expect(syncStmt).toBeDefined();
    expect(syncStmt!.params).toContain(TENANT_ID);
    expect(syncStmt!.params).toContain("ps_customer");
    expect(syncStmt!.params).toContain("99999");
  });

  it("is idempotent — DELETE before INSERT means re-running produces no duplicates", async () => {
    const { db: sourceMock } = makeSourceMockWithRows([makeRow({ id_customer: 1 })]);
    const { db: targetMock, statements: targetStmts } = makeMockDb();

    await bulkImport(sourceMock, targetMock, { tenantId: TENANT_ID });
    await bulkImport(sourceMock, targetMock, { tenantId: TENANT_ID });

    const deletes = targetStmts.filter((s) => /DELETE FROM guests/i.test(s.sql));
    const inserts = targetStmts.filter((s) => /INSERT INTO guests/i.test(s.sql));
    expect(deletes.length).toBe(2);
    expect(inserts.length).toBe(2);
    expect(deletes[0].params).toContain("1");
    expect(deletes[1].params).toContain("1");
  });

  it("handles a 200-row batch (chunked at 500 by default → 1 chunk)", async () => {
    const rows = Array.from({ length: 200 }, (_, i) => makeRow({ id_customer: i + 1 }));
    const { db: sourceMock } = makeSourceMockWithRows(rows);
    const { db: targetMock, statements: targetStmts } = makeMockDb();

    const result = await bulkImport(sourceMock, targetMock, { tenantId: TENANT_ID });

    expect(result.rowsRead).toBe(200);
    expect(result.rowsInserted).toBe(200);
    const inserts = targetStmts.filter((s) => /INSERT INTO guests/i.test(s.sql));
    expect(inserts.length).toBe(200);
  });

  it("handles duplicate-looking source rows (different id, same email) by mapping both", async () => {
    const { db: sourceMock } = makeSourceMockWithRows([
      makeRow({ id_customer: 1, email: "dup@example.com", phone: "+2347000000001" }),
      makeRow({ id_customer: 2, email: "dup@example.com", phone: "+2347000000002" }),
    ]);
    const { db: targetMock, statements: targetStmts } = makeMockDb();

    const result = await bulkImport(sourceMock, targetMock, { tenantId: TENANT_ID });

    expect(result.rowsInserted).toBe(2);
    const inserts = targetStmts.filter((s) => /INSERT INTO guests/i.test(s.sql));
    expect(inserts.length).toBe(2);
    expect(inserts[0].params).toContain("1");
    expect(inserts[1].params).toContain("2");
    const phones = inserts.map((i) =>
      i.params.find((p) => typeof p === "string" && /^\d+$/.test(p) && p.length > 10));
    expect(phones[0]).not.toBe(phones[1]);
  });
});

// ── Mapping-vs-fixture sanity tests ────────────────────────────────────────
// Pure-function tests of qloappsMapping.mapRow — verifies that every edge
// case present in the messy-guests.csv fixture is handled correctly by the
// mapping. No DB involved.

describe("Seeding — QloApps mapping against fixture edge cases", () => {
  it("maps a clean row through unchanged (modulo normalization)", () => {
    const m = qloappsMapping.mapRow(makeRow());
    expect(m.source_ref).toBe("1");
    expect(m.first_name).toBe("John");
    expect(m.last_name).toBe("Doe");
    expect(m.email).toBe("john@example.com");
    expect(m.phone).toBe("2348012345678");
    expect(m.deleted_at).toBeNull();
    expect(m.comm_prefs.email_opt_in).toBe(false);
    expect(m.comm_prefs.marketing_opt_in).toBe(false);
  });

  it("zero-date birthday (0000-00-00) → null date_of_birth", () => {
    const m = qloappsMapping.mapRow(makeRow({ birthday: "0000-00-00" }));
    expect(m.date_of_birth).toBeNull();
  });

  it("whitespace-only email → null", () => {
    const m = qloappsMapping.mapRow(makeRow({ email: "   " }));
    expect(m.email).toBeNull();
  });

  it("mixed-case email with surrounding whitespace → lowercased + trimmed", () => {
    const m = qloappsMapping.mapRow(makeRow({ email: "  John@Example.COM  " }));
    expect(m.email).toBe("john@example.com");
  });

  it("soft-deleted row (deleted=1) → deleted_at set to a Date", () => {
    const m = qloappsMapping.mapRow(makeRow({ deleted: 1 }));
    expect(m.deleted_at).toBeInstanceOf(Date);
  });

  it("truncates firstname > 32 chars", () => {
    const m = qloappsMapping.mapRow(makeRow({ firstname: "A".repeat(50) }));
    expect(m.first_name?.length).toBe(32);
  });

  it("truncates lastname > 32 chars", () => {
    const m = qloappsMapping.mapRow(makeRow({ lastname: "B".repeat(60) }));
    expect(m.last_name?.length).toBe(32);
  });

  it("normalizes every phone format from the fixture to digits-only", () => {
    const fixtures = [
      { in: "+234 801 234 5678", out: "2348012345678" },
      { in: "+1-555-123-4567", out: "15551234567" },
      { in: "(234) 801-234-5678", out: "2348012345678" },
      { in: "+234.801.234.5678", out: "2348012345678" },
      { in: "08012345678", out: "08012345678" },
    ];
    for (const { in: input, out: expected } of fixtures) {
      const m = qloappsMapping.mapRow(makeRow({ phone: input }));
      expect(m.phone).toBe(expected);
    }
  });

  it("maps comm_prefs correctly (newsletter → email_opt_in, optin → marketing_opt_in)", () => {
    const m = qloappsMapping.mapRow(makeRow({ newsletter: 1, optin: 1 }));
    expect(m.comm_prefs.email_opt_in).toBe(true);
    expect(m.comm_prefs.marketing_opt_in).toBe(true);
    expect(m.comm_prefs.sms_opt_in).toBe(false);
    expect(m.comm_prefs.push_opt_in).toBe(false);
  });
});
