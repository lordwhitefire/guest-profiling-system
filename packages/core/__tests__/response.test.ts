// =============================================================================
// Response envelope tests
// =============================================================================

import { describe, it, expect } from "vitest";
import {
  ok,
  created,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  serverError,
  notImplemented,
} from "../src/server/response";

describe("Response envelope helpers", () => {
  it("ok() returns 200 with success envelope", async () => {
    const res = ok({ foo: "bar" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true, data: { foo: "bar" } });
  });

  it("ok() includes metadata when provided", async () => {
    const res = ok([1, 2, 3], { page: 1, limit: 20, total: 100 });
    const body = await res.json();
    expect(body.metadata).toEqual({ page: 1, limit: 20, total: 100 });
  });

  it("created() returns 201 with success envelope", async () => {
    const res = created({ id: "x" });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ id: "x" });
  });

  it("badRequest() returns 400 with error shape", async () => {
    const res = badRequest("VALIDATION_ERROR", "Missing email");
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Missing email" },
    });
  });

  it("badRequest() includes details when provided", async () => {
    const res = badRequest("VALIDATION_ERROR", "Invalid", [{ path: "email" }]);
    const body = await res.json();
    expect(body.error.details).toEqual([{ path: "email" }]);
  });

  it("unauthorized() returns 401 with code UNAUTHORIZED", async () => {
    const res = unauthorized();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("forbidden() returns 403 with code FORBIDDEN", async () => {
    const res = forbidden("Not owner");
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe("FORBIDDEN");
    expect(body.error.message).toBe("Not owner");
  });

  it("notFound() returns 404 with code NOT_FOUND", async () => {
    const res = notFound("Guest not found");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("conflict() returns 409 with code CONFLICT", async () => {
    const res = conflict("Email exists");
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.code).toBe("CONFLICT");
  });

  it("serverError() returns 500 with generic message (no leak)", async () => {
    const res = serverError();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe("INTERNAL_ERROR");
    expect(body.error.message).toBe("Internal server error.");
    // Must NOT contain the actual error details.
    expect(JSON.stringify(body)).not.toContain("stack");
    expect(JSON.stringify(body)).not.toContain("undefined");
  });

  it("notImplemented() returns 501", async () => {
    const res = notImplemented();
    expect(res.status).toBe(501);
    const body = await res.json();
    expect(body.error.code).toBe("NOT_IMPLEMENTED");
  });
});
