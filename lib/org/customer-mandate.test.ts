import { describe, it, expect } from "vitest";
import { decideMandate, defaultMandate, type CustomerMandate } from "./customer-mandate";

const signed: CustomerMandate = defaultMandate(1000);

describe("customer mandate — one signature, a hard floor (Consent Rails)", () => {
  it("deny-by-default: no signature ⇒ nothing runs, not even a build", () => {
    const unsigned: CustomerMandate = { ...signed, signedAt: null };
    expect(decideMandate("build_software", unsigned).decision).toBe("needs-you");
    expect(decideMandate("collect_revenue", unsigned).decision).toBe("needs-you");
  });

  it("the kill switch halts EVERYTHING instantly — even scoped, signed acts", () => {
    const killed: CustomerMandate = { ...signed, killSwitch: true };
    for (const act of ["build_software", "deploy", "outreach", "collect_revenue"] as const) {
      expect(decideMandate(act, killed).decision).toBe("forbidden");
    }
  });

  it("the irreducible floor NEVER automates — even when explicitly 'scoped'", () => {
    const overreaching: CustomerMandate = {
      ...signed,
      scopes: [...signed.scopes, "sign_contract", "payout_setup", "delete_company", "spend_above_cap"],
    };
    for (const act of ["sign_contract", "payout_setup", "delete_company", "spend_above_cap"] as const) {
      expect(decideMandate(act, overreaching).decision).toBe("needs-you"); // scope can't buy the floor
    }
  });

  it("signed + scoped absorbable acts run autonomously on platform rails", () => {
    for (const act of ["build_software", "deploy", "publish_content", "outreach", "collect_revenue"] as const) {
      expect(decideMandate(act, signed).decision).toBe("auto");
    }
  });

  it("unscoped acts need the customer even when signed", () => {
    const narrow: CustomerMandate = { ...signed, scopes: ["build_software"] };
    expect(decideMandate("outreach", narrow).decision).toBe("needs-you");
    expect(decideMandate("build_software", narrow).decision).toBe("auto");
  });

  it("the spend cap is a hard ceiling: under runs, crossing needs the customer", () => {
    expect(decideMandate("spend_platform_budget", signed, { spendCents: 1000, spentThisMonthCents: 3000 }).decision).toBe("auto");
    const over = decideMandate("spend_platform_budget", signed, { spendCents: 2500, spentThisMonthCents: 3000 });
    expect(over.decision).toBe("needs-you");
    expect(over.reason).toContain("cap");
  });

  it("defaultMandate offers only absorbable scopes — never the irreducible floor", () => {
    const d = defaultMandate();
    for (const irr of ["sign_contract", "payout_setup", "delete_company", "spend_above_cap"]) {
      expect(d.scopes).not.toContain(irr);
    }
    expect(d.killSwitch).toBe(false);
    expect(d.monthlySpendCapCents).toBeGreaterThan(0);
  });
});
