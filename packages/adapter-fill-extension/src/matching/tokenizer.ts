// =============================================================================
// Tokenizer — lowercase + split + abbreviation expansion
// =============================================================================
// Per Card 5 §7.1: "For each [field], it extracts five signals (label,
// placeholder, name, id, legend) and normalizes them by tokenizing against
// an abbreviation dictionary."
//
// The tokenizer is intentionally simple: lowercase, replace non-alphanumeric
// runs with single spaces, expand known abbreviations, return the token list
// AND the rejoined normalized phrase. Both forms are used by the scorer:
//   - token list: fuzzy matching (Dice coefficient needs token sets)
//   - normalized phrase: exact-phrase comparison
//
// No external dependencies — keeps the extension bundle small.

/** Abbreviation dictionary. Keys are lowercase abbreviations; values are
 *  their expansions. Add hotel-specific terms here. */
const ABBREVIATIONS: Record<string, string> = {
  "fn": "first name",
  "ln": "last name",
  "fname": "first name",
  "lname": "last name",
  "dob": "date of birth",
  "tel": "telephone",
  "ph": "phone",
  "no": "number",
  "num": "number",
  "apt": "apartment",
  "ste": "suite",
  "bldg": "building",
  "co": "company",
  "org": "organization",
  "addr": "address",
  "st": "street",
  "ave": "avenue",
  "rd": "road",
  "ct": "city",
  // 'st' is overloaded — context-dependent. We keep "street" as the
  // expansion because that's by far the most common usage on registration
  // forms. The scorer's negative-pattern check disambiguates state vs street
  // when needed.
  "zip": "postal code",
  "pc": "postal code",
  "postcode": "postal code",
  "e-mail": "email",
  "e_mail": "email",
  "emailaddr": "email address",
  "phonenum": "phone number",
  "mobilenum": "mobile number",
  "dobdate": "date of birth",
};

export interface TokenizerResult {
  /** Lowercase, normalized phrase — used for exact-phrase matching. */
  phrase: string;
  /** Token list — used for fuzzy matching (Dice, Jaro-Winkler). */
  tokens: string[];
}

/**
 * Tokenize a raw string from a form field signal (label, placeholder, etc.).
 *
 * Steps:
 *   1. Lowercase
 *   2. Split on any non-alphanumeric run (spaces, dashes, underscores, etc.)
 *   3. Expand abbreviations using the dictionary above
 *   4. Re-join with single spaces → normalized phrase
 *
 * Returns the phrase (string) and the token list (string[]). Both are
 * safe to compare across signals because the normalization is deterministic.
 */
export function tokenize(raw: string | null | undefined): TokenizerResult {
  if (raw === null || raw === undefined) return { phrase: "", tokens: [] };

  const lower = String(raw).toLowerCase().trim();
  if (lower.length === 0) return { phrase: "", tokens: [] };

  // Split on non-alphanumeric runs
  const rawTokens = lower.split(/[^a-z0-9]+/).filter((t) => t.length > 0);

  // Expand abbreviations inline
  const expanded: string[] = [];
  for (const t of rawTokens) {
    if (ABBREVIATIONS[t]) {
      // The expansion may itself contain spaces — split again.
      const sub = ABBREVIATIONS[t].split(/\s+/).filter((s) => s.length > 0);
      expanded.push(...sub);
    } else {
      expanded.push(t);
    }
  }

  return {
    phrase: expanded.join(" "),
    tokens: expanded,
  };
}
