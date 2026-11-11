// =============================================================================
// Native prototype setter — framework-safe value writes
// =============================================================================
// Per Card 5 §7.4: "Plain element.value = x assignments fail silently on
// React/Vue/Angular pages because the framework installs a value tracker
// on the instance that marks the assignment as already-seen, suppressing
// the onChange callback. FormFilla bypasses this by calling the value setter
// defined on the element's PROTOTYPE directly (via Function.prototype.call),
// which the framework's instance-level wrapper cannot intercept."
//
// After the value is set, two events are dispatched to match what a real
// user edit produces:
//   - Event 1: input (bubbles=true, composed=true, inputType='insertReplacementText')
//   - Event 2: change (bubbles=true, composed=true)
//
// Defense in depth (Card 5 §7.4): "if the page has somehow replaced the
// prototype's own value descriptor, the prototype lookup fails silently and
// falls back to plain el.value = x. A second fallback uses a hidden
// same-origin about:blank iframe's untouched copy of the same built-in
// prototype."
//
// We provide THREE fallback tiers:
//   1. Native prototype setter via HTMLInputElement.prototype lookup
//   2. Plain el.value = x
//   3. Pristine-iframe prototype (created on demand, cached)

export type SetterOutcome = "prototype" | "plain" | "iframe" | "select" | "failed";

export interface SetResult {
  outcome: SetterOutcome;
  element: Element;
  value: string;
  /** Whether input + change events were dispatched. */
  eventsDispatched: boolean;
}

/**
 * Set a value on a form element using the native prototype setter bypass.
 *
 * Handles input, textarea, and select elements. Checkboxes and radios are
 * set via .checked = (value === "true" || value === "on").
 */
export function setValue(element: Element, value: string): SetResult {
  const tagName = element.tagName.toLowerCase();

  if (tagName === "select") {
    return setSelectValue(element as HTMLSelectElement, value);
  }
  if (tagName === "textarea") {
    return setTextAreaValue(element as HTMLTextAreaElement, value);
  }
  if (tagName === "input") {
    const input = element as HTMLInputElement;
    if (input.type === "checkbox" || input.type === "radio") {
      return setCheckboxValue(input, value);
    }
    return setInputValue(input, value);
  }

  return { outcome: "failed", element, value, eventsDispatched: false };
}

function setInputValue(input: HTMLInputElement, value: string): SetResult {
  // Tier 1: native prototype setter bypass
  try {
    const proto = HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
    if (descriptor && descriptor.set) {
      descriptor.set.call(input, value);
      dispatchEvents(input);
      return { outcome: "prototype", element: input, value, eventsDispatched: true };
    }
  } catch {
    // Fall through to tier 2
  }

  // Tier 2: plain el.value = x
  try {
    input.value = value;
    dispatchEvents(input);
    return { outcome: "plain", element: input, value, eventsDispatched: true };
  } catch {
    // Fall through to tier 3
  }

  // Tier 3: pristine-iframe prototype
  try {
    const iframeProto = getPristineInputPrototype();
    if (iframeProto && iframeProto.set) {
      iframeProto.set.call(input, value);
      dispatchEvents(input);
      return { outcome: "iframe", element: input, value, eventsDispatched: true };
    }
  } catch {
    // Total failure
  }

  return { outcome: "failed", element: input, value, eventsDispatched: false };
}

function setTextAreaValue(textarea: HTMLTextAreaElement, value: string): SetResult {
  // Same tiered approach as input
  try {
    const proto = HTMLTextAreaElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
    if (descriptor && descriptor.set) {
      descriptor.set.call(textarea, value);
      dispatchEvents(textarea);
      return { outcome: "prototype", element: textarea, value, eventsDispatched: true };
    }
  } catch { /* fall through */ }

  try {
    textarea.value = value;
    dispatchEvents(textarea);
    return { outcome: "plain", element: textarea, value, eventsDispatched: true };
  } catch { /* fall through */ }

  try {
    const iframeProto = getPristineTextareaPrototype();
    if (iframeProto && iframeProto.set) {
      iframeProto.set.call(textarea, value);
      dispatchEvents(textarea);
      return { outcome: "iframe", element: textarea, value, eventsDispatched: true };
    }
  } catch { /* total failure */ }

  return { outcome: "failed", element: textarea, value, eventsDispatched: false };
}

