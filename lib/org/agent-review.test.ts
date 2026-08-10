import { describe, it, expect } from "vitest";
import {
  escalations,
  isReviewDay,
  reviewAgents,
  reviewCycleArtifact,
  scoreObjectives,
  type ReviewInput,
  type QuarterObjective,
} from "./agent-review";

const agent = (over: Partial<ReviewInput>): ReviewInput => ({
  agentId: "growth-1",
  role: "growth",
  successRate: 0.8,
  activityCount: 20,
  spendUsd: 12.5,
  ...over,
});

describe("reviewAgents — the deterministic verdict rules", () => {
  it("insufficient-data below minActivity (default 5), whatever the rate says", () => {
    const [v] = reviewAgents([agent({ successRate: 0.1, activityCount: 4 })]);
    expect(v.verdict).toBe("insufficient-data");
    expect(v.rationale).toContain("4 activities");
    expect(v.rationale).toContain("below the 5 needed");
    expect(v.suggestedModelTier).toBeUndefined();
  });

  it("insufficient-data when no success rate was measured (null)", () => {
    const [v] = reviewAgents([agent({ successRate: null, activityCount: 0 })]);
    expect(v.verdict).toBe("insufficient-data");
    expect(v.rationale).toContain("No measured success rate");
  });

  it("minActivity is configurable", () => {
    const [v] = reviewAgents([agent({ successRate: 0.9, activityCount: 8 })], { minActivity: 10 });
    expect(v.verdict).toBe("insufficient-data");
  });

  it("retire-recommend needs sustained failure with real volume (successRate < 0.3)", () => {
    const [v] = reviewAgents([agent({ successRate: 0.2, activityCount: 20, spendUsd: 40 })]);
    expect(v.verdict).toBe("retire-recommend");
    expect(v.rationale).toContain("0.20");
    expect(v.rationale).toContain("20 activities");
    expect(v.rationale).toContain("pending founder approval");
  });

  it("retune for the mid-band (0.3 to 0.7), suggesting the opus tier", () => {
    const [low] = reviewAgents([agent({ successRate: 0.3 })]);
    const [mid] = reviewAgents([agent({ successRate: 0.5 })]);
    expect(low.verdict).toBe("retune");
    expect(mid.verdict).toBe("retune");
    expect(mid.suggestedModelTier).toBe("opus");
    expect(mid.rationale).toContain("0.50");
  });

  it("keep at 0.7 and above, no tier suggestion in the plain case", () => {
    const [v] = reviewAgents([agent({ successRate: 0.7 })]);
    expect(v.verdict).toBe("keep");
    expect(v.suggestedModelTier).toBeUndefined();
  });

  it("high success + low spend suggests the cheaper haiku tier", () => {
    const [v] = reviewAgents([agent({ successRate: 0.95, activityCount: 30, spendUsd: 2.1 })]);
    expect(v.verdict).toBe("keep");
    expect(v.suggestedModelTier).toBe("haiku");
    expect(v.rationale).toContain("$2.10");
  });

  it("high-stakes roles never get a cheaper-tier suggestion, whatever the numbers say", () => {
    const [v] = reviewAgents(
      [agent({ role: "finance-controller", successRate: 0.98, activityCount: 40, spendUsd: 1.5 })],
      { highStakesRoles: ["finance-controller"] },
    );
    expect(v.verdict).toBe("keep");
    expect(v.suggestedModelTier).toBeUndefined();
    expect(v.rationale).toContain("high-stakes role");
  });

  it("high success with real spend is a plain keep, not a downgrade", () => {
    const [v] = reviewAgents([agent({ successRate: 0.95, spendUsd: 80 })]);
    expect(v.verdict).toBe("keep");
    expect(v.suggestedModelTier).toBeUndefined();
  });
});

describe("reviewCycleArtifact — the quarterly doc", () => {
  const verdicts = reviewAgents([
    agent({ agentId: "growth-1", successRate: 0.95, activityCount: 30, spendUsd: 2 }),
    agent({ agentId: "eng-2", role: "engineering", successRate: 0.5 }),
    agent({ agentId: "sales-3", role: "sales", successRate: 0.15 }),
    agent({ agentId: "ops-4", role: "ops", successRate: null, activityCount: 0 }),
  ]);
  const doc = reviewCycleArtifact(verdicts, "Q3 2026");

  it("carries the quarter label, the distribution summary, and the per-agent table", () => {
    expect(doc).toContain("# Agent Review Cycle: Q3 2026");
    expect(doc).toContain("Reviewed 4 agents: 1 keep, 1 retune, 1 retire-recommend, 1 insufficient-data.");
    expect(doc).toContain("| Agent | Role | Verdict | Suggested tier | Rationale |");
    expect(doc).toContain("| growth-1 | growth | keep | haiku |");
    expect(doc).toContain("| eng-2 | engineering | retune | opus |");
    expect(doc).toContain("| ops-4 | ops | insufficient-data | none |");
  });

  it("lists every retire and retune as PENDING FOUNDER APPROVAL", () => {
    expect(doc).toContain("RETIRE sales-3 (sales)");
    expect(doc).toContain("RETUNE eng-2 (engineering)");
    const pendings = doc.match(/PENDING FOUNDER APPROVAL/g) ?? [];
    expect(pendings.length).toBe(2);
  });

  it("honest empty: no verdicts renders a none-yet line, no fabricated distribution", () => {
    const empty = reviewCycleArtifact([], "Q4 2026");
    expect(empty).toContain("No agents reviewed yet.");
    expect(empty).not.toContain("Reviewed");
  });

  it("no rendered string contains an em-dash or en-dash", () => {
    expect(doc).not.toMatch(/[—–]/);
    for (const v of verdicts) expect(v.rationale).not.toMatch(/[—–]/);
  });
});

