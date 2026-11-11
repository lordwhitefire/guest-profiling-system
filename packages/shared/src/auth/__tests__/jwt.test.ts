import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { issueJwt, verifyJwt, getExpiresInSeconds, type JwtClaims } from "../jwt.js";

describe("JWT (issue + verify)", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "a".repeat(64); // 32 bytes hex = 64 chars
    process.env.JWT_EXPIRES_IN_SECONDS = "86400";
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_EXPIRES_IN_SECONDS;
  });

  it("issues and verifies a valid JWT roundtrip", async () => {
    const token = await issueJwt({
      userId: "11111111-1111-4000-8000-111111111111",
      tenantId: "22222222-2222-4000-8000-222222222222",
      groups: ["Receptionist"],
    });
    const claims = await verifyJwt(token);
    expect(claims.sub).toBe("11111111-1111-4000-8000-111111111111");
    expect(claims.tenant_id).toBe("22222222-2222-4000-8000-222222222222");
    expect(claims.groups).toEqual(["Receptionist"]);
    expect(claims.iss).toBe("guest-profiling-system");
    expect(claims.aud).toBe("gps-users");
  });

  it("includes iat and exp claims with correct expiration", async () => {
    const token = await issueJwt({
      userId: "u1",
      tenantId: "t1",
      groups: ["Admin"],
    });
    const claims = await verifyJwt(token);
    expect(typeof claims.iat).toBe("number");
    expect(typeof claims.exp).toBe("number");
    expect((claims.exp ?? 0) - (claims.iat ?? 0)).toBe(getExpiresInSeconds());
    expect(getExpiresInSeconds()).toBe(86400);
  });

  it("rejects a tampered token (signature changed)", async () => {
    // Issue a token, then corrupt the signature by swapping the entire
    // signature portion for a known-invalid string.
    const token = await issueJwt({
      userId: "u1",
      tenantId: "t1",
      groups: ["Admin"],
    });
    // Split into header.payload.signature
    const parts = token.split(".");
    expect(parts.length).toBe(3);
    // Replace the signature with a different (but base64url-valid) string.
    // 43 chars of "X" is a valid base64url 32-byte signature shape.
    const tampered = `${parts[0]}.${parts[1]}.${"X".repeat(43)}`;
    await expect(verifyJwt(tampered)).rejects.toThrow();
  });

  it("rejects an expired token (exp set in the past)", async () => {
    // Issue a token with a manually-set past expiration by using the jose
    // library directly with a negative clock tolerance.
    const { SignJWT } = await import("jose");
    const secret = new TextEncoder().encode(process.env.JWT_SECRET as string);
    // Create a token that expired 1 hour ago.
    const past = Math.floor(Date.now() / 1000) - 3600;
    const token = await new SignJWT({
      sub: "u1", tenant_id: "t1", groups: ["Admin"],
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt(past - 86400)
      .setExpirationTime(past)
      .setIssuer("guest-profiling-system")
      .setAudience("gps-users")
      .sign(secret);

    await expect(verifyJwt(token)).rejects.toThrow();
  });

  it("rejects a token signed with a different secret", async () => {
    // Issue with one secret, then change the env var, then verify.
    // NOTE: jwt.ts reads the secret at module load, so we use a different
    // approach — issue a token with a totally different secret inline.
    const { SignJWT } = await import("jose");
    const wrongSecret = new TextEncoder().encode("a-different-secret".repeat(8));
    const token = await new SignJWT({
      sub: "u1", tenant_id: "t1", groups: ["Admin"],
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .setIssuer("guest-profiling-system")
      .setAudience("gps-users")
      .sign(wrongSecret);

    await expect(verifyJwt(token)).rejects.toThrow();
  });
});
