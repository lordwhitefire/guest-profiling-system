// =============================================================================
// Phase badge — renders a guest_phase value with the correct variant
// =============================================================================
// Per PM Plan §14.4 / task.md:
//   IN_HOUSE         → success (green)
//   CHECKIN_DAY      → warning (amber)
//   PRE_CHECKIN      → warning (amber)
//   POST_STAY        → default (gray)
//   IDLE             → default (gray)
//   UNKNOWN_CONTACT  → default (gray)
//   ESCALATED        → danger (red)

import { Badge } from "@/components/ui/badge";
import type { GuestPhase } from "@gps/shared";

const PHASE_VARIANT: Record<
  GuestPhase,
  "default" | "success" | "warning" | "danger"
> = {
  IN_HOUSE: "success",
  CHECKIN_DAY: "warning",
  PRE_CHECKIN: "warning",
  POST_STAY: "default",
  IDLE: "default",
  UNKNOWN_CONTACT: "default",
  ESCALATED: "danger",
  // Phases that don't appear in the API but are in the type:
  ACQUIRING: "default",
  BOOKING_RECEIVED: "default",
  WELCOME_SENT: "default",
  INFO_SENT: "default",
  UPSELL: "default",
};

// Human-readable labels (spaces instead of underscores).
const PHASE_LABEL: Record<GuestPhase, string> = {
  UNKNOWN_CONTACT: "Unknown",
  ACQUIRING: "Acquiring",
  BOOKING_RECEIVED: "Booking received",
  WELCOME_SENT: "Welcome sent",
  INFO_SENT: "Info sent",
  IDLE: "Idle",
  UPSELL: "Upsell",
  PRE_CHECKIN: "Pre check-in",
  CHECKIN_DAY: "Check-in day",
  IN_HOUSE: "In house",
  POST_STAY: "Post stay",
  ESCALATED: "Escalated",
};

export interface PhaseBadgeProps {
  phase: GuestPhase;
  className?: string;
}

export function PhaseBadge({ phase, className }: PhaseBadgeProps) {
  const variant = PHASE_VARIANT[phase] ?? "default";
  const label = PHASE_LABEL[phase] ?? phase;
  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}
