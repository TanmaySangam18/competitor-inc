import { describe, it, expect } from "vitest";
import { deriveQuery, scoreDemand, buildReport, type SourceResult } from "./radar";

describe("deriveQuery", () => {
  it("strips stopwords + filler and keeps meaningful keywords", () => {
    const q = deriveQuery("An app for meal prep planning for busy nurses");
    expect(q).not.toMatch(/\bapp\b|\bfor\b|\ban\b/);
    expect(q).toMatch(/meal/);
    expect(q).toMatch(/nurses/);
  });
  it("caps the number of terms", () => {
    const q = deriveQuery("alpha bravo charlie delta echo foxtrot golf hotel", 3);
    expect(q.split(" ").length).toBeLessThanOrEqual(3);
  });
  it("falls back to the raw idea when nothing survives", () => {
    const q = deriveQuery("the app");
    expect(q.length).toBeGreaterThan(0);
  });
});

describe("scoreDemand", () => {
  it("scores strong for lots of real signal + engagement + rising trend", () => {
    const r = scoreDemand({ totalSignals: 500, totalEngagement: 5000, competition: 40, trend: "rising", reachableSources: 3 });
    expect(r.demandScore).toBeGreaterThanOrEqual(62);
    expect(r.verdict).toBe("strong");
  });
  it("scores weak for near-zero signal", () => {
    const r = scoreDemand({ totalSignals: 0, totalEngagement: 0, competition: 0, trend: "unknown", reachableSources: 3 });
    expect(r.verdict).toBe("weak");
  });
  it("tempers the score when few sources were reachable", () => {
    const full = scoreDemand({ totalSignals: 200, totalEngagement: 2000, competition: 30, trend: "rising", reachableSources: 3 });
    const thin = scoreDemand({ totalSignals: 200, totalEngagement: 2000, competition: 30, trend: "rising", reachableSources: 1 });
    expect(thin.demandScore).toBeLessThan(full.demandScore);
  });
  it("tempers the score when the query was broadened (semantic-drift risk)", () => {
    const focused = scoreDemand({ totalSignals: 200, totalEngagement: 2000, competition: 30, trend: "rising", reachableSources: 3, broadened: false });
    const broad = scoreDemand({ totalSignals: 200, totalEngagement: 2000, competition: 30, trend: "rising", reachableSources: 3, broadened: true });
    expect(broad.demandScore).toBeLessThan(focused.demandScore);
  });

  it("never returns out-of-range scores", () => {
    const hi = scoreDemand({ totalSignals: 1e9, totalEngagement: 1e9, competition: 40, trend: "rising", reachableSources: 3 });
    expect(hi.demandScore).toBeLessThanOrEqual(100);
    expect(hi.demandScore).toBeGreaterThanOrEqual(1);
  });
});

describe("buildReport", () => {
  const hn: SourceResult = {
    source: "Hacker News", reachable: true, count: 120, engagement: 900,
    signals: [{ source: "Hacker News", title: "Show HN: meal prep", url: "https://news.ycombinator.com/item?id=1", metric: "100 points", date: new Date().toISOString() }],
  };
  const gh: SourceResult = {
    source: "GitHub", reachable: true, count: 60, engagement: 300,
    signals: [{ source: "GitHub", title: "org/mealprep", url: "https://github.com/org/mealprep", metric: "60 stars" }],
  };
  const dead: SourceResult = { source: "StackExchange", reachable: false, count: 0, engagement: 0, signals: [], note: "unreachable" };

  it("treats GitHub as competition, not demand signal", () => {
    const rep = buildReport("meal prep app", "meal prep", [hn, gh]);
    expect(rep.competition).toBe(60);
    expect(rep.totalSignals).toBe(120); // HN count only, not GH
  });
  it("collects every source URL as a citation", () => {
    const rep = buildReport("meal prep app", "meal prep", [hn, gh]);
    expect(rep.citations).toContain("https://news.ycombinator.com/item?id=1");
    expect(rep.citations).toContain("https://github.com/org/mealprep");
  });
  it("names unreachable sources honestly in the summary", () => {
    const rep = buildReport("meal prep app", "meal prep", [hn, dead]);
    expect(rep.summary).toMatch(/couldn't reach/i);
    expect(rep.summary).toMatch(/StackExchange/);
  });
  it("produces a verdict and a rising trend from fresh HN dates", () => {
    const rep = buildReport("meal prep app", "meal prep", [hn]);
    expect(["strong", "mixed", "weak"]).toContain(rep.verdict);
    expect(rep.trend).toBe("rising");
  });
});

describe("deriveQuery survives the real ideas (regression from a live run)", () => {
  it("keeps co-op as one token instead of destroying it", () => {
    // Found by running the product: "A tool that tells Northeastern students which co-op postings are
    // actually real" searched "tells northeastern" and surfaced Yankee Candle articles. The hyphen was
    // split into "co" + "op", both dropped as too short, and filler verbs outranked the real nouns.
    const q = deriveQuery("A tool that tells Northeastern students which co-op postings are actually real");
    expect(q).toContain("co-op");
    expect(q).toContain("northeastern");
    expect(q).toContain("postings");
    expect(q).not.toContain("tells");
    expect(q).not.toContain("which");
    expect(q).not.toContain("actually");
  });

  it("still extracts sane queries from the other seed ideas", () => {
    expect(deriveQuery("A tool that turns my voice notes into to-dos")).toContain("voice");
    expect(deriveQuery("A booking page for a local tutor")).toMatch(/booking|tutor/);
  });

  it("never returns an empty query even for a stopword-only idea", () => {
    expect(deriveQuery("a tool that we build").length).toBeGreaterThan(0);
  });
});
