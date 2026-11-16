// =============================================================================
// Local-Postgres integration tests (BP-03)
// =============================================================================
// These tests use the owner's real clean DB and hotel source DB. They create
// temporary rows, then remove them. Run with:
//
//   set -a && . ./.env && set +a && pnpm test:integration
//
// They are intentionally not part of `pnpm test:unit`, which must keep running
// without a database.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import postgres from "postgres";
import type { Db } from "@gps/shared";
import { GuestsRepository } from "@/src/server/guests/repository";
import {
  getAdapterConnection,
  registerRawRow,
  syncTenant,
} from "@/src/server/adapters/service";

const GV = "11111111-1111-1111-1111-111111111111";
const LS = "22222222-2222-2222-2222-222222222222";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required for integration tests. Run with the repo .env loaded.",
  );
}

const db = postgres(databaseUrl, { max: 5 }) as unknown as Db;
const repo = new GuestsRepository(db);
const unique = () => `${Date.now()}.${Math.random().toString(16).slice(2)}`;

async function cleanupGuest(tenantId: string, guestId: string) {
  await db`
    DELETE FROM guest_profile_links
    WHERE tenant_id = ${tenantId} AND guest_id = ${guestId}::uuid
  `;
  await db`
    DELETE FROM reservations
    WHERE tenant_id = ${tenantId} AND guest_id = ${guestId}::uuid
  `;
  await db`
    DELETE FROM loyalty_profiles
    WHERE tenant_id = ${tenantId} AND guest_id = ${guestId}::uuid
  `;
  await db`
    DELETE FROM guests
    WHERE tenant_id = ${tenantId} AND guest_id = ${guestId}::uuid
  `;
}

async function findGuestByEmail(tenantId: string, email: string) {
  const rows = await db`
    SELECT guest_id
    FROM guests
    WHERE tenant_id = ${tenantId} AND email = ${email} AND deleted_at IS NULL
    LIMIT 1
  `;
  return rows.length
    ? String((rows[0] as unknown as { guest_id: string }).guest_id)
    : null;
}

async function cleanupAuditForEmail(tenantId: string, email: string) {
  await db`
    DELETE FROM audit_logs
    WHERE tenant_id = ${tenantId}
      AND action = 'CREATE'
      AND entity_type = 'registration'
      AND after->>'rawEmail' = ${email}
  `;
}

async function cleanupAuditForSync(tenantId: string, jobId: string) {
  await db`
    DELETE FROM audit_logs
    WHERE tenant_id = ${tenantId}
      AND after->>'jobId' = ${jobId}
  `;
}

async function deleteSourceRow(
  tenantId: string,
  sourceTable: string,
  sourceRowId: string,
) {
  const conn = await getAdapterConnection(db, tenantId, "write");
  if (!conn) return;
  const source = postgres(conn.dsn, {
    max: 1,
    idle_timeout: 5,
    connect_timeout: 5,
  });
  try {
    if (conn.pmsType === "qloapps") {
      await source.unsafe(
        `DELETE FROM ${sourceTable} WHERE id_customer = ${sourceRowId}::int`,
      );
    } else {
      await source.unsafe(
        `DELETE FROM ${sourceTable} WHERE id = ${sourceRowId}::int`,
      );
    }
  } finally {
    await source.end();
  }
}

beforeAll(async () => {
  // Fail fast if the local Postgres is unreachable.
  await db`SELECT 1`;
});

afterAll(async () => {
  await db.end();
});

