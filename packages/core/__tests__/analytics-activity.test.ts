import { describe, expect, it } from "vitest";
import { buildDailySeries } from "@/app/api/analytics/activity/route";

describe("buildDailySeries", () => {
  const now = new Date("2026-11-12T10:00:00.000Z");

  it("returns a dense 30-day series ending today (UTC)", () => {
    const points = buildDailySeries(new Map(), 30, now);
    expect(points).toHaveLength(30);
    expect(points[0]?.date).toBe("2026-10-14");
    expect(points[29]?.date).toBe("2026-11-12");
  });

  it("fills days with no rows as zero and keeps real counts", () => {
    const points = buildDailySeries(new Map([["2026-11-10", 4]]), 3, now);
    expect(points).toEqual([
      { date: "2026-11-10", count: 4 },
      { date: "2026-11-11", count: 0 },
      { date: "2026-11-12", count: 0 },
    ]);
  });
});
