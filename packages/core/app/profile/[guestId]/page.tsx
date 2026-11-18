// =============================================================================
// /profile/[guestId] — full guest detail (standalone page)
// =============================================================================
// This page is the standalone URL version of the right pane. The /search
// page loads profiles inline in the right pane; this page is for direct
// links (e.g., from a notification email or a browser bookmark).
//
// Server-rendered: the page fetches the guest and the derived visit history
// from the API on first render, forwarding the incoming request's cookies
// (including the httpOnly gps-jwt cookie) so the API authenticates the
// server-side call as the logged-in user.
//
// The visit count is NOT read from the legacy reservations/loyalty path. It
// comes from /api/guests/{guestId}/visits, which groups guest_profile_links.

import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import type { Guest, GuestVisit, ApiResponse } from "@gps/shared";
import { ProfileDetail } from "@/components/guest/profile-detail";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const runtime = "nodejs";

interface PageProps {
  params: Promise<{ guestId: string }>;
}

export default async function ProfilePage({ params }: PageProps) {
  const { guestId } = await params;

  // Forward the caller's cookies to our own API. The base URL comes from
  // configuration (or the local server port), never from the Host header:
  // forwarding cookies to a Host-derived URL would be an SSRF/cookie leak.
  const cookieStore = await cookies();
  // Render injects RENDER_EXTERNAL_URL, so a deployed service needs no
  // NEXT_PUBLIC_ variable. The 127.0.0.1 fallback is for local production runs.
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.RENDER_EXTERNAL_URL ??
    `http://127.0.0.1:${process.env.PORT ?? "3000"}`;

  const cookieHeader = cookieStore
    .getAll()
    .map(c => `${c.name}=${c.value}`)
    .join("; ");

  let guest: Guest | null = null;
  let error: string | null = null;
  let guestResponse: Response | null = null;

  try {
    guestResponse = await fetch(`${base}/api/guests/${guestId}`, {
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      cache: "no-store",
    });
  } catch (err) {
    error = err instanceof Error ? err.message : "Network error.";
  }

  // notFound() throws; keep it outside the fetch try/catch so it is not
  // converted into a generic 200 error panel.
  if (guestResponse?.status === 404) notFound();

  if (guestResponse && !guestResponse.ok) {
    error = `Guest request failed (${guestResponse.status}).`;
  } else if (guestResponse) {
    try {
      const body: ApiResponse<Guest> = await guestResponse.json();
      if (body.success && body.data) {
        guest = body.data;
      } else {
        error = body.error?.message ?? "Failed to load guest.";
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "Could not parse guest response.";
    }
  }

  if (error || !guest) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="font-heading text-xl font-semibold text-ink-900 mb-2">
            Could not load guest
          </h1>
          <p className="text-sm text-ink-600 mb-4">{error ?? "Guest not found."}</p>
          <Link href="/search">
            <Button variant="secondary">Back to search</Button>
          </Link>
        </div>
      </main>
    );
  }

  // The exact guest is already known; only the visit projection is fetched
  // here. A visit-history failure does not hide the guest profile.
  let visits: GuestVisit[] = [];
  let visitTotal = guest.totalStays;
  let visitsError: string | null = null;

  try {
    const res = await fetch(
      `${base}/api/guests/${guestId}/visits?limit=100`,
      {
        headers: {
          "Content-Type": "application/json",
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        },
        cache: "no-store",
      },
    );

    if (!res.ok) {
      visitsError = `Visit history unavailable (${res.status}).`;
    } else {
      const body: ApiResponse<GuestVisit[]> = await res.json();
      if (body.success) {
        visits = body.data ?? [];
        visitTotal = body.metadata?.total ?? visits.length;
      } else {
        visitsError = body.error?.message ?? "Failed to load visit history.";
      }
    }
  } catch (err) {
    visitsError = err instanceof Error ? err.message : "Network error.";
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
        <ProfileDetail
          guest={guest}
          visits={visits}
          visitTotal={visitTotal}
          visitsError={visitsError}
        />
      </div>
    </main>
  );
}