import { describe, it, expect } from "vitest";
import { generateSocialNetwork } from "./social-network";
import {
  buildAdMarket, createAdServer, indexMemberFacts, matchesTargeting, predictCtr,
  simulateAdDay, buildInvoices, type SimAdCampaign, type MemberAdFacts,
} from "./ads-marketplace";
import { DAY_MS } from "./rand";

const NOW = Date.UTC(2026, 7, 15);
const net = generateSocialNetwork("ads-test", { members: 3000, now: NOW });
const facts = indexMemberFacts(net);
const market = buildAdMarket(net, "ads-test-market", { advertisers: 12, campaignsPerAdvertiser: 3, now: NOW });

const campaign = (over: Partial<SimAdCampaign> = {}): SimAdCampaign => ({
  id: "cmp_x", advertiserId: "adv_x", name: "test", objective: "lead",
  pricingModel: "cpm", bidMicros: 5_000_000, dailyBudgetMicros: 100_000_000,
  totalBudgetMicros: 1_000_000_000, targeting: {}, frequencyCapPerDay: 3,
  slots: ["feed"], startsAt: NOW - 30 * DAY_MS, endsAt: NOW + 30 * DAY_MS,
  simulated: true, ...over,
});

describe("the honesty wall holds over the ads tables too", () => {
  it("marks every ad object simulated:true, literally", () => {
    expect(market.simulated).toBe(true);
    expect(market.advertisers.every((a) => a.simulated)).toBe(true);
    expect(market.campaigns.every((c) => c.simulated)).toBe(true);
    expect(market.creatives.every((c) => c.simulated)).toBe(true);
  });

  it("carries no field that a dashboard could render as money we actually made", () => {
    // An ads module is the single most dangerous place for the honesty wall to leak, because it is full
    // of real-looking money. Every amount here is named *Micros on a simulated object, and none of these
    // names exist anywhere in it.
    const { server } = simulateAdDay(net, market, { requests: 400, facts, seed: "wall" });
    const keys = new Set<string>();
    const collect = (o: object): void => Object.keys(o).forEach((k) => keys.add(k));
    market.advertisers.forEach(collect);
    market.campaigns.forEach(collect);
    market.creatives.forEach(collect);
    server.charges.slice(0, 50).forEach(collect);
    server.outcomes.slice(0, 50).forEach(collect);
    collect(server.report());
    for (const k of keys) {
      expect(k, `field "${k}" could be misread as real business revenue`)
        .not.toMatch(/^(revenue|mrr|arr|subscription|paid|customers?|signups?|billing|earnings|payout)$/i);
    }
  });

  it("stamps the simulated notice on every invoice", () => {
    const { server } = simulateAdDay(net, market, { requests: 800, facts, seed: "inv" });
    const invoices = buildInvoices(market, server.charges, NOW - 2 * DAY_MS, NOW);
    expect(invoices.length).toBeGreaterThan(0);
    for (const inv of invoices) {
      expect(inv.simulated).toBe(true);
      expect(inv.notice).toMatch(/SIMULATED/);
      expect(inv.notice).toMatch(/never be reported as revenue/i);
    }
  });
});

describe("targeting selects the audience it declares", () => {
  const f: MemberAdFacts = {
    memberId: "m_1", track: "engineering", industry: "Software", country: "Germany",
    level: 3, companySize: "51-200", skills: new Set(["TypeScript", "Kubernetes"]),
    openToWork: false, lastActiveAt: NOW - 3 * DAY_MS, connectionCount: 40,
  };

  it("passes an empty filter", () => {
    expect(matchesTargeting(f, {}, NOW)).toBe(true);
  });

  it("narrows on every dimension independently", () => {
    expect(matchesTargeting(f, { industries: ["Software"] }, NOW)).toBe(true);
    expect(matchesTargeting(f, { industries: ["Biotech"] }, NOW)).toBe(false);
    expect(matchesTargeting(f, { tracks: ["engineering", "data"] }, NOW)).toBe(true);
    expect(matchesTargeting(f, { tracks: ["sales"] }, NOW)).toBe(false);
    expect(matchesTargeting(f, { countries: ["Germany"] }, NOW)).toBe(true);
    expect(matchesTargeting(f, { countries: ["Japan"] }, NOW)).toBe(false);
    expect(matchesTargeting(f, { minLevel: 3 }, NOW)).toBe(true);
    expect(matchesTargeting(f, { minLevel: 4 }, NOW)).toBe(false);
    expect(matchesTargeting(f, { maxLevel: 2 }, NOW)).toBe(false);
    expect(matchesTargeting(f, { openToWork: true }, NOW)).toBe(false);
    expect(matchesTargeting(f, { companySizes: ["51-200"] }, NOW)).toBe(true);
    expect(matchesTargeting(f, { companySizes: ["5000+"] }, NOW)).toBe(false);
  });

  it("treats a skill filter as any-of, not all-of", () => {
    expect(matchesTargeting(f, { skills: ["Kubernetes", "Figma"] }, NOW)).toBe(true);
    expect(matchesTargeting(f, { skills: ["Figma"] }, NOW)).toBe(false);
  });

  it("excludes members who have not been seen inside the window", () => {
    expect(matchesTargeting(f, { activeWithinDays: 7 }, NOW)).toBe(true);
    expect(matchesTargeting(f, { activeWithinDays: 1 }, NOW)).toBe(false);
  });

  it("only ever serves a winner that matches its own targeting", () => {
    // The rule that protects the advertiser. A miss here is spend on an audience they excluded.
    const { server } = simulateAdDay(net, market, { requests: 3000, facts, seed: "target" });
    const byId = new Map(market.campaigns.map((c) => [c.id, c]));
    let checked = 0;
    for (const o of server.outcomes) {
      if (!o.winningCampaignId) continue;
      const c = byId.get(o.winningCampaignId)!;
      expect(matchesTargeting(facts.get(o.memberId)!, c.targeting, o.at), `${c.id} served outside its audience`).toBe(true);
      checked++;
    }
    expect(checked).toBeGreaterThan(100);
  });
});

describe("the auction", () => {
  it("ranks by expected value, so a tighter match beats a bigger bid", () => {
    // This inversion is the whole reason ad auctions score bid x predicted click-through rather than
    // bid alone. A hiring ad shown to someone open to work outranks a generic ad bidding more.
    const f = facts.get(net.members.find((m) => m.openToWork)!.id)!;
    const tight = campaign({ id: "cmp_tight", objective: "hiring", pricingModel: "cpc", bidMicros: 2_000_000, targeting: { openToWork: true, tracks: [f.track] } });
    const loose = campaign({ id: "cmp_loose", objective: "awareness", pricingModel: "cpc", bidMicros: 3_000_000, targeting: {} });
    expect(predictCtr(f, tight)).toBeGreaterThan(predictCtr(f, loose));
    expect(tight.bidMicros * predictCtr(f, tight)).toBeGreaterThan(loose.bidMicros * predictCtr(f, loose));

    const server = createAdServer({ seed: "s", advertisers: [], campaigns: [tight, loose], creatives: [], simulated: true }, facts, { seed: "rank" });
    const out = server.auction({ requestId: "r1", memberId: f.memberId, slot: "feed", at: NOW });
    expect(out.winningCampaignId).toBe("cmp_tight");
  });

  it("charges second price, never the winner's own bid", () => {
    const { server } = simulateAdDay(net, market, { requests: 2500, facts, seed: "gsp" });
    let contested = 0;
    for (const o of server.outcomes) {
      if (!o.winningCampaignId) continue;
      expect(o.clearingPriceMicros).toBeLessThanOrEqual(o.firstPriceMicros + 1);
      if (o.eligible > 1) contested++;
    }
    expect(contested, "no contested auctions in the sample").toBeGreaterThan(50);
    // Across the run, second pricing must actually have discounted something.
    expect(server.report().discountMicros).toBeGreaterThan(0);
  });

  it("charges nothing and explains itself when nothing is eligible", () => {
    const server = createAdServer({ seed: "s", advertisers: [], campaigns: [campaign({ targeting: { countries: ["Atlantis"] } })], creatives: [], simulated: true }, facts, { seed: "empty" });
    const out = server.auction({ requestId: "r1", memberId: net.members[0].id, slot: "feed", at: NOW });
    expect(out.winningCampaignId).toBeNull();
    expect(out.clearingPriceMicros).toBe(0);
    expect(out.filtered["targeting-miss"]).toBe(1);
    expect(server.charges).toHaveLength(0);
  });

  it("counts a reason for every candidate it drops", () => {
    // "No ad was shown" with no explanation is the most expensive silence in an ad system.
    const { server } = simulateAdDay(net, market, { requests: 500, facts, seed: "why" });
    for (const o of server.outcomes) {
      const dropped = Object.values(o.filtered).reduce((a, b) => a + b, 0);
      expect(dropped + o.eligible).toBe(o.candidates);
    }
  });

  it("does not depend on the order campaigns happen to sit in", () => {
    const shuffled = { ...market, campaigns: [...market.campaigns].reverse() };
    const a = simulateAdDay(net, market, { requests: 600, facts, seed: "order" });
    const b = simulateAdDay(net, shuffled, { requests: 600, facts, seed: "order" });
    expect(a.server.outcomes.map((o) => o.winningCampaignId)).toEqual(b.server.outcomes.map((o) => o.winningCampaignId));
  });
});

