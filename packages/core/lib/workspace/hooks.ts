// =============================================================================
// Workspace data hooks — React hooks that fetch real data from the API and
// expose it in the WorkspaceGuest shape the 17-screen UI consumes.
// =============================================================================
// These hooks replace the mock GUESTS array. They handle:
//   - Loading state (boolean)
//   - Error state (ApiError or null)
//   - Data state (the WorkspaceGuest list or single record)
//   - Refetch (manual invalidation)
//
// Pattern: each hook is a thin wrapper around useState + useEffect that
// calls the api-client and converts the result via toWorkspaceGuest(s).
// Stale-response protection: the hook tracks a request id and ignores
// out-of-order responses.
//
// Why separate hooks (not a single "useWorkspaceData")?
//   - Each screen mounts its own hook; React's rules-of-hooks require this.
//   - The search screen needs debounced live-filter; the directory needs
//     pagination; the profile needs a single guest by id. Different shapes.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import type { Guest } from "@gps/shared";
import { toWorkspaceGuest, toWorkspaceGuests, type WorkspaceGuest } from "./adapters";

const DEBOUNCE_MS = 200;
const MIN_QUERY_LENGTH = 2;

// ── useGuestSearch ─────────────────────────────────────────────────────────
// Live-filter search. Mirrors the behavior of the existing
// packages/core/components/guest/search-input.tsx combobox:
//   - 200ms debounce after the user stops typing
//   - Min 2 chars to fire a search
//   - Stale-response protection (later requests win)

export interface UseGuestSearchResult {
  guests: WorkspaceGuest[];
  loading: boolean;
  error: string | null;
  query: string;
  setQuery: (q: string) => void;
}

export function useGuestSearch(initialQuery = ""): UseGuestSearchResult {
  const [query, setQuery] = useState(initialQuery);
  const [guests, setGuests] = useState<WorkspaceGuest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    const q = query.trim();
    if (q.length < MIN_QUERY_LENGTH) {
      setGuests([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    const requestId = ++requestIdRef.current;

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await api.searchGuests(q);
        if (requestId === requestIdRef.current) {
          setGuests(toWorkspaceGuests(results));
        }
      } catch (err) {
        if (requestId === requestIdRef.current) {
          setError(err instanceof ApiError ? err.message : "Search failed.");
          setGuests([]);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query]);

  return { guests, loading, error, query, setQuery };
}

// ── useGuestDirectory ───────────────────────────────────────────────────────
// Paginated guest list. Used by the Directory screen.

export interface UseGuestDirectoryResult {
  guests: WorkspaceGuest[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  error: string | null;
  setPage: (p: number) => void;
  refetch: () => void;
}

export function useGuestDirectory(initialPage = 1, limit = 20): UseGuestDirectoryResult {
  const [page, setPage] = useState(initialPage);
  const [guests, setGuests] = useState<WorkspaceGuest[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchTick, setRefetchTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api.listGuests(page, limit)
      .then((result) => {
        if (cancelled) return;
        setGuests(toWorkspaceGuests(result.guests));
        setTotal(result.total);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Failed to load guests.");
        setGuests([]);
        setTotal(0);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [page, limit, refetchTick]);

  const refetch = useCallback(() => setRefetchTick((t) => t + 1), []);

  return { guests, total, page, limit, loading, error, setPage, refetch };
}

// ── useGuest ────────────────────────────────────────────────────────────────
// Fetch a single guest by id. Used by the profile screen and visit-history.

export interface UseGuestResult {
  guest: WorkspaceGuest | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useGuest(guestId: string | null): UseGuestResult {
  const [guest, setGuest] = useState<WorkspaceGuest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refetchTick, setRefetchTick] = useState(0);

  useEffect(() => {
    if (!guestId) {
      setGuest(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    api.getGuest(guestId)
      .then((g: Guest) => {
        if (!cancelled) setGuest(toWorkspaceGuest(g));
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load guest.");
          setGuest(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [guestId, refetchTick]);

  const refetch = useCallback(() => setRefetchTick((t) => t + 1), []);
  return { guest, loading, error, refetch };
}

// ── useGuestBySourceRef ────────────────────────────────────────────────────
// Variant of useGuest that resolves a guest by source_ref (e.g., QloApps
// id_customer). Used when the workspace receives a click from the search
// results list — the search API returns full Guest objects, so we don't
// actually need a separate fetch; the calling screen can just pass the
// already-fetched Guest object via toWorkspaceGuest.

export function useGuestByObject(g: Guest | null): UseGuestResult {
  // Convert without a network call.
  const guest = g ? toWorkspaceGuest(g) : null;
  return { guest, loading: false, error: null, refetch: () => {} };
}

// ── useGuestCount ──────────────────────────────────────────────────────────
// Quick total count for the dashboard metrics. We fetch page 1 with limit 1
// and read metadata.total. Not efficient for large tables, but fine for the
// demo. A real /api/stats endpoint would be a future task.

export interface UseGuestCountResult {
  total: number;
  loading: boolean;
  error: string | null;
}

export function useGuestCount(): UseGuestCountResult {
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    api.listGuests(1, 1)
      .then((r) => { if (!cancelled) setTotal(r.total); })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load count.");
          setTotal(0);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  return { total, loading, error };
}
