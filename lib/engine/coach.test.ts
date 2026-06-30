import { describe, it, expect } from "vitest";
import { coachFor } from "./coach";
import type { Company } from "./types";

// Minimal Company for the fields coachFor reads (status, validation.confidence, product.status, night, ledger.spent).
const co = (over: Record<string, unknown> = {}): Company =>
  ({
    id: "c",
    name: "X",
    slug: "x",
    idea: "an idea",
    status: "operating",
    night: 3,
    ledger: { spent: 10, credited: 0, tasksDone: 5, tasksFailed: 0 },
    ...over,
  }) as unknown as Company;

describe("coachFor — grounded in this company's stage", () => {
  it("weak validation → sharpen + commitment metric", () => {
    const r = coachFor(co({ status: "validating", validation: { confidence: 40 } }));
    expect(r.headline).toMatch(/sharpen/i);
    expect(r.metric).toMatch(/commitment/i);
  });

  it("strong validation → earned the build", () => {
    const r = coachFor(co({ status: "validated", validation: { confidence: 82 } }));
    expect(r.headline).toMatch(/earned the build/i);
  });

  it("operating with no live product → ship-first, PPU metric", () => {
    const r = coachFor(co({ status: "operating", product: undefined }));
    expect(r.metric).toMatch(/Proven Paying User/i);
  });

  it("operating + live product → conversion game", () => {
    const r = coachFor(co({ status: "operating", product: { url: "https://x.io", status: "live" } }));
    expect(r.metric).toMatch(/free.?→.?paid|cost-per-PPU/i);
  });
});
