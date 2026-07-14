import { describe, it, expect } from "vitest";
import { EnvVault, NullVault } from "./vault";
import { providerStatus, selectProvider, hasFailover, failoverChain } from "./providers";
import { PromptRegistry } from "./prompts";
import { pairedMetric, reportKpi, suspectGaming } from "./kpi";
import { exportData, planDeletion } from "./dsr";
import { AuditLog, MemoryAuditSink } from "./audit";

describe("D · vault client", () => {
  it("null vault fails closed", () => {
    const v = new NullVault();
    expect(v.has("ANY")).toBe(false);
    expect(v.get("ANY", { agent: "engineering", purpose: "test" })).toBeNull();
  });
  it("env vault records the ACCESS (name + purpose), never the value", () => {
    const log = new AuditLog(new MemoryAuditSink());
    const v = new EnvVault(log);
    process.env.__TEST_SECRET = "super-secret-value";
    const got = v.get("__TEST_SECRET", { agent: "engineering", purpose: "deploy" });
    expect(got).toBe("super-secret-value");
    const entry = log.all()[0];
    expect(entry.action).toBe("secret_read");
    expect(JSON.stringify(entry)).not.toContain("super-secret-value"); // value never logged
    delete process.env.__TEST_SECRET;
  });
});

describe("D · multi-provider resilience", () => {
  it("selects the first configured provider; null when none", () => {
    const saved = { a: process.env.ANTHROPIC_API_KEY, o: process.env.OPENAI_API_KEY, g: process.env.GOOGLE_API_KEY, q: process.env.GROQ_API_KEY };
    delete process.env.ANTHROPIC_API_KEY; delete process.env.OPENAI_API_KEY; delete process.env.GOOGLE_API_KEY; delete process.env.GROQ_API_KEY;
    expect(selectProvider()).toBeNull();
    expect(hasFailover()).toBe(false);
    process.env.OPENAI_API_KEY = "x"; process.env.GOOGLE_API_KEY = "y";
    expect(selectProvider()).toBe("openai"); // first configured in default order
    expect(hasFailover()).toBe(true);
    expect(failoverChain()).toContain("google");
    // restore
    for (const [k, val] of [["ANTHROPIC_API_KEY", saved.a], ["OPENAI_API_KEY", saved.o], ["GOOGLE_API_KEY", saved.g], ["GROQ_API_KEY", saved.q]] as const) {
      if (val === undefined) delete process.env[k]; else process.env[k] = val;
    }
    expect(providerStatus().length).toBe(4);
  });
});

describe("D · prompts-as-code", () => {
  it("registers staged, activates (deploy), and rolls back", () => {
    const r = new PromptRegistry();
    r.register("ceo", "v1 text");
    expect(r.active("ceo")).toBeNull(); // staged, not live
    r.activate("ceo", 1);
    expect(r.active("ceo")?.version).toBe(1);
    r.register("ceo", "v2 text");
    r.activate("ceo", 2);
    expect(r.active("ceo")?.version).toBe(2);
    r.rollback("ceo");
    expect(r.active("ceo")?.version).toBe(1); // reverted like a deploy
  });
});

describe("D · anti-Goodhart KPIs", () => {
  it("pairs each KPI with its counter-metric", () => {
    expect(pairedMetric("resolution rate")).toBe("reopen rate");
    expect(pairedMetric("velocity")).toBe("rework rate");
  });
  it("reports both together; flags incomplete when the counter is missing", () => {
    expect(reportKpi("resolution rate", 0.9, 0.05).bothReported).toBe(true);
    expect(reportKpi("resolution rate", 0.9).bothReported).toBe(false);
  });
  it("suspects gaming when the KPI improves while its counter worsens", () => {
    expect(suspectGaming(+0.1, +0.1)).toBe(true);
    expect(suspectGaming(+0.1, -0.02)).toBe(false);
  });
});

describe("D · GDPR export + delete", () => {
  it("exports an honest (possibly empty) bundle — never fabricated", () => {
    expect(exportData("acme").note).toMatch(/no data source|nothing fabricated/i);
    const b = exportData("acme", (c) => ({ profile: { id: c } }));
    expect(b.sections.profile).toEqual({ id: "acme" });
  });
  it("deletion is T3 and human-reserved (a plan, not an execution)", () => {
    const plan = planDeletion("acme");
    expect(plan.tier).toBe("T3");
    expect(plan.requiresHuman).toBe(true);
    expect(plan.steps.length).toBeGreaterThan(3);
  });
});
