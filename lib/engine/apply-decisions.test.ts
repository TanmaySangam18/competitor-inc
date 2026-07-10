import { describe, it, expect } from "vitest";
import { planDecisionApplication, type PendingItem, type RecordedDecision } from "./apply-decisions";
import { defaultMandate } from "@/lib/org/customer-mandate";

const mandate = defaultMandate(1000);
const allow = () => true;
const items: PendingItem[] = [
  { id: "a", kind: "deploy", title: "Deploy v2" },
  { id: "b", kind: "twitter", title: "Launch post" },
  { id: "c", kind: "spend", title: "Ad test", amountCents: 1000 },
  { id: "d", kind: "delete", title: "Delete company" },
];
const yes = (ids: string[]): RecordedDecision[] => ids.map((id) => ({ approvalId: id, decision: "approved" as const }));

describe("apply-decisions — the unattended choke point (Consent Rails slice 2)", () => {
  it("double-green executes; no decision means untouched", () => {
    const p = planDecisionApplication(items, yes(["a", "b"]), mandate, { policyAllows: allow });
    expect(p.execute.map((i) => i.id).sort()).toEqual(["a", "b"]);
    expect(p.hold).toEqual([]);
    expect(p.reject).toEqual([]);
  });

  it("rejected clears without firing; unknown kinds NEVER execute even when approved", () => {
    const p = planDecisionApplication(items, [...yes(["d"]), { approvalId: "a", decision: "rejected" }], mandate, { policyAllows: allow });
    expect(p.reject.map((i) => i.id)).toEqual(["a"]);
    expect(p.execute).toEqual([]); // "delete" is unmapped → held, not fired
    expect(p.hold[0].item.id).toBe("d");
    expect(p.hold[0].reason).toContain("refused");
  });

  it("the kill switch + cap + policy all hold the line even on approved items", () => {
    const killed = planDecisionApplication(items, yes(["a"]), { ...mandate, killSwitch: true }, { policyAllows: allow });
    expect(killed.execute).toEqual([]);
    expect(killed.hold[0].reason).toContain("kill switch");
    const overCap = planDecisionApplication(items, yes(["c"]), mandate, { spentThisMonthCents: 4500, policyAllows: allow });
    expect(overCap.execute).toEqual([]);
    expect(overCap.hold[0].reason).toContain("cap");
    const noPolicy = planDecisionApplication(items, yes(["a"]), mandate, {}); // policyAllows omitted
    expect(noPolicy.execute).toEqual([]); // deny-by-default: a missing policy check can't open the gate
    expect(noPolicy.hold[0].reason).toContain("policy");
  });
});
