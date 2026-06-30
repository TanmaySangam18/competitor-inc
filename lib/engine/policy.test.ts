import { describe, it, expect } from "vitest";
import { decide, withinCaps, executionRefusal, shouldAlert, promotionEligible, governApprovals, POLICY, type ActionContext, type Policy } from "./policy";
import type { ApprovalItem } from "./types";

// A fully-green AUTO context for an action we pretend the matrix allows unattended (we override the
// matrix per-test to exercise the gate logic, since no real executor action is AUTO by default).
const green = (over: Partial<ActionContext> = {}): ActionContext => ({
  type: "spend",
  agent: "marketing",
  amountUsd: 10,
  spentTodayUsd: 0,
  spentMonthUsd: 0,
  hasCredential: true,
  compliancePass: true,
  observable: true,
  reversible: true,
  ...over,
});

// A policy whose matrix marks (marketing, spend) AUTO so we can reach gates 3–5.
const autoSpendPolicy: Policy = {
  ...POLICY,
  matrix: { ...POLICY.matrix, marketing: { ...POLICY.matrix.marketing, spend: "AUTO" } },
};

describe("decide — the five-gate enforcement engine", () => {
  it("QUEUEs an APPROVE action (every real executor action needs a human)", () => {
    expect(decide(green({ type: "outreach" })).verdict).toBe("QUEUE");
    expect(decide(green({ type: "spend" })).verdict).toBe("QUEUE");
  });

  it("BLOCKs an action not permitted for the agent (NEVER)", () => {
    // engineering may not spend
    expect(decide(green({ agent: "engineering", type: "spend" })).verdict).toBe("BLOCK");
    // marketing may not deploy
    expect(decide(green({ agent: "marketing", type: "deploy" })).verdict).toBe("BLOCK");
  });

  it("BLOCKs a forbidden action even when every gate is green", () => {
    const d = decide(green({ type: "move_funds_out" }));
    expect(d.verdict).toBe("BLOCK");
    expect(d.reason).toMatch(/forbidden/);
  });

  it("BLOCKs when the kill switch is engaged", () => {
    const killed: Policy = { ...POLICY, spend: { ...POLICY.spend, killSwitch: true } };
    expect(decide(green({ type: "outreach" }), killed).verdict).toBe("BLOCK");
  });

  it("Gate 1 — BLOCKs when no credential exists", () => {
    expect(decide(green({ hasCredential: false })).verdict).toBe("BLOCK");
  });

  it("Gate 2 — BLOCKs when compliance fails", () => {
    expect(decide(green({ compliancePass: false })).verdict).toBe("BLOCK");
  });

  it("AUTO only when the matrix says AUTO and all five gates pass", () => {
    expect(decide(green(), autoSpendPolicy).verdict).toBe("AUTO");
  });

  it("Gate 3 — an AUTO action over a cap QUEUEs instead of running", () => {
    expect(decide(green({ amountUsd: 999 }), autoSpendPolicy).verdict).toBe("QUEUE");
  });

  it("Gate 4 — an unobservable AUTO action QUEUEs", () => {
    expect(decide(green({ observable: false }), autoSpendPolicy).verdict).toBe("QUEUE");
  });

  it("Gate 5 — an irreversible AUTO action QUEUEs", () => {
    expect(decide(green({ reversible: false }), autoSpendPolicy).verdict).toBe("QUEUE");
  });
});

describe("withinCaps — spend blast radius", () => {
  it("passes non-spend actions through", () => {
    expect(withinCaps(green({ type: "outreach", amountUsd: 99999 }))).toBe(true);
  });
  it("fails over the per-transaction cap", () => {
    expect(withinCaps(green({ amountUsd: POLICY.spend.perTransactionCapUsd + 1 }))).toBe(false);
  });
  it("fails when it would breach the daily cap", () => {
    expect(withinCaps(green({ amountUsd: 40, spentTodayUsd: POLICY.spend.dailyCapUsd - 10 }))).toBe(false);
  });
  it("fails when it would breach the monthly cap", () => {
    expect(withinCaps(green({ amountUsd: 40, spentMonthUsd: POLICY.spend.monthlyCapUsd - 10 }))).toBe(false);
  });
  it("passes within all caps", () => {
    expect(withinCaps(green({ amountUsd: 10, spentTodayUsd: 10, spentMonthUsd: 100 }))).toBe(true);
  });
});

