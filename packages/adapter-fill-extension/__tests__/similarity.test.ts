// =============================================================================
// Similarity tests — Dice coefficient + Jaro-Winkler + max
// =============================================================================

import { describe, it, expect } from "vitest";
import { diceCoefficient, jaroWinkler, maxFuzzySimilarity } from "../src/matching/similarity.js";

describe("diceCoefficient", () => {
  it("returns 1.0 for identical strings", () => {
    expect(diceCoefficient("first name", "first name")).toBe(1.0);
    expect(diceCoefficient("email", "email")).toBe(1.0);
  });

  it("returns 0.0 for completely different strings", () => {
    expect(diceCoefficient("abc", "xyz")).toBe(0.0);
  });

  it("returns 0.0 for strings shorter than 2 chars", () => {
    expect(diceCoefficient("a", "ab")).toBe(0.0);
    expect(diceCoefficient("ab", "a")).toBe(0.0);
    expect(diceCoefficient("", "")).toBe(0.0);
  });

  it("gives high score for strings sharing most bigrams", () => {
    const score = diceCoefficient("first name", "first nam");
    expect(score).toBeGreaterThan(0.8);
  });

  it("gives partial score for strings with some shared bigrams", () => {
    const score = diceCoefficient("email", "emale");
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });

  it("is symmetric — dice(a, b) === dice(b, a)", () => {
    const a = diceCoefficient("first name", "firstname");
    const b = diceCoefficient("firstname", "first name");
    expect(a).toBeCloseTo(b, 5);
  });
});

describe("jaroWinkler", () => {
  it("returns 1.0 for identical strings", () => {
    expect(jaroWinkler("first name", "first name")).toBe(1.0);
    expect(jaroWinkler("email", "email")).toBe(1.0);
  });

  it("returns 0.0 for completely different strings", () => {
    expect(jaroWinkler("abc", "xyz")).toBe(0.0);
  });

  it("returns 0.0 for empty strings", () => {
    expect(jaroWinkler("", "")).toBe(0.0);
    expect(jaroWinkler("abc", "")).toBe(0.0);
  });

  it("gives high score for strings with common prefix", () => {
    const score = jaroWinkler("martha", "marhta");
    expect(score).toBeGreaterThan(0.9);
  });

  it("gives high score for strings with same characters in different order (via Dice)", () => {
    // Jaro-Winkler is prefix-biased, so "first name" vs "name first" gets a
    // low JW score. But Dice coefficient on bigrams catches the similarity.
    const diceScore = diceCoefficient("first name", "name first");
    expect(diceScore).toBeGreaterThan(0.5);
    // And the max() of the two should be > 0.5 because Dice wins.
    const max = maxFuzzySimilarity("first name", "name first");
    expect(max).toBeGreaterThan(0.5);
  });

  it("is symmetric — jw(a, b) === jw(b, a)", () => {
    const a = jaroWinkler("martha", "marhta");
    const b = jaroWinkler("marhta", "martha");
    expect(a).toBeCloseTo(b, 5);
  });
});

describe("maxFuzzySimilarity", () => {
  it("returns 1.0 for identical strings (both Dice and JW are 1.0)", () => {
    expect(maxFuzzySimilarity("first name", "first name")).toBe(1.0);
  });

  it("returns 0.0 for completely different strings", () => {
    expect(maxFuzzySimilarity("abc", "xyz")).toBe(0.0);
  });

  it("takes the max of Dice and Jaro-Winkler", () => {
    // For "first name" vs "firstname": Dice is high (shares most bigrams),
    // JW is also high (common prefix). max should be > 0.8.
    const score = maxFuzzySimilarity("first name", "firstname");
    expect(score).toBeGreaterThan(0.8);
  });

  it("returns a value in [0, 1] for any input", () => {
    const cases = [
      ["first name", "first name"],
      ["email", "phone"],
      ["address", "addr"],
      ["x", "y"],
      ["", ""],
      ["a", "ab"],
    ];
    for (const [a, b] of cases) {
      const score = maxFuzzySimilarity(a, b);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    }
  });
});
