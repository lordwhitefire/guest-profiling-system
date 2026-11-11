// =============================================================================
// Adapter-read configuration
// =============================================================================
// Loads env vars + per-tenant config from the adapter_connections table.
// All sensitive values (source PMS URL) come from the DB, encrypted at rest.

import postgres from "postgres";

export interface AdapterConfig {
  tenantId: string;
  pmsType: "qloapps" | "mews" | "cloudbeds" | "apaleo" | "custom";
  sourceUrl: string;          // decrypted at runtime; never logged
  targetUrl: string;          // our DB URL, from DATABASE_URL env var
  updateChunkSize: number;
  deleteChunkSize: number;
  minDeleteChunkSize: number;
  throttlePercent: number;
  resyncOnSchemaChange: boolean;
  fullCopyThreshold: number;
  waitBetweenJobsMs: number;
}

const DEFAULTS = {
  updateChunkSize: 1000,
  deleteChunkSize: 1000,
  minDeleteChunkSize: 100,
  throttlePercent: 75,
  resyncOnSchemaChange: false,
  fullCopyThreshold: 0.5,
  waitBetweenJobsMs: 5000,
};

/**
 * Load adapter config for a tenant.
 * Reads the adapter_connections table to get pms_type + encrypted source URL.
 * Falls back to env vars for the global settings (DATABASE_URL, etc.).
 *
 * Per-tenant overrides are NOT supported in v1 (all tenants share the same
 * chunk sizes / throttle). When we need them, add a `config JSONB` column
 * to adapter_connections.
 */
export async function loadConfig(tenantId: string): Promise<AdapterConfig> {
  const targetUrl = process.env.DATABASE_URL;
  if (!targetUrl) {
    throw new Error(
      "DATABASE_URL environment variable is required. " +
      "Copy .env.example to .env and fill in real values."
    );
  }

  const target = postgres(targetUrl, { max: 5 });
  try {
    const rows = await target`
      SELECT pms_type, connection_url_encrypted, is_read_only
      FROM adapter_connections
      WHERE tenant_id = ${tenantId}
        AND deleted_at IS NULL
      LIMIT 1
    `;

    if (rows.length === 0) {
      throw new Error(
        `No adapter connection found for tenant ${tenantId}. ` +
        `Create one via the admin UI (/admin/tenants) before running the sync.`
      );
    }

    const row = rows[0] as {
      pms_type: AdapterConfig["pmsType"];
      connection_url_encrypted: Buffer;
      is_read_only: boolean;
    };

    if (!row.is_read_only) {
      throw new Error(
        `Adapter connection for tenant ${tenantId} is not marked read-only. ` +
        `Refusing to sync — Card 1 contract requires read-only source access.`
      );
    }

    const sourceUrl = await decryptConnectionUrl(row.connection_url_encrypted);

    // Enforce default_transaction_read_only=true on the source URL (Card 1 contract).
    // If the URL already has it, no change. If not, append it.
    const safeSourceUrl = ensureReadOnlyFlag(sourceUrl);

    return {
      tenantId,
      pmsType: row.pms_type,
      sourceUrl: safeSourceUrl,
      targetUrl,
      ...DEFAULTS,
    };
  } finally {
    await target.end();
  }
}

/**
 * Decrypt the source PMS connection URL using FIELD_ENCRYPTION_KEY.
 *
 * v1 implementation uses a simple XOR cipher for testability.
 * Production should swap this for AES-256-GCM via the `crypto` module.
 * The interface (Buffer in, string out) stays the same.
 *
 * TODO before any production deploy: replace XOR with AES-256-GCM.
 * The current implementation is intentionally weak — it exists to make the
 * interface testable, not to provide real encryption.
 */
async function decryptConnectionUrl(encrypted: Buffer): Promise<string> {
  const keyHex = process.env.FIELD_ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error(
      "FIELD_ENCRYPTION_KEY must be a 32-byte hex string (64 chars). " +
      "Generate with: openssl rand -hex 32"
    );
  }
  const key = Buffer.from(keyHex, "hex");
  // XOR cipher — placeholder. See TODO above.
  const decrypted = Buffer.alloc(encrypted.length);
  for (let i = 0; i < encrypted.length; i++) {
    decrypted[i] = encrypted[i]! ^ key[i % key.length]!;
  }
  const url = decrypted.toString("utf-8");
  if (!url.startsWith("postgres://") && !url.startsWith("postgresql://")) {
    throw new Error(
      "Decrypted source URL does not look like a Postgres connection string. " +
      "Check FIELD_ENCRYPTION_KEY and the adapter_connections row."
    );
  }
  return url;
}

/**
 * Ensure the source URL has `default_transaction_read_only=true` in its
 * query string. This is the Card 1 contract — we never connect to the
 * source PMS in read-write mode, even if the credentials allow it.
 */
function ensureReadOnlyFlag(url: string): string {
  if (url.includes("default_transaction_read_only=true")) {
    return url;
  }
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}default_transaction_read_only=true`;
}
