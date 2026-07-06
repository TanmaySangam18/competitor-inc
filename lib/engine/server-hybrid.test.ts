import { describe, it, expect } from "vitest";
import { shouldUseFreeTier } from "./server";

// Hybrid routing: the CHEAP tier routes to a free provider (when configured); mid/strong (the validation
// verdict + code builds) always stay on Claude.
describe("hybrid model routing — shouldUseFreeTier", () => {
  it("routes the cheap model to the free tier ONLY when a free provider is configured", () => {
    expect(shouldUseFreeTier("claude-haiku-4-5", "claude-haiku-4-5", true)).toBe(true);
    expect(shouldUseFreeTier("claude-haiku-4-5", "claude-haiku-4-5", false)).toBe(false);
  });

  it("never routes mid/strong models (verdict + builds stay on Claude)", () => {
    expect(shouldUseFreeTier("claude-opus-4-8", "claude-haiku-4-5", true)).toBe(false);
    expect(shouldUseFreeTier("claude-sonnet-5", "claude-haiku-4-5", true)).toBe(false);
  });

  it("handles an undefined model (managed default → not free)", () => {
    expect(shouldUseFreeTier(undefined, "claude-haiku-4-5", true)).toBe(false);
  });
});
