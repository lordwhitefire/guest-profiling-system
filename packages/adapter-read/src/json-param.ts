import type { Db } from "@gps/shared";

/**
 * Return a postgres.js JSON fragment when the client supports it, or a plain
 * JSON string for lightweight test doubles (pg-mem) that do not implement
 * `sql.json()`. On a real Postgres connection this prevents the
 * double-encoded `{}` string bug.
 */
export function jsonParam(db: Db, value: unknown): unknown {
  const candidate = db as unknown as { json?: (value: unknown) => unknown };
  return typeof candidate.json === "function"
    ? candidate.json(value)
    : JSON.stringify(value);
}