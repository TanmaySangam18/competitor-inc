// The human-readable proving-ground report. Run it alone with `npm run prove`.
// It prints the capability verdict AND asserts the battery passes, so the report can never
// silently drift from a real pass. (Everything here is simulated:true — the machine, not a result.)
import { describe, it, expect } from "vitest";
import { proveGround } from "./proving-ground";

describe("Proving Ground — report", () => {
  it("prints the S2 grounding-capability verdict", () => {
    const seeds = ["northwind", "contoso", "meridian", "halcyon", "everpeak"];
    const report = proveGround(seeds, { people: 60, years: 30, artifactsPerYear: 60 });
    const { checks } = report;
    const lines = [
      "",
      "  ┌─ SYNTHETIC PROVING GROUND ─ S2: grounded retrieval (simulated) ─────────",
      `  │ tenants:   ${report.tenants}   artifacts: ${report.artifacts}`,
      `  │ grounding:  ${checks.grounding.passed}/${checks.grounding.total}  (answers cite only real, in-tenant artifacts)`,
      `  │ isolation:  ${checks.isolation.passed}/${checks.isolation.total}  (no tenant query leaks another tenant's data)`,
      `  │ abstention: ${checks.abstention.passed}/${checks.abstention.total}  (no-evidence ⇒ "I don't know", not a hallucination)`,
      `  │ verdict:   ${report.passed ? "PASS ✓" : "FAIL ✗"}`,
      "  └──────────────────────────────────────────────────────────────────────",
      `  ${report.verdict}`,
      "",
    ];
    console.log(lines.join("\n"));
    for (const f of [...checks.grounding.failures, ...checks.isolation.failures, ...checks.abstention.failures]) {
      console.log("  ! " + f);
    }
    expect(report.passed).toBe(true);
  });
});
