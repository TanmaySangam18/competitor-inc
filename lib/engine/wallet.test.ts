import { describe, it, expect } from "vitest";
import {
  DEFAULT_WALLET,
  decideSpend,
  balanceCents,
  committedCents,
  spentThisMonthCents,
  spentByCategoryCents,
  budgetAlerts,
  newTxn,
  applyRefund,
  pause,
  resume,
  revoke,
  reinstate,
  type WalletConfig,
  type WalletTxn,
  type SpendRequest,
} from "./wallet";

const now = Date.parse("2026-07-04T12:00:00Z");
const req = (over: Partial<SpendRequest> = {}): SpendRequest => ({
  agent: "engineering",
  task: "buy domain",
  category: "domain",
  amountCents: 1200,
  ...over,
});
const txn = (over: Partial<WalletTxn> = {}): WalletTxn => ({
  ...newTxn(req(), "executed", () => "t" + Math.random(), now),
  ...over,
});
const wallet = (over: Partial<WalletConfig> = {}): WalletConfig => ({ ...DEFAULT_WALLET, fundedCents: 100000, ...over });

describe("wallet — balances & aggregation", () => {
  it("committed excludes blocked and subtracts refunds", () => {
    const txns = [
      txn({ amountCents: 1000, status: "executed" }),
      txn({ amountCents: 5000, status: "blocked" }), // ignored
      txn({ amountCents: 2000, status: "refunded", refundCents: 2000 }), // nets 0
      txn({ amountCents: 3000, status: "executed", refundCents: 1000 }), // nets 2000
    ];
    expect(committedCents(txns)).toBe(3000);
  });

  it("balance = funded − committed", () => {
    const w = wallet({ fundedCents: 10000 });
    const txns = [txn({ amountCents: 3000, status: "executed" })];
    expect(balanceCents(w, txns)).toBe(7000);
  });

  it("spentThisMonth ignores other months + blocked", () => {
    const older = txn({ amountCents: 9999, status: "executed", month: "2026-06", createdAt: Date.parse("2026-06-15T00:00:00Z") });
    const thisM = txn({ amountCents: 2500, status: "executed" });
    expect(spentThisMonthCents([older, thisM], now)).toBe(2500);
  });

  it("spentByCategory sums per category this month", () => {
    const txns = [txn({ category: "ads", amountCents: 3000 }), txn({ category: "ads", amountCents: 1500 }), txn({ category: "domain", amountCents: 1200 })];
    const byCat = spentByCategoryCents(txns, now);
    expect(byCat.ads).toBe(4500);
    expect(byCat.domain).toBe(1200);
  });
});

describe("wallet — decideSpend", () => {
  it("blocks when revoked", () => {
    expect(decideSpend(revoke(wallet()), req(), [], now).verdict).toBe("block");
  });
  it("blocks when paused", () => {
    expect(decideSpend(pause(wallet()), req(), [], now).verdict).toBe("block");
  });
  it("blocks on insufficient funds", () => {
    const d = decideSpend(wallet({ fundedCents: 500 }), req({ amountCents: 1200 }), [], now);
    expect(d.verdict).toBe("block");
    expect(d.reason).toMatch(/insufficient/i);
  });
  it("blocks over the per-transaction cap", () => {
    const d = decideSpend(wallet({ perTransactionCapCents: 1000 }), req({ amountCents: 1200 }), [], now);
    expect(d.verdict).toBe("block");
    expect(d.reason).toMatch(/per-transaction/i);
  });
  it("blocks over the monthly cap", () => {
    const w = wallet({ monthlyCapCents: 3000 });
    const prior = [txn({ amountCents: 2500, status: "executed" })];
    expect(decideSpend(w, req({ amountCents: 1000 }), prior, now).verdict).toBe("block");
  });
  it("blocks over a category budget", () => {
    const w = wallet({ categoryBudgetsCents: { ads: 5000 } });
    const prior = [txn({ category: "ads", amountCents: 4500, status: "executed" })];
    expect(decideSpend(w, req({ category: "ads", amountCents: 1000 }), prior, now).verdict).toBe("block");
  });
  it("queues (approve) at/above the auto-approve threshold", () => {
    const w = wallet({ autoApproveUnderCents: 2000 });
    expect(decideSpend(w, req({ amountCents: 2000 }), [], now).verdict).toBe("approve");
    expect(decideSpend(w, req({ amountCents: 5000 }), [], now).verdict).toBe("approve");
  });
  it("auto-approves under the threshold within all limits", () => {
    const w = wallet({ autoApproveUnderCents: 2000 });
    expect(decideSpend(w, req({ amountCents: 1200 }), [], now).verdict).toBe("auto");
  });
  it("rejects non-positive amounts", () => {
    expect(decideSpend(wallet(), req({ amountCents: 0 }), [], now).verdict).toBe("block");
  });
});

describe("wallet — budget alerts", () => {
  it("warns at 80% and criticals at 100% of monthly", () => {
    const w = wallet({ monthlyCapCents: 1000 });
    const warn = budgetAlerts(w, [txn({ amountCents: 850, status: "executed" })], now);
    expect(warn.find((a) => a.scope === "monthly")?.level).toBe("warning");
    const crit = budgetAlerts(w, [txn({ amountCents: 1000, status: "executed" })], now);
    expect(crit.find((a) => a.scope === "monthly")?.level).toBe("critical");
  });
  it("alerts per category budget", () => {
    const w = wallet({ monthlyCapCents: 1000000, categoryBudgetsCents: { ads: 1000 } });
    const a = budgetAlerts(w, [txn({ category: "ads", amountCents: 950, status: "executed" })], now);
    expect(a.find((x) => x.scope === "ads")?.level).toBe("warning");
  });
});

describe("wallet — refunds & controls", () => {
  it("applyRefund caps at the original amount and restores balance", () => {
    const t = txn({ amountCents: 3000, status: "executed" });
    const refunded = applyRefund(t, 5000);
    expect(refunded.refundCents).toBe(3000);
    expect(refunded.status).toBe("refunded");
    expect(committedCents([refunded])).toBe(0);
  });
  it("pause/resume/revoke/reinstate flip the right flags", () => {
    expect(pause(DEFAULT_WALLET).paused).toBe(true);
    expect(resume(pause(DEFAULT_WALLET)).paused).toBe(false);
    const r = revoke(DEFAULT_WALLET);
    expect(r.revoked).toBe(true);
    expect(r.paused).toBe(true);
    expect(reinstate(r).revoked).toBe(false);
  });
});
