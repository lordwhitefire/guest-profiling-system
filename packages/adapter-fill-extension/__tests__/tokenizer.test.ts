// =============================================================================
// Tokenizer tests
// =============================================================================

import { describe, it, expect } from "vitest";
import { tokenize } from "../src/matching/tokenizer.js";

describe("tokenizer", () => {
  it("returns empty result for null/undefined/empty input", () => {
    expect(tokenize(null)).toEqual({ phrase: "", tokens: [] });
    expect(tokenize(undefined)).toEqual({ phrase: "", tokens: [] });
    expect(tokenize("")).toEqual({ phrase: "", tokens: [] });
    expect(tokenize("   ")).toEqual({ phrase: "", tokens: [] });
  });

  it("lowercases input", () => {
    expect(tokenize("FIRST NAME").phrase).toBe("first name");
    expect(tokenize("Email Address").phrase).toBe("email address");
  });

  it("splits on spaces, dashes, underscores, and other non-alphanumeric runs", () => {
    expect(tokenize("first-name").tokens).toEqual(["first", "name"]);
    expect(tokenize("first_name").tokens).toEqual(["first", "name"]);
    expect(tokenize("first.name").tokens).toEqual(["first", "name"]);
    expect(tokenize("first name").tokens).toEqual(["first", "name"]);
    expect(tokenize("first  name").tokens).toEqual(["first", "name"]);
  });

  it("expands 'fn' abbreviation to 'first name'", () => {
    expect(tokenize("fn").phrase).toBe("first name");
  });

  it("expands 'ln' abbreviation to 'last name'", () => {
    expect(tokenize("ln").phrase).toBe("last name");
  });

  it("expands 'dob' abbreviation to 'date of birth'", () => {
    expect(tokenize("dob").phrase).toBe("date of birth");
  });

  it("expands 'tel' abbreviation to 'telephone'", () => {
    expect(tokenize("tel").phrase).toBe("telephone");
  });

  it("expands 'ph' abbreviation to 'phone'", () => {
    expect(tokenize("ph").phrase).toBe("phone");
  });

  it("expands 'apt' abbreviation to 'apartment'", () => {
    expect(tokenize("apt").phrase).toBe("apartment");
  });

  it("expands 'zip' abbreviation to 'postal code'", () => {
    expect(tokenize("zip").phrase).toBe("postal code");
  });

  it("expands abbreviations inline within larger phrases", () => {
    expect(tokenize("apt 1").phrase).toBe("apartment 1");
    expect(tokenize("fn label").phrase).toBe("first name label");
  });

  it("preserves the original token list after abbreviation expansion", () => {
    expect(tokenize("first name").tokens).toEqual(["first", "name"]);
    expect(tokenize("apt 5").tokens).toEqual(["apartment", "5"]);
  });

  it("preserves numbers in tokens", () => {
    expect(tokenize("address line 2").tokens).toEqual(["address", "line", "2"]);
    expect(tokenize("apt5").tokens).toEqual(["apt5"]);
  });

  it("is deterministic — same input produces same output", () => {
    const a = tokenize("First Name");
    const b = tokenize("First Name");
    expect(a).toEqual(b);
  });
});
