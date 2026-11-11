"use client";

// =============================================================================
// /search — receptionist's primary screen (two-pane layout)
// =============================================================================
// Left pane: search input + results
// Right pane: selected profile detail (or empty state)
//
// Layout:
//   Desktop (>=1024px): two-pane side-by-side, 1fr 2fr
//   Tablet (768-1023px): single pane, profile opens as overlay
//   Mobile (<768px): NOT designed for v1 (receptionist works at a desk)
//
// This page is client-rendered — the search and profile fetch happen via
// the API client (lib/api-client.ts). The auth cookie is sent automatically.

import { useState } from "react";
import { SearchInput } from "@/components/guest/search-input";
import { ProfileDetail } from "@/components/guest/profile-detail";
import type { Guest } from "@gps/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SearchPage() {
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  return (
    <main className="min-h-screen bg-ink-50">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <header className="mb-6">
          <h1 className="font-heading text-3xl font-bold text-ink-900">
            Guest search
          </h1>
          <p className="mt-1 text-ink-600">
            Type a name, email, or phone to find a returning guest.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left pane: search */}
          <section className="lg:col-span-1">
            <SearchInput onSelect={setSelectedGuest} />
          </section>

          {/* Right pane: profile detail or empty state */}
          <section className="lg:col-span-2">
            {selectedGuest ? (
              <ProfileDetail guest={selectedGuest} />
            ) : (
              <EmptyProfileState />
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function EmptyProfileState() {
  return (
    <Card className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 h-16 w-16 rounded-full bg-ink-100 flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-8 w-8 text-ink-400"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
          />
        </svg>
      </div>
      <h2 className="font-heading text-xl font-semibold text-ink-800 mb-1">
        No guest selected
      </h2>
      <p className="text-sm text-ink-500 max-w-sm">
        Search for a guest on the left to see their profile, reservations,
        and loyalty details here.
      </p>
    </Card>
  );
}
