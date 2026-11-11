// =============================================================================
// Throttle tests — Card 1 §3.6 contract
// =============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Throttle } from "../src/throttle.js";

describe("Throttle (Card 1 §3.6)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does NOT sleep when utilization is below target_level", async () => {
    const t = new Throttle({ name: "updates", targetLevel: 0.75 });
    t.start();
    // 50ms of "job" time
    vi.advanceTimersByTime(50);
    t.end();
    // 50ms more of non-job time (total elapsed = 100ms; utilization = 50%)
    vi.advanceTimersByTime(50);
    const slept = await t.wait();
    expect(slept).toBe(0);
  });

  it("sleeps 2 × (utilization - target_level) × totalDuration when over budget", async () => {
    const t = new Throttle({ name: "updates", targetLevel: 0.5 });
    t.start();
    // 100ms of job time (utilization = 100% after this)
    vi.advanceTimersByTime(100);
    t.end();
    // Total elapsed = 100ms; utilization = 1.0
    // Expected sleep = 2 × (1.0 - 0.5) × 100ms = 100ms
    const waitPromise = t.wait();
    // Advance fake timers to resolve the setTimeout inside wait()
    vi.advanceTimersByTime(200);
    const slept = await waitPromise;
    expect(slept).toBe(100);
  });

  it("never sleeps when target_level >= 1.0 (100% = disabled)", async () => {
    const t = new Throttle({ name: "updates", targetLevel: 1.0 });
    t.start();
    vi.advanceTimersByTime(1000);
    t.end();
    const slept = await t.wait();
    expect(slept).toBe(0);
  });

  it("clamps target_level to [0.01, 1.0]", () => {
    const t1 = new Throttle({ name: "x", targetLevel: 0.001 });
    expect(t1.targetLevel).toBe(0.01);
    const t2 = new Throttle({ name: "y", targetLevel: 5.0 });
    expect(t2.targetLevel).toBe(1.0);
    const t3 = new Throttle({ name: "z", targetLevel: -1 });
    expect(t3.targetLevel).toBe(0.01);
  });

  it("tracks totalJobDuration cumulatively across multiple chunks", () => {
    const t = new Throttle({ name: "updates", targetLevel: 0.5 });
    t.start();
    vi.advanceTimersByTime(40);
    t.end();
    t.start();
    vi.advanceTimersByTime(60);
    t.end();
    const stats = t.stats();
    expect(stats.totalJobDurationMs).toBe(100);
  });

  it("utilization() returns 0 if no time has elapsed (no divide-by-zero)", () => {
    const t = new Throttle({ name: "x", targetLevel: 0.5 });
    expect(t.utilization()).toBe(0);
  });

  it("wait() is a no-op if totalDuration is zero", async () => {
    const t = new Throttle({ name: "x", targetLevel: 0.5 });
    // Don't call start() — totalDuration is 0
    const slept = await t.wait();
    expect(slept).toBe(0);
  });

  it("end() without start() is a no-op", () => {
    const t = new Throttle({ name: "x", targetLevel: 0.5 });
    expect(() => t.end()).not.toThrow();
    expect(t.stats().totalJobDurationMs).toBe(0);
  });

  it("stats() returns expected shape", () => {
    const t = new Throttle({ name: "updates", targetLevel: 0.75 });
    t.start();
    vi.advanceTimersByTime(50);
    t.end();
    const stats = t.stats();
    expect(stats).toHaveProperty("targetLevel");
    expect(stats).toHaveProperty("totalDurationMs");
    expect(stats).toHaveProperty("totalJobDurationMs");
    expect(stats).toHaveProperty("utilization");
    expect(stats.targetLevel).toBe(0.75);
    expect(stats.totalJobDurationMs).toBe(50);
    expect(stats.utilization).toBeCloseTo(1.0, 2);
  });
});
