"use client";

// =============================================================================
// Profile detail — right pane: full guest detail
// =============================================================================
// Renders all 5 sections per task.md:
//   1. Header (avatar, name, phase badge, last stay date)
//   2. Contact (email mailto, phone tel, address)
//   3. Preferences (JSONB as key-value pairs)
//   4. Reservations (last 5, sorted by check_in DESC)
//   5. Loyalty (tier, points, total stays)
//   6. Action: Fill form button (disabled placeholder — TASK-006 enables it)
//
// NEVER displays identity_doc_* (Card 2 §4.4 — sensitive-field stripping
// already done at the API layer; this component does not even attempt to
// render them).

import { useEffect, useState } from "react";
import { api, ApiError, type LoyaltyResponse } from "@/lib/api-client";
import type { Guest, Reservation } from "@gps/shared";
import { Avatar } from "./avatar";
import { PhaseBadge } from "./phase-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export interface ProfileDetailProps {
  guest: Guest;
}

export function ProfileDetail({ guest }: ProfileDetailProps) {
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
              {guest.vipLevel !== "NONE" && (
                <Badge variant="default">{guest.vipLevel}</Badge>
              )}
              {guest.lastStayDate && (
                <span className="text-sm text-ink-500">
                  Last stay: {guest.lastStayDate.toISOString().slice(0, 10)}
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
              <dd>{guest.dateOfBirth.toISOString().slice(0, 10)}</dd>
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

      {/* 3. Preferences */}
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

      {/* 4. Reservations */}
      <Card>
        <h3 className="font-heading text-lg font-semibold text-ink-900 mb-3">
          Recent reservations
        </h3>
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
                    {r.checkIn.toISOString().slice(0, 10)} → {r.checkOut.toISOString().slice(0, 10)}
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

      {/* 5. Loyalty */}
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
            <div className="text-sm text-ink-600">
              <span className="font-medium text-ink-900">{loyalty.totalStays}</span> total stays
            </div>
          </div>
        ) : (
          <p className="text-sm text-ink-500">No loyalty profile.</p>
        )}
      </Card>

      {/* 6. Action — Fill form (placeholder; TASK-006 enables it) */}
      <div className="flex justify-end">
        <Button
          variant="primary"
          disabled
          onClick={() => toast.info("Form fill will be available after TASK-006.")}
          title="Browser extension form-fill — TASK-006"
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
