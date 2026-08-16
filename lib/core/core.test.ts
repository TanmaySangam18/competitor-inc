import { describe, it, expect } from "vitest";
import { core } from "./index";
import { POLICY } from "@/lib/core/policy";

// Proves the company OS runs HEADLESS — no React, no server, no env — which is the whole point of lib/core.

describe("core.org", () => {
  it("exposes a non-empty, self-consistent org", () => {
    expect(core.org.size()).toBe(core.org.roles.length);
    expect(core.org.size()).toBeGreaterThan(0);
    expect(core.org.departments.length).toBeGreaterThan(0);
  });
  it("passes its own integrity check", () => {
    expect(core.org.validate()).toEqual([]);
  });
  it("resolves reporting chains from real role ids", () => {
    const someRole = core.org.roles.find((r) => r.level !== "exec");
    expect(someRole).toBeTruthy();
    expect(Array.isArray(core.org.chain(someRole!.id))).toBe(true);
  });
});

describe("core.agents (canonical roster, codenames retired)", () => {
  it("lists the 9 governed roles with real titles", () => {
    expect(core.agents.roles.length).toBe(9);
    for (const a of core.agents.roles) expect(a.title.length).toBeGreaterThan(0);
  });
  it("uses no legacy codenames", () => {
    const codenames = /\b(forge|apex|pitch|surge|guard|rig|ledger|pulse)\b/i;
    for (const a of core.agents.roles) expect(codenames.test(a.title)).toBe(false);
  });
});

describe("core.governance (the one decision spine)", () => {
  it("caps: rejects an over-limit spend, allows zero", () => {
    expect(core.governance.withinCaps({ type: "spend", agent: "marketing", amountUsd: 1_000_000 })).toBe(false);
    expect(core.governance.withinCaps({ type: "spend", agent: "marketing", amountUsd: 0 })).toBe(true);
  });
  it("kill switch halts everything (hard floor)", () => {
    const killed = { ...POLICY, spend: { ...POLICY.spend, killSwitch: true } };
    const d = core.governance.decide({ type: "build", agent: "engineering" }, killed);
    expect(d.verdict).toBe("BLOCK");
  });
  it("decide always returns a valid verdict + reason", () => {
    const d = core.governance.decide({ type: "deploy", agent: "engineering", reversible: true, observable: true });
    expect(["AUTO", "QUEUE", "BLOCK"]).toContain(d.verdict);
    expect(typeof d.reason).toBe("string");
  });
});
