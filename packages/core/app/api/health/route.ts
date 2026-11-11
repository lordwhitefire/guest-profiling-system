// =============================================================================
// GET /api/health — Render health check
// =============================================================================
// Render probes this endpoint every few seconds. Returns 200 if the process
// is alive. Does NOT require auth — Render's probe has no session.
//
// We deliberately keep this lightweight: no DB query, no auth check. If the
// process can respond, it's healthy. Database connectivity is monitored
// separately via the cron worker's audit log.

import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  return NextResponse.json(
    {
      status: "ok",
      service: "gps-core",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    { status: 200 },
  );
}
