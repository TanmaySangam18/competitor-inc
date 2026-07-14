import { describe, it, expect } from "vitest";
import { AuditLog, MemoryAuditSink } from "./audit";
import { killSwitch } from "./killswitch";
import { governAction } from "./govern";

describe("A1 · append-only audit ledger", () => {
  it("appends and seals a hash chain; integrity verifies", () => {
    const log = new AuditLog(new MemoryAuditSink());
    log.record({ actor: "engineering", action: "deploy", verdict: "AUTO" });
    log.record({ actor: "marketing", action: "outreach", verdict: "QUEUE" });
    const all = log.all();
    expect(all).toHaveLength(2);
    expect(all[0].prevHash).toBe("GENESIS");
    expect(all[1].prevHash).toBe(all[0].hash);
    expect(log.verifyIntegrity()).toEqual({ ok: true, count: 2 });
  });

  it("is tamper-EVIDENT — mutating a past entry breaks the chain at that seq", () => {
    const sink = new MemoryAuditSink();
    const log = new AuditLog(sink);
    log.record({ actor: "engineering", action: "deploy", verdict: "AUTO" });
    log.record({ actor: "finance", action: "spend", costUsd: 10, verdict: "QUEUE" });
    // Simulate an attacker editing history directly in the store.
    sink.all()[0].costUsd = 999999;
    const res = log.verifyIntegrity();
    expect(res.ok).toBe(false);
    expect(res.brokenAt).toBe(0);
  });

  it("has no update or delete method (append-only by construction)", () => {
    const log = new AuditLog();
    expect((log as unknown as Record<string, unknown>).update).toBeUndefined();
    expect((log as unknown as Record<string, unknown>).delete).toBeUndefined();
  });

  it("queries by actor / customer / action / since", () => {
    const log = new AuditLog(new MemoryAuditSink());
    log.record({ actor: "engineering", action: "deploy", customer: "acme" });
    log.record({ actor: "marketing", action: "outreach", customer: "beta" });
    expect(log.query({ actor: "engineering" })).toHaveLength(1);
    expect(log.query({ customer: "beta" })[0].action).toBe("outreach");
  });
});

describe("A1 · out-of-band kill switch (3 levels)", () => {
  it("global / per-agent / per-customer halts, independently", () => {
    // fresh scope names so the shared singleton doesn't collide across tests
    killSwitch.stopAgent("marketing-x");
    expect(killSwitch.haltReason({ agent: "marketing-x" })).toMatch(/stopped/);
    expect(killSwitch.haltReason({ agent: "engineering-x" })).toBeNull();
    killSwitch.resumeAgent("marketing-x");
    expect(killSwitch.isHalted({ agent: "marketing-x" })).toBe(false);

    killSwitch.freezeCustomer("cust-x");
    expect(killSwitch.haltReason({ customer: "cust-x" })).toMatch(/frozen/);
    killSwitch.unfreezeCustomer("cust-x");

    killSwitch.engageGlobal();
    expect(killSwitch.haltReason({ agent: "anyone" })).toMatch(/global/);
    killSwitch.disengageGlobal();
    expect(killSwitch.isHalted()).toBe(false);
  });
});

describe("A1 · governed entry point (switch → decide → audit)", () => {
  it("records every verdict to the ledger", () => {
    const log = new AuditLog(new MemoryAuditSink());
    // marketing/outreach is APPROVE in the matrix → QUEUE
    const r = governAction({ type: "outreach", agent: "marketing", hasCredential: true, compliancePass: true }, { log });
    expect(r.decision.verdict).toBe("QUEUE");
    expect(r.halted).toBe(false);
    expect(log.all()).toHaveLength(1);
    expect(log.all()[0].verdict).toBe("QUEUE");
  });

  it("a forbidden action is BLOCKed AND recorded", () => {
    const log = new AuditLog(new MemoryAuditSink());
    const r = governAction({ type: "move_funds_out", agent: "finance" }, { log });
    expect(r.decision.verdict).toBe("BLOCK");
    expect(log.all()[0].verdict).toBe("BLOCK");
  });

  it("the kill switch overrides the policy — halted, recorded", () => {
    const log = new AuditLog(new MemoryAuditSink());
    // a unique frozen customer proves the per-customer halt flows through govern before decide().
    killSwitch.freezeCustomer("frozen-co");
    const r = governAction({ type: "deploy", agent: "engineering" }, { log, customer: "frozen-co" });
    expect(r.halted).toBe(true);
    expect(r.decision.verdict).toBe("BLOCK");
    expect(log.all()[0].rationale).toMatch(/kill switch/);
    killSwitch.unfreezeCustomer("frozen-co");
  });
});
