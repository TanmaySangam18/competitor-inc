import { describe, it, expect } from "vitest";
import { isPremiumAction, PREMIUM_ACTIONS } from "./access-server";

describe("access-server — premium action classification", () => {
  it("gates the real external actions", () => {
    for (const a of ["deploy", "outreach", "ads", "payments", "bluesky", "mastodon", "reddit"]) {
      expect(isPremiumAction(a)).toBe(true);
    }
  });

  it("does NOT gate the free-aha / non-external actions", () => {
    // build = the free aha (capped elsewhere); spend = wallet+policy; unknown = not premium here.
    expect(isPremiumAction("build")).toBe(false);
    expect(isPremiumAction("spend")).toBe(false);
    expect(isPremiumAction("validate")).toBe(false);
    expect(isPremiumAction("")).toBe(false);
  });

  it("PREMIUM_ACTIONS is the source of truth", () => {
    expect(PREMIUM_ACTIONS.has("deploy")).toBe(true);
    expect(PREMIUM_ACTIONS.has("build")).toBe(false);
  });
});