describe("BP-03 local-Postgres data tests", () => {
  it("same guest shows the same count on list, profile and visits", async () => {
    const email = `bp03.consistency.${unique()}@example.test`;
    const guest = await repo.create(GV, {
      firstName: "Consistency",
      lastName: "Check",
      email,
      phone: "+23480000000101",
    });
    const guestId = guest.guestId;

    try {
      // Three raw links = three derived visits. This is the shape the hotel
      // source database cannot store itself.
      for (let i = 1; i <= 3; i += 1) {
        const sourceRowId = `bp03-${unique()}-${i}`;
        await db`
          INSERT INTO guest_profile_links
            (tenant_id, guest_id, source_table, source_row_id,
             source_created_at, source_payload, linked_at, linked_by_job)
          VALUES
            (${GV}, ${guestId}::uuid, 'ps_customer', ${sourceRowId},
             NOW() - (${i}::int * INTERVAL '1 day'),
             ${db.json({ email, phone: "+23480000000101", source_row_id: sourceRowId })}::jsonb,
             NOW(), 'bp03-test')
        `;
      }

      const listed = await repo.list(GV, { page: 1, limit: 20 });
      const listRow = listed.guests.find((g) => g.guestId === guestId);
      expect(listRow, "new guest should be on page 1 of the list").toBeTruthy();
      expect(listRow?.totalStays).toBe(3);

      const searched = await repo.search(GV, email);
      expect(searched).toHaveLength(1);
      expect(searched[0]?.guestId).toBe(guestId);
      expect(searched[0]?.totalStays).toBe(3);

      const profile = await repo.getById(guestId, GV);
      expect(profile?.guestId).toBe(guestId);
      expect(profile?.totalStays).toBe(3);

      const visits = await repo.getVisitsForGuest(guestId, GV, { limit: 100 });
      const summary = await repo.getVisitSummaryForGuest(guestId, GV);
      expect(visits).toHaveLength(3);
      expect(summary.total).toBe(3);
    } finally {
      await cleanupGuest(GV, guestId);
    }
  });

  it("registration -> sync -> visit count increments exactly once", async () => {
    const email = `bp03.sync.${unique()}@example.test`;
    const jobIds: string[] = [];
    let registrationAuditEmail: string | null = email;
    let sourceTable: string | null = null;
    let sourceRowId: string | null = null;

    try {
      const before = await repo.search(GV, email);
      expect(before).toHaveLength(0);

      const registration = await registerRawRow(db, GV, null, {
        name: "BP03 Sync Check",
        email,
        phone: "+23480000000103",
      });
      sourceTable = registration.sourceTable;
      sourceRowId = registration.sourceRowId;

      // The raw hotel row exists, but the clean profile has not been synced.
      const beforeSync = await repo.search(GV, email);
      expect(beforeSync).toHaveLength(0);

      const sync1 = await syncTenant(db, GV, null);
      jobIds.push(sync1.jobId);

      const afterFirst = await repo.search(GV, email);
      expect(afterFirst).toHaveLength(1);
      const firstGuest = afterFirst[0]!;
      expect(firstGuest.totalStays).toBe(1);
      const firstSummary = await repo.getVisitSummaryForGuest(
        firstGuest.guestId,
        GV,
      );
      expect(firstSummary.total).toBe(1);

      const sync2 = await syncTenant(db, GV, null);
      jobIds.push(sync2.jobId);

      const afterSecond = await repo.search(GV, email);
      expect(afterSecond).toHaveLength(1);
      expect(afterSecond[0]?.guestId).toBe(firstGuest.guestId);
      expect(afterSecond[0]?.totalStays).toBe(1);
      const secondSummary = await repo.getVisitSummaryForGuest(
        firstGuest.guestId,
        GV,
      );
      expect(secondSummary.total).toBe(1);
    } finally {
      if (registrationAuditEmail) {
        await cleanupAuditForEmail(GV, registrationAuditEmail);
      }
      for (const jobId of jobIds) {
        await cleanupAuditForSync(GV, jobId);
      }
      if (sourceTable && sourceRowId) {
        await deleteSourceRow(GV, sourceTable, sourceRowId);
      }
      const guestId = await findGuestByEmail(GV, email);
      if (guestId) await cleanupGuest(GV, guestId);
      registrationAuditEmail = null;
    }
  });

  it("same name in two tenants stays two profiles with no cross-tenant read", async () => {
    const email = `bp03.shared.${unique()}@example.test`;
    const gvGuest = await repo.create(GV, {
      firstName: "Shared",
      lastName: "Name",
      email,
      phone: "+23480000000201",
    });
    const lsGuest = await repo.create(LS, {
      firstName: "Shared",
      lastName: "Name",
      email,
      phone: "+23480000000202",
    });

    try {
      expect(gvGuest.guestId).not.toBe(lsGuest.guestId);

      const gvSearch = await repo.search(GV, email);
      const lsSearch = await repo.search(LS, email);
      expect(gvSearch).toHaveLength(1);
      expect(lsSearch).toHaveLength(1);
      expect(gvSearch[0]?.guestId).toBe(gvGuest.guestId);
      expect(lsSearch[0]?.guestId).toBe(lsGuest.guestId);

      expect(await repo.getById(gvGuest.guestId, LS)).toBeNull();
      expect(await repo.getById(lsGuest.guestId, GV)).toBeNull();
    } finally {
      await cleanupGuest(GV, gvGuest.guestId);
      await cleanupGuest(LS, lsGuest.guestId);
    }
  });
});