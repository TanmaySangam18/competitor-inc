import { describe, it, expect } from "vitest";
import { draftBlitz } from "./blitz";

describe("draftBlitz — Surge's launch-blitz drafts", () => {
  const drafts = draftBlitz({ name: "Plantly", idea: "a marketplace for rare houseplants" });

  it("produces a draft per launch channel", () => {
    expect(drafts.length).toBeGreaterThanOrEqual(3);
    expect(drafts.map((d) => d.channel)).toEqual(expect.arrayContaining(["X thread", "Show HN", "Indie Hackers"]));
  });

  it("personalizes each draft with the company name and a non-empty body + title", () => {
    for (const d of drafts) {
      expect(d.body).toContain("Plantly");
      expect(d.title.length).toBeGreaterThan(0);
      expect(d.body.length).toBeGreaterThan(0);
    }
  });

  it("strips the leading article from the idea in the problem phrase", () => {
    const hn = drafts.find((d) => d.channel === "Show HN")!;
    expect(hn.body).toContain("marketplace for rare houseplants");
  });
});
