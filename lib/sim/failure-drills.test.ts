import { describe, it, expect } from "vitest";
import { runFailureDrills } from "./failure-drills";

describe("A3 · simulation failure-drills (the ship gate)", () => {
  it("all six mandated failure drills pass (REQUIREMENTS §15)", async () => {
    const report = await runFailureDrills();
    // surface any failing drill in the assertion message
    const failing = report.drills.filter((d) => !d.passed).map((d) => `${d.name}: ${d.detail}`);
    expect(failing, failing.join(" | ")).toEqual([]);
    expect(report.ok).toBe(true);
    expect(report.total).toBe(6);
  });

  it("covers the exact six failure classes from the spec", async () => {
    const report = await runFailureDrills();
    const names = report.drills.map((d) => d.name).sort();
    expect(names).toEqual([
      "contradictory facts",
      "hostile customer",
      "model-provider outage",
      "orchestrator bad plan",
      "prompt injection",
      "runaway spend",
    ]);
  });
});
