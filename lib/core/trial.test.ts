import { describe, it, expect, beforeEach } from "vitest";
import {
  TRIAL_POLICY, TRIAL_CAPABILITIES, TRIAL_NOTICE,
  trialDecision, consume, emptyUsage, rolled, dayKey, trialOffer,
} from "./trial";
import { killSwitch } from "./killswitch";

const NOW = Date.UTC(2026, 7, 16, 12, 0, 0);
const fresh = () => emptyUsage(NOW);

beforeEach(() => killSwitch.disengageGlobal());

describe("zero connections to look", () => {
  it("lets a brand new visitor think with nothing connected", () => {
    const d = trialDecision(fresh(), "visitor-1", "think", { now: NOW });
    expect(d.allowed).toBe(true);
    expect(d.remainingForVisitor).toBe(TRIAL_POLICY.perVisitorDailyCap - 1);
  });

  it("carries the honest notice on every decision, allowed or refused", () => {
    const ok = trialDecision(fresh(), "v", "think", { now: NOW });
    const no = trialDecision(fresh(), "v", "deploy", { now: NOW });
    for (const d of [ok, no]) {
      expect(d.notice).toBe(TRIAL_NOTICE);
      expect(d.notice).toMatch(/competitor\.inc's own capped model key/i);
      expect(d.notice).toMatch(/cannot deploy, publish, email or spend/i);
    }
  });

  it("states the offer without overstating it", () => {
    const offer = trialOffer();
    expect(offer).toMatch(/free runs a day on our key/i);
    expect(offer).toMatch(/own what it makes/i);
    expect(offer).not.toMatch(/—/);
  });
});

describe("the blast radius is one capability", () => {
  it("permits thinking only", () => {
    expect(TRIAL_CAPABILITIES).toEqual(["think"]);
  });

  it("refuses everything that leaves the building", () => {
    // A free trial that could deploy, publish, email or spend would be an abuse surface with our name on
    // the outbound. Each refusal also doubles as the reason to connect something.
    for (const cap of ["commit", "deploy", "persist", "store", "publish", "correspond", "transact"] as const) {
      const d = trialDecision(fresh(), "v", cap, { now: NOW });
      expect(d.allowed, `${cap} must not be available on a shared key`).toBe(false);
      expect(d.reason).toMatch(/can only think/i);
    }
  });
});

describe("the caps hold", () => {
  it("stops one visitor at their daily allowance", () => {
    let usage = fresh();
    for (let i = 0; i < TRIAL_POLICY.perVisitorDailyCap; i++) {
      expect(trialDecision(usage, "greedy", "think", { now: NOW }).allowed).toBe(true);
      usage = consume(usage, "greedy", NOW);
    }
    const d = trialDecision(usage, "greedy", "think", { now: NOW });
    expect(d.allowed).toBe(false);
    expect(d.reason).toMatch(/used today's \d+ free runs/i);
  });

  it("does not let one visitor's cap block another", () => {
    let usage = fresh();
    for (let i = 0; i < TRIAL_POLICY.perVisitorDailyCap; i++) usage = consume(usage, "greedy", NOW);
    expect(trialDecision(usage, "someone-else", "think", { now: NOW }).allowed).toBe(true);
  });

  it("stops everyone at the shared platform ceiling", () => {
    const usage = { ...fresh(), platformCalls: TRIAL_POLICY.dailyPlatformCap };
    const d = trialDecision(usage, "new-visitor", "think", { now: NOW });
    expect(d.allowed).toBe(false);
    expect(d.reason).toMatch(/shared trial allowance for today is used up/i);
    expect(d.reason).toMatch(/no cap at all/i); // and it points at the fix
  });

  it("rolls the counters at the UTC day boundary", () => {
    let usage = fresh();
    for (let i = 0; i < TRIAL_POLICY.perVisitorDailyCap; i++) usage = consume(usage, "v", NOW);
    expect(trialDecision(usage, "v", "think", { now: NOW }).allowed).toBe(false);

    const tomorrow = NOW + 24 * 3600 * 1000;
    expect(dayKey(tomorrow)).not.toBe(dayKey(NOW));
    expect(trialDecision(usage, "v", "think", { now: tomorrow }).allowed).toBe(true);
    expect(rolled(usage, tomorrow).platformCalls).toBe(0);
  });

  it("counts both the visitor and the platform on every consumed call", () => {
    const after = consume(fresh(), "v", NOW);
    expect(after.platformCalls).toBe(1);
    expect(after.perVisitor["v"]).toBe(1);
  });
});

describe("fail closed, unlike the request rate limiter", () => {
  it("refuses when the platform key is absent rather than half-working", () => {
    const d = trialDecision(fresh(), "v", "think", { now: NOW, platformKeyPresent: false });
    expect(d.allowed).toBe(false);
    expect(d.reason).toMatch(/trial key is not configured/i);
  });

  it("refuses when the visitor cannot be identified, so the cap is enforceable", () => {
    // Without an identity the per-visitor cap is meaningless and one script becomes every visitor.
    expect(trialDecision(fresh(), "", "think", { now: NOW }).allowed).toBe(false);
    expect(trialDecision(fresh(), "   ", "think", { now: NOW }).reason).toMatch(/no visitor identity/i);
  });

  it("obeys the kill switch, which sits above the trial like everything else", () => {
    killSwitch.engageGlobal();
    const d = trialDecision(fresh(), "v", "think", { now: NOW });
    expect(d.allowed).toBe(false);
    expect(d.reason).toMatch(/kill switch/i);
  });
});

describe("purity, so the counters can live anywhere", () => {
  it("never mutates the usage it is given", () => {
    const usage = fresh();
    const snapshot = JSON.stringify(usage);
    trialDecision(usage, "v", "think", { now: NOW });
    consume(usage, "v", NOW);
    expect(JSON.stringify(usage)).toBe(snapshot);
  });
});
