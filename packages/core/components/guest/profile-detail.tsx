"use client";

// =============================================================================
// Profile detail — right pane: full guest detail
// =============================================================================
// Renders all 5 sections per task.md:
//   1. Header (avatar, name, phase badge, last stay date)
//   2. Contact (email mailto, phone tel, address)
//   3. Preferences (JSONB as key-value pairs)
//   4. Visit history (derived from guest_profile_links; one link = one visit)
//   5. Reservations (last 5, sorted by check_in DESC)
//   6. Loyalty (tier and points; not used for visit count)
//   7. Action: send the guest to the FormFilla browser extension
//
// NEVER displays identity_doc_* (Card 2 §4.4 — sensitive-field stripping
// already done at the API layer; this component does not even attempt to
// render them).

import { useEffect, useState } from "react";
import { api, ApiError, type LoyaltyResponse } from "@/lib/api-client";
import type { Guest, GuestVisit, Reservation } from "@gps/shared";
import { Avatar } from "./avatar";
import { PhaseBadge } from "./phase-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { storeGuestInExtension } from "@/lib/extension-bridge";

export interface ProfileDetailProps {
  guest: Guest;
  /** Derived visits fetched by the standalone profile page. */
  visits?: GuestVisit[];
  /** Global derived count, which can exceed the fetched page size. */
  visitTotal?: number;
  /** Non-fatal visit-history load error; the rest of the profile still renders. */
  visitsError?: string | null;
}

// Server-fetched JSON gives dates as ISO strings, while client-side API data
// can give Date objects. Format both without assuming a method exists.
function isoDay(value: unknown): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString().slice(0, 10);
}

