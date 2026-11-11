// =============================================================================
// API client — typed fetch wrapper
// =============================================================================
// All client-side calls to the API go through this wrapper. It:
//   - Sends credentials (httpOnly JWT cookie) with every request
//   - Unwraps the standard response envelope ({ success, data, metadata })
//   - Throws ApiError with code + message + details on failure
//   - Returns just the `data` payload on success (caller doesn't see envelope)

import type { Guest, Reservation, ApiResponse } from "@gps/shared";

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { credentials: "include", ...init });
  } catch (err) {
    // Network error — fetch threw before we got a response.
    throw new ApiError(
      "NETWORK_ERROR",
      err instanceof Error ? err.message : "Network request failed.",
    );
  }

  // Parse the response body. If JSON parsing fails, it's a server error.
  let body: ApiResponse<T>;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError(
      "INTERNAL_ERROR",
      `Server returned ${res.status} with non-JSON body.`,
    );
  }

  if (!body.success || body.error) {
    throw new ApiError(
      body.error?.code ?? "UNKNOWN",
      body.error?.message ?? "Unknown error.",
      body.error?.details,
    );
  }

  // Success — return just the data payload.
  return body.data as T;
}

/**
 * Like {@link apiFetch} but returns the full response envelope (data +
 * metadata). Use this when the caller needs pagination metadata.
 */
async function apiFetchRaw<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  let res: Response;
  try {
    res = await fetch(path, { credentials: "include", ...init });
  } catch (err) {
    throw new ApiError(
      "NETWORK_ERROR",
      err instanceof Error ? err.message : "Network request failed.",
    );
  }

  let body: ApiResponse<T>;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError(
      "INTERNAL_ERROR",
      `Server returned ${res.status} with non-JSON body.`,
    );
  }

  if (!body.success || body.error) {
    throw new ApiError(
      body.error?.code ?? "UNKNOWN",
      body.error?.message ?? "Unknown error.",
      body.error?.details,
    );
  }

  return body;
}

export interface LoyaltyResponse {
  tier: string;
  pointsBalance: number;
  totalStays: number;
}

