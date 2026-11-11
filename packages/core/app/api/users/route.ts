// =============================================================================
// GET /api/users — list users in the caller's tenant
// POST /api/users — invite a new user (admin-only)
// =============================================================================
// Per Card 2's tenant scope resolver: caller sees only users in their tenant.
// Creating a user requires Admin group in the caller's JWT claims.

import { NextResponse, type NextRequest } from "next/server";
import { getDb, hashPassword, resolveTenantScope } from "@gps/shared";
import type { User, UserRole } from "@gps/shared";
import { authenticate, getIntQuery } from "@/src/server/auth-helpers";
import { ok, forbidden, badRequest, conflict, serverError } from "@/src/server/response";
import { writeAuditLog } from "@/src/server/audit/log";

export const runtime = "nodejs";

// ── GET /api/users ─────────────────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;
  const claims = auth.claims;

  const scope = resolveTenantScope(claims);
  if (scope.kind === "denied") return forbidden(scope.reason);
  if (scope.kind !== "single-tenant") return forbidden("Chain-level scope not supported in v1.");

  const tenantId = scope.tenantId;
  const page = getIntQuery(request, "page", 1, Number.MAX_SAFE_INTEGER);
  const limit = getIntQuery(request, "limit", 20, 100);

  const db = getDb();
  try {
    const countRows = await db`
      SELECT count(*)::int AS n FROM users
      WHERE tenant_id = ${tenantId} AND deleted_at IS NULL
    `;
    const total = (countRows[0] as { n: number }).n;

    const rows = await db`
      SELECT user_id, tenant_id, email, groups, active, created_at, updated_at
      FROM users
      WHERE tenant_id = ${tenantId} AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${(page - 1) * limit}
    `;
    const users: User[] = rows.map((r: Record<string, unknown>) => ({
      userId: String(r.user_id),
      tenantId: String(r.tenant_id),
      email: String(r.email),
      passwordHash: "",  // never returned
      groups: r.groups as UserRole[],
      active: Boolean(r.active),
      createdAt: new Date(r.created_at as string),
      updatedAt: new Date(r.updated_at as string),
      deletedAt: null,
    }));

    return ok<User[]>(users, { page, limit, total });
  } catch (err) {
    console.error("[GET /api/users] Failed:", err);
    return serverError();
  }
}

// ── POST /api/users — invite (create) a new user ──────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;
  const claims = auth.claims;

  if (!claims.groups?.includes("Admin")) {
    return forbidden("Only admins can invite users.");
  }
  if (!claims.tenant_id) {
    return forbidden("Caller has no tenant_id claim.");
  }

  let body: { email?: string; password?: string; groups?: string[] };
  try {
    body = await request.json();
  } catch {
    return badRequest("BAD_REQUEST", "Invalid JSON body.");
  }

  if (!body.email || typeof body.email !== "string") {
    return badRequest("VALIDATION_ERROR", "email is required.");
  }
  if (!body.password || body.password.length < 8) {
    return badRequest("VALIDATION_ERROR", "password must be at least 8 characters.");
  }

  const groups = body.groups?.length ? body.groups : ["Receptionist"];
  const validGroups = new Set(["Admin", "RegionalManager", "Receptionist"]);
  for (const g of groups) {
    if (!validGroups.has(g)) {
      return badRequest("VALIDATION_ERROR", `Unknown group: ${g}.`);
    }
  }

  const db = getDb();
  try {
    const passwordHash = await hashPassword(body.password);
    const rows = await db`
      INSERT INTO users (tenant_id, email, password_hash, groups)
      VALUES (${claims.tenant_id}, ${body.email.toLowerCase().trim()}, ${passwordHash}, ${groups as unknown as string[]})
      RETURNING user_id, tenant_id, email, groups, active, created_at, updated_at
    `;
    if (rows.length === 0) return serverError();

    const row = rows[0] as Record<string, unknown>;
    const user: User = {
      userId: String(row.user_id),
      tenantId: String(row.tenant_id),
      email: String(row.email),
      passwordHash: "",
      groups: row.groups as UserRole[],
      active: Boolean(row.active),
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
      deletedAt: null,
    };

    await writeAuditLog(db, {
      tenantId: claims.tenant_id,
      actorUserId: claims.sub,
      action: "CREATE",
      entityType: "user",
      entityId: user.userId,
      before: null,
      after: { ...user, passwordHash: "[redacted]" },
    });

    return ok(user);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "23505") {
      return conflict("Email already exists in this tenant.");
    }
    console.error("[POST /api/users] Failed:", err);
    return serverError();
  }
}