describe("executionRefusal — the /api/execute guard (runs after human sign-off)", () => {
  it("allows an approved, in-bounds action", () => {
    expect(executionRefusal(green({ type: "outreach" }))).toBeNull();
    expect(executionRefusal(green({ type: "spend", amountUsd: 25 }))).toBeNull();
  });
  it("refuses a BLOCKed action as forbidden_attempt (wrong agent / forbidden)", () => {
    const wrongAgent = executionRefusal(green({ agent: "engineering", type: "spend" }));
    expect(wrongAgent?.reason).toMatch(/not permitted/);
    expect(wrongAgent?.event).toBe("forbidden_attempt");
    const forbidden = executionRefusal(green({ type: "move_funds_out" }));
    expect(forbidden?.reason).toMatch(/forbidden/);
    expect(forbidden?.event).toBe("forbidden_attempt");
  });
  it("flags a hard spend-ceiling breach as cap_breach, even on an approved action", () => {
    const r = executionRefusal(green({ type: "spend", amountUsd: POLICY.spend.perTransactionCapUsd + 100 }));
    expect(r?.reason).toMatch(/per-transaction cap/);
    expect(r?.event).toBe("cap_breach");
  });
});

describe("shouldAlert — observability made active", () => {
  it("alerts on the configured events", () => {
    expect(shouldAlert("cap_breach")).toBe(true);
    expect(shouldAlert("failure")).toBe(true);
    expect(shouldAlert("forbidden_attempt")).toBe(true);
  });
  it("respects a policy that silences an event", () => {
    const quiet: Policy = { ...POLICY, observability: { ...POLICY.observability, realTimeAlertsOn: ["failure"] } };
    expect(shouldAlert("cap_breach", quiet)).toBe(false);
    expect(shouldAlert("failure", quiet)).toBe(true);
  });
});

describe("promotionEligible — promote-on-evidence rollout", () => {
  it("promotes an APPROVE action that ran clean long enough", () => {
    expect(promotionEligible({ action: "outreach", cleanNights: POLICY.rollout.promoteAfterCleanNights, incidents: 0 })).toBe(true);
  });
  it("won't promote before the clean-nights threshold", () => {
    expect(promotionEligible({ action: "outreach", cleanNights: 3, incidents: 0 })).toBe(false);
  });
  it("any incident resets eligibility", () => {
    expect(promotionEligible({ action: "outreach", cleanNights: 99, incidents: 1 })).toBe(false);
  });
  it("never promotes the forbidden floor", () => {
    expect(promotionEligible({ action: "move_funds_out", cleanNights: 9999, incidents: 0 })).toBe(false);
  });
});

describe("governApprovals — five-gate filter on the Approval Inbox", () => {
  const appr = (over: Partial<ApprovalItem> = {}): ApprovalItem =>
    ({ id: "a", night: 1, agent: "marketing", kind: "outreach", title: "t", ...over }) as ApprovalItem;

  it("keeps an APPROVE-bucket proposal", () => {
    expect(governApprovals([appr({ agent: "marketing", kind: "outreach" })]).length).toBe(1);
  });

  it("drops proposals the policy BLOCKs (wrong agent for the action)", () => {
    const out = governApprovals([
      appr({ agent: "engineering", kind: "spend" }), // engineering NEVER spend → dropped
      appr({ agent: "marketing", kind: "outreach" }), // kept
    ]);
    expect(out.map((a) => a.agent)).toEqual(["marketing"]);
  });
});
