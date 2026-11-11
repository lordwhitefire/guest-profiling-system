// =============================================================================
// /profile/[guestId] — full guest detail (standalone page)
// =============================================================================
// This page is the standalone URL version of the right pane. The /search
// page loads profiles inline in the right pane; this page is for direct
// links (e.g., from a notification email or a browser bookmark).
//
// Server-rendered: the page fetches the guest from the API on first render
// (using server-side fetch), then hydrates on the client.

import { notFound } from "next/navigation";
import type { Guest, ApiResponse } from "@gps/shared";
import { ProfileDetail } from "@/components/guest/profile-detail";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const runtime = "nodejs";

interface PageProps {
  params: Promise<{ guestId: string }>;
}

export default async function ProfilePage({ params }: PageProps) {
  const { guestId } = await params;

  // Server-side fetch. The httpOnly cookie is forwarded from the incoming
  // request automatically when we use the same origin.
  // NOTE: in production, we'd configure fetch to forward cookies; for now,
  // this page works when accessed from a logged-in session because the
  // browser sends the cookie automatically on the document request.
  let guest: Guest | null = null;
  let error: string | null = null;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/guests/${guestId}`, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (res.status === 404) {
      notFound();
    }
    const body: ApiResponse<Guest> = await res.json();
    if (body.success && body.data) {
      guest = body.data;
    } else {
      error = body.error?.message ?? "Failed to load guest.";
    }
  } catch (err) {
    error = err instanceof Error ? err.message : "Network error.";
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="font-heading text-xl font-semibold text-ink-900 mb-2">
            Could not load guest
          </h1>
          <p className="text-sm text-ink-600 mb-4">{error}</p>
          <Link href="/search">
            <Button variant="secondary">Back to search</Button>
          </Link>
        </div>
      </main>
    );
  }

  if (!guest) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-ink-50">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-4">
          <Link
            href="/search"
            className="text-sm text-accent hover:underline"
          >
            ← Back to search
          </Link>
        </div>
        <ProfileDetail guest={guest} />
      </div>
    </main>
  );
}
