import { describe, it, expect } from "vitest";
import { rollupCosts, marginFor, spendAnomaly } from "./economics";
import { AuditLog, MemoryAuditSink } from "./audit";

function ledger() {
  const log = new AuditLog(new MemoryAuditSink());
  log.record({ actor: "engineering", action: "build", customer: "acme", costUsd: 0.12 });
  log.record({ actor: "marketing", action: "outreach", customer: "acme", costUsd: 0.03 });
  log.record({ actor: "engineering", action: "build", customer: "beta", costUsd: 0.20 });
  log.record({ actor: "support", action: "answer", customer: "acme", costUsd: 0 }); // free — ignored
  return log.all();
}

describe("B1 · unit economics", () => {
  it("rolls up cost by customer / agent / action", () => {
    const r = rollupCosts(ledger());
    expect(r.totalUsd).toBeCloseTo(0.35, 5);
    expect(r.perCustomer.acme).toBeCloseTo(0.15, 5);
    expect(r.perCustomer.beta).toBeCloseTo(0.20, 5);
    expect(r.perAgent.engineering).toBeCloseTo(0.32, 5);
  });

  it("computes per-customer margin and alarms when negative", () => {
    const entries = ledger();
    const good = marginFor("acme", 10, entries);
    expect(good.marginUsd).toBeCloseTo(9.85, 2);
    expect(good.alarm).toBe(false);

    const bad = marginFor("beta", 0.05, entries); // revenue below cost
    expect(bad.marginUsd).toBeLessThan(0);
    expect(bad.alarm).toBe(true);
  });

  it("alarms on a thin margin below the minimum", () => {
    const m = marginFor("acme", 0.16, ledger(), { minMarginPct: 0.5 }); // cost 0.15, margin ~6% < 50%
    expect(m.alarm).toBe(true);
  });

  it("detects a spend spike vs the baseline", () => {
    expect(spendAnomaly([10, 12, 11, 200]).detected).toBe(true);
    expect(spendAnomaly([10, 12, 11, 14]).detected).toBe(false);
    expect(spendAnomaly([5]).detected).toBe(false); // not enough history
  });
});
