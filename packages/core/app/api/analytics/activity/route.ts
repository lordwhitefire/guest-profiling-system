// =============================================================================
// GET /api/analytics/activity — guest profile activity per day
// =============================================================================
// Powers the Analytics chart. Counts guest records created per day for the
// caller's tenant over the last N days (default 30, max 90). Days with no
// guests are returned as zero so the chart has a continuous series.

import { NextResponse, type NextRequest } from "next/server";
import { getDb, resolveTenantScope } from "@gps/shared";
import { authenticate } from "@/src/server/auth-helpers";
import { ok, badRequest, forbidden, serverError } from "@/src/server/response";

export const runtime = "nodejs";

export interface ActivityPoint {
  date: string; // YYYY-MM-DD (UTC)
  count: number;
}

export interface ActivityResponse {
  days: number;
  points: ActivityPoint[];
}

/**
 * Zero-fill a dense day series ending today (UTC). Exported for unit tests.
 */
export function buildDailySeries(
  byDate: Map<string, number>,
  days: number,
  now: Date = new Date(),
): ActivityPoint[] {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (days - 1));

  const points: ActivityPoint[] = [];
  for (let i = 0; i < days; i += 1) {
    const date = new Date(start.getTime() + i * 86_400_000).toISOString().slice(0, 10);
    points.push({ date, count: byDate.get(date) ?? 0 });
  }
  return points;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;
  const claims = auth.claims;

  const scope = resolveTenantScope(claims);
  if (scope.kind === "denied") return forbidden(scope.reason);
  if (scope.kind !== "single-tenant") return forbidden("Chain-level scope not supported in v1.");

  const rawDays = Number(request.nextUrl.searchParams.get("days") ?? "30");
  if (!Number.isInteger(rawDays) || rawDays < 1 || rawDays > 90) {
    return badRequest("BAD_REQUEST", "days must be an integer between 1 and 90.");
  }
  const days = rawDays;

  const db = getDb();
  try {
    const rows = await db`
      SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS date,
             count(*)::int AS count
      FROM guests
      WHERE tenant_id = ${scope.tenantId}
        AND deleted_at IS NULL
        AND created_at >= date_trunc('day', now()) - ((${days - 1})::int || ' days')::interval
      GROUP BY 1
      ORDER BY 1
    `;
    const byDate = new Map<string, number>(
      rows.map((row) => [String(row.date), Number(row.count)]),
    );

    return ok<ActivityResponse>({ days, points: buildDailySeries(byDate, days) });
  } catch (err) {
    console.error("[GET /api/analytics/activity] Failed:", err);
    return serverError();
  }
}
