// =============================================================================
// Phase badge component tests
// =============================================================================

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { PhaseBadge } from "../components/guest/phase-badge";
import type { GuestPhase } from "@gps/shared";

describe("PhaseBadge component", () => {
  // Helper to extract the variant from the rendered badge's class name.
  // The Badge component uses cva to generate class names like:
  //   "bg-success/10 text-success" for variant="success"
  function getVariant(container: ReturnType<typeof render>["container"]): string {
    const badge = container.querySelector("span");
    const cls = badge?.className ?? "";
    if (cls.includes("bg-success")) return "success";
    if (cls.includes("bg-warning")) return "warning";
    if (cls.includes("bg-danger")) return "danger";
    return "default";
  }

  it("IN_HOUSE → success variant (green)", () => {
    const { container } = render(<PhaseBadge phase="IN_HOUSE" />);
    expect(getVariant(container)).toBe("success");
  });

  it("CHECKIN_DAY → warning variant (amber)", () => {
    const { container } = render(<PhaseBadge phase="CHECKIN_DAY" />);
    expect(getVariant(container)).toBe("warning");
  });

  it("PRE_CHECKIN → warning variant (amber)", () => {
    const { container } = render(<PhaseBadge phase="PRE_CHECKIN" />);
    expect(getVariant(container)).toBe("warning");
  });

  it("POST_STAY → default variant (gray)", () => {
    const { container } = render(<PhaseBadge phase="POST_STAY" />);
    expect(getVariant(container)).toBe("default");
  });

  it("IDLE → default variant (gray)", () => {
    const { container } = render(<PhaseBadge phase="IDLE" />);
    expect(getVariant(container)).toBe("default");
  });

  it("UNKNOWN_CONTACT → default variant (gray)", () => {
    const { container } = render(<PhaseBadge phase="UNKNOWN_CONTACT" />);
    expect(getVariant(container)).toBe("default");
  });

  it("ESCALATED → danger variant (red)", () => {
    const { container } = render(<PhaseBadge phase="ESCALATED" />);
    expect(getVariant(container)).toBe("danger");
  });

  it("renders a human-readable label (spaces instead of underscores)", () => {
    const { container } = render(<PhaseBadge phase="PRE_CHECKIN" />);
    expect(container.textContent).toContain("Pre check-in");
  });

  it("IN_HOUSE label is 'In house'", () => {
    const { container } = render(<PhaseBadge phase="IN_HOUSE" />);
    expect(container.textContent).toContain("In house");
  });
});
