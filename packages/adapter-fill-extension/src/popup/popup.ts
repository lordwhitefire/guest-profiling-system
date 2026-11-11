// =============================================================================
// Popup script — the receptionist-facing UI
// =============================================================================
// Loads when the receptionist clicks the extension's toolbar icon.
// Shows: (1) the last-stored guest from chrome.storage.local, (2) a "Fill
// Form" button that triggers fillForm() in the active tab's content script,
// (3) the fill result with high/medium-confidence breakdown.

import {
  isFillRequest,
  type FillResultPayload,
  type ScanResultPayload,
  type StoreGuestPayload,
} from "../messaging/messages.js";

// ── Element refs ────────────────────────────────────────────────────────────

const el = {
  loading: document.getElementById("loading")!,
  error: document.getElementById("error")!,
  errorMessage: document.getElementById("error-message")!,
  errorRetry: document.getElementById("error-retry")!,
  noGuest: document.getElementById("no-guest")!,
  ready: document.getElementById("ready")!,
  guestInitials: document.getElementById("guest-initials")!,
  guestName: document.getElementById("guest-name")!,
  guestEmail: document.getElementById("guest-email")!,
  guestPhone: document.getElementById("guest-phone")!,
  fillButton: document.getElementById("fill-button")!,
  scanButton: document.getElementById("scan-button")!,
  scanResult: document.getElementById("scan-result")!,
  scanSummary: document.getElementById("scan-summary")!,
  scanPreview: document.getElementById("scan-preview")!,
  scanBack: document.getElementById("scan-back")!,
  fillResult: document.getElementById("fill-result")!,
  resultHigh: document.getElementById("result-high")!,
  resultMedium: document.getElementById("result-medium")!,
  resultTime: document.getElementById("result-time")!,
  resultAssignments: document.getElementById("result-assignments")!,
  resultBack: document.getElementById("result-back")!,
};

// ── State ────────────────────────────────────────────────────────────────────

let storedGuest: StoreGuestPayload | null = null;

// ── Boot ────────────────────────────────────────────────────────────────────

showLoading();
requestStoredGuest();

// ── Event handlers ────────────────────────────────────────────────────────

el.fillButton.addEventListener("click", onFillClick);
el.scanButton.addEventListener("click", onScanClick);
el.errorRetry.addEventListener("click", requestStoredGuest);
el.scanBack.addEventListener("click", () => showReady());
el.resultBack.addEventListener("click", () => window.close());

// ── Logic ──────────────────────────────────────────────────────────────────

function showLoading() {
  hideAll();
  el.loading.classList.remove("hidden");
}

function showError(message: string) {
  hideAll();
  el.errorMessage.textContent = message;
  el.error.classList.remove("hidden");
}

function showNoGuest() {
  hideAll();
  el.noGuest.classList.remove("hidden");
}

function showReady() {
  if (!storedGuest) return showNoGuest();
  hideAll();
  const g = storedGuest.guest;
  const name = [g.firstName, g.lastName].filter(Boolean).join(" ") || "Unknown Guest";
  el.guestName.textContent = name;
  el.guestEmail.textContent = g.email ?? "No email";
  el.guestPhone.textContent = g.phone ?? "No phone";
  el.guestInitials.textContent = deriveInitials(g.firstName, g.lastName);
  el.ready.classList.remove("hidden");
}

function showScanResult(payload: ScanResultPayload) {
  hideAll();
  el.scanSummary.textContent = `Found ${payload.totalFields} form field${payload.totalFields === 1 ? "" : "s"} on this page.`;
  el.scanPreview.innerHTML = "";
  if (payload.preview.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No fields detected.";
    li.style.color = "#97a4b6";
    el.scanPreview.appendChild(li);
  } else {
    for (const f of payload.preview) {
      const li = document.createElement("li");
      li.innerHTML = `<b>${escapeHtml(f.label || f.placeholder || f.name || f.id || f.debugId)}</b> <span style="color:#97a4b6">(${escapeHtml(f.type)})</span>`;
      el.scanPreview.appendChild(li);
    }
  }
  el.scanResult.classList.remove("hidden");
}

function showFillResult(payload: FillResultPayload) {
  hideAll();
  if ("error" in payload && typeof payload.error === "string") {
    showError(payload.error);
    return;
  }
  el.resultHigh.textContent = String(payload.highConfidenceFills);
  el.resultMedium.textContent = String(payload.mediumConfidenceFills);
  el.resultTime.textContent = `${payload.durationMs}ms`;

  el.resultAssignments.innerHTML = "";
  const realAssignments = payload.assignments.filter((a) => a.real);
  if (realAssignments.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No matches above threshold.";
    li.style.color = "#97a4b6";
    el.resultAssignments.appendChild(li);
  } else {
    for (const a of realAssignments) {
      const li = document.createElement("li");
      li.className = a.highConfidence ? "high" : "medium";
      li.innerHTML = `
        <span class="key">${escapeHtml(a.key)}</span>
        <span class="score">${a.score.toFixed(1)}</span>
        ${a.fieldLabel ? `<span class="field-label">${escapeHtml(a.fieldLabel)}</span>` : ""}
      `;
      el.resultAssignments.appendChild(li);
    }
  }
  el.fillResult.classList.remove("hidden");
}

function hideAll() {
  el.loading.classList.add("hidden");
  el.error.classList.add("hidden");
  el.noGuest.classList.add("hidden");
  el.ready.classList.add("hidden");
  el.scanResult.classList.add("hidden");
  el.fillResult.classList.add("hidden");
}

async function requestStoredGuest() {
  showLoading();
  try {
    const response = await chrome.runtime.sendMessage({ type: "GET_STORED_GUEST" });
    if (response && response.payload) {
      storedGuest = response.payload as StoreGuestPayload;
      showReady();
    } else {
      showNoGuest();
    }
  } catch (err) {
    showError(err instanceof Error ? err.message : "Could not load stored guest.");
  }
}

async function onFillClick() {
  if (!storedGuest) return;
  (el.fillButton as HTMLButtonElement).disabled = true;
  el.fillButton.textContent = "Filling…";
  try {
    const response = await chrome.runtime.sendMessage({
      type: "FILL_REQUEST",
      payload: {
        profile: storedGuest.guest,
        autoFillHighConfidence: true,
      },
    });
    if (response && response.payload) {
      showFillResult(response.payload as FillResultPayload);
    } else {
      showError("No response from the content script.");
    }
  } catch (err) {
    showError(err instanceof Error ? err.message : "Fill request failed.");
  } finally {
    (el.fillButton as HTMLButtonElement).disabled = false;
    el.fillButton.textContent = "Fill Form";
  }
}

async function onScanClick() {
  (el.scanButton as HTMLButtonElement).disabled = true;
  el.scanButton.textContent = "Scanning…";
  try {
    const response = await chrome.runtime.sendMessage({ type: "SCAN_REQUEST" });
    if (response && response.payload) {
      showScanResult(response.payload as ScanResultPayload);
    } else {
      showError("No response from the content script.");
    }
  } catch (err) {
    showError(err instanceof Error ? err.message : "Scan request failed.");
  } finally {
    (el.scanButton as HTMLButtonElement).disabled = false;
    el.scanButton.textContent = "Scan Page Only";
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function deriveInitials(first: string | null, last: string | null): string {
  const f = (first ?? "").trim()[0];
  const l = (last ?? "").trim()[0];
  const a = f ? f.toUpperCase() : "?";
  const b = l ? l.toUpperCase() : "?";
  return a + b;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