describe("budgets are never exceeded", () => {
  const { server } = simulateAdDay(net, market, { requests: 25_000, facts, seed: "budget" });

  it("stops a campaign at its lifetime budget", () => {
    // The assertion that matters most. An ad system that overspends a budget is not a rounding problem,
    // it is money taken from someone who did not agree to spend it.
    for (const c of market.campaigns) {
      const spent = server.spentTotalMicros(c.id);
      expect(spent, `${c.id} overspent its total budget`).toBeLessThanOrEqual(c.totalBudgetMicros + c.bidMicros);
    }
  });

  it("stops a campaign at its daily budget", () => {
    const byDay = new Map<string, number>();
    for (const ch of server.charges) {
      const k = `${ch.campaignId}:${Math.floor(ch.at / DAY_MS)}`;
      byDay.set(k, (byDay.get(k) ?? 0) + ch.amountMicros);
    }
    const byId = new Map(market.campaigns.map((c) => [c.id, c]));
    for (const [k, spent] of byDay) {
      const c = byId.get(k.split(":")[0])!;
      expect(spent, `${c.id} overspent a day`).toBeLessThanOrEqual(c.dailyBudgetMicros + c.bidMicros);
    }
  });

  it("paces delivery instead of spending out by breakfast", () => {
    // Without pacing every campaign exhausts in the first hour and the auction is empty for the rest of
    // the day, which is the single loudest complaint advertisers have about naive ad servers.
    const early = server.charges.filter((c) => (c.at % DAY_MS) < 4 * 3_600_000).reduce((a, c) => a + c.amountMicros, 0);
    const total = server.charges.reduce((a, c) => a + c.amountMicros, 0);
    expect(total).toBeGreaterThan(0);
    expect(early / total, "most of the day's spend landed before 4am").toBeLessThan(0.55);
    expect(server.report().filtered["pacing-throttled"] ?? 0).toBeGreaterThan(0);
  });

  it("respects the per-member daily frequency cap", () => {
    const shown = new Map<string, number>();
    for (const o of server.outcomes) {
      if (!o.winningCampaignId) continue;
      const k = `${o.winningCampaignId}:${o.memberId}:${Math.floor(o.at / DAY_MS)}`;
      shown.set(k, (shown.get(k) ?? 0) + 1);
    }
    const byId = new Map(market.campaigns.map((c) => [c.id, c]));
    for (const [k, n] of shown) {
      const c = byId.get(k.split(":")[0])!;
      expect(n, `${c.id} blew its frequency cap`).toBeLessThanOrEqual(c.frequencyCapPerDay);
    }
  });
});

