import { describe, it, expect } from "vitest";
import { auditShiftActivities } from "./office-house-architecture";
import type { Activity } from "@/lib/core/types";

const act = (over: Partial<Activity>): Activity => ({
  id: crypto.randomUUID(),
  night: 1,
  agent: "engineering",
  action: "Did some real work",
  cost: 10,
  status: "done",
  ...over,
});

describe("auditShiftActivities (Chief Audit Officer sweep)", () => {
  it("passes clean, proven, normal-cost work", () => {
    const r = auditShiftActivities([
      act({ action: "Shipped landing page", cost: 20, proof: { kind: "url", value: "https://x.y" } }),
      act({ action: "Wrote tests", cost: 5 }),
    ]);
    expect(r.flagged.length).toBe(0);
    expect(r.clean).toBe(2);
  });

  it("flags high-cost actions with no proof", () => {
    const r = auditShiftActivities([act({ action: "Bought ads", cost: 150000 })]);
    expect(r.flagged.length).toBe(1);
    expect(r.flagged[0].issues.some((i) => i.includes("High-cost"))).toBe(true);
  });

  it("flags impossible overclaims (millions of users on pennies)", () => {
    const r = auditShiftActivities([act({ action: "Onboarded a million users overnight", cost: 5 })]);
    expect(r.flagged.length).toBe(1);
    expect(r.flagged[0].issues.some((i) => i.toLowerCase().includes("suspicious"))).toBe(true);
  });

  it("does not flag high-cost actions that carry proof", () => {
    const r = auditShiftActivities([
      act({ action: "Large infra spend", cost: 150000, proof: { kind: "metric", value: "servers provisioned" } }),
    ]);
    expect(r.flagged.length).toBe(0);
  });
});
