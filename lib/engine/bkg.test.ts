import { describe, it, expect } from "vitest";
import { extractFromActivity, buildGraph, summarizeGraph } from "./bkg";

describe("extractFromActivity — conservative heuristic extraction", () => {
  it("pulls channels, assets, metrics, and decisions", () => {
    const e = extractFromActivity({ action: "Shipped the landing site and posted to Reddit", meta: "120 signups" });
    const ids = e.entities.map((x) => x.id);
    expect(ids).toContain("channel:reddit");
    expect(ids).toContain("asset:shipped build");
    expect(ids).toContain("metric:signups");
  });
  it("finds a live url and money as entities", () => {
    const e = extractFromActivity({ action: "Deployed https://acme.com", meta: "ad spend $50" });
    const ids = e.entities.map((x) => x.id);
    expect(ids).toContain("asset:live url");
    expect(ids).toContain("metric:spend/revenue");
  });
  it("invents nothing for an empty/benign activity", () => {
    expect(extractFromActivity({ action: "thinking about strategy" }).entities).toEqual([]);
  });
});

describe("buildGraph — accumulates mentions + co-occurrence edges", () => {
  const acts = [
    { action: "Posted to Reddit", meta: "30 signups" },
    { action: "Posted to Reddit again", meta: "another 40 signups" },
    { action: "Validated the pricing", meta: "decided to charge $39" },
  ];
  it("dedupes entities and counts mentions", () => {
    const g = buildGraph(acts);
    const reddit = g.entities.find((e) => e.id === "channel:reddit");
    expect(reddit?.mentions).toBe(2);
  });
  it("creates co-occurrence edges only between kept entities", () => {
    const g = buildGraph(acts);
    expect(g.edges.length).toBeGreaterThan(0);
    const ids = new Set(g.entities.map((e) => e.id));
    for (const e of g.edges) {
      expect(ids.has(e.from)).toBe(true);
      expect(ids.has(e.to)).toBe(true);
    }
  });
  it("caps the entity count", () => {
    const g = buildGraph(acts, 2);
    expect(g.entities.length).toBeLessThanOrEqual(2);
  });
  it("ranks by mentions (most-known first)", () => {
    const g = buildGraph(acts);
    for (let i = 1; i < g.entities.length; i++) {
      expect(g.entities[i - 1].mentions).toBeGreaterThanOrEqual(g.entities[i].mentions);
    }
  });
});

describe("summarizeGraph — model-injectable, empty when empty", () => {
  it("returns '' for an empty graph (adds nothing to a prompt)", () => {
    expect(summarizeGraph({ entities: [], edges: [] })).toBe("");
  });
  it("names channels, assets, metrics, and decisions", () => {
    const s = summarizeGraph(buildGraph([{ action: "Posted to Reddit, shipped site", meta: "50 signups, decided to charge" }]));
    expect(s).toMatch(/channels tried: reddit/);
    expect(s).toMatch(/assets:/);
    expect(s).toMatch(/metrics seen:/);
    expect(s).toMatch(/decision/);
  });
});
