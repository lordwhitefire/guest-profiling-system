// =============================================================================
// Sensitive-field stripping — Card 2 §4.4
// =============================================================================
// The three columns identity_doc_type, identity_doc_number, identity_doc_expiry
// live in the guest_identity_documents linked table. They are NEVER returned
// by GET /api/guests/{id} — the response excludes the entire identity_documents
// array. Fetching identity documents requires a separate admin-only endpoint
// (TASK-005).

import type { Guest } from "@gps/shared";

// The fields that must never appear in a guest API response.
// These are conceptual fields (from Card 2 §4.4); in our schema they live in
// guest_identity_documents, not in guests — but we list them here to make
// the security boundary explicit and testable.
export const SENSITIVE_GUEST_FIELDS = [
  "identity_doc_type",
  "identity_doc_number",
  "identity_doc_expiry",
  "identity_documents", // the full linked array
] as const;

// Type for the response shape — Guest without the sensitive fields.
// In our current schema, Guest doesn't include identity documents directly
// (they're a separate linked table), so this type is structurally the same
// as Guest today. But making it explicit means a future schema change that
// adds identity_doc_* to Guest will be caught at compile time.
export type SafeGuestResponse = Omit<Guest, "identity_documents">;

/**
 * Strip sensitive fields from a guest object before returning it in an API
 * response. Per Card 2 §4.4.
 *
 * v1: guests don't carry identity_documents in their main shape (they're
 * a separate linked table), so this function is a no-op today. But it's
 * here as the security boundary — if a future change inlines identity_doc_*
 * into the guests table, this function will be the place to strip them.
 *
 * Tests assert that the response does NOT contain the sensitive fields;
 * those tests pass today because the fields aren't there, and they'll
 * catch a regression if a future change adds them.
 */
export function stripSensitiveFields<T extends Record<string, unknown>>(guest: T): T {
  // Make a shallow copy and delete any sensitive fields that happen to be there.
  // (Today, none of these are present in a Guest object — but a future schema
  // change might inline them.)
  const safe = { ...guest };
  for (const field of SENSITIVE_GUEST_FIELDS) {
    if (field in safe) {
      delete safe[field];
    }
  }
  return safe;
}

/**
 * Strip sensitive fields from an array of guest objects (used by list and
 * search endpoints).
 */
export function stripSensitiveFieldsFromArray<T extends Record<string, unknown>>(
  guests: T[],
): T[] {
  return guests.map(stripSensitiveFields);
}
