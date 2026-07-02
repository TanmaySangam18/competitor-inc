import { describe, it, expect } from "vitest";
import { buildMomTestKit } from "./momtest";

describe("buildMomTestKit — Mom Test compliance, enforced structurally", () => {
  const kit = buildMomTestKit({ name: "Plantly", idea: "a marketplace for rare houseplants" });

  it("the cardinal rule: no question is a 'would you' hypothetical", () => {
    for (const { q } of kit.questions) {
      expect(q.toLowerCase()).not.toMatch(/would you (use|buy|pay)/);
    }
  });

  it("asks about past behavior and money", () => {
    const all = kit.questions.map((x) => x.q.toLowerCase()).join(" ");
    expect(all).toMatch(/last time/);
    expect(all).toMatch(/tried or bought|cost/);
  });

  it("personalizes with the idea's problem phrase, never pitches the product in questions", () => {
    expect(kit.questions[0].q).toContain("marketplace for rare houseplants");
    for (const { q } of kit.questions.slice(0, 4)) expect(q).not.toContain("Plantly");
  });

  it("costly-ask ladder ends in money and every ask names its cost", () => {
    expect(kit.costlyAsks[kit.costlyAsks.length - 1].label).toBe("Money");
    for (const a of kit.costlyAsks) expect(a.cost.length).toBeGreaterThan(0);
  });

  it("debrief scores commitments, not compliments", () => {
    expect(kit.debrief.join(" ")).toMatch(/commitment/i);
  });
});
