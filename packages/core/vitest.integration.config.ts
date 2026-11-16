import { defineConfig } from "vitest/config";
import path from "node:path";

// Local-Postgres integration suite. It is deliberately separate from the unit
// suite: it needs the owner's real clean DB and hotel source DB, and it writes
// temporary rows that it removes again.
export default defineConfig({
  test: {
    environment: "node",
    include: ["integration/**/*.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    fileParallelism: false,
    sequence: { concurrent: false },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});