import { describe, it, expect } from "vitest";
import { runValidate, runShift, runChat, realModelConfigured } from "./server";
import type { Company } from "./types";

const company: Company = {
  id: "co1",
  name: "Testly",
  slug: "testly",
  idea: "an app for testing",
  createdAt: 0,
  status: "operating",
  night: 0,
  ledger: { spent: 0, refunded: 0, tasksDone: 0, tasksFailed: 0 },
};

describe("server engine", () => {
  it("reports whether a real model is configured as a boolean", () => {
    expect(typeof realModelConfigured()).toBe("boolean");
  });

  it("runValidate returns a coherent validation", async () => {
    const v = await runValidate("a marketplace for plants");
    expect(["strong", "weak", "mixed"]).toContain(v.verdict);
    expect(v.waitlist).toBeGreaterThanOrEqual(0);
    expect(v.steps.length).toBeGreaterThan(0);
    expect(v.experiments).toHaveLength(4);
    expect(v.confidence).toBeGreaterThanOrEqual(0);
    expect(v.confidence).toBeLessThanOrEqual(100);
  });

  it("runShift returns activities + approvals arrays for the next night", async () => {
    const r = await runShift(company);
    expect(Array.isArray(r.activities)).toBe(true);
    expect(Array.isArray(r.approvals)).toBe(true);
    for (const a of r.activities) expect(a.night).toBe(1);
    for (const ap of r.approvals) expect(ap.resolved).toBeUndefined();
  });

  it("runChat returns a non-empty contextual reply (simulated when no key)", async () => {
    const reply = await runChat({ name: company.name, idea: company.idea }, "should we launch ads?");
    expect(typeof reply).toBe("string");
    expect(reply.length).toBeGreaterThan(0);
    expect(/approval|outbound|campaign/i.test(reply)).toBe(true);
  });
});
