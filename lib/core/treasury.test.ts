import { describe, it, expect } from "vitest";
import { ruleSpend, applyDebit, rollMonth, envelopeStatus, type Envelope } from "./treasury";

const env = (over: Partial<Envelope> = {}): Envelope => ({ department: "growth", monthlyCapUsd: 100, spentThisMonthUsd: 0, ...over });

describe("treasury — the bank for the 56 (ADR-0020)", () => {
  it("in-budget debit within the per-txn cap runs SILENTLY (auto, no human)", () => {
    const v = ruleSpend(env(), { department: "growth", kind: "debit", amountUsd: 30, memo: "ad test" });
    expect(v.decision).toBe("auto");
    if (v.decision === "auto") expect(v.remainingUsd).toBe(70);
  });
  it("a debit that would blow the department envelope ESCALATES, never silently overspends", () => {
    const v = ruleSpend(env({ spentThisMonthUsd: 90 }), { department: "growth", kind: "debit", amountUsd: 20, memo: "x" });
    expect(v.decision).toBe("escalate");
    if (v.decision === "escalate") expect(v.reason).toContain("budget");
  });
  it("a single txn over the platform per-transaction cap escalates even with envelope room", () => {
    const v = ruleSpend(env({ monthlyCapUsd: 10000 }), { department: "growth", kind: "debit", amountUsd: 500, memo: "big" });
    expect(v.decision).toBe("escalate");
    if (v.decision === "escalate") expect(v.reason).toContain("per-transaction cap");
  });
  it("WITHDRAWALS are always blocked here — moving funds out is human-only (the hard floor)", () => {
    const v = ruleSpend(env(), { department: "growth", kind: "withdraw", amountUsd: 5, memo: "payout" });
    expect(v.decision).toBe("block");
    if (v.decision === "block") expect(v.reason).toContain("human-only");
  });
  it("guards: bad amount + department mismatch block", () => {
    expect(ruleSpend(env(), { department: "growth", kind: "debit", amountUsd: 0, memo: "" }).decision).toBe("block");
    expect(ruleSpend(env(), { department: "finance", kind: "debit", amountUsd: 5, memo: "" }).decision).toBe("block");
  });
  it("applyDebit accrues; rollMonth resets; status flags low at >=80% used", () => {
    let e = applyDebit(env(), 85);
    expect(e.spentThisMonthUsd).toBe(85);
    expect(envelopeStatus(e)).toMatchObject({ remainingUsd: 15, pctUsed: 85, low: true });
    e = rollMonth(e);
    expect(e.spentThisMonthUsd).toBe(0);
    expect(envelopeStatus(e).low).toBe(false);
  });
});
