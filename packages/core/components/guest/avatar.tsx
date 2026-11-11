// =============================================================================
// Avatar — initials in a colored circle
// =============================================================================
// 40px circle; background color is deterministic from a string (guest_id or
// fallback to email). Initials = first letter of first_name + first letter
// of last_name, uppercased. Fallback: "?" when names are null.

import { clsx } from "clsx";

const AVATAR_COLORS = [
  "#1B6B7A", // accent (deep teal)
  "#5B8DB8", // accent-muted (lighter blue)
  "#D97706", // warning (amber)
  "#16A34A", // success (green)
  "#7C3AED", // purple
  "#DC2626", // danger (red)
  "#0891B2", // cyan
  "#9333EA", // violet
];

/**
 * Deterministic hash of a string → index into AVATAR_COLORS.
 * Same input always produces the same color.
 */
function colorForString(s: string): string {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx]!;
}

function getInitials(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
): string {
  const f = (firstName ?? "").trim()[0] ?? "";
  const l = (lastName ?? "").trim()[0] ?? "";
  // If both names are missing, return "?" alone.
  if (!f && !l) return "?";
  // Otherwise, use "?" for any missing name (so "?S" or "J?" reads correctly).
  const fChar = f || "?";
  const lChar = l || "?";
  const initials = `${fChar}${lChar}`.toUpperCase();
  return initials;
}

export interface AvatarProps {
  firstName?: string | null;
  lastName?: string | null;
  /** The seed for the background color (typically guest_id or email). */
  seed: string;
  /** Avatar size in pixels. Default 40. */
  size?: number;
  className?: string;
}

export function Avatar({
  firstName,
  lastName,
  seed,
  size = 40,
  className,
}: AvatarProps) {
  const initials = getInitials(firstName, lastName);
  const bgColor = colorForString(seed || initials);

  return (
    <div
      className={clsx(
        "inline-flex items-center justify-center rounded-full font-medium text-white select-none",
        className,
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: bgColor,
        fontSize: size * 0.4,
      }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}
