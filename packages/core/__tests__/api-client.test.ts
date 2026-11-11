// =============================================================================
// API client tests
// =============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { api, ApiError } from "../lib/api-client";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function mockResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe("API client", () => {
  describe("api.searchGuests", () => {
    it("returns the data array on success", async () => {
      mockFetch.mockResolvedValue(
        mockResponse({ success: true, data: [{ guestId: "g1" }] }),
      );
      const result = await api.searchGuests("john");
      expect(result).toEqual([{ guestId: "g1" }]);
    });

    it("encodes the query parameter", async () => {
      mockFetch.mockResolvedValue(mockResponse({ success: true, data: [] }));
      await api.searchGuests("john doe@example");
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/guests/search?q=john%20doe%40example",
        expect.objectContaining({ credentials: "include" }),
      );
    });

    it("returns empty array when API returns empty data", async () => {
      mockFetch.mockResolvedValue(
        mockResponse({ success: true, data: [] }),
      );
      const result = await api.searchGuests("zzz");
      expect(result).toEqual([]);
    });
  });

  describe("api.getGuest", () => {
    it("returns the guest object on success", async () => {
      mockFetch.mockResolvedValue(
        mockResponse({ success: true, data: { guestId: "g1", firstName: "John" } }),
      );
      const result = await api.getGuest("g1");
      expect(result).toEqual({ guestId: "g1", firstName: "John" });
    });

    it("throws ApiError with code NOT_FOUND on 404", async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          success: false,
          error: { code: "NOT_FOUND", message: "Guest not found." },
        }, 404),
      );
      await expect(api.getGuest("nonexistent")).rejects.toThrow(ApiError);
      await expect(api.getGuest("nonexistent")).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Guest not found.",
      });
    });

    it("throws ApiError with code UNAUTHORIZED on 401", async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required." },
        }, 401),
      );
      await expect(api.getGuest("g1")).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    });

    it("throws ApiError with code FORBIDDEN on 403", async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          success: false,
          error: { code: "FORBIDDEN", message: "Not owner." },
        }, 403),
      );
      await expect(api.getGuest("g1")).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("throws ApiError with code INTERNAL_ERROR on 500", async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          success: false,
          error: { code: "INTERNAL_ERROR", message: "Internal server error." },
        }, 500),
      );
      await expect(api.getGuest("g1")).rejects.toMatchObject({
        code: "INTERNAL_ERROR",
      });
    });

    it("preserves the details field from the response body", async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid",
            details: [{ path: "email" }],
          },
        }, 400),
      );
      try {
        await api.getGuest("g1");
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).details).toEqual([{ path: "email" }]);
      }
    });
  });

  describe("credentials", () => {
    it("all requests include credentials: include", async () => {
      mockFetch.mockResolvedValue(mockResponse({ success: true, data: {} }));
      await api.getGuest("g1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ credentials: "include" }),
      );
    });
  });

  describe("network errors", () => {
    it("throws ApiError with code NETWORK_ERROR when fetch throws", async () => {
      mockFetch.mockRejectedValue(new Error("Connection refused"));
      await expect(api.getGuest("g1")).rejects.toMatchObject({
        code: "NETWORK_ERROR",
      });
    });
  });

  describe("non-JSON responses", () => {
    it("throws ApiError with code INTERNAL_ERROR when body is not JSON", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.reject(new SyntaxError("Unexpected token")),
      } as unknown as Response);
      await expect(api.getGuest("g1")).rejects.toMatchObject({
        code: "INTERNAL_ERROR",
      });
    });
  });

  describe("api.getReservations", () => {
    it("includes the limit parameter in the URL", async () => {
      mockFetch.mockResolvedValue(mockResponse({ success: true, data: [] }));
      await api.getReservations("g1", 5);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/guests/g1/reservations?limit=5",
        expect.objectContaining({ credentials: "include" }),
      );
    });
  });

  describe("api.login", () => {
    it("POSTs the email and password as JSON", async () => {
      mockFetch.mockResolvedValue(
        mockResponse({ success: true, data: { userId: "u1" } }),
      );
      const result = await api.login("john@example.com", "secret");
      expect(result).toEqual({ userId: "u1" });
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/auth/login",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "john@example.com", password: "secret" }),
        }),
      );
    });
  });

  describe("api.listGuests", () => {
    it("hits /api/guests?page=N&limit=M with the given page and limit", async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          success: true,
          data: [],
          metadata: { page: 2, limit: 20, total: 207 },
        }),
      );
      await api.listGuests(2, 20);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/guests?page=2&limit=20",
        expect.objectContaining({ credentials: "include" }),
      );
    });

    it("returns the data array + metadata.total in a flat object", async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          success: true,
          data: [{ guestId: "g1" }, { guestId: "g2" }],
          metadata: { page: 1, limit: 20, total: 207 },
        }),
      );
      const result = await api.listGuests(1, 20);
      expect(result.guests).toEqual([{ guestId: "g1" }, { guestId: "g2" }]);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.total).toBe(207);
    });

    it("defaults page=1, limit=20 when called with no args", async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          success: true,
          data: [],
          metadata: { page: 1, limit: 20, total: 0 },
        }),
      );
      await api.listGuests();
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/guests?page=1&limit=20",
        expect.objectContaining({ credentials: "include" }),
      );
    });

    it("falls back to data.length for total when metadata is missing", async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          success: true,
          data: [{ guestId: "g1" }, { guestId: "g2" }, { guestId: "g3" }],
        }),
      );
      const result = await api.listGuests(1, 20);
      expect(result.total).toBe(3);
    });

    it("falls back to the requested page/limit when metadata is missing", async () => {
      mockFetch.mockResolvedValue(
        mockResponse({ success: true, data: [] }),
      );
      const result = await api.listGuests(5, 50);
      expect(result.page).toBe(5);
      expect(result.limit).toBe(50);
    });

    it("throws ApiError on a non-success response", async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          success: false,
          error: { code: "FORBIDDEN", message: "Access denied." },
        }, 403),
      );
      await expect(api.listGuests()).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Access denied.",
      });
    });
  });
});
