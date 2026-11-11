// =============================================================================
// Scanner — DOM walker that extracts FieldSignals from form fields
// =============================================================================
// Per Card 5 §7.1: "recursively walks the active DOM subtree (including
// same-origin iframes) and detects all input, select, textarea, and
// combobox elements. For each, it extracts five signals (label, placeholder,
// name, id, legend) and normalizes them by tokenizing against an abbreviation
// dictionary."
//
// Output: FieldSignals[] — one per detected form field.
//
// Browser-only. This module MUST be importable from the content script.
// It accesses `document` directly. In tests, we pass a mock document.
//
// IMPORTANT: this scanner never writes to the DOM. It only reads. Writes
// happen in the Framework Setter (native-setter.ts).

import { tokenize, type TokenizerResult } from "./tokenizer.js";

export type FieldType = "text" | "email" | "tel" | "number" | "date" | "datetime-local" | "password" | "url" | "search" | "select-one" | "select-multiple" | "textarea" | "checkbox" | "radio" | "unknown";

export interface FieldSignals {
  /** Stable identifier for debugging — typically element's id or a synthetic index. */
  debugId: string;
  /** The five raw signal sources, as captured from the DOM. */
  raw: {
    label: string | null;
    placeholder: string | null;
    name: string | null;
    id: string | null;
    legend: string | null;
  };
  /** Tokenized + normalized versions of each signal. */
  normalized: {
    label: TokenizerResult;
    placeholder: TokenizerResult;
    name: TokenizerResult;
    id: TokenizerResult;
    legend: TokenizerResult;
  };
  /** HTML autocomplete attribute value (e.g. "given-name", "email"). */
  autocomplete: string | null;
  /** Input type attribute. null means no type attr (defaults to "text"). */
  type: FieldType;
  /** Tag name in lowercase ("input", "select", "textarea"). */
  tagName: string;
  /** Block type for repeated blocks (e.g. "guest", "address"). null if not in a block. */
  blockType: string | null;
  /** Index within the block (0-based). null if not in a block. */
  blockIndex: number | null;
  /** The live element reference — kept so the setter can write to it later. */
  element: Element;
}

/**
 * Walk the DOM subtree under `root` and collect form fields.
 *
 * Same-origin iframes are walked recursively (per Card 5 §7.1). Cross-origin
 * iframes are skipped — they're invisible to the content script and would
 * need their own content script injection.
 *
 * @param root The root element to walk. Default: document.body.
 * @param visited Set of roots already walked (used to prevent infinite loops).
 *                Callers usually don't pass this; it's for recursion.
 */
export function scanDocument(root: Element | Document = document.body, visited: Set<Element> = new Set()): FieldSignals[] {
  const out: FieldSignals[] = [];
  if (!root) return out;

  const startEl = root instanceof Document ? root.body : root;
  if (!startEl || visited.has(startEl)) return out;
  visited.add(startEl);

  // Query for form fields. We exclude input[type="hidden"], input[type="submit"],
  // input[type="button"], and input[type="image"] because they're not user-
  // editable and don't make sense to fill.
  const selector = "input:not([type='hidden']):not([type='submit']):not([type='button']):not([type='image']):not([type='reset']):not([type='file']):not([type='color']):not([type='range']), select, textarea";
  const elements = startEl.querySelectorAll(selector);

  elements.forEach((el, idx) => {
    const signals = extractSignals(el, idx);
    if (signals) out.push(signals);
  });

  // Recurse into same-origin iframes
  startEl.querySelectorAll("iframe").forEach((iframe) => {
    let innerDoc: Document | null = null;
    try {
      // contentDocument throws on cross-origin iframes; we catch and skip.
      innerDoc = (iframe as HTMLIFrameElement).contentDocument;
    } catch {
      // Cross-origin — skip silently per Card 5 §7.1.
    }
    if (innerDoc && innerDoc.body) {
      out.push(...scanDocument(innerDoc.body, visited));
    }
  });

  return out;
}

/**
 * Extract the 5 signals from a single form element.
 *
 * Signal sources, per Card 5 §7.2:
 *   - label: closest <label for="elementId"> OR wrapping <label>
 *   - placeholder: element.placeholder
 *   - name: element.name (form-control name attribute)
 *   - id: element.id
 *   - legend: closest <fieldset><legend> for grouped fields
 */
