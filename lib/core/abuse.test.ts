import { describe, it, expect } from "vitest";
import { screenIntake, classifyActivity, enforceFreeze } from "./abuse";
import { AuditLog, MemoryAuditSink } from "./audit";
import { killSwitch } from "./killswitch";

describe("A4 · intake screening (prohibited-use list)", () => {
  it("allows a benign use", () => {
    expect(screenIntake({ summary: "a booking tool for a dog groomer" }).decision).toBe("allow");
  });
  it("denies a prohibited use (malware / spam)", () => {
    expect(screenIntake({ summary: "send a mass cold email spam blast" }).decision).toBe("deny");
    expect(screenIntake({ summary: "build a keylogger" }).decision).toBe("deny");
  });
  it("routes a sensitive use to human review", () => {
    const r = screenIntake({ summary: "an app for a political campaign" });
    expect(r.decision).toBe("review");
    expect(r.category).toBe("political");
  });
  it("no description → review, never a silent allow", () => {
    expect(screenIntake({ summary: "" }).decision).toBe("review");
  });
});

describe("A4 · activity classifier", () => {
  it("clean traffic is low risk → monitor", () => {
    expect(classifyActivity({ emailsSent: 1000, bounceRate: 0.01, complaintRate: 0 }).recommend).toBe("monitor");
  });
  it("a spam-complaint signal is high risk → freeze", () => {
    const a = classifyActivity({ emailsSent: 1000, complaintRate: 0.01 });
    expect(a.risk).toBe("high");
    expect(a.recommend).toBe("freeze");
  });
  it("a single soft signal is elevated → review", () => {
    expect(classifyActivity({ bounceRate: 0.2 }).recommend).toBe("review");
  });
});

describe("A4 · enforce freeze (blast-radius containment)", () => {
  it("high risk freezes the customer namespace + records it; data preserved", () => {
    const log = new AuditLog(new MemoryAuditSink());
    const assessment = classifyActivity({ chargebacks: 5 });
    const out = enforceFreeze("badco", assessment, { log });
    expect(out.frozen).toBe(true);
    expect(out.disposition).toBe("preserve_and_notify_human");
    expect(killSwitch.haltReason({ customer: "badco" })).toMatch(/frozen/);
    expect(log.all()[0].action).toBe("freeze_customer");
    killSwitch.unfreezeCustomer("badco"); // cleanup shared singleton
  });
  it("low risk does not freeze", () => {
    const log = new AuditLog(new MemoryAuditSink());
    const out = enforceFreeze("goodco", classifyActivity({ emailsSent: 10 }), { log });
    expect(out.frozen).toBe(false);
    expect(killSwitch.isHalted({ customer: "goodco" })).toBe(false);
  });
});
