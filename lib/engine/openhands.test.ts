import { describe, it, expect } from "vitest";
import { openhandsConfigured, openhandsBuildExecutor } from "./openhands";

// In the test env OPENHANDS_API_URL/KEY are unset → the adapter is a no-op and the caller falls back to
// the GitHub builder / simulated path. (The live API path is exercised once a real endpoint is provided.)
describe("openhands adapter (gating)", () => {
  it("reports not-configured and returns a null executor when env is unset", () => {
    expect(openhandsConfigured()).toBe(false);
    expect(openhandsBuildExecutor()).toBeNull();
  });
});
