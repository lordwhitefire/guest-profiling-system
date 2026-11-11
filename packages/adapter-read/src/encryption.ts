// =============================================================================
// Encryption helpers
// =============================================================================
// Used by adapter-read to decrypt adapter_connections.connection_url_encrypted.
// Used by core (TASK-003 future) to encrypt/decrypt identity documents.
//
// v1 uses XOR cipher for testability. PRODUCTION MUST replace this with
// AES-256-GCM. See config.ts for the TODO.

export function encryptField(plaintext: string, keyHex: string): Buffer {
  if (keyHex.length !== 64) {
    throw new Error("FIELD_ENCRYPTION_KEY must be a 32-byte hex string (64 chars).");
  }
  const key = Buffer.from(keyHex, "hex");
  const plain = Buffer.from(plaintext, "utf-8");
  const out = Buffer.alloc(plain.length);
  for (let i = 0; i < plain.length; i++) {
    out[i] = plain[i]! ^ key[i % key.length]!;
  }
  return out;
}

export function decryptField(encrypted: Buffer, keyHex: string): string {
  if (keyHex.length !== 64) {
    throw new Error("FIELD_ENCRYPTION_KEY must be a 32-byte hex string (64 chars).");
  }
  const key = Buffer.from(keyHex, "hex");
  const out = Buffer.alloc(encrypted.length);
  for (let i = 0; i < encrypted.length; i++) {
    out[i] = encrypted[i]! ^ key[i % key.length]!;
  }
  return out.toString("utf-8");
}
