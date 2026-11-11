// =============================================================================
// Response envelope helpers
// =============================================================================
// Per PM Plan §8.2 — simplified standard envelope.
// All API routes use these helpers to keep response shapes consistent.

import { NextResponse } from "next/server";
import type { ApiResponse } from "@gps/shared";

// ── Success responses ────────────────────────────────────────────────────

export function ok<T>(data: T, metadata?: ApiResponse<T>["metadata"]): NextResponse {
  const body: ApiResponse<T> = { success: true, data, ...(metadata ? { metadata } : {}) };
  return NextResponse.json(body, { status: 200 });
}

export function created<T>(data: T): NextResponse {
  const body: ApiResponse<T> = { success: true, data };
  return NextResponse.json(body, { status: 201 });
}

// ── Error responses ────────────────────────────────────────────────────────

export function badRequest(code: string, message: string, details?: unknown): NextResponse {
  const body: ApiResponse<never> = {
    success: false,
    error: { code, message, ...(details !== undefined ? { details } : {}) },
  };
  return NextResponse.json(body, { status: 400 });
}

export function unauthorized(message = "Authentication required."): NextResponse {
  const body: ApiResponse<never> = {
    success: false,
    error: { code: "UNAUTHORIZED", message },
  };
  return NextResponse.json(body, { status: 401 });
}

export function forbidden(message = "Access denied."): NextResponse {
  const body: ApiResponse<never> = {
    success: false,
    error: { code: "FORBIDDEN", message },
  };
  return NextResponse.json(body, { status: 403 });
}

export function notFound(message = "Not found."): NextResponse {
  const body: ApiResponse<never> = {
    success: false,
    error: { code: "NOT_FOUND", message },
  };
  return NextResponse.json(body, { status: 404 });
}

export function conflict(message: string): NextResponse {
  const body: ApiResponse<never> = {
    success: false,
    error: { code: "CONFLICT", message },
  };
  return NextResponse.json(body, { status: 409 });
}

export function serverError(message = "Internal server error."): NextResponse {
  // Per testing.md §2: do NOT leak the actual error to the client.
  // The caller is responsible for logging the real error server-side.
  const body: ApiResponse<never> = {
    success: false,
    error: { code: "INTERNAL_ERROR", message },
  };
  return NextResponse.json(body, { status: 500 });
}

export function notImplemented(): NextResponse {
  const body: ApiResponse<never> = {
    success: false,
    error: { code: "NOT_IMPLEMENTED", message: "This endpoint is not yet implemented." },
  };
  return NextResponse.json(body, { status: 501 });
}
