// =============================================================================
// Adapter connection URL encryption
// =============================================================================
// The shared encryption module works on values; this wrapper owns the
// process-level key and the bytea conversion used by adapter_connections.

import { decryptField, encryptField } from "@gps/adapter-read/encryption";

function keyHex(): string {
  const key = process.env.FIELD_ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error("FIELD_ENCRYPTION_KEY must be a 32-byte hex string (64 chars).");
  }
  return key;
}

export function encryptConnectionUrl(url: string): Buffer {
  return encryptField(url, keyHex());
}

export function decryptConnectionUrl(value: Buffer | Uint8Array | string): string {
  const bytes =
    typeof value === "string"
      ? Buffer.from(value, "hex")
      : Buffer.from(value);
  return decryptField(bytes, keyHex());
}
