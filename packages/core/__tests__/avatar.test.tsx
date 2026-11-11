// =============================================================================
// Avatar component tests
// =============================================================================

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Avatar } from "../components/guest/avatar";

describe("Avatar component", () => {
  it("renders initials (first letter of first_name + first letter of last_name)", () => {
    const { container } = render(
      <Avatar firstName="John" lastName="Doe" seed="g1" />,
    );
    const avatar = container.querySelector("div[aria-hidden='true']");
    expect(avatar?.textContent).toBe("JD");
  });

  it("uppercases the initials", () => {
    const { container } = render(
      <Avatar firstName="jane" lastName="smith" seed="g2" />,
    );
    const avatar = container.querySelector("div[aria-hidden='true']");
    expect(avatar?.textContent).toBe("JS");
  });

  it("falls back to '?' when both names are null", () => {
    const { container } = render(
      <Avatar firstName={null} lastName={null} seed="g3" />,
    );
    const avatar = container.querySelector("div[aria-hidden='true']");
    expect(avatar?.textContent).toBe("?");
  });

  it("falls back to '?' when first_name is null but last_name is set", () => {
    const { container } = render(
      <Avatar firstName={null} lastName="Smith" seed="g4" />,
    );
    const avatar = container.querySelector("div[aria-hidden='true']");
    expect(avatar?.textContent).toBe("?S");
  });

  it("falls back to '?' when last_name is null but first_name is set", () => {
    const { container } = render(
      <Avatar firstName="John" lastName={null} seed="g5" />,
    );
    const avatar = container.querySelector("div[aria-hidden='true']");
    expect(avatar?.textContent).toBe("J?");
  });

  it("uses a deterministic background color from the seed", () => {
    const { container: c1 } = render(
      <Avatar firstName="A" lastName="B" seed="same-seed" />,
    );
    const { container: c2 } = render(
      <Avatar firstName="C" lastName="D" seed="same-seed" />,
    );
    const bg1 = c1.querySelector("div[aria-hidden='true']") as HTMLElement;
    const bg2 = c2.querySelector("div[aria-hidden='true']") as HTMLElement;
    expect(bg1.style.backgroundColor).toBe(bg2.style.backgroundColor);
  });

  it("uses a different background color for different seeds", () => {
    const { container: c1 } = render(
      <Avatar firstName="A" lastName="B" seed="seed-1" />,
    );
    const { container: c2 } = render(
      <Avatar firstName="A" lastName="B" seed="seed-2" />,
    );
    const bg1 = c1.querySelector("div[aria-hidden='true']") as HTMLElement;
    const bg2 = c2.querySelector("div[aria-hidden='true']") as HTMLElement;
    // Note: there's a small chance two seeds hash to the same color.
    // This test should pass most of the time; if it flakes, switch to a
    // different pair of seeds.
    expect(bg1.style.backgroundColor).not.toBe(bg2.style.backgroundColor);
  });

  it("uses the default size of 40px when size prop is not provided", () => {
    const { container } = render(
      <Avatar firstName="A" lastName="B" seed="g6" />,
    );
    const avatar = container.querySelector("div[aria-hidden='true']") as HTMLElement;
    expect(avatar.style.width).toBe("40px");
    expect(avatar.style.height).toBe("40px");
  });

  it("uses the provided size when size prop is set", () => {
    const { container } = render(
      <Avatar firstName="A" lastName="B" seed="g7" size={56} />,
    );
    const avatar = container.querySelector("div[aria-hidden='true']") as HTMLElement;
    expect(avatar.style.width).toBe("56px");
    expect(avatar.style.height).toBe("56px");
  });
});
