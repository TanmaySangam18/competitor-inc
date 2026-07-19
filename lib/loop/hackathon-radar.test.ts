import { describe, it, expect, vi } from "vitest";
import { scanHackathons, winPlan } from "./hackathon-radar";

const listing = {
  hackathons: [
    { title: "AI Agents Challenge", url: "https://x.devpost.com", prize_amount: "$<span data-currency-value>10,000</span>", displayed_location: { location: "Online" }, open_state: "open", submission_period_dates: "Jul 20 - Aug 15, 2026" },
    { title: "Campus Only", url: "https://y.devpost.com", prize_amount: "$5,000", displayed_location: { location: "Boston, MA" }, open_state: "open", submission_period_dates: "" },
    { title: "No Prize Jam", url: "https://z.devpost.com", prize_amount: "", displayed_location: { location: "Online" }, open_state: "upcoming", submission_period_dates: "" },
  ],
};
const fakeFetch = (body: unknown, status = 200) =>
  vi.fn(async () => ({ ok: status < 400, status, json: async () => body })) as unknown as typeof fetch;

describe("hackathon radar (ADR-0014) — $0 discovery, compliance-first win plans", () => {
  it("scans, keeps ONLINE events, parses prizes, ranks by prize", async () => {
    const r = await scanHackathons({ fetchImpl: fakeFetch(listing) });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.hits.map((h) => h.title)).toEqual(["AI Agents Challenge", "No Prize Jam"]); // in-person filtered out
      expect(r.hits[0].prizeUsd).toBe(10000);
      expect(r.hits[1].prizeUsd).toBe(0); // unstated prize kept honest, listed last
    }
  });

  it("minPrize filters; upstream failure and shape drift are honest errors, never throws", async () => {
    const r = await scanHackathons({ fetchImpl: fakeFetch(listing), minPrizeUsd: 1 });
    if (r.ok) expect(r.hits).toHaveLength(1);
    expect((await scanHackathons({ fetchImpl: fakeFetch({}, 200) })).ok).toBe(false);
    expect((await scanHackathons({ fetchImpl: fakeFetch(listing, 503) })).ok).toBe(false);
  });

  it("winPlan opens with the compliance gate and carries the abort + disclosure rails", () => {
    const plan = winPlan({ title: "AI Agents Challenge", url: "https://x.devpost.com", prizeUsd: 10000, online: true, openState: "open", submissionDates: "Jul 20 - Aug 15", source: "devpost" });
    expect(plan.goal).toContain("Step 0 (gate)");
    expect(plan.goal).toContain("ABORT if AI assistance is prohibited");
    expect(plan.goal).toContain("no fabricated metrics");
    expect(plan.rulesCheck[0]).toContain("we skip, we never hide");
    expect(plan.rulesCheck.some((r) => r.includes("IP assignment"))).toBe(true);
  });
});