function setSelectValue(select: HTMLSelectElement, value: string): SetResult {
  // Selects don't have the React value-tracker issue because they fire
  // change events natively. We just set .value and dispatch change.
  try {
    // Try exact match first
    select.value = value;
    // If no exact match, try case-insensitive match
    if (select.value !== value) {
      const lowerValue = value.toLowerCase();
      for (const opt of Array.from(select.options)) {
        if (opt.value.toLowerCase() === lowerValue || opt.text.toLowerCase() === lowerValue) {
          select.value = opt.value;
          break;
        }
      }
    }
    dispatchEvents(select);
    return { outcome: "select", element: select, value: select.value, eventsDispatched: true };
  } catch {
    return { outcome: "failed", element: select, value, eventsDispatched: false };
  }
}

function setCheckboxValue(input: HTMLInputElement, value: string): SetResult {
  try {
    input.checked = value === "true" || value === "on" || value === "1" || value === "yes";
    dispatchEvents(input);
    return { outcome: "prototype", element: input, value: String(input.checked), eventsDispatched: true };
  } catch {
    return { outcome: "failed", element: input, value, eventsDispatched: false };
  }
}

/**
 * Dispatch the input + change event pair (Card 5 §7.4).
 *
 * Both events:
 *   - bubbles: true      (so they propagate up to document)
 *   - composed: true     (so they cross shadow DOM boundaries)
 *
 * Input event specifically:
 *   - inputType: 'insertReplacementText' (per spec, NOT 'insertFromPaste')
 *   - bubbles + composed
 */
function dispatchEvents(el: Element): void {
  // Event 1: input
  const inputEvent = new InputEvent("input", {
    bubbles: true,
    composed: true,
    // inputType is a valid InputEventInit field but TypeScript's lib may
    // not always include it. We cast through unknown to bypass.
    ...({ inputType: "insertReplacementText", data: (el as HTMLInputElement).value }) as unknown as InputEventInit,
  });
  el.dispatchEvent(inputEvent);

  // Event 2: change
  const changeEvent = new Event("change", {
    bubbles: true,
    composed: true,
  });
  el.dispatchEvent(changeEvent);
}

// ── Pristine-iframe prototype cache ────────────────────────────────────────
//
// Per Card 5 §7.4: "Blank iframes get a fully independent set of global
// constructors synchronously on attach, which is the standard technique for
// recovering an unpatched native reference."
//
// We create a hidden same-origin about:blank iframe once and cache its
// HTMLInputElement.prototype value descriptor. If the host page has
// replaced the main document's prototype, the iframe's is untouched.

let cachedInputDescriptor: PropertyDescriptor | null = null;
let cachedTextareaDescriptor: PropertyDescriptor | null = null;
let cachedIframe: HTMLIFrameElement | null = null;

function getPristineInputPrototype(): PropertyDescriptor | null {
  if (cachedInputDescriptor) return cachedInputDescriptor;
  const win = getPristineWindow();
  if (!win) return null;
  const InputCtor = (win as unknown as { HTMLInputElement: typeof HTMLInputElement }).HTMLInputElement;
  const descriptor = Object.getOwnPropertyDescriptor(InputCtor.prototype, "value");
  if (descriptor && descriptor.set) {
    cachedInputDescriptor = descriptor;
    return descriptor;
  }
  return null;
}

function getPristineTextareaPrototype(): PropertyDescriptor | null {
  if (cachedTextareaDescriptor) return cachedTextareaDescriptor;
  const win = getPristineWindow();
  if (!win) return null;
  const TextareaCtor = (win as unknown as { HTMLTextAreaElement: typeof HTMLTextAreaElement }).HTMLTextAreaElement;
  const descriptor = Object.getOwnPropertyDescriptor(TextareaCtor.prototype, "value");
  if (descriptor && descriptor.set) {
    cachedTextareaDescriptor = descriptor;
    return descriptor;
  }
  return null;
}

function getPristineWindow(): Window | null {
  if (cachedIframe && cachedIframe.contentWindow) {
    return cachedIframe.contentWindow;
  }
  try {
    cachedIframe = document.createElement("iframe");
    cachedIframe.style.display = "none";
    cachedIframe.setAttribute("aria-hidden", "true");
    cachedIframe.src = "about:blank";
    document.documentElement.appendChild(cachedIframe);
    // about:blank iframes get a fully initialized window synchronously
    if (cachedIframe.contentWindow) {
      return cachedIframe.contentWindow;
    }
  } catch {
    cachedIframe = null;
  }
  return null;
}

/**
 * Tear down the pristine-iframe cache. Called by tests to ensure clean
 * state across runs.
 */
export function teardownPristineIframe(): void {
  if (cachedIframe) {
    try { cachedIframe.remove(); } catch { /* ignore */ }
    cachedIframe = null;
    cachedInputDescriptor = null;
    cachedTextareaDescriptor = null;
  }
}