export function ProfileDetail({
  guest,
  visits = [],
  visitTotal,
  visitsError = null,
}: ProfileDetailProps) {
  const [reservations, setReservations] = useState<Reservation[] | null>(null);
  const [loyalty, setLoyalty] = useState<LoyaltyResponse | null>(null);
  const [loadingSpokes, setLoadingSpokes] = useState(true);

  // Fetch linked spokes (reservations + loyalty) in parallel.
  useEffect(() => {
    let cancelled = false;
    setLoadingSpokes(true);

    Promise.all([
      api.getReservations(guest.guestId, 5).catch((err) => {
        console.error("[profile-detail] Failed to fetch reservations:", err);
        return [] as Reservation[];
      }),
      api.getLoyalty(guest.guestId).catch((err) => {
        // 404 is expected when the guest has no loyalty profile — not an error.
        if (err instanceof ApiError && err.code === "NOT_FOUND") return null;
        console.error("[profile-detail] Failed to fetch loyalty:", err);
        return null;
      }),
    ]).then(([res, loy]) => {
      if (cancelled) return;
      setReservations(res);
      setLoyalty(loy);
      setLoadingSpokes(false);
    });

    return () => {
      cancelled = true;
    };
  }, [guest.guestId]);

  const fullName = [guest.firstName, guest.lastName].filter(Boolean).join(" ") || "Unknown guest";
  const initials = `${(guest.firstName ?? "?")[0] ?? "?"}${(guest.lastName ?? "?")[0] ?? "?"}`;
  const totalVisits = visitTotal ?? guest.totalStays;

  // Send this guest to the FormFilla extension. Delivery is confirmed by the
  // extension's content script; without it we say so instead of claiming success.
  const fillRegistrationForm = async () => {
    const delivered = await storeGuestInExtension({
      guest: {
        guestId: guest.guestId,
        firstName: guest.firstName,
        lastName: guest.lastName,
        fullName: [guest.firstName, guest.lastName].filter(Boolean).join(" ") || null,
        email: guest.email,
        phone: guest.phone,
        dateOfBirth: guest.dateOfBirth ? isoDay(guest.dateOfBirth) : null,
        nationality: guest.nationality,
        addressLine1: guest.addressLine1,
        addressLine2: guest.addressLine2,
        city: guest.city,
        state: guest.state,
        postalCode: guest.postalCode,
        country: guest.country,
        company: null,
        notes: null,
      },
      storedAt: Date.now(),
    });
    if (delivered) {
      toast.success("Guest prepared. Open the hotel's registration form and click the extension icon.");
    } else {
      toast.error("Extension not detected. Install and enable the Guest Profiling extension, then try again.");
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <Card>
        <div className="flex items-start gap-4">
          <Avatar
            firstName={guest.firstName}
            lastName={guest.lastName}
            seed={guest.guestId}
            size={56}
          />
          <div className="flex-1 min-w-0">
            <h2 className="font-heading text-2xl font-bold text-ink-900">
              {fullName}
            </h2>
            <div className="mt-1 flex items-center gap-3 flex-wrap">
              <PhaseBadge phase={guest.guestPhase} />
              <span className="text-sm text-ink-500">
                {totalVisits} visit{totalVisits === 1 ? "" : "s"}
              </span>
              {guest.vipLevel !== "NONE" && (
                <Badge variant="default">{guest.vipLevel}</Badge>
              )}
              {guest.lastStayDate && (
                <span className="text-sm text-ink-500">
                  Last stay: {isoDay(guest.lastStayDate)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Contact */}
      <Card>
        <h3 className="font-heading text-lg font-semibold text-ink-900 mb-3">
          Contact
        </h3>
        <dl className="space-y-2 text-sm">
          {guest.email && (
            <div className="flex gap-3">
              <dt className="w-20 text-ink-500">Email</dt>
              <dd>
                <a
                  href={`mailto:${guest.email}`}
                  className="text-accent hover:underline"
                >
                  {guest.email}
                </a>
              </dd>
            </div>
          )}
          {guest.phone && (
            <div className="flex gap-3">
              <dt className="w-20 text-ink-500">Phone</dt>
              <dd>
                <a
                  href={`tel:${guest.phone}`}
                  className="text-accent hover:underline"
                >
                  {guest.phone}
                </a>
              </dd>
            </div>
          )}
          {(guest.addressLine1 || guest.city || guest.country) && (
            <div className="flex gap-3">
              <dt className="w-20 text-ink-500">Address</dt>
              <dd className="space-y-1">
                {guest.addressLine1 && <div>{guest.addressLine1}</div>}
                {guest.addressLine2 && <div>{guest.addressLine2}</div>}
                {guest.city && <div>{guest.city}</div>}
                {guest.state && <div>{guest.state}</div>}
                {guest.postalCode && <div>{guest.postalCode}</div>}
                {guest.country && <div>{guest.country}</div>}
              </dd>
            </div>
          )}
          {guest.dateOfBirth && (
            <div className="flex gap-3">
              <dt className="w-20 text-ink-500">DOB</dt>
              <dd>{isoDay(guest.dateOfBirth)}</dd>
            </div>
          )}
          {guest.nationality && (
            <div className="flex gap-3">
              <dt className="w-20 text-ink-500">Nationality</dt>
              <dd>{guest.nationality}</dd>
            </div>
          )}
        </dl>
      </Card>

      {/* 3. Visit history — derived from guest_profile_links */}
      <Card>
        <h3 className="font-heading text-lg font-semibold text-ink-900 mb-1">
          Visit history
        </h3>
        <p className="text-sm text-ink-500 mb-3">
          Derived from {totalVisits} raw hotel row{totalVisits === 1 ? "" : "s"}. The hotel
          database has no visit table; each linked row is one visit.
        </p>
        {visitsError ? (
          <p className="text-sm text-ink-500">
            Could not load the full visit list. {visitsError}
          </p>
        ) : visits.length === 0 ? (
          <p className="text-sm text-ink-500">No visits recorded.</p>
        ) : (
          <>
            <ul className="space-y-2">
              {visits.map((visit) => (
                <li
                  key={visit.visitId}
                  className="flex items-center justify-between gap-3 py-2 border-b border-ink-100 last:border-b-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink-900">
                      {isoDay(visit.occurredAt ?? visit.linkedAt)}
                    </div>
                    <div className="text-xs text-ink-500">
                      {visit.sourceTable} #{visit.sourceRowId}
                    </div>
                  </div>
                  {visit.email && (
                    <span className="text-xs text-ink-500 truncate max-w-[12rem]">
                      {visit.email}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            {visits.length < totalVisits && (
              <p className="text-xs text-ink-500 mt-3">
                Showing {visits.length} of {totalVisits} visits.
              </p>
            )}
          </>
        )}
      </Card>

      {/* 4. Preferences */}
      {guest.preferences && Object.keys(guest.preferences).length > 0 && (
        <Card>
          <h3 className="font-heading text-lg font-semibold text-ink-900 mb-3">
            Preferences
          </h3>
          <dl className="space-y-2 text-sm">
            {Object.entries(guest.preferences).map(([key, value]) => (
              <div key={key} className="flex gap-3">
                <dt className="w-32 text-ink-500 capitalize">{key.replace(/_/g, " ")}</dt>
                <dd>{String(value)}</dd>
              </div>
            ))}
          </dl>
        </Card>
      )}

      {/* 5. Reservations */}
      <Card>
        <h3 className="font-heading text-lg font-semibold text-ink-900 mb-3">
          Recent reservations
        </h3>
        <p className="text-xs text-ink-500 mb-3">
          Reservations are a separate record; the visit count above comes from derived raw links.
        </p>
        {loadingSpokes ? (
          <ReservationsSkeleton />
        ) : reservations && reservations.length > 0 ? (
          <ul className="space-y-2">
            {reservations.map((r) => (
              <li
                key={r.reservationId}
                className="flex items-center justify-between gap-3 py-2 border-b border-ink-100 last:border-b-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-ink-900">
                    {isoDay(r.checkIn)} → {isoDay(r.checkOut)}
                  </div>
                  <div className="text-xs text-ink-500">
                    {r.roomType ?? "Room type N/A"}
                    {r.numGuests > 1 ? ` · ${r.numGuests} guests` : ""}
                  </div>
                </div>
                <Badge
                  variant={
                    r.status === "CHECKED_IN" ? "success" :
                    r.status === "CANCELLED" ? "danger" :
                    r.status === "NO_SHOW" ? "warning" :
                    "default"
                  }
                >
                  {r.status.replace(/_/g, " ").toLowerCase()}
                </Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-500">No reservations on file.</p>
        )}
      </Card>

      {/* 6. Loyalty */}
      <Card>
        <h3 className="font-heading text-lg font-semibold text-ink-900 mb-3">
          Loyalty
        </h3>
        {loadingSpokes ? (
          <div className="skeleton h-12 w-full" />
        ) : loyalty ? (
          <div className="flex items-center gap-4">
            {loyalty.tier !== "NONE" && (
              <Badge variant="default">{loyalty.tier}</Badge>
            )}
            <div className="text-sm text-ink-600">
              <span className="font-medium text-ink-900">{loyalty.pointsBalance}</span> points
            </div>
          </div>
        ) : (
          <p className="text-sm text-ink-500">No loyalty profile.</p>
        )}
      </Card>

      {/* 7. Action — send this guest to the browser extension */}
      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={fillRegistrationForm}
          title="Send this guest to the Guest Profiling browser extension"
        >
          Fill registration form
        </Button>
      </div>
    </div>
  );
}

function ReservationsSkeleton() {
  return (
    <ul className="space-y-2">
      {[0, 1, 2].map((i) => (
        <li
          key={i}
          className="flex items-center justify-between gap-3 py-2"
        >
          <div className="flex-1 space-y-1">
            <div className="skeleton h-4 w-32" />
            <div className="skeleton h-3 w-24" />
          </div>
          <div className="skeleton h-6 w-20 rounded-full" />
        </li>
      ))}
    </ul>
  );
}
