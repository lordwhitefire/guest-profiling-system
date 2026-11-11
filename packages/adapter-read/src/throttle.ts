// =============================================================================
// Throttle — Card 1 §3.6 contract
// =============================================================================
// The throttle is a simple time-budget governor. For each chunk operation
// (read source + apply to target), the throttle records start/end times and
// accumulates totalJobDuration (time spent in source DB operations).
//
// At the end of each chunk, compute:
//   utilization = totalJobDuration / totalDuration
//
// If utilization > target_level, sleep:
//   waitTime = 2 × (utilization - target_level) × totalDuration
//
// The factor of 2 brings the running average down to the target over the
// next chunk. If target_level >= 1.0 (100%), throttle is bypassed entirely.

export interface ThrottleOptions {
  name: string;                 // "updates" or "deletes"
  targetLevel: number;         // 0.01 to 1.0; clamped
}

export class Throttle {
  readonly name: string;
  readonly targetLevel: number;       // clamped to [0.01, 1.0]
  private startTime: number | null = null;
  private jobStartTime: number | null = null;
  private totalJobDurationMs = 0;

  constructor(opts: ThrottleOptions) {
    this.name = opts.name;
    // Clamp target level: minimum 1% (otherwise it would always be over budget
    // and sleep forever); maximum 100% (no throttle).
    this.targetLevel = Math.max(0.01, Math.min(1.0, opts.targetLevel));
  }

  /**
   * Mark the start of a source DB operation. Called before reading from source.
   */
  start(): void {
    const now = Date.now();
    this.jobStartTime = now;
    if (this.startTime === null) {
      this.startTime = now;
    }
  }

  /**
   * Mark the end of a source DB operation. Called after reading from source
   * (and after applying to target, but only the source portion should count
   * toward job duration per Card 1's contract — see note in start()).
   *
   * Per Card 1's source code: totalJobDuration tracks time spent in the
   * source DB only. We do NOT include target DB write time.
   */
  end(): void {
    if (this.jobStartTime === null) {
      // end() called without start() — no-op.
      return;
    }
    const now = Date.now();
    this.totalJobDurationMs += now - this.jobStartTime;
    this.jobStartTime = null;
  }

  /**
   * Compute current utilization (0.0 to 1.0+).
   * Returns 0 if no time has elapsed (avoid divide-by-zero).
   */
  utilization(): number {
    if (this.startTime === null) return 0;
    const totalDuration = Date.now() - this.startTime;
    if (totalDuration === 0) return 0;
    return this.totalJobDurationMs / totalDuration;
  }

  /**
   * Sleep if utilization exceeds target. Returns the ms slept (0 if no sleep).
   *
   * Per Card 1: waitTime = 2 × (utilization - target_level) × totalDuration
   */
  async wait(): Promise<number> {
    // If target is 100% (or above, after clamping), never sleep.
    if (this.targetLevel >= 1.0) return 0;

    const totalDuration = this.startTime === null ? 0 : Date.now() - this.startTime;
    if (totalDuration === 0) return 0;

    const utilization = this.totalJobDurationMs / totalDuration;
    if (utilization <= this.targetLevel) return 0;

    const overshoot = utilization - this.targetLevel;
    const waitMs = Math.ceil(2 * overshoot * totalDuration);
    if (waitMs <= 0) return 0;

    await sleep(waitMs);
    return waitMs;
  }

  /**
   * Returns the throttle's current state for logging/debugging.
   */
  stats(): {
    targetLevel: number;
    totalDurationMs: number;
    totalJobDurationMs: number;
    utilization: number;
  } {
    const totalDuration = this.startTime === null ? 0 : Date.now() - this.startTime;
    return {
      targetLevel: this.targetLevel,
      totalDurationMs: totalDuration,
      totalJobDurationMs: this.totalJobDurationMs,
      utilization: totalDuration === 0 ? 0 : this.totalJobDurationMs / totalDuration,
    };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
