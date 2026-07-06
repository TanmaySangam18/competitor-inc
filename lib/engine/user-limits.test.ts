import { describe, it, expect } from "vitest";
import { USER_DAILY_LIMITS, checkUserLimit } from "./user-limits";

describe("user-limits", () => {
  it("defines sane positive daily caps for each metered kind", () => {
    expect(USER_DAILY_LIMITS.validate).toBeGreaterThan(0);
    expect(USER_DAILY_LIMITS.shift).toBeGreaterThan(0);
    expect(USER_DAILY_LIMITS.goal).toBeGreaterThan(0);
  });

  it("fails OPEN (allowed, not enforced) when Supabase/auth is unavailable", async () => {
    // No Supabase env in the test runner ⇒ the check must never block or throw.
    const r = await checkUserLimit("validate");
    expect(r.allowed).toBe(true);
    expect(r.enforced).toBe(false);
    expect(r.limit).toBe(USER_DAILY_LIMITS.validate);
  });
});
