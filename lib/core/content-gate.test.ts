import { describe, it, expect } from "vitest";
import { screenContent } from "./content-gate";

describe("content gate v2 — the judgment screen (ADR-0025)", () => {
  it("clean, receipt-style marketing prose passes", () => {
    const r = screenContent(
      "We shipped the treasury this week: per-department budget envelopes, every debit logged. " +
      "Receipt in the ledger. Written by our AI team, disclosed as always.",
    );
    expect(r.verdict).toBe("pass");
    expect(r.flags).toEqual([]);
  });

  it("flags hostile dunking even when factually receipt-clean (the S3 scenario)", () => {
    const r = screenContent("Unlike that garbage from our competitor, our numbers are real [receipt: #42].");
    expect(r.verdict).toBe("flag");
    expect(r.flags.join()).toContain("hostile-language");
  });

  it("flags tragedy adjacency: never market near layoffs, disasters, deaths", () => {
    for (const text of [
      "They just announced layoffs. Great week to switch to us!",
      "After the earthquake, remember: our uptime held.",
    ]) {
      expect(screenContent(text).verdict, text).toBe("flag");
    }
  });

  it("flags politics, medical, and legal claim territory", () => {
    expect(screenContent("Vote for the candidate who understands AI.").flags.join()).toContain("politics");
    expect(screenContent("Our approach cures burnout for founders.").flags.join()).toContain("medical");
    expect(screenContent("What they are doing violates the law.").flags.join()).toContain("legal");
  });

  it("flags engagement bait and shouting; names every reason with the offending snippet", () => {
    const r = screenContent("LIKE IF YOU AGREE!!! THIS IS THE SHOCKING TRUTH THEY HIDE");
    expect(r.verdict).toBe("flag");
    expect(r.flags.length).toBeGreaterThanOrEqual(2);
    for (const f of r.flags) expect(f).toMatch(/“.+”/);
  });

  it("a flag is a route to a human, not a censor: verdict vocabulary is pass|flag only", () => {
    expect(["pass", "flag"]).toContain(screenContent("anything").verdict);
  });
});
