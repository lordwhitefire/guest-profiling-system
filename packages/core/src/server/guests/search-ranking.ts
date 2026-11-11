// =============================================================================
// Search ranking — Card 2 + PM Plan §14.2
// =============================================================================
// Ranking (highest first):
//   1. Exact email match (case-insensitive)
//   2. Exact phone match (digits-only comparison)
//   3. Prefix match on first_name or last_name (case-insensitive)
//   4. Substring match on first_name, last_name, or email (case-insensitive)
//
// The actual SQL query uses UNION ALL with a rank column to express this
// ordering. Postgres's trigram indexes (pg_trgm) on email/first_name/last_name
// accelerate the substring matches.

import type { Guest } from "@gps/shared";

export const SEARCH_MAX_QUERY_LENGTH = 100;
export const SEARCH_MIN_QUERY_LENGTH = 2;
export const SEARCH_MAX_RESULTS = 20;

export interface RankedGuest {
  guest: Guest;
  rank: 1 | 2 | 3 | 4;       // 1 = best (exact email)
}

/**
 * Build the SQL WHERE clause + parameters for a guest search.
 * Returns null if the query is too short or too long (caller should return
 * empty array without hitting the DB).
 *
 * Per PM Plan §14.2: ranking is via UNION of 4 SELECTs, each tagged with a
 * rank, then ORDER BY rank, last_stay_date DESC, LIMIT 20.
 *
 * The actual SQL is built as a single unsafe() string because postgres.js's
 * typed template literals don't accept dynamic column lists. We use parameter
 * binding for the search term itself to prevent SQL injection.
 */
export function buildSearchSql(
  tenantId: string,
  searchTerm: string,
): { sql: string; params: unknown[] } | null {
  const normalized = searchTerm.trim();
  if (normalized.length < SEARCH_MIN_QUERY_LENGTH) return null;
  const truncated = normalized.slice(0, SEARCH_MAX_QUERY_LENGTH);

  // For phone matching: digits only.
  const digitsOnly = truncated.replace(/\D/g, "");

  // For email exact match: lowercase.
  const lowerEmail = truncated.toLowerCase();

  // For name prefix match: lowercase + % for LIKE.
  const namePrefix = `%${lowerEmail}%`;

  // The query uses UNION ALL to deduplicate (a guest matching multiple tiers
  // appears only at the highest rank). Then ORDER BY rank ASC, last_stay_date
  // DESC, and LIMIT 20.
  //
  // Note: we cast id_customer-like source_ref to varchar for the phone match
  // since QloApps stores id_customer as int; our guests.source_ref is varchar.
  const sql = `
    (
      SELECT *, 1 as rank FROM guests
      WHERE tenant_id = $1 AND deleted_at IS NULL
        AND lower(email) = $2
    )
    UNION ALL
    (
      SELECT *, 2 as rank FROM guests
      WHERE tenant_id = $1 AND deleted_at IS NULL
        AND phone = $3
        AND lower(email) != $2  -- exclude matches already in tier 1
    )
    UNION ALL
    (
      SELECT *, 3 as rank FROM guests
      WHERE tenant_id = $1 AND deleted_at IS NULL
        AND (
          lower(first_name) LIKE $4
          OR lower(last_name) LIKE $4
        )
        AND lower(email) != $2  -- exclude matches already in tier 1
        AND phone != $3          -- exclude matches already in tier 2
    )
    UNION ALL
    (
      SELECT *, 4 as rank FROM guests
      WHERE tenant_id = $1 AND deleted_at IS NULL
        AND (
          lower(email) LIKE $4
          OR lower(first_name) LIKE $4
          OR lower(last_name) LIKE $4
        )
        AND lower(email) != $2  -- exclude matches already in tier 1
        AND phone != $3          -- exclude matches already in tier 2
        AND NOT (
          lower(first_name) LIKE $4 OR lower(last_name) LIKE $4
        )  -- exclude matches already in tier 3 (but still allow substring email)
    )
    ORDER BY rank ASC, last_stay_date DESC NULLS LAST
    LIMIT ${SEARCH_MAX_RESULTS}
  `;

  return {
    sql,
    params: [tenantId, lowerEmail, digitsOnly, namePrefix],
  };
}

/**
 * Validate a search query. Returns null if valid, or an error message if invalid.
 * Per testing.md: queries shorter than 2 chars return empty array (not 400);
 * this helper is for callers that want to short-circuit.
 */
export function validateSearchQuery(query: string): string | null {
  const trimmed = query.trim();
  if (trimmed.length < SEARCH_MIN_QUERY_LENGTH) {
    return null; // graceful — caller returns empty array
  }
  if (trimmed.length > SEARCH_MAX_QUERY_LENGTH) {
    return `Query too long (max ${SEARCH_MAX_QUERY_LENGTH} chars).`;
  }
  return null;
}