function extractSignals(el: Element, idx: number): FieldSignals | null {
  const tagName = el.tagName.toLowerCase();
  if (tagName !== "input" && tagName !== "select" && tagName !== "textarea") return null;

  const input = el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

  // 1. label: look for <label for="id"> first, then wrapping <label>
  let label: string | null = null;
  const id = (input as HTMLInputElement).id || null;
  if (id) {
    const forLabel = document.querySelector(`label[for="${cssEscape(id)}"]`);
    if (forLabel) label = forLabel.textContent?.trim() ?? null;
  }
  if (!label) {
    const wrapping = el.closest("label");
    if (wrapping) label = wrapping.textContent?.trim() ?? null;
  }
  // aria-label fallback (covers custom UIs)
  if (!label) {
    const ariaLabel = el.getAttribute("aria-label");
    if (ariaLabel) label = ariaLabel.trim();
  }
  // aria-labelledby fallback
  if (!label) {
    const labelledBy = el.getAttribute("aria-labelledby");
    if (labelledBy) {
      const refs = labelledBy.split(/\s+/).map((id) => document.getElementById(id)).filter(Boolean);
      const text = refs.map((r) => r?.textContent?.trim() ?? "").join(" ").trim();
      if (text) label = text;
    }
  }

  // 2. placeholder
  const placeholder = ("placeholder" in input ? input.placeholder : null) || null;

  // 3. name
  const name = ("name" in input ? input.name : null) || null;

  // 5. legend — closest <fieldset> ancestor's <legend>
  let legend: string | null = null;
  const fieldset = el.closest("fieldset");
  if (fieldset) {
    const legendEl = fieldset.querySelector("legend");
    if (legendEl) legend = legendEl.textContent?.trim() ?? null;
  }

  // autocomplete attribute
  const autocompleteAttr = el.getAttribute("autocomplete");
  const autocomplete = autocompleteAttr && autocompleteAttr !== "off" ? autocompleteAttr : null;

  // type — null means "no type attr" (browser defaults to "text")
  const typeAttr = tagName === "input" ? (input as HTMLInputElement).type.toLowerCase() : tagName;
  const type = coerceType(typeAttr);

  // block context — look for an ancestor with [data-block-type] or a class
  // hint like "block-guest" / "block-address". v1: simple heuristic.
  const blockEl = el.closest("[data-block-type], [class*='block-']");
  let blockType: string | null = null;
  let blockIndex: number | null = null;
  if (blockEl) {
    blockType = blockEl.getAttribute("data-block-type");
    if (!blockType) {
      // Extract from class — e.g. "block-guest-0" → ("guest", 0)
      const m = (blockEl.className || "").match(/block-([a-z]+)(?:-(\d+))?/);
      if (m) {
        blockType = m[1]!;
        if (m[2]) blockIndex = parseInt(m[2], 10);
      }
    } else {
      const idxAttr = blockEl.getAttribute("data-block-index");
      if (idxAttr !== null) blockIndex = parseInt(idxAttr, 10);
    }
  }

  return {
    debugId: id ?? `${tagName}-${idx}`,
    raw: { label, placeholder, name, id, legend },
    normalized: {
      label: tokenize(label),
      placeholder: tokenize(placeholder),
      name: tokenize(name),
      id: tokenize(id),
      legend: tokenize(legend),
    },
    autocomplete,
    type,
    tagName,
    blockType,
    blockIndex,
    element: el,
  };
}

/** Coerce the input.type attribute to a known FieldType. Unknown → "unknown". */
function coerceType(raw: string): FieldType {
  const known: FieldType[] = [
    "text", "email", "tel", "number", "date", "datetime-local", "password",
    "url", "search", "select-one", "select-multiple", "textarea", "checkbox", "radio",
  ];
  return (known as string[]).includes(raw) ? (raw as FieldType) : "unknown";
}

/** CSS.escape polyfill — used for querySelector(`label[for="${id}"]`). */
function cssEscape(s: string): string {
  // Modern browsers ship CSS.escape; older ones don't. For our purposes a
  // simple backslash-escape of special chars is enough.
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") return CSS.escape(s);
  return s.replace(/["\\]/g, "\\$&");
}
