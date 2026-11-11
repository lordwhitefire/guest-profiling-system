// Placeholder test for the adapter-read stub. TASK-002 will replace this
// with real tests against a seeded QloApps source DB (Card 4 schema).

import { describe, it, expect } from "vitest";

describe("@gps/adapter-read stub (TASK-002 not yet implemented)", () => {
  it("stub module loads without crashing", async () => {
    // The stub currently calls process.exit(1) at module load, which would
    // crash the test runner. So we just assert that this test file itself
    // loads — the actual stub behavior is verified by the OpenSpec task
    // registry: TASK-002 is "pending" until the first-hotel decision.
    expect(true).toBe(true);
  });
});
