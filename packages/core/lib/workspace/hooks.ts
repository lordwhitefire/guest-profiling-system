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
import { api, ApiError, type MeResponse } from "@/lib/api-client";
import type { Guest, GuestVisit, Reservation } from "@gps/shared";
import { toWorkspaceGuest, toWorkspaceGuests, type WorkspaceGuest } from "./adapters";

const DEBOUNCE_MS = 200;
const MIN_QUERY_LENGTH = 2;

// ── useMe — current user + active hotel ────────────────────────────────────

export interface UseMeResult {
  me: MeResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useMe(): UseMeResult {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getMe()
      .then((value) => {
        if (cancelled) return;
        setMe(value);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Failed to load account.");
        setMe(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [tick]);

  return { me, loading, error, refetch: () => setTick((t) => t + 1) };
}

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
  refetch: () => void;
}

/**
 * Live-filter search driven by the caller's query string.
 *
 * The query is owned by the screen (so the input stays responsive); this
 * hook only reacts to it. Passing the query in is what makes typing fire a
 * request — an internal state copy would never see the caller's updates.
 */
export function useGuestSearch(query: string, hotelName = "Current hotel"): UseGuestSearchResult {
  const [guests, setGuests] = useState<WorkspaceGuest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refetchTick, setRefetchTick] = useState(0);
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
          setGuests(toWorkspaceGuests(results, hotelName));
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
  }, [query, refetchTick, hotelName]);

  const refetch = useCallback(() => setRefetchTick((t) => t + 1), []);

  return { guests, loading, error, refetch };
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

export function useGuestDirectory(initialPage = 1, limit = 20, hotelName = "Current hotel"): UseGuestDirectoryResult {
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
        setGuests(toWorkspaceGuests(result.guests, hotelName));
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
  }, [page, limit, refetchTick, hotelName]);

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

export function useGuest(guestId: string | null, hotelName = "Current hotel"): UseGuestResult {
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
        if (!cancelled) setGuest(toWorkspaceGuest(g, hotelName));
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
  }, [guestId, refetchTick, hotelName]);

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

// ── useReservations — Visit History screen ─────────────────────────────────
// Real stay records for the selected guest. Returns an empty list when no
// guest id is available (demo data has no database identity).

