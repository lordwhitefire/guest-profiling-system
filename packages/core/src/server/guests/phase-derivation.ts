// =============================================================================
// Phase derivation — Card 3 → guest_phase column
// =============================================================================
// Per PM Plan §14.2. Computed on read from the guest's reservations.
// Never stored (avoids stale data); always derived from current state.

import type { GuestPhase, Reservation } from "@gps/shared";

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/**
 * Derive a guest's phase from their reservations and the current time.
 *
 * Priority (highest first):
 *   1. IN_HOUSE — has a reservation with check_in <= today <= check_out
 *   2. CHECKIN_DAY — has a reservation with check_in == today
 *   3. PRE_CHECKIN — has a future reservation with check_in within 48h
 *   4. POST_STAY — has a recent checkout (within last 7 days)
 *   5. IDLE — has future reservations beyond 48h, OR all reservations are past beyond 7 days
 *   6. UNKNOWN_CONTACT — no reservations at all
 *
 * CANCELLED and NO_SHOW reservations are excluded from consideration.
 *
 * @param reservations - the guest's reservation history (any tenant scope already applied by caller)
 * @param now - the current time (defaults to new Date(); injectable for tests)
 */
export function derivePhase(
  reservations: Reservation[],
  now: Date = new Date(),
): GuestPhase {
  const today = startOfDay(now);
  const twoDaysFromNow = addDays(today, 2);
  const sevenDaysAgo = addDays(today, -7);

  // Exclude cancelled and no-show reservations.
  const activeRes = reservations.filter(
    (r) => r.status !== "CANCELLED" && r.status !== "NO_SHOW",
  );

  if (activeRes.length === 0) {
    return "UNKNOWN_CONTACT";
  }

  // 1. IN_HOUSE — check_in <= today <= check_out
  const inHouse = activeRes.find((r) => {
    const checkIn = startOfDay(r.checkIn);
    const checkOut = startOfDay(r.checkOut);
    return checkIn <= today && today <= checkOut;
  });
  if (inHouse) return "IN_HOUSE";

  // 2. CHECKIN_DAY — check_in == today
  const todayCheckin = activeRes.find((r) => {
    return startOfDay(r.checkIn).getTime() === today.getTime();
  });
  if (todayCheckin) return "CHECKIN_DAY";

  // 3. PRE_CHECKIN — future check_in within 48h
  const upcoming = activeRes.find((r) => {
    const checkIn = startOfDay(r.checkIn);
    return checkIn > today && checkIn <= twoDaysFromNow;
  });
  if (upcoming) return "PRE_CHECKIN";

  // 4. POST_STAY — checkout within last 7 days
  const recentCheckout = activeRes.find((r) => {
    const checkOut = startOfDay(r.checkOut);
    return checkOut < today && checkOut >= sevenDaysAgo;
  });
  if (recentCheckout) return "POST_STAY";

  // 5. IDLE — has reservations but none of the above states apply
  // (covers: future booking beyond 48h, OR all past beyond 7 days)
  return "IDLE";
}
