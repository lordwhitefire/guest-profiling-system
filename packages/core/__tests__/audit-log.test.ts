// =============================================================================
// Audit log writer tests
// =============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { writeAuditLog } from "../src/server/audit/log";

// Mock postgres.js — we want to assert the SQL is called with the right
// parameters without touching a real DB.
const mockUnsafe = vi.fn();
const mockDb = {
  unsafe: mockUnsafe,
  // The writeAuditLog uses the tagged template form, not unsafe().
  // Tagged template on a function: we need to mock the function call.
} as unknown as Parameters<typeof writeAuditLog>[0];

// We can't easily mock the tagged template form; instead, we use a real-ish
// mock that captures the SQL strings.
// For the writeAuditLog tests, we'll use a custom mock that captures the call.

function makeMockDb() {
  const calls: { sql: string; params: unknown[] }[] = [];
  const taggedTemplate = (strings: TemplateStringsArray, ...values: unknown[]) => {
    calls.push({ sql: strings.join("?"), params: values });
    return Promise.resolve([]);
  };
  // Add the unsafe method (not used by audit log, but required by Db type).
  (taggedTemplate as unknown as { unsafe: typeof mockUnsafe }).unsafe = mockUnsafe;
  return { db: taggedTemplate as unknown as Parameters<typeof writeAuditLog>[0], calls };
}

describe("Audit log writer", () => {
  beforeEach(() => {
    mockUnsafe.mockReset();
  });

  it("writes an INSERT into audit_logs with all fields", async () => {
    const { db, calls } = makeMockDb();
    await writeAuditLog(db, {
      tenantId: "t1",
      actorUserId: "u1",
      action: "CREATE",
      entityType: "guest",
      entityId: "g1",
      before: null,
      after: { guest_id: "g1", first_name: "John" },
    });
    expect(calls.length).toBe(1);
    expect(calls[0]!.sql).toContain("INSERT INTO audit_logs");
    expect(calls[0]!.params).toContain("t1");
    expect(calls[0]!.params).toContain("u1");
    expect(calls[0]!.params).toContain("CREATE");
    expect(calls[0]!.params).toContain("guest");
    expect(calls[0]!.params).toContain("g1");
  });

  it("serializes before/after as JSON strings (not raw objects)", async () => {
    const { db, calls } = makeMockDb();
    await writeAuditLog(db, {
      tenantId: "t1",
      actorUserId: "u1",
      action: "UPDATE",
      entityType: "guest",
      entityId: "g1",
      before: { first_name: "Old" },
      after: { first_name: "New" },
    });
    // The params array should include the JSON-stringified before/after,
    // each followed by "::jsonb" cast.
    const beforeStr = calls[0]!.params.find(
      (p) => typeof p === "string" && p.includes('"first_name":"Old"'),
    );
    const afterStr = calls[0]!.params.find(
      (p) => typeof p === "string" && p.includes('"first_name":"New"'),
    );
    expect(beforeStr).toBeDefined();
    expect(afterStr).toBeDefined();
  });

  it("passes NULL for before on CREATE", async () => {
    const { db, calls } = makeMockDb();
    await writeAuditLog(db, {
      tenantId: "t1",
      actorUserId: "u1",
      action: "CREATE",
      entityType: "guest",
      entityId: "g1",
      before: null,
      after: { first_name: "John" },
    });
    // The SQL should contain a null literal for before (we pass null and
    // the SQL has "::jsonb" cast).
    // Look for null in the params.
    expect(calls[0]!.params).toContain(null);
  });

  it("does NOT throw when the DB insert fails (best-effort)", async () => {
    // Use a mock that throws.
    const failingDb = (() => {
      const fn = () => Promise.reject(new Error("DB down"));
      (fn as unknown as { unsafe: () => void }).unsafe = () => {};
      return fn as unknown as Parameters<typeof writeAuditLog>[0];
    })();

    // Suppress console.error for this test.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      writeAuditLog(failingDb, {
        tenantId: "t1",
        actorUserId: "u1",
        action: "CREATE",
        entityType: "guest",
        entityId: "g1",
        before: null,
        after: { first_name: "John" },
      }),
    ).resolves.toBeUndefined();

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("[audit-log]"),
      expect.any(String),
      expect.any(Object),
    );

    spy.mockRestore();
  });

  it("supports null actorUserId (system-generated events)", async () => {
    const { db, calls } = makeMockDb();
    await writeAuditLog(db, {
      tenantId: "t1",
      actorUserId: null,
      action: "SYNC",
      entityType: "guest",
      entityId: "g1",
      before: null,
      after: null,
    });
    expect(calls[0]!.params).toContain(null);
    expect(calls[0]!.params).toContain("SYNC");
  });
});