export interface UseReservationsResult {
  reservations: Reservation[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useReservations(guestId: string | null, limit = 20): UseReservationsResult {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(!!guestId);
  const [error, setError] = useState<string | null>(null);
  const [refetchTick, setRefetchTick] = useState(0);

  useEffect(() => {
    if (!guestId) {
      setReservations([]);
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    api.getReservations(guestId, limit)
      .then((rows) => { if (!cancelled) setReservations(rows); })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load visit history.");
          setReservations([]);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [guestId, limit, refetchTick]);

  const refetch = useCallback(() => setRefetchTick((t) => t + 1), []);
  return { reservations, loading, error, refetch };
}

// ── useGuestVisits — Visit History screen ──────────────────────────────────
// Visits are derived from guest_profile_links: one link = one raw source row
// = one visit. The source database stores no visit table.

export interface UseGuestVisitsResult {
  visits: GuestVisit[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useGuestVisits(guestId: string | null, limit = 100): UseGuestVisitsResult {
  const [visits, setVisits] = useState<GuestVisit[]>([]);
  const [loading, setLoading] = useState(!!guestId);
  const [error, setError] = useState<string | null>(null);
  const [refetchTick, setRefetchTick] = useState(0);

  useEffect(() => {
    if (!guestId) {
      setVisits([]);
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    api.getVisits(guestId, limit)
      .then((rows) => { if (!cancelled) setVisits(rows); })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load visit history.");
          setVisits([]);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [guestId, limit, refetchTick]);

  const refetch = useCallback(() => setRefetchTick((t) => t + 1), []);
  return { visits, loading, error, refetch };
}

// ── useHealth — Analytics system-health panel ──────────────────────────────

export interface UseHealthResult {
  health: { status: string; uptime: number; timestamp: string } | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useHealth(): UseHealthResult {
  const [health, setHealth] = useState<{ status: string; uptime: number; timestamp: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getHealth()
      .then((h) => { if (!cancelled) { setHealth(h); setError(null); } })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Health check failed.");
          setHealth(null);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tick]);

  return { health, loading, error, refetch: () => setTick((t) => t + 1) };
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

// ── useStats — dashboard metrics (real /api/stats endpoint) ───────────────

import type { TenantStats, SyncStatusResponse, DataRequest, TenantSettings } from "@/lib/api-client";
import type { AuditLog, Tenant, User } from "@gps/shared";

export interface UseStatsResult {
  stats: TenantStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useStats(): UseStatsResult {
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getStats()
      .then((s) => { if (!cancelled) setStats(s); })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load stats.");
          setStats(null);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tick]);

  return { stats, loading, error, refetch: () => setTick((t) => t + 1) };
}

// ── useGuestActivity — Analytics chart ────────────────────────────────────

export interface UseGuestActivityResult {
  points: Array<{ date: string; count: number }>;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useGuestActivity(days = 30): UseGuestActivityResult {
  const [points, setPoints] = useState<Array<{ date: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getGuestActivity(days)
      .then((r) => { if (!cancelled) { setPoints(r.points); setError(null); } })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load activity.");
          setPoints([]);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [days, tick]);

  return { points, loading, error, refetch: () => setTick((t) => t + 1) };
}

// ── useAuditLogs — audit-logs screen ───────────────────────────────────────

export interface UseAuditLogsResult {
  logs: AuditLog[];
  total: number;
  loading: boolean;
  error: string | null;
  page: number;
  setPage: (p: number) => void;
  refetch: () => void;
}

export function useAuditLogs(initialPage = 1, limit = 20): UseAuditLogsResult {
  const [page, setPage] = useState(initialPage);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.listAuditLogs(page, limit)
      .then((r) => {
        if (cancelled) return;
        setLogs(r.logs);
        setTotal(r.total);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Failed to load audit logs.");
        setLogs([]);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, limit, tick]);

  return { logs, total, loading, error, page, setPage, refetch: () => setTick((t) => t + 1) };
}

// ── useSyncStatus — PMS Integration screen ──────────────────────────────────

export interface UseSyncStatusResult {
  status: SyncStatusResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSyncStatus(): UseSyncStatusResult {
  const [status, setStatus] = useState<SyncStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getSyncStatus()
      .then((s) => { if (!cancelled) setStatus(s); })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load sync status.");
          setStatus(null);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tick]);

  return { status, loading, error, refetch: () => setTick((t) => t + 1) };
}

// ── useDataRequests — Data Requests screen ────────────────────────────────

export interface UseDataRequestsResult {
  requests: DataRequest[];
  total: number;
  loading: boolean;
  error: string | null;
  page: number;
  setPage: (p: number) => void;
  refetch: () => void;
}

export function useDataRequests(initialPage = 1, limit = 20): UseDataRequestsResult {
  const [page, setPage] = useState(initialPage);
  const [requests, setRequests] = useState<DataRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.listDataRequests(page, limit)
      .then((r) => {
        if (cancelled) return;
        setRequests(r.requests);
        setTotal(r.total);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Failed to load data requests.");
        setRequests([]);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, limit, tick]);

  return { requests, total, loading, error, page, setPage, refetch: () => setTick((t) => t + 1) };
}

// ── useUsers — Users screen ─────────────────────────────────────────────────

export interface UseUsersResult {
  users: User[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useUsers(): UseUsersResult {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.listUsers(1, 100)
      .then((r) => {
        if (cancelled) return;
        setUsers(r.users);
        setTotal(r.total);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Failed to load users.");
        setUsers([]);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tick]);

  return { users, total, loading, error, refetch: () => setTick((t) => t + 1) };
}

// ── useTenants — Tenants screen ─────────────────────────────────────────────

export interface UseTenantsResult {
  tenants: Tenant[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTenants(): UseTenantsResult {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.listTenants()
      .then((t) => { if (!cancelled) setTenants(t); })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load tenants.");
          setTenants([]);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tick]);

  return { tenants, loading, error, refetch: () => setTick((t) => t + 1) };
}

// ── useSettings — Settings screen ─────────────────────────────────────────

export interface UseSettingsResult {
  settings: TenantSettings | null;
  loading: boolean;
  error: string | null;
  update: (s: Partial<TenantSettings>) => Promise<void>;
  refetch: () => void;
}

export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getSettings()
      .then((s) => { if (!cancelled) setSettings(s); })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load settings.");
          setSettings(null);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tick]);

  const update = async (s: Partial<TenantSettings>) => {
    const updated = await api.updateSettings(s);
    setSettings(updated);
  };

  return { settings, loading, error, update, refetch: () => setTick((t) => t + 1) };
}
