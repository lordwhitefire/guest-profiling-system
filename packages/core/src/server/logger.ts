// =============================================================================
// Structured logger — JSON-line logs for observability
// =============================================================================
// Per Blueprint area 19 (Monitoring and observability). Every API request
// is logged as a single JSON line on stdout, ready for ingestion by Render's
// log drain → Datadog / Logtail / Loki / etc.
//
// Format: { time, level, request_id, method, path, status, duration_ms,
//           tenant_id, user_id, ip, user_agent, error? }
//
// In production, also surfaces to Sentry if SENTRY_DSN is set. Sentry hooks
// are best-effort — logging must never block a request.

type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  requestId?: string;
  tenantId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  path?: string;
  status?: number;
  durationMs?: number;
  [key: string]: unknown;
}

const LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const MIN_LEVEL: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) ?? (process.env.NODE_ENV === "production" ? "info" : "debug");

function writeLog(level: LogLevel, msg: string, ctx: LogContext = {}): void {
  if (LEVELS[level] < LEVELS[MIN_LEVEL]) return;

  const entry = {
    time: new Date().toISOString(),
    level,
    msg,
    ...ctx,
  };

  // Always write to stdout (Render's log drain picks this up)
  // JSON-line format: one log entry per line, no newlines inside the JSON
  if (level === "error") {
    process.stderr.write(JSON.stringify(entry) + "\n");
  } else {
    process.stdout.write(JSON.stringify(entry) + "\n");
  }

  // Best-effort Sentry hook for errors in production
  if (level === "error" && process.env.SENTRY_DSN && typeof fetch !== "undefined") {
    try {
      // We don't pull in the full Sentry SDK here — too heavy for this slice.
      // Production should install @sentry/nextjs and wrap Next.js with it.
      // This is a placeholder that surfaces the error to a Sentry-compatible
      // webhook endpoint if SENTRY_DSN is set.
      void fetch(process.env.SENTRY_DSN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level,
          message: msg,
          extra: ctx,
          timestamp: entry.time,
        }),
      }).catch(() => { /* best-effort; never throw */ });
    } catch {
      /* best-effort */
    }
  }
}

export const log = {
  debug: (msg: string, ctx?: LogContext) => writeLog("debug", msg, ctx),
  info: (msg: string, ctx?: LogContext) => writeLog("info", msg, ctx),
  warn: (msg: string, ctx?: LogContext) => writeLog("warn", msg, ctx),
  error: (msg: string, ctx?: LogContext) => writeLog("error", msg, ctx),
};

/** Generate a short request ID (UUID v4 truncated) for log correlation. */
export function newRequestId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID().slice(0, 8);
  }
  // Fallback for environments without crypto.randomUUID
  return Math.random().toString(36).slice(2, 10);
}
