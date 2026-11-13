// =============================================================================
// Browser-extension bridge — send a prepared guest to FormFilla
// =============================================================================
// Delivery is confirmed by the extension's content script. If no extension is
// present the promise resolves false after a short timeout, so callers can say
// so honestly instead of claiming the guest was prepared.

export function storeGuestInExtension(payload: unknown): Promise<boolean> {
  return new Promise((resolve) => {
    const onAck = (event: MessageEvent) => {
      if (event.source !== window) return;
      if (event.origin !== window.location.origin) return;
      if ((event.data as { type?: string } | null)?.type !== "GPS_STORE_GUEST_ACK") return;
      window.clearTimeout(timer);
      window.removeEventListener("message", onAck);
      resolve(true);
    };
    const timer = window.setTimeout(() => {
      window.removeEventListener("message", onAck);
      resolve(false);
    }, 700);
    window.addEventListener("message", onAck);

    const extensionId = process.env.NEXT_PUBLIC_GPS_EXTENSION_ID;
    const chromeGlobal = (globalThis as unknown as {
      chrome?: {
        runtime?: {
          sendMessage?: (id: string, msg: unknown, cb: () => void) => void;
          lastError?: unknown;
        };
      };
    }).chrome;
    if (extensionId && chromeGlobal?.runtime?.sendMessage) {
      try {
        chromeGlobal.runtime.sendMessage(extensionId, { type: "STORE_GUEST", payload }, () => {
          void chromeGlobal.runtime?.lastError;
        });
      } catch {
        // Fall through to the content-script bridge below.
      }
    }
    // The extension's content script listens for this, forwards it to the
    // background worker, and acknowledges.
    window.postMessage({ type: "GPS_STORE_GUEST", payload }, window.location.origin);
  });
}
