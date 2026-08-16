import { describe, it, expect } from "vitest";
import { analyze } from "./analyst";
import type { Activity, Company } from "@/lib/core/types";

const co = (night: number): Company => ({
  id: "c1",
  name: "Test",
  slug: "test",
  idea: "a thing",
  createdAt: Date.now(),
  status: "operating",
  night,
  ledger: { spent: 0, credited: 0, tasksDone: 0, tasksFailed: 0 },
});

const act = (night: number, action: string, meta = ""): Activity => ({
  id: Math.random().toString(36).slice(2),
  night,
  agent: "growth",
  action,
  meta,
  cost: 0,
  status: "done",
});

describe("analyze — Growth Analyst", () => {
  it("counts opportunities per night from demand signals", () => {
    const acts = [
      act(1, "Sent outreach to 10 leads"),
      act(1, "Posted in a community"),
      act(2, "Drafted SEO alternative page"),
    ];
    const r = analyze(co(2), acts);
    expect(r.totalOpportunities).toBe(3);
    expect(r.perNight).toHaveLength(2);
    expect(r.perNight[0].opportunities).toBe(2);
    expect(r.perNight[1].opportunities).toBe(1);
  });

  it("reports zero + demand bottleneck for an empty log", () => {
    const r = analyze(co(1), []);
    expect(r.totalOpportunities).toBe(0);
    expect(r.bottleneck.bottleneck).toBe("demand");
    expect(r.northStar).toMatch(/opportunit/i);
  });

  it("tallies channels from activity text", () => {
    const acts = [
      act(1, "Got a referral intro from a happy customer"),
      act(1, "Drafted a programmatic SEO page"),
      act(2, "Posted an honest story in the community / Show HN"),
    ];
    const r = analyze(co(2), acts);
    const channels = r.byChannel.map((c) => c.channel);
    expect(channels).toContain("Referrals & intros");
    expect(channels).toContain("SEO / content");
    expect(channels).toContain("Community posts");
  });

  it("detects an upward trend when the last shift beats the prior average", () => {
    const acts = [
      act(1, "one outreach"),
      act(2, "one outreach"),
      act(3, "lead outreach prospect campaign referral"), // 1 activity, many demand words still counts as 1 opp
      act(3, "posted community"),
      act(3, "sent cold email"),
    ];
    const r = analyze(co(3), acts);
    expect(r.perNight[2].opportunities).toBeGreaterThan(r.perNight[0].opportunities);
    expect(r.trend).toBe("up");
  });

  it("counts conversion signals separately", () => {
    const acts = [act(1, "Got a new paying customer"), act(1, "Booked a demo")];
    const r = analyze(co(1), acts);
    expect(r.conversionSignals).toBe(2);
  });
});
