// =============================================================================
// Database client — postgres.js wrapper
// =============================================================================
// Single connection pool per process. Lazy-initialized on first use.
// Connection URL comes from DATABASE_URL env var.

import postgres from "postgres";

let client: ReturnType<typeof postgres> | null = null;

export function getDb(): ReturnType<typeof postgres> {
  if (client) return client;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL environment variable is required. " +
      "Copy .env.example to .env and fill in real values."
    );
  }

  client = postgres(url, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    ssl: process.env.NODE_ENV === "production" ? "require" : false,
  });

  return client;
}

/**
 * Close the database connection pool. Useful in tests and graceful shutdown.
 */
export async function closeDb(): Promise<void> {
  if (client) {
    await client.end();
    client = null;
  }
}

export type Db = ReturnType<typeof getDb>;
