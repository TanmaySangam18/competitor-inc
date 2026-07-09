import { describe, it, expect } from "vitest";
import { POLICY, type Policy } from "@/lib/engine/policy";
import { autopilotMode, roleAutopilotMode, partitionActions, FOUNDER_GATED_KINDS } from "./autopilot";

// A controlled policy that isolates the autopilot LOGIC from POLICY's matrix/forbidden internals:
// empty matrix (no NEVER cells), a known forbidden action, clean caps + kill switch off.
const testPolicy: Policy = {
  ...POLICY,
  forbiddenActions: new Set(["forbidden-x"]),
  matrix: {} as Policy["matrix"],
  spend: { ...POLICY.spend, killSwitch: false, perTransactionCapUsd: 100, dailyCapUsd: 1000, monthlyCapUsd: 5000 },
};

describe("autopilot — the governance flip", () => {
  it("runs ordinary work unattended by default (the flip)", () => {
    expect(autopilotMode({ type: "outreach", agent: "growth" }, testPolicy).mode).toBe("auto");
    expect(autopilotMode({ type: "twitter", agent: "marketing" }, testPolicy).mode).toBe("auto");
    expect(autopilotMode({ type: "build", agent: "engineering" }, testPolicy).mode).toBe("auto");
  });

  it("still gates every high-consequence class to the founder", () => {
    for (const kind of ["sign", "pricing", "delete", "payout", "refund", "contract", "partnership", "prod-deploy"]) {
      expect(autopilotMode({ type: kind, agent: "ops" }, testPolicy).mode, kind).toBe("queue");
    }
  });

  it("never runs a forbidden action, and the kill switch halts everything", () => {
    expect(autopilotMode({ type: "forbidden-x", agent: "ops" }, testPolicy).mode).toBe("block");
    const killed: Policy = { ...testPolicy, spend: { ...testPolicy.spend, killSwitch: true } };
    expect(autopilotMode({ type: "outreach", agent: "growth" }, killed).mode).toBe("block");
  });

  it("auto-runs spend inside caps but escalates over them", () => {
    expect(autopilotMode({ type: "spend", agent: "marketing", amountUsd: 50 }, testPolicy).mode).toBe("auto");
    expect(autopilotMode({ type: "spend", agent: "marketing", amountUsd: 500 }, testPolicy).mode).toBe("queue");
  });

  it("resolves a real ORG role's action via its execFn", () => {
    // CFO proposing a payout → always the founder (money movement).
    expect(roleAutopilotMode("chief-financial-officer", { type: "payout" }, testPolicy).mode).toBe("queue");
    // SDR sending outreach → runs unattended under standing authorization.
    expect(roleAutopilotMode("sales-development-representative", { type: "outreach" }, testPolicy).mode).toBe("auto");
    // General Counsel signing → the founder, always.
    expect(roleAutopilotMode("general-counsel", { type: "sign" }, testPolicy).mode).toBe("queue");
  });

  it("partitions a batch into run-now / founder-queue / dropped", () => {
    const items = [
      { id: "a", type: "outreach", agent: "growth" as const },
      { id: "b", type: "sign", agent: "legal" as const },
      { id: "c", type: "forbidden-x", agent: "ops" as const },
    ];
    const p = partitionActions(items, (i) => ({ type: i.type, agent: i.agent }), testPolicy);
    expect(p.auto.map((x) => x.id)).toEqual(["a"]);
    expect(p.queue.map((x) => x.id)).toEqual(["b"]);
    expect(p.blocked.map((x) => x.id)).toEqual(["c"]);
  });

  it("the founder-gated set covers money, signatures, deletion, pricing, prod deploys", () => {
    for (const k of ["money", "payout", "sign", "delete", "pricing", "prod-deploy"]) {
      expect(FOUNDER_GATED_KINDS.has(k), k).toBe(true);
    }
  });
});
