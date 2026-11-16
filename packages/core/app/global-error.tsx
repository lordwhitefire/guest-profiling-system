"use client";

// =============================================================================
// Global error boundary — used when the root layout itself fails
// =============================================================================
// Must render its own <html>/<body>. No raw error message is shown.

import { useEffect } from "react";

export default function GlobalError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error("[gps] global error", error);
  }, [error]);

  const digest =
    typeof error === "object" && error !== null && "digest" in error
      ? String((error as { digest?: unknown }).digest ?? "")
      : "";

  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "system-ui, sans-serif", background: "#f8fafc", color: "#0f172a" }}>
        <main style={{ maxWidth: 420, textAlign: "center", padding: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 14, color: "#475569", marginBottom: 16 }}>
            The application could not start this request. Try again, or reload
            the page.
          </p>
          {digest && (
            <p style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
              Reference: {digest}
            </p>
          )}
          <button
            type="button"
            onClick={() => retry()}
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer" }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}