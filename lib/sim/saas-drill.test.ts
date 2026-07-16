import { describe, it, expect } from "vitest";
import { proveSaas, defaultSaasScript, type SaasSessionStep } from "./saas-drill";

describe("S3 · multi-session SaaS drill (the synthetic test bed)", () => {
  it("the default SaaS life passes every invariant", () => {
    const report = proveSaas("simflow");
    expect(report.notes, report.notes.join(" | ")).toEqual([]);
    expect(report.passed).toBe(true);
    expect(report.checks).toEqual({
      anchored: true,
      recallCarriesHistory: true,
      wallGrew: true,
      wallCatchesPlantedBreak: true,
      refusedChangeNotApplied: true,
      finalWallHolds: true,
      tenantIsolated: true,
      isolationControlNonVacuous: true,
    });
  });

  it("is honest by construction: simulated:true, and the sim wall is in the type", () => {
    const report = proveSaas("simflow");
    expect(report.simulated).toBe(true);
  });

  it("only honest changes land as ADRs — the planted break never does", () => {
    const report = proveSaas("simflow");
    const honestChanges = defaultSaasScript("simflow").filter((s) => s.kind === "change").length;
    expect(report.adrs).toBe(honestChanges); // 3 honest changes, the bad one refused
    expect(report.sessions).toBe(5);
  });

  it("the wall compounds: it ends strictly larger than it was born", () => {
    const report = proveSaas("simflow");
    // born: 3-4 baseline + 3 SaaS floor; grown by one check per honest change
    expect(report.wallChecks).toBeGreaterThanOrEqual(9);
  });

  it("is deterministic — same script ⇒ identical report", () => {
    const a = proveSaas("simflow");
    const b = proveSaas("simflow");
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("a script whose planted break is never caught FAILS the drill (the wall must prove something)", () => {
    // A life with no bad-change: wallCatchesPlantedBreak stays false, so the drill cannot pass —
    // you cannot claim the wall works without watching it catch a break.
    const noBreak: SaasSessionStep[] = defaultSaasScript("simflow").filter((s) => s.kind !== "bad-change");
    const report = proveSaas("simflow", noBreak);
    expect(report.checks.wallCatchesPlantedBreak).toBe(false);
    expect(report.passed).toBe(false);
  });
});
