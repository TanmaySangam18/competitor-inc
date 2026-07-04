import { describe, it, expect } from "vitest";
import { walletRowToConfig, txnRowsToTxns } from "./wallet-db";
import { DEFAULT_WALLET, decideSpend } from "./wallet";

describe("wallet-db mappers (fail-safe)", () => {
  it("null row → unfunded default (spend blocks)", () => {
    const cfg = walletRowToConfig(null);
    expect(cfg.fundedCents).toBe(0);
    // The safety property: an absent wallet blocks real spend.
    const d = decideSpend(cfg, { agent: "growth", task: "x", category: "ads", amountCents: 1000 }, []);
    expect(d.verdict).toBe("block");
  });

  it("maps a real row into config", () => {
    const cfg = walletRowToConfig({
      id: "w1",
      funded_cents: 50000,
      per_transaction_cap_cents: 3000,
      monthly_cap_cents: 100000,
      auto_approve_under_cents: 1500,
      category_budgets_cents: { ads: 20000 },
      paused: false,
      revoked: false,
    });
    expect(cfg.fundedCents).toBe(50000);
    expect(cfg.perTransactionCapCents).toBe(3000);
    expect(cfg.categoryBudgetsCents.ads).toBe(20000);
  });

  it("coerces garbage fields to safe defaults", () => {
    const cfg = walletRowToConfig({ funded_cents: "oops", monthly_cap_cents: null });
    expect(cfg.fundedCents).toBe(0);
    expect(cfg.monthlyCapCents).toBe(DEFAULT_WALLET.monthlyCapCents);
  });

  it("txnRowsToTxns handles null + maps rows", () => {
    expect(txnRowsToTxns(null)).toEqual([]);
    const txns = txnRowsToTxns([
      { id: "t1", agent: "engineering", task: "domain", category: "domain", amount_cents: 1200, status: "executed", month: "2026-07" },
    ]);
    expect(txns[0].amountCents).toBe(1200);
    expect(txns[0].category).toBe("domain");
  });
});
