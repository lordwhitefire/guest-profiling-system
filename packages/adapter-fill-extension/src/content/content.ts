// =============================================================================
// Content script — runs on every page (per manifest's content_scripts)
// =============================================================================
// Receives FILL_REQUEST and SCAN_REQUEST messages from the popup (via the
// background service worker), runs the fill pipeline, and returns the result.
//
// This script is bundled by esbuild into dist/content.js, which is loaded
// by Chrome via the manifest's content_scripts entry.
//
// Card 5 §7.1: the scanner walks the active DOM subtree (including same-origin
// iframes). We don't gate on URL — the manifest's host_permissions determine
// which pages this script runs on. The popup is what the receptionist uses
// to trigger a fill.

import { fillForm } from "../fill/fill.js";
import { scanDocument } from "../matching/scanner.js";
import { LOW_THRESHOLD, HIGH_THRESHOLD } from "../matching/scorer.js";
import {
  isFillRequest,
  isScanRequest,
  type FillRequestMessage,
  type FillResultMessage,
  type ScanResultMessage,
  type FillResultPayload,
} from "../messaging/messages.js";

// Bridge for the workspace UI ("Prepare Registration").
// The page cannot call chrome.runtime directly without the extension id, so
// it posts a window message. We verify it came from this page's own window
// and origin, forward it to the background worker, then acknowledge so the
// UI can tell the receptionist whether the extension actually received it.
window.addEventListener("message", (event: MessageEvent) => {
  if (event.source !== window) return;
  if (event.origin !== window.location.origin) return;
  const data = event.data as { type?: string; payload?: unknown } | null;
  if (data?.type !== "GPS_STORE_GUEST") return;

  chrome.runtime.sendMessage({ type: "STORE_GUEST", payload: data.payload }, () => {
    // No listener means the background worker is asleep or broken; either
    // way the ack records that the content script did receive the message.
    void chrome.runtime.lastError;
    window.postMessage({ type: "GPS_STORE_GUEST_ACK", ok: true }, window.location.origin);
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (isFillRequest(message)) {
    handleFillRequest(message).then(sendResponse);
    return true;  // keep the message channel open for async response
  }
  if (isScanRequest(message)) {
    handleScanRequest().then(sendResponse);
    return true;
  }
  // Unknown message type — ignore (don't return true)
  return false;
});

async function handleFillRequest(message: FillRequestMessage): Promise<FillResultMessage> {
  try {
    const result = await fillForm({
      profile: message.payload.profile,
      autoFillHighConfidence: message.payload.autoFillHighConfidence ?? true,
    });

    const payload: FillResultPayload = {
      totalFields: result.totalFields,
      totalCandidates: result.totalCandidates,
      realAssignments: result.realAssignments,
      highConfidenceFills: result.highConfidenceFills,
      mediumConfidenceFills: result.mediumConfidenceFills,
      durationMs: result.durationMs,
      assignments: result.assignments.map((a) => ({
        fieldIndex: a.fieldIndex,
        key: a.key,
        score: a.score,
        real: a.real,
        highConfidence: a.score >= HIGH_THRESHOLD,
        needsConfirmation: a.real && a.score >= LOW_THRESHOLD && a.score < HIGH_THRESHOLD,
        fieldLabel: result.fields[a.fieldIndex]?.raw.label ?? null,
      })),
    };

    return { type: "FILL_RESULT", payload };
  } catch (err) {
    console.error("[adapter-fill content] fillForm failed:", err);
    return {
      type: "FILL_RESULT",
      payload: {
        totalFields: 0,
        totalCandidates: 0,
        realAssignments: 0,
        highConfidenceFills: 0,
        mediumConfidenceFills: 0,
        durationMs: 0,
        assignments: [],
        error: err instanceof Error ? err.message : "Unknown error",
      },
    };
  }
}

async function handleScanRequest(): Promise<ScanResultMessage> {
  const fields = scanDocument(document.body);
  return {
    type: "SCAN_RESULT",
    payload: {
      totalFields: fields.length,
      preview: fields.slice(0, 5).map((f) => ({
        debugId: f.debugId,
        type: f.type,
        label: f.raw.label,
        placeholder: f.raw.placeholder,
        name: f.raw.name,
        id: f.raw.id,
      })),
    },
  };
}

// Export the thresholds for re-use by the popup if it imports from this module
export { LOW_THRESHOLD, HIGH_THRESHOLD };