/** Paged list response — `data` is the page of guests, `metadata.total` is the global count. */
export interface GuestListResponse {
  guests: Guest[];
  page: number;
  limit: number;
  total: number;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiFetch<{ userId: string }>("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    apiFetch<never>("/api/auth/logout", { method: "POST" }),

  // Guest search (Feature F1 — live search)
  searchGuests: (q: string): Promise<Guest[]> =>
    apiFetch<Guest[]>(`/api/guests/search?q=${encodeURIComponent(q)}`),

  // Guest list (paginated) — for the Directory screen and dashboard counts.
  // Backend returns { success, data: Guest[], metadata: { page, limit, total } }.
  // We surface the metadata fields alongside the guest array for the UI.
  listGuests: async (page = 1, limit = 20): Promise<GuestListResponse> => {
    const body = await apiFetchRaw<Guest[]>(`/api/guests?page=${page}&limit=${limit}`);
    return {
      guests: body.data ?? [],
      page: body.metadata?.page ?? page,
      limit: body.metadata?.limit ?? limit,
      total: body.metadata?.total ?? (body.data?.length ?? 0),
    };
  },

  // Single guest
  getGuest: (id: string): Promise<Guest> =>
    apiFetch<Guest>(`/api/guests/${id}`),

  updateGuest: (id: string, updates: Partial<Guest>): Promise<Guest> =>
    apiFetch<Guest>(`/api/guests/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }),

  createGuest: (guest: Pick<Guest, "firstName" | "lastName" | "email"> & { phone?: string }): Promise<Guest> =>
    apiFetch<Guest>("/api/guests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(guest),
    }),

  // Linked spokes
  getReservations: (id: string, limit = 5): Promise<Reservation[]> =>
    apiFetch<Reservation[]>(`/api/guests/${id}/reservations?limit=${limit}`),

  getLoyalty: (id: string): Promise<LoyaltyResponse> =>
    apiFetch<LoyaltyResponse>(`/api/guests/${id}/loyalty`),

  // ── Admin endpoints ────────────────────────────────────────────────────

  // Audit logs (paginated, filterable)
  listAuditLogs: async (page = 1, limit = 20, action?: string, entityType?: string) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (action) params.set("action", action);
    if (entityType) params.set("entityType", entityType);
    const body = await apiFetchRaw<AuditLog[]>(`/api/audit-logs?${params}`);
    return {
      logs: body.data ?? [],
      page: body.metadata?.page ?? page,
      limit: body.metadata?.limit ?? limit,
      total: body.metadata?.total ?? (body.data?.length ?? 0),
    };
  },

  // Dashboard stats
  getStats: (): Promise<TenantStats> =>
    apiFetch<TenantStats>("/api/stats"),

  // Tenants (caller sees their own in v1)
  listTenants: (): Promise<Tenant[]> =>
    apiFetch<Tenant[]>("/api/tenants"),

  createTenant: (name: string) =>
    apiFetch<Tenant>("/api/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }),

  // Users (admin)
  listUsers: async (page = 1, limit = 20) => {
    const body = await apiFetchRaw<User[]>(`/api/users?page=${page}&limit=${limit}`);
    return {
      users: body.data ?? [],
      page: body.metadata?.page ?? page,
      limit: body.metadata?.limit ?? limit,
      total: body.metadata?.total ?? (body.data?.length ?? 0),
    };
  },

  createUser: (email: string, password: string, groups: string[] = ["Receptionist"]) =>
    apiFetch<User>("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, groups }),
    }),

  // Sync status (PMS Integration screen)
  getSyncStatus: (): Promise<SyncStatusResponse> =>
    apiFetch<SyncStatusResponse>("/api/sync-status"),

  // Data subject requests (NDPR/GDPR/CCPA)
  listDataRequests: async (page = 1, limit = 20, status?: string) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.set("status", status);
    const body = await apiFetchRaw<DataRequest[]>(`/api/data-requests?${params}`);
    return {
      requests: body.data ?? [],
      page: body.metadata?.page ?? page,
      limit: body.metadata?.limit ?? limit,
      total: body.metadata?.total ?? (body.data?.length ?? 0),
    };
  },

  createDataRequest: (payload: {
    guestId?: string;
    guestEmail?: string;
    type: "ACCESS" | "EXPORT" | "CORRECTION" | "DELETION";
    description?: string;
  }) =>
    apiFetch<DataRequest>("/api/data-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  // Health (unauthenticated liveness probe)
  getHealth: async (): Promise<{ status: string; service: string; timestamp: string; uptime: number }> => {
    const res = await fetch("/api/health", { credentials: "include" });
    if (!res.ok) throw new ApiError("HEALTH_UNAVAILABLE", `Health check returned ${res.status}.`);
    return res.json();
  },

  // Settings
  getSettings: (): Promise<TenantSettings> =>
    apiFetch<TenantSettings>("/api/settings"),

  updateSettings: (settings: Partial<TenantSettings>) =>
    apiFetch<TenantSettings>("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    }),
};

// ── Admin-only response types (mirror of backend types) ──────────────────

import type { AuditLog, Tenant, User } from "@gps/shared";

export interface TenantStats {
  totalGuests: number;
  totalVip: number;
  totalReturning: number;
  totalNew: number;
  totalThisMonth: number;
  lastSyncAt: string | null;
  syncErrors: number;
  auditEvents24h: number;
}

export interface SyncStatusResponse {
  states: Array<{
    tenantId: string;
    tableName: string;
    lastSeenXmin: string;  // BigInt serialized as string in JSON
    whereClause: string | null;
    updatedAt: string;
  }>;
  recentEvents: Array<{
    logId: string;
    action: string;
    entityType: string;
    entityId: string | null;
    createdAt: string;
  }>;
  hasAdapterConnection: boolean;
}

export type DataRequestType = "ACCESS" | "EXPORT" | "CORRECTION" | "DELETION";
export type DataRequestStatus = "SUBMITTED" | "REVIEWING" | "FULFILLED" | "REJECTED";

export interface DataRequest {
  requestId: string;
  tenantId: string;
  guestId: string | null;
  guestEmail: string | null;
  type: DataRequestType;
  status: DataRequestStatus;
  description: string | null;
  submittedBy: string;
  submittedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  notes: string | null;
}

export interface TenantSettings {
  emailNotifications: boolean;
  autoSync: boolean;
  multiFactorAuth: boolean;
  guestProfileMatching: boolean;
  dataRetentionDays: number;
}
