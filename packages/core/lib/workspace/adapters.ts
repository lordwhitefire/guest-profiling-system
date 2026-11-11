// =============================================================================
// Workspace data adapters — converts real API Guest objects to the simpler
// shape the 17-screen workspace UI expects.
// =============================================================================
// Background: the workspace UI was originally built against a mock array
// (GUESTS constant) with these fields:
//   { name, initials, email, phone, visits, last, hotel, status, room }
//
// The real Guest type (from @gps/shared) has many more fields and uses
// camelCase. Rather than rewrite all 17 screens, this adapter converts
// real Guest objects to the simpler shape the UI already consumes.
//
// This keeps the slice small and reversible. A future UI refresh can
// replace this adapter with a real Guest-typed UI; until then, the UI
// shows real data through a thin compatibility layer.

import type { Guest, GuestPhase, VipLevel } from "@gps/shared";

export interface WorkspaceGuest {
  /** Real guest_id from the API (used to fetch profile, reservations, loyalty) */
  guestId: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  visits: number;
  last: string;
  hotel: string;
  status: "VIP" | "Returning" | "New";
  room: string;
  /** Raw guest object — kept for the profile screen to display full info */
  raw: Guest;
}

/** Format an ISO date as "DD Mon YYYY" (e.g., "11 Nov 2026"). */
function formatLastStay(date: Date | string | null): string {
  if (!date) return "Never";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "Never";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Derive 2-letter initials from first + last name. Missing letters become '?'. */
function deriveInitials(first: string | null, last: string | null): string {
  const f = (first ?? "").trim()[0];
  const l = (last ?? "").trim()[0];
  const a = f ? f.toUpperCase() : "?";
  const b = l ? l.toUpperCase() : "?";
  return a + b;
}

/** Derive a status pill from VIP level + total stays (heuristic). */
function deriveStatus(vip: VipLevel, totalStays: number): WorkspaceGuest["status"] {
  if (vip && vip !== "NONE") return "VIP";
  if (totalStays >= 2) return "Returning";
  return "New";
}

/**
 * Convert a real Guest (from the API) into the simpler WorkspaceGuest
 * shape that the 17-screen UI consumes.
 *
 * For the hotel/room fields, we use what's available. In v1 these are not
 * in the Guest type itself (they live in Reservation); we surface a "-"
 * placeholder until the UI is redesigned to show reservation-linked data.
 */
export function toWorkspaceGuest(g: Guest, hotelName = "Demo Hotel"): WorkspaceGuest {
  const name = [g.firstName, g.lastName].filter(Boolean).join(" ") || "Unknown Guest";
  return {
    guestId: g.guestId,
    name,
    initials: deriveInitials(g.firstName, g.lastName),
    email: g.email ?? "—",
    phone: g.phone ?? "—",
    visits: g.totalStays ?? 0,
    last: formatLastStay(g.lastStayDate),
    hotel: hotelName,
    status: deriveStatus(g.vipLevel, g.totalStays ?? 0),
    room: "—",
    raw: g,
  };
}

/** Convert a list of Guests in one call. */
export function toWorkspaceGuests(
  guests: Guest[],
  hotelName = "Demo Hotel",
): WorkspaceGuest[] {
  return guests.map((g) => toWorkspaceGuest(g, hotelName));
}
