// =============================================================================
// Audit log writer — append-only; best-effort
// =============================================================================
// On every mutation to guest data (POST, PUT, DELETE), append a row to
// audit_logs. The write is best-effort: if it fails, log the error but do
// NOT fail the request (audit is observability, not transactional correctness).

import type { Db } from "@gps/shared";
import type { AuditAction } from "@gps/shared";

export interface AuditLogEntry {
  tenantId: string;
  actorUserId: string | null;
  action: AuditAction;
  entityType: string;          // e.g. "guest", "reservation", "user"
  entityId: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}

/**
 * Append an entry to audit_logs. Best-effort: errors are logged but do not
 * propagate to the caller.
 */
export async function writeAuditLog(db: Db, entry: AuditLogEntry): Promise<void> {
  try {
    await db`
      INSERT INTO audit_logs
        (tenant_id, actor_user_id, action, entity_type, entity_id, before, after)
      VALUES
        (${entry.tenantId},
         ${entry.actorUserId},
         ${entry.action},
         ${entry.entityType},
         ${entry.entityId},
         ${entry.before ? JSON.stringify(entry.before) : null}::jsonb,
         ${entry.after ? JSON.stringify(entry.after) : null}::jsonb)
    `;
  } catch (err) {
    // Best-effort: log the error but do NOT propagate.
    // The audit log must never block a successful mutation response.
    console.error(
      `[audit-log] Failed to write audit entry:`,
      err instanceof Error ? err.message : String(err),
      { entry: { ...entry, before: entry.before ? "[redacted]" : null, after: entry.after ? "[redacted]" : null } },
    );
  }
}
