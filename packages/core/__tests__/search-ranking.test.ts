// =============================================================================
// Search ranking tests — Card 2 + PM Plan §14.2
// =============================================================================

import { describe, it, expect } from "vitest";
import {
  buildSearchSql,
  validateSearchQuery,
  SEARCH_MAX_QUERY_LENGTH,
  SEARCH_MAX_RESULTS,
  SEARCH_MIN_QUERY_LENGTH,
} from "../src/server/guests/search-ranking";

describe("Search ranking (Card 2 §4.2 + Feature F1)", () => {
  describe("validateSearchQuery", () => {
    it("returns null for empty query (graceful, not 400)", () => {
      expect(validateSearchQuery("")).toBeNull();
    });

    it("returns null for query shorter than min length", () => {
      expect(validateSearchQuery("a")).toBeNull();
      expect(validateSearchQuery(" ")).toBeNull();
    });

    it("returns null for valid query within length bounds", () => {
      expect(validateSearchQuery("john")).toBeNull();
      expect(validateSearchQuery("john@example.com")).toBeNull();
    });

    it("returns error message for query exceeding max length", () => {
      const long = "a".repeat(SEARCH_MAX_QUERY_LENGTH + 1);
      const result = validateSearchQuery(long);
      expect(result).toContain("too long");
      expect(result).toContain(String(SEARCH_MAX_QUERY_LENGTH));
    });
  });

  describe("buildSearchSql", () => {
    it("returns null for query shorter than min length", () => {
      expect(buildSearchSql("tenant-1", "a")).toBeNull();
    });

    it("returns null for empty query", () => {
      expect(buildSearchSql("tenant-1", "")).toBeNull();
      expect(buildSearchSql("tenant-1", "   ")).toBeNull();
    });

    it("truncates query longer than max length", () => {
      const long = "a".repeat(SEARCH_MAX_QUERY_LENGTH + 50);
      const built = buildSearchSql("tenant-1", long);
      expect(built).not.toBeNull();
      // The lowercased + truncated version should be in the params.
      expect(built!.params[1]).toBe("a".repeat(SEARCH_MAX_QUERY_LENGTH));
    });

    it("returns SQL with UNION ALL across 4 tiers", () => {
      const built = buildSearchSql("tenant-1", "john");
      expect(built).not.toBeNull();
      expect(built!.sql).toContain("UNION ALL");
      // Count the UNION ALL occurrences (3 unions for 4 tiers).
      const unions = built!.sql.match(/UNION ALL/g);
      expect(unions?.length).toBe(3);
    });

    it("returns SQL with ORDER BY rank ASC, last_stay_date DESC", () => {
      const built = buildSearchSql("tenant-1", "john");
      expect(built!.sql).toContain("ORDER BY rank ASC");
      expect(built!.sql).toContain("last_stay_date DESC");
    });

    it("returns SQL with LIMIT 20 (SEARCH_MAX_RESULTS)", () => {
      const built = buildSearchSql("tenant-1", "john");
      expect(built!.sql).toContain(`LIMIT ${SEARCH_MAX_RESULTS}`);
    });

    it("excludes soft-deleted guests (deleted_at IS NULL)", () => {
      const built = buildSearchSql("tenant-1", "john");
      // Each of the 4 tier SELECTs must include "deleted_at IS NULL".
      const matches = built!.sql.match(/deleted_at IS NULL/g);
      expect(matches?.length).toBe(4);
    });

    it("tenant_id is bound as $1 (parameter, not interpolated)", () => {
      const built = buildSearchSql("tenant-uuid-here", "john");
      expect(built!.params[0]).toBe("tenant-uuid-here");
      // The SQL should NOT contain the tenant_id literally.
      expect(built!.sql).not.toContain("tenant-uuid-here");
      expect(built!.sql).toContain("$1");
    });

    it("lowercased email is bound as $2", () => {
      const built = buildSearchSql("t1", "JOHN@EXAMPLE.COM");
      expect(built!.params[1]).toBe("john@example.com");
    });

    it("digits-only phone is bound as $3", () => {
      const built = buildSearchSql("t1", "+234 800 123 4567");
      expect(built!.params[2]).toBe("2348001234567");
    });

    it("name-prefix LIKE pattern is bound as $4", () => {
      const built = buildSearchSql("t1", "john");
      expect(built!.params[3]).toBe("%john%");
    });
  });

  describe("Constants", () => {
    it("SEARCH_MAX_RESULTS is 20", () => {
      expect(SEARCH_MAX_RESULTS).toBe(20);
    });

    it("SEARCH_MIN_QUERY_LENGTH is 2", () => {
      expect(SEARCH_MIN_QUERY_LENGTH).toBe(2);
    });

    it("SEARCH_MAX_QUERY_LENGTH is 100", () => {
      expect(SEARCH_MAX_QUERY_LENGTH).toBe(100);
    });
  });
});