describe("the ledger closes", () => {
  const { server } = simulateAdDay(net, market, { requests: 8000, facts, seed: "ledger" });

  it("charges only whole micros", () => {
    // Fractional money is how an ad ledger drifts away from its invoices. This is the assertion that
    // first caught the generator charging floats while its own comment claimed integers.
    for (const ch of server.charges) expect(Number.isInteger(ch.amountMicros), `${ch.id} charged ${ch.amountMicros}`).toBe(true);
  });

  it("reconciles invoices to charges exactly, in integer micros", () => {
    // An ad system that cannot close its own books is not an ad system.
    const invoices = buildInvoices(market, server.charges, 0, Number.MAX_SAFE_INTEGER);
    const invoiced = invoices.reduce((a, i) => a + i.totalMicros, 0);
    const charged = server.charges.reduce((a, c) => a + c.amountMicros, 0);
    expect(invoiced).toBe(charged);
    expect(invoiced).toBe(server.report().chargedMicros);
  });

  it("bills every line to the advertiser that owns the campaign", () => {
    const owner = new Map(market.campaigns.map((c) => [c.id, c.advertiserId]));
    for (const inv of buildInvoices(market, server.charges, 0, Number.MAX_SAFE_INTEGER)) {
      for (const line of inv.lines) expect(owner.get(line.campaignId)).toBe(inv.advertiserId);
    }
  });

  it("honours the invoice period", () => {
    const cut = NOW - DAY_MS + 12 * 3_600_000;
    const before = buildInvoices(market, server.charges, 0, cut).reduce((a, i) => a + i.totalMicros, 0);
    const after = buildInvoices(market, server.charges, cut + 1, Number.MAX_SAFE_INTEGER).reduce((a, i) => a + i.totalMicros, 0);
    expect(before + after).toBe(server.report().chargedMicros);
  });

  it("only charges CPC campaigns on a click, and CPM campaigns on an impression", () => {
    const model = new Map(market.campaigns.map((c) => [c.id, c.pricingModel]));
    for (const ch of server.charges) {
      if (ch.amountMicros === 0) continue;
      expect(ch.event).toBe(model.get(ch.campaignId) === "cpc" ? "click" : "impression");
    }
  });
});

describe("the run reports itself honestly", () => {
  it("produces a report whose parts agree with each other", () => {
    const { server, report } = simulateAdDay(net, market, { requests: 5000, facts, seed: "report" });
    expect(report.requests).toBe(5000);
    expect(report.filled).toBe(server.outcomes.filter((o) => o.winningCampaignId).length);
    expect(report.fillRate).toBeCloseTo(report.filled / report.requests, 3);
    expect(report.clicks).toBeLessThanOrEqual(report.impressions);
    expect(report.uniqueMembersReached).toBeLessThanOrEqual(report.impressions);
    expect(report.simulated).toBe(true);
  });

  it("is deterministic: same seed, identical auctions", () => {
    const a = simulateAdDay(net, market, { requests: 1200, facts, seed: "same" });
    const b = simulateAdDay(net, market, { requests: 1200, facts, seed: "same" });
    expect(JSON.stringify(a.report)).toBe(JSON.stringify(b.report));
    expect(JSON.stringify(a.server.charges)).toBe(JSON.stringify(b.server.charges));
  });

  it("fills a meaningful share of requests at this market size", () => {
    const { report } = simulateAdDay(net, market, { requests: 4000, facts, seed: "fill" });
    expect(report.fillRate).toBeGreaterThan(0.2);
    expect(report.impressions).toBeGreaterThan(500);
  });
});

describe("indexing the corpus for the auction", () => {
  it("gives every member the facts targeting reads", () => {
    for (const m of net.members.slice(0, 200)) {
      const f = facts.get(m.id)!;
      expect(f.track).toBe(m.track);
      expect(f.industry).toBe(m.industry);
      expect(f.country).toBe(m.country);
      expect(f.level).toBeGreaterThanOrEqual(0);
      expect(f.skills.size).toBeGreaterThan(0);
    }
  });

  it("reads seniority from the newest job, not the first one", () => {
    const latest = new Map<string, { level: number; startedAt: number }>();
    for (const p of net.positions) {
      const prev = latest.get(p.memberId);
      if (!prev || p.startedAt > prev.startedAt) latest.set(p.memberId, { level: p.level, startedAt: p.startedAt });
    }
    for (const m of net.members.slice(0, 200)) expect(facts.get(m.id)!.level).toBe(latest.get(m.id)!.level);
  });
});
