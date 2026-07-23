import { describe, it, expect } from "vitest";
import { locTally } from "./loc-ledger";

describe("honest line ledger (ADR-0019) — earned, never asserted", () => {
  it("sums the two buckets and names provenance in the claim", () => {
    const t = locTally({ companyZeroLines: 42000, customerShippedLines: 1200, verifiedDeployments: 2 });
    expect(t.total).toBe(43200);
    expect(t.claim).toContain("42,000 lines building competitor.inc");
    expect(t.claim).toContain("2 verified customer deployments");
  });
  it("customer bucket at 0 states the honest truth, not a fake number", () => {
    const t = locTally({ companyZeroLines: 42000, customerShippedLines: 0, verifiedDeployments: 0 });
    expect(t.customerShipped).toBe(0);
    expect(t.claim).toContain("0 customer lines yet — the honest number");
  });
  it("refuses to invent: negative / NaN clamp to 0", () => {
    const t = locTally({ companyZeroLines: -5, customerShippedLines: Number.NaN, verifiedDeployments: -3 });
    expect(t.total).toBe(0);
    expect(t.companyZero).toBe(0);
  });
});
