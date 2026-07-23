import { describe, it, expect } from "vitest";
import { planCluster, honestyGate, draftBrief, AI_BYLINE } from "./seo-factory";

describe("SEO factory — the plan (ADR-0023, pillar + 15, $0 and deterministic)", () => {
  const plan = planCluster("autonomous AI companies");

  it("produces exactly one pillar and 15 supporting pieces", () => {
    expect(plan.pillar.intent).toBe("pillar");
    expect(plan.supporting).toHaveLength(15);
    expect(plan.supporting.every((s) => s.intent === "supporting")).toBe(true);
  });

  it("slugs are unique, url-safe, and topic-derived", () => {
    const slugs = [plan.pillar.slug, ...plan.supporting.map((s) => s.slug)];
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) {
      expect(s).toMatch(/^[a-z0-9-]+$/);
      expect(s).toContain("autonomous-ai-companies");
    }
  });

  it("every title mentions the topic (no orphan templates)", () => {
    for (const item of [plan.pillar, ...plan.supporting]) {
      expect(item.title.toLowerCase()).toContain("autonomous ai companies");
    }
  });
});

describe("SEO factory — the honesty gate (the wall drafts must pass)", () => {
  it("appends the AI byline when absent, and is idempotent when present", () => {
    const r1 = honestyGate({ title: "t", body: "A useful paragraph about workflows." });
    expect(r1.ok && r1.body.includes(AI_BYLINE)).toBe(true);
    const r2 = honestyGate({ title: "t", body: (r1 as { body: string }).body });
    expect(r2.ok && (r2 as { body: string }).body.match(new RegExp("AI marketing team", "g"))!.length).toBe(1);
  });

  it("blocks unverified audience stats, money claims, and testimonials", () => {
    const r = honestyGate({
      title: "t",
      body: [
        "Over 10,000 customers rely on this every day.",
        "Teams have seen $50k in revenue within weeks.",
        "“It changed everything for us.” — a customer",
      ].join("\n\n"),
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.violations).toHaveLength(3);
  });

  it("passes the same claims when a receipt is cited in the paragraph", () => {
    const r = honestyGate({
      title: "t",
      body: "Our first deployment served 3 users in week one [receipt: audit-ledger #42].",
    });
    expect(r.ok).toBe(true);
  });

  it("blocks guarantees and superlatives regardless of receipts", () => {
    const r = honestyGate({ title: "t", body: "Results are guaranteed [receipt: none-needed]." });
    expect(r.ok).toBe(false);
  });
});

describe("SEO factory — the drafting brief carries its own rails", () => {
  it("names the gate, the receipt marker, and the disclosure", () => {
    const brief = draftBrief(planCluster("agent governance").pillar, { name: "competitor.inc", idea: "the autonomous software company" });
    expect(brief).toContain("honesty gate");
    expect(brief).toContain("[receipt:");
    expect(brief.toLowerCase()).toContain("disclosed");
  });
});
