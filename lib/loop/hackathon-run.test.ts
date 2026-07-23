import { describe, it, expect, vi } from "vitest";
import { submissionPackage, autoHackathon } from "./hackathon-run";
import type { RadarHit } from "./hackathon-radar";

const hit: RadarHit = {
  title: "AI Agents Challenge", url: "https://x.devpost.com", prizeUsd: 10000,
  online: true, openState: "open", submissionDates: "Jul 20 - Aug 15, 2026", source: "devpost",
};

const listing = {
  hackathons: [
    { title: "AI Agents Challenge", url: "https://x.devpost.com", prize_amount: "$<span data-currency-value>10,000</span>", displayed_location: { location: "Online" }, open_state: "open", submission_period_dates: "Jul 20 - Aug 15, 2026" },
  ],
};
const fakeFetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => listing })) as unknown as typeof fetch;

function fakeSb() {
  const inserts: Record<string, unknown>[] = [];
  const sb = {
    from() { return this; },
    async insert(r: Record<string, unknown>) { inserts.push(r); return { error: null }; },
  } as unknown as import("@supabase/supabase-js").SupabaseClient;
  return { sb, inserts };
}

describe("hackathon run (ADR-0021) — find → build → package; the submit click stays human", () => {
  it("submissionPackage discloses AI authorship and keeps the human hard-stops explicit", () => {
    const p = submissionPackage(hit, { projectName: "ProofBoard", buildSummary: "A live receipts board.", repoUrl: "https://github.com/x/y", liveUrl: "https://y.vercel.app" });
    expect(p.description.join(" ")).toMatch(/AI agents planned, wrote, reviewed/i);
    expect(p.links).toEqual(["https://github.com/x/y", "https://y.vercel.app"]);
    const human = p.humanSteps.join(" ");
    expect(human).toMatch(/account creation and rules acceptance are yours alone/i);
    expect(human).toMatch(/press Submit/i);
  });

  it("no receipts → the package says receipts are pending, never invents links", () => {
    const p = submissionPackage(hit, { projectName: "X", buildSummary: "S" });
    expect(p.links).toEqual([]);
    expect(p.description.join(" ")).toMatch(/receipts pending/i);
  });

  it("autoHackathon: scan → pick the open hit → a REAL org-run is inserted with the win-plan goal", async () => {
    const { sb, inserts } = fakeSb();
    const r = await autoHackathon(sb, "u1", { minPrizeUsd: 1000, fetchImpl: fakeFetch });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.hit.title).toBe("AI Agents Challenge");
      expect(r.goal).toMatch(/^WIN PLAN/);
      expect(r.rulesCheck.length).toBeGreaterThan(0);
    }
    expect(inserts).toHaveLength(1);
    expect(String(inserts[0].goal)).toContain("compliance rules check");
    expect(inserts[0].user_id).toBe("u1");
  });

  it("scan failure → honest error, nothing inserted", async () => {
    const { sb, inserts } = fakeSb();
    const failFetch = vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) })) as unknown as typeof fetch;
    const r = await autoHackathon(sb, "u1", { fetchImpl: failFetch });
    expect(r.ok).toBe(false);
    expect(inserts).toHaveLength(0);
  });
});
