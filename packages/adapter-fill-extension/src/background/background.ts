// =============================================================================
// Background service worker — MV3 service worker
// =============================================================================
// Routes messages between the popup and content scripts. Also handles the
// STORE_GUEST message from the workspace UI (via window.postMessage bridge).
//
// Card 5 §7.7 contract:
//   - Receptionist clicks "Prepare Registration" in the workspace UI
//   - Workspace UI posts a STORE_GUEST message to the page
//   - A small injected bridge script picks it up and sends to background
//   - Background stores in chrome.storage.local
//   - When the receptionist opens the popup on the hotel's PMS page, the
//     popup reads the stored guest and shows "Ready to fill: John Doe"
//   - Receptionist clicks "Fill form" in the popup
//   - Popup sends FILL_REQUEST to background
//   - Background forwards to active tab's content script
//   - Content script runs fillForm() and returns FillResult
//   - Popup displays the result
//
// STORAGE SCHEMA (chrome.storage.local):
//   - "gps:guest" — the last-stored guest profile (StoreGuestPayload)
//   - "gps:lastFill" — the last fill result (for debugging / undo)

import {
  isGetStoredGuest,
  isFillRequest,
  type StoreGuestPayload,
} from "../messaging/messages.js";

const STORAGE_KEY_GUEST = "gps:guest";
const STORAGE_KEY_LAST_FILL = "gps:lastFill";

chrome.runtime.onInstalled.addListener(() => {
  console.info("[adapter-fill bg] Extension installed");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // GET_STORED_GUEST: popup → background
  if (isGetStoredGuest(message)) {
    chrome.storage.local.get(STORAGE_KEY_GUEST).then((result) => {
      const guest = result[STORAGE_KEY_GUEST] as StoreGuestPayload | undefined;
      sendResponse({ type: "GUEST_STORED", payload: guest ?? null });
    });
    return true;
  }

  // FILL_REQUEST: popup → background → content script (active tab)
  if (isFillRequest(message)) {
    chrome.tabs.query({ active: true, currentWindow: true }).then(async (tabs) => {
      const tabId = tabs[0]?.id;
      if (!tabId) {
        sendResponse({
          type: "FILL_RESULT",
          payload: { error: "No active tab", totalFields: 0, assignments: [] },
        });
        return;
      }
      try {
        const response = await chrome.tabs.sendMessage(tabId, message);
        // Cache the result for debugging
        if (chrome.storage.local) {
          chrome.storage.local.set({ [STORAGE_KEY_LAST_FILL]: response });
        }
        sendResponse(response);
      } catch (err) {
        console.error("[adapter-fill bg] tabs.sendMessage failed:", err);
        sendResponse({
          type: "FILL_RESULT",
          payload: {
            error: err instanceof Error ? err.message : "Could not reach the active tab. Make sure you're on the hotel's registration page.",
            totalFields: 0,
            assignments: [],
          },
        });
      }
    });
    return true;
  }

  // External messages from the workspace UI (via the bridge script)
  if (typeof message === "object" && message !== null && message.type === "STORE_GUEST") {
    const payload = (message as { payload: StoreGuestPayload }).payload;
    chrome.storage.local.set({ [STORAGE_KEY_GUEST]: payload }).then(() => {
      sendResponse({ type: "GUEST_STORED", payload });
    });
    return true;
  }

  return false;
});

// Allow external websites (our workspace UI) to send messages to this extension
// Requires "externally_connectable" in manifest.json
chrome.runtime.onMessageExternal.addListener((message, _sender, sendResponse) => {
  if (typeof message === "object" && message !== null && message.type === "STORE_GUEST") {
    const payload = (message as { payload: StoreGuestPayload }).payload;
    chrome.storage.local.set({ [STORAGE_KEY_GUEST]: payload }).then(() => {
      sendResponse({ type: "GUEST_STORED", payload });
    });
    return true;
  }
  return false;
});
