import { describe, it, expect } from "vitest";
import { rationaleFor } from "./rationale";

describe("rationaleFor — the Rationale Stream", () => {
  it("gives each agent its own governing principle", () => {
    expect(rationaleFor("engineering", "Shipped X").principle).toMatch(/Proof-of-Work/i);
    expect(rationaleFor("marketing", "Ran a test").principle).toMatch(/demand/i);
    expect(rationaleFor("ceo", "Nightly audit").principle).toMatch(/economics/i);
    expect(rationaleFor("support", "Answered emails").principle).toMatch(/promise/i);
    expect(rationaleFor("growth", "Spotted a trend").principle).toMatch(/reversible|converts/i);
  });

  it("derives a why from what the action was", () => {
    expect(rationaleFor("engineering", "Shipped the MVP").why).toMatch(/verif/i);
    expect(rationaleFor("marketing", "Ran a $20 test — 3% CTR").why).toMatch(/demand test/i);
    expect(rationaleFor("engineering", "A codegen task failed").why).toMatch(/credited/i);
    expect(rationaleFor("ceo", "Nightly audit: runway healthy").why).toMatch(/numbers|drift/i);
  });

  it("always returns both fields", () => {
    const r = rationaleFor("growth", "did something unusual");
    expect(r.why).toBeTruthy();
    expect(r.principle).toBeTruthy();
  });
});
