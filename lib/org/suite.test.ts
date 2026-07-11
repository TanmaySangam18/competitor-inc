import { describe, it, expect } from "vitest";
import { reuse, suiteRecall, type Suite } from "./suite";
import { fullstackPromptFile } from "@/lib/engine/fullstack-build";

const empty: Suite = { company: "Rivera Lab", products: [] };
const one: Suite = { company: "Rivera Lab", products: [{ slug: "study-tool", purpose: "run human-subjects studies" }] };
const two: Suite = {
  company: "Rivera Lab",
  products: [
    { slug: "study-tool", purpose: "run human-subjects studies" },
    { slug: "grant-tracker", purpose: "track grant deadlines + spend" },
  ],
};

describe("the suite (S4) — a customer's products share one substrate", () => {
  it("reuse: the first product reuses nothing; a 2nd+ shares identity + data", () => {
    expect(reuse(empty)).toEqual({ firstProduct: true, siblings: 0, sharesIdentity: false, sharesData: false });
    expect(reuse(one)).toEqual({ firstProduct: false, siblings: 1, sharesIdentity: true, sharesData: true });
    expect(reuse(two).siblings).toBe(2);
  });

  it("suiteRecall: empty for the first product (nothing to reuse yet)", () => {
    expect(suiteRecall(empty)).toBe("");
  });

  it("suiteRecall: a new product JOINS the suite — reuse one sign-on + shared data, names the siblings", () => {
    const r = suiteRecall(two);
    expect(r).toContain("JOINS that suite");
    expect(r).toContain("ONE SIGN-ON");
    expect(r).toContain("SHARED DATA");
    expect(r).toContain("study-tool");
    expect(r).toContain("grant-tracker");
  });

  it("flows into the build brief AHEAD of everything, so a suite product reuses from the first line", () => {
    const brief = fullstackPromptFile("a lab-inventory app", { suiteRecall: suiteRecall(one) });
    expect(brief).toContain("PRODUCT SUITE");
    expect(brief.indexOf("PRODUCT SUITE")).toBe(0); // the very first thing the agent reads
    // a first-product build (no suite) carries no suite framing
    expect(fullstackPromptFile("a lab-inventory app")).not.toContain("PRODUCT SUITE");
  });

  it("is bounded + deterministic", () => {
    const big: Suite = { company: "X", products: Array.from({ length: 50 }, (_, i) => ({ slug: `p${i}`, purpose: "x".repeat(60) })) };
    expect(suiteRecall(big).length).toBeLessThanOrEqual(1400);
    expect(suiteRecall(two)).toEqual(suiteRecall(two));
  });
});
