// =============================================================================
// Messaging — typed message contracts between popup, background, content script
// =============================================================================
// Per Card 5 §7.7: "Receptionist confirmation flow: high-confidence matches
// fill silently; medium-confidence matches highlight amber and wait for click;
// nothing below LOW_THRESHOLD fills."
//
// Message flow:
//   1. Receptionist clicks "Fill form" in the popup
//   2. Popup sends FILL_REQUEST message with the guest profile to the
//      background service worker
//   3. Background forwards to the active tab's content script
//   4. Content script runs fillForm() and returns FillResult
//   5. Popup displays the summary (filled / needs confirmation)
//
// For the workspace UI integration:
//   - The workspace "Prepare Registration" button stores the guest in
//     chrome.storage.local and opens the popup (or, if the user is on the
//     hotel's PMS page, triggers fillForm directly).
//   - The popup reads the stored guest from chrome.storage.local.

export type MessageType =
  | "FILL_REQUEST"        // popup → content (via background)
  | "FILL_RESULT"         // content → popup (via background)
  | "SCAN_REQUEST"        // popup → content (just scan, no fill)
  | "SCAN_RESULT"         // content → popup
  | "GET_STORED_GUEST"    // popup → background
  | "STORE_GUEST"         // workspace UI → background (via window.postMessage)
  | "GUEST_STORED";       // background → popup

export interface BaseMessage<T extends MessageType, P = unknown> {
  type: T;
  payload: P;
}

export type FillRequestMessage = BaseMessage<"FILL_REQUEST", FillRequestPayload>;
export type FillResultMessage = BaseMessage<"FILL_RESULT", FillResultPayload>;
export type ScanRequestMessage = BaseMessage<"SCAN_REQUEST", Record<string, never>>;
export type ScanResultMessage = BaseMessage<"SCAN_RESULT", ScanResultPayload>;
export type GetStoredGuestMessage = BaseMessage<"GET_STORED_GUEST", Record<string, never>>;
export type StoreGuestMessage = BaseMessage<"STORE_GUEST", StoreGuestPayload>;
export type GuestStoredMessage = BaseMessage<"GUEST_STORED", StoreGuestPayload | null>;

export type Message =
  | FillRequestMessage
  | FillResultMessage
  | ScanRequestMessage
  | ScanResultMessage
  | GetStoredGuestMessage
  | StoreGuestMessage
  | GuestStoredMessage;

export interface FillRequestPayload {
  profile: Record<string, unknown>;
  autoFillHighConfidence?: boolean;
}

export interface FillResultPayload {
  totalFields: number;
  totalCandidates: number;
  realAssignments: number;
  highConfidenceFills: number;
  mediumConfidenceFills: number;
  durationMs: number;
  /** Per-assignment details for the popup's "review matches" view. */
  assignments: Array<{
    fieldIndex: number;
    key: string;
    score: number;
    real: boolean;
    highConfidence: boolean;
    needsConfirmation: boolean;
    fieldLabel: string | null;
  }>;
  /** Present only when the fill pipeline threw. */
  error?: string;
}

export interface ScanResultPayload {
  totalFields: number;
  /** First 5 fields' signals, for the popup's preview. */
  preview: Array<{
    debugId: string;
    type: string;
    label: string | null;
    placeholder: string | null;
    name: string | null;
    id: string | null;
  }>;
}

export interface StoreGuestPayload {
  guest: {
    guestId: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    dateOfBirth: string | null;
    nationality: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
    company: string | null;
    notes: string | null;
  };
  /** When the guest was stored (epoch ms). Used for staleness checks. */
  storedAt: number;
}

// ── Type guards ────────────────────────────────────────────────────────────

export function isFillRequest(m: unknown): m is FillRequestMessage {
  return typeof m === "object" && m !== null && (m as BaseMessage<MessageType>).type === "FILL_REQUEST";
}

export function isScanRequest(m: unknown): m is ScanRequestMessage {
  return typeof m === "object" && m !== null && (m as BaseMessage<MessageType>).type === "SCAN_REQUEST";
}

export function isGetStoredGuest(m: unknown): m is GetStoredGuestMessage {
  return typeof m === "object" && m !== null && (m as BaseMessage<MessageType>).type === "GET_STORED_GUEST";
}

export function isStoreGuest(m: unknown): m is StoreGuestMessage {
  return typeof m === "object" && m !== null && (m as BaseMessage<MessageType>).type === "STORE_GUEST";
}