describe("escalations — personnel actions go to the human, never auto-applied", () => {
  const verdicts = reviewAgents([
    agent({ agentId: "sales-3", role: "sales", successRate: 0.15 }),
    agent({ agentId: "eng-2", role: "engineering", successRate: 0.5 }),
    agent({ agentId: "growth-1", successRate: 0.9 }),
    agent({ agentId: "ops-4", role: "ops", successRate: null, activityCount: 0 }),
  ]);

  it("produces one EnqueueInput per retire-recommend (fire) and retune (policy_change), nothing else", () => {
    const items = escalations(verdicts);
    expect(items).toHaveLength(2);
    const retire = items.find((i) => i.kind === "fire")!;
    expect(retire.title).toBe("Retire agent sales-3 (sales)");
    expect(retire.summary).toContain("founder approval");
    expect(retire.artifact).toContain("Nothing has been changed.");
    const retune = items.find((i) => i.kind === "policy_change")!;
    expect(retune.title).toBe("Retune agent eng-2 (engineering)");
    expect(retune.artifact).toContain("Suggested model tier: opus");
    expect(retune.artifact).toContain("routing stays as configured");
  });

  it("keep and insufficient-data never escalate", () => {
    const items = escalations(verdicts);
    expect(items.some((i) => i.title.includes("growth-1"))).toBe(false);
    expect(items.some((i) => i.title.includes("ops-4"))).toBe(false);
  });

  it("no escalation string contains an em-dash or en-dash", () => {
    for (const i of escalations(verdicts)) {
      expect(i.title).not.toMatch(/[—–]/);
      expect(i.summary).not.toMatch(/[—–]/);
      expect(i.artifact).not.toMatch(/[—–]/);
    }
  });
});

describe("isReviewDay — first Monday of Jan/Apr/Jul/Oct (UTC)", () => {
  const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d, 12, 0));

  it("true on the first Monday of each quarter month in 2026", () => {
    expect(isReviewDay(utc(2026, 0, 5))).toBe(true); // Mon Jan 5 2026
    expect(isReviewDay(utc(2026, 3, 6))).toBe(true); // Mon Apr 6 2026
    expect(isReviewDay(utc(2026, 6, 6))).toBe(true); // Mon Jul 6 2026
    expect(isReviewDay(utc(2026, 9, 5))).toBe(true); // Mon Oct 5 2026
  });

  it("false on the second Monday, on non-Mondays, and outside quarter months", () => {
    expect(isReviewDay(utc(2026, 0, 12))).toBe(false); // second Monday of Jan
    expect(isReviewDay(utc(2026, 6, 7))).toBe(false); // Tue Jul 7
    expect(isReviewDay(utc(2026, 6, 13))).toBe(false); // second Monday of Jul
    expect(isReviewDay(utc(2026, 1, 2))).toBe(false); // Mon Feb 2, not a quarter month
    expect(isReviewDay(utc(2026, 4, 4))).toBe(false); // Mon May 4, not a quarter month
  });

  it("handles a quarter month that starts on a Monday (first Monday is the 1st)", () => {
    // June 1 2026 is a Monday but June is not a quarter month; Feb 1 2027 IS a Monday and not quarter.
    // Mar 1 2027 is a Monday, not quarter. Jan 1 2029 is a Monday AND a quarter month.
    expect(isReviewDay(utc(2029, 0, 1))).toBe(true); // Mon Jan 1 2029
    expect(isReviewDay(utc(2029, 0, 8))).toBe(false); // the following Monday
  });
});

describe("scoreObjectives — the quarterly OKR retro, unknown is never met", () => {
  const objectives: QuarterObjective[] = [
    { id: "o1", statement: "Sign the first campus pilot", evidence: ["Signed pilot agreement on file"], met: true },
    { id: "o2", statement: "Ship the treasury envelope gate", evidence: [], met: null },
    { id: "o3", statement: "Reach 10 paying pilots", evidence: ["Revenue events show 2 paying pilots"], met: false },
    { id: "o4", statement: "Claimed win with nothing behind it", evidence: [], met: true },
  ];
  const doc = scoreObjectives(objectives, "Q3 2026");

  it("counts met/missed/unscored and renders per-objective lines", () => {
    expect(doc).toContain("# Quarterly objectives retro: Q3 2026");
    expect(doc).toContain("4 objectives: 2 met, 1 missed, 1 unscored.");
    expect(doc).toContain("MET [o1]: Sign the first campus pilot (1 evidence item).");
    expect(doc).toContain("MISSED [o3]: Reach 10 paying pilots");
  });

  it("unscored objectives are stated honestly as unknown, not as met", () => {
    expect(doc).toContain("UNSCORED [o2]: Ship the treasury envelope gate. No evidence recorded, scored as unknown, not as met.");
  });

  it("a met claim with zero evidence is flagged as unverified (honesty floor)", () => {
    expect(doc).toContain("MET (unverified) [o4]");
    expect(doc).toContain("Treat as a claim, not a verified result.");
  });

  it("honest empty: no objectives renders a none-yet line", () => {
    expect(scoreObjectives([], "Q1 2027")).toContain("No objectives were recorded for this quarter yet.");
  });

  it("no rendered string contains an em-dash or en-dash", () => {
    expect(doc).not.toMatch(/[—–]/);
    expect(scoreObjectives([], "Q1 2027")).not.toMatch(/[—–]/);
  });
});
