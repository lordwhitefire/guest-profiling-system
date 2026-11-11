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

export interface LoyaltyResponse {
  tier: string;
  pointsBalance: number;
  totalStays: number;
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

  // Single guest
  getGuest: (id: string): Promise<Guest> =>
    apiFetch<Guest>(`/api/guests/${id}`),

  updateGuest: (id: string, updates: Partial<Guest>): Promise<Guest> =>
    apiFetch<Guest>(`/api/guests/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }),

  // Linked spokes
  getReservations: (id: string, limit = 5): Promise<Reservation[]> =>
    apiFetch<Reservation[]>(`/api/guests/${id}/reservations?limit=${limit}`),

  getLoyalty: (id: string): Promise<LoyaltyResponse> =>
    apiFetch<LoyaltyResponse>(`/api/guests/${id}/loyalty`),
};
