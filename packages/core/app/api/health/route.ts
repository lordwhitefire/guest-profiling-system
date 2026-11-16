// =============================================================================
// GET /api/health — liveness + database probe
// =============================================================================
// Render probes this endpoint. It returns 200 only when the process is alive
// AND a short `SELECT 1` against the clean DB succeeds. A database outage
// returns 503 so the platform can pull the instance out of rotation.
//
// No secrets or raw database errors are returned to the caller.

import { NextResponse } from "next/server";
import { getDb } from "@gps/shared";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  const base = {
    service: "gps-core",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };

  try {
    const db = getDb();
    await db`SELECT 1`;
    return NextResponse.json({ ...base, status: "ok", database: "ok" });
  } catch (err) {
    console.error("[GET /api/health] Database probe failed:", err);
    return NextResponse.json(
      { ...base, status: "error", database: "unavailable" },
      { status: 503 },
    );
  }
}