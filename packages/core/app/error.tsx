"use client";

// =============================================================================
// Root route error boundary
// =============================================================================
// Next.js 16 passes `retry` (not `reset`). The UI never prints the raw error
// message or stack: server errors are already sanitised, and the digest is the
// only correlation value shown.

import { useEffect } from "react";

export default function Error({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error("[gps] route error", error);
  }, [error]);

  const digest =
    typeof error === "object" && error !== null && "digest" in error
      ? String((error as { digest?: unknown }).digest ?? "")
      : "";

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <h1 className="font-heading text-xl font-semibold text-ink-900 mb-2">
          Something went wrong
        </h1>
        <p className="text-sm text-ink-600 mb-4">
          The request could not be completed. The error was logged; try again,
          or return to the dashboard.
        </p>
        {digest && (
          <p className="text-xs text-ink-500 mb-4">Reference: {digest}</p>
        )}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            className="gps-primary"
            onClick={() => retry()}
          >
            Try again
          </button>
          <a className="gps-outline" href="/workspace/dashboard">
            Back to dashboard
          </a>
        </div>
      </div>
    </main>
  );
}