// =============================================================================
// Workspace adapter tests
// =============================================================================
// Verifies toWorkspaceGuest() correctly converts a real Guest (from the API)
// into the simpler WorkspaceGuest shape that the 17-screen UI consumes.

import { describe, it, expect } from "vitest";
import { toWorkspaceGuest, toWorkspaceGuests } from "@/lib/workspace/adapters";
import type { Guest } from "@gps/shared";

// Build a Guest object with sensible defaults; override with `over`.
function makeGuest(over: Partial<Guest> = {}): Guest {
  return {
    guestId: "00000000-0000-0000-0000-000000000001",
    tenantId: "00000000-0000-0000-0000-000000000002",
    sourceRef: "1",
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    emailVerified: false,
    phone: "2348012345678",
    phoneVerified: false,
    dateOfBirth: new Date("1990-01-01"),
    nationality: "NG",
    language: "en",
    addressLine1: null,
    addressLine2: null,
    addressLine3: null,
    addressLine4: null,
    city: null,
    state: null,
    province: null,
    county: null,
    postalCode: null,
    country: null,
    preferences: {},
    commPrefs: {
      emailOptIn: false,
      smsOptIn: false,
      pushOptIn: false,
      marketingOptIn: false,
    },
    vipLevel: "NONE",
    totalStays: 0,
    totalSpend: 0,
    lastStayDate: null,
    tags: null,
    mergedFromIds: null,
    guestPhase: "UNKNOWN_CONTACT",
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-06-01T00:00:00Z"),
    deletedAt: null,
    ...over,
  };
}

describe("toWorkspaceGuest", () => {
  it("combines firstName + lastName into a single 'name' field", () => {
    const g = toWorkspaceGuest(makeGuest({ firstName: "Ada", lastName: "Lovelace" }));
    expect(g.name).toBe("Ada Lovelace");
  });

  it("preserves the guestId from the source Guest", () => {
    const g = toWorkspaceGuest(makeGuest({ guestId: "abc-123" }));
    expect(g.guestId).toBe("abc-123");
  });

  it("derives 2-letter initials from firstName + lastName", () => {
    const g = toWorkspaceGuest(makeGuest({ firstName: "John", lastName: "Doe" }));
    expect(g.initials).toBe("JD");
  });

  it("uppercases initials even when source names are lowercase", () => {
    const g = toWorkspaceGuest(makeGuest({ firstName: "john", lastName: "doe" }));
    expect(g.initials).toBe("JD");
  });

  it("handles missing firstName gracefully (returns ??)", () => {
    const g = toWorkspaceGuest(makeGuest({ firstName: null, lastName: "Doe" }));
    expect(g.initials).toBe("?D");
  });

  it("handles missing lastName gracefully (returns J?)", () => {
    const g = toWorkspaceGuest(makeGuest({ firstName: "John", lastName: null }));
    expect(g.initials).toBe("J?");
  });

  it("handles both names missing (returns ??)", () => {
    const g = toWorkspaceGuest(makeGuest({ firstName: null, lastName: null }));
    expect(g.initials).toBe("??");
  });

  it("falls back to 'Unknown Guest' when both names are missing", () => {
    const g = toWorkspaceGuest(makeGuest({ firstName: null, lastName: null }));
    expect(g.name).toBe("Unknown Guest");
  });

  it("falls back to '—' when email is null", () => {
    const g = toWorkspaceGuest(makeGuest({ email: null }));
    expect(g.email).toBe("—");
  });

  it("falls back to '—' when phone is null", () => {
    const g = toWorkspaceGuest(makeGuest({ phone: null }));
    expect(g.phone).toBe("—");
  });

  it("maps totalStays to 'visits'", () => {
    const g = toWorkspaceGuest(makeGuest({ totalStays: 7 }));
    expect(g.visits).toBe(7);
  });

  it("defaults visits to 0 when totalStays is undefined (defensive)", () => {
    const g = toWorkspaceGuest(makeGuest({ totalStays: undefined as unknown as number }));
    expect(g.visits).toBe(0);
  });

  it("formats lastStayDate as 'DD Mon YYYY'", () => {
    const g = toWorkspaceGuest(makeGuest({ lastStayDate: new Date("2026-11-11T00:00:00Z") }));
    expect(g.last).toBe("11 Nov 2026");
  });

  it("returns 'Never' when lastStayDate is null", () => {
    const g = toWorkspaceGuest(makeGuest({ lastStayDate: null }));
    expect(g.last).toBe("Never");
  });

  it("returns 'Never' when lastStayDate is an invalid date string", () => {
    const g = toWorkspaceGuest(makeGuest({ lastStayDate: new Date("invalid") }));
    expect(g.last).toBe("Never");
  });

  it("derives 'VIP' status when vipLevel is non-NONE", () => {
    const g = toWorkspaceGuest(makeGuest({ vipLevel: "GOLD" }));
    expect(g.status).toBe("VIP");
  });

  it("derives 'Returning' status when totalStays >= 2 and vipLevel is NONE", () => {
    const g = toWorkspaceGuest(makeGuest({ vipLevel: "NONE", totalStays: 5 }));
    expect(g.status).toBe("Returning");
  });

  it("derives 'New' status when totalStays < 2 and vipLevel is NONE", () => {
    const g = toWorkspaceGuest(makeGuest({ vipLevel: "NONE", totalStays: 1 }));
    expect(g.status).toBe("New");
  });

  it("uses the provided hotelName parameter", () => {
    const g = toWorkspaceGuest(makeGuest(), "Grand Vista Hotel");
    expect(g.hotel).toBe("Grand Vista Hotel");
  });

  it("defaults hotelName to 'Demo Hotel'", () => {
    const g = toWorkspaceGuest(makeGuest());
    expect(g.hotel).toBe("Demo Hotel");
  });

  it("preserves the raw Guest object on the 'raw' field for the profile screen", () => {
    const source = makeGuest({ firstName: "Test" });
    const g = toWorkspaceGuest(source);
    expect(g.raw).toBe(source);
  });
});

describe("toWorkspaceGuests", () => {
  it("converts a list of Guests in one call", () => {
    const list = [
      makeGuest({ guestId: "1", firstName: "A" }),
      makeGuest({ guestId: "2", firstName: "B" }),
      makeGuest({ guestId: "3", firstName: "C" }),
    ];
    const result = toWorkspaceGuests(list);
    expect(result.length).toBe(3);
    expect(result[0]!.guestId).toBe("1");
    expect(result[1]!.guestId).toBe("2");
    expect(result[2]!.guestId).toBe("3");
  });

  it("returns an empty array for an empty input", () => {
    expect(toWorkspaceGuests([])).toEqual([]);
  });
});
