import { describe, it, expect } from "vitest";
import { generateSocialDrafts, generateDistributionActivities } from "./distribution";
import type { Company } from "./types";

const company: Company = {
  id: "test-id",
  name: "TestProduct",
  slug: "testproduct",
  idea: "a tool for solopreneurs to find their first customers",
  createdAt: Date.now(),
  status: "operating",
  night: 1,
  ledger: { spent: 0, credited: 0, tasksDone: 0, tasksFailed: 0 },
  product: { url: "https://testproduct.com", status: "live" },
};

describe("generateSocialDrafts", () => {
  it("returns at least 3 approval items", () => {
    const drafts = generateSocialDrafts(company, 1);
    expect(drafts.length).toBeGreaterThanOrEqual(3);
  });

  it("includes twitter and linkedin kinds", () => {
    const drafts = generateSocialDrafts(company, 1);
    const kinds = drafts.map((d) => d.kind);
    expect(kinds).toContain("twitter");
    expect(kinds).toContain("linkedin");
  });

  it("draft detail includes the product URL", () => {
    const drafts = generateSocialDrafts(company, 1);
    const withUrl = drafts.filter((d) => d.detail.includes("testproduct.com"));
    expect(withUrl.length).toBeGreaterThan(0);
  });

  it("all drafts have non-empty title and detail", () => {
    const drafts = generateSocialDrafts(company, 1);
    for (const d of drafts) {
      expect(d.title.length).toBeGreaterThan(0);
      expect(d.detail.length).toBeGreaterThan(0);
    }
  });
});

describe("generateDistributionActivities", () => {
  it("returns 2 activities", () => {
    const acts = generateDistributionActivities(company, 1);
    expect(acts).toHaveLength(2);
  });

  it("activities have agent growth or marketing", () => {
    const acts = generateDistributionActivities(company, 1);
    for (const a of acts) {
      expect(["growth", "marketing"]).toContain(a.agent);
    }
  });
});
