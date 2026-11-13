// =============================================================================
// /profile/[guestId] — full guest detail (standalone page)
// =============================================================================
// This page is the standalone URL version of the right pane. The /search
// page loads profiles inline in the right pane; this page is for direct
// links (e.g., from a notification email or a browser bookmark).
//
// Server-rendered: the page fetches the guest from the API on first render
// using server-side fetch, forwarding the incoming request's cookies
// (including the httpOnly gps-jwt cookie) so the API authenticates the
// server-side call as the logged-in user.
//
// TASK-009 fix: previously the fetch did not forward cookies, so the API
// returned 401 and the page only rendered "Back to search". Now we copy
// the Cookie header from the incoming request to the fetch.

import { notFound } from "next/navigation";
import { cookies } from "next/headers";
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

  // Forward the caller's cookies to our own API. The base URL comes from
  // configuration (or the local server port), never from the Host header:
  // forwarding cookies to a Host-derived URL would be an SSRF/cookie leak.
  const cookieStore = await cookies();
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    `http://127.0.0.1:${process.env.PORT ?? "3000"}`;

  const cookieHeader = cookieStore
    .getAll()
    .map(c => `${c.name}=${c.value}`)
    .join("; ");

  let guest: Guest | null = null;
  let error: string | null = null;

  try {
    const res = await fetch(`${base}/api/guests/${guestId}`, {
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
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
