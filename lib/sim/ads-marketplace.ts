// ─────────────────────────────────────────────────────────────────────────────
// TIER 3, PART ONE: THE ADS MARKETPLACE.
//
// This is the piece I said out loud was a separate company rather than a feature, and the founder asked
// for it anyway. So here it is built properly rather than gestured at: advertisers, campaigns with real
// budgets, declarative targeting over the 50,000-member corpus, a generalised second-price auction with
// predicted click-through in the ranking, even-delivery budget pacing, per-member frequency caps, and a
// charge ledger that reconciles to the cent.
//
// WHY IT MATTERS BEYOND THE SIMULATION: an ads auction is the densest correctness problem a social
// network contains. It is the one place where a wrong answer costs someone money on every request, it
// has to be fast under a strict latency budget, and every rule interacts (a frequency cap changes who is
// eligible, which changes the clearing price, which changes the pacing, which changes eligibility on the
// next request). If the machine can build and hold THIS correct, the rest of a professional network is
// downhill. That is what makes it worth building against synthetic data.
//
// HONESTY WALL (load-bearing, [[crack-audit-and-no-fake-proof]]): every object here is `simulated: true`
// and every monetary amount is named `*Micros` on a `SimAd*` type. There is deliberately no field called
// revenue, billing, paid or spend-in-dollars anywhere in this module, so no dashboard, export or report
// can pick a number up from here and render it as money competitor.inc actually made. It has made none.
//
// Pure and deterministic: no I/O, no clock, seeded RNG. Same seed and same corpus ⇒ identical auctions.
// ─────────────────────────────────────────────────────────────────────────────

import { rng, pick, between, pickSome, DAY_MS } from "./rand";
import type { SyntheticSocialNetwork, SimMember } from "./social-network";

/** A micro is one millionth of a currency unit. Ad systems price in micros because a single impression
 *  is worth a fraction of a cent, and floating-point money is how you end up off by a dollar a day. */
export type Micros = number;

export type AdObjective = "awareness" | "engagement" | "hiring" | "lead";
export type PricingModel = "cpm" | "cpc";
export type AdSlot = "feed" | "sidebar" | "message";

export interface SimAdvertiser {
  id: string;
  companyId: string;
  name: string;
  createdAt: number;
  simulated: true;
}

/** Declarative audience selection. Every field is a narrowing filter, and an empty field means "any". */
export interface SimAdTargeting {
  industries?: string[];
  tracks?: string[];
  countries?: string[];
  skills?: string[];
  companySizes?: string[];
  /** Seniority window on the member's career ladder. */
  minLevel?: number;
  maxLevel?: number;
  openToWork?: boolean;
  /** Only reach members seen in the last N days. Advertisers pay for reach, not for dormant rows. */
  activeWithinDays?: number;
}

export interface SimAdCampaign {
  id: string;
  advertiserId: string;
  name: string;
  objective: AdObjective;
  pricingModel: PricingModel;
  /** CPM bid is per thousand impressions; CPC bid is per click. Both in micros. */
  bidMicros: Micros;
  dailyBudgetMicros: Micros;
  totalBudgetMicros: Micros;
  targeting: SimAdTargeting;
  frequencyCapPerDay: number;
  slots: AdSlot[];
  startsAt: number;
  endsAt: number;
  simulated: true;
}

export interface SimAdCreative {
  id: string;
  campaignId: string;
  headline: string;
  body: string;
  ctaLabel: string;
  landingUrl: string;
  simulated: true;
}

export interface SimAdMarket {
  seed: string;
  advertisers: SimAdvertiser[];
  campaigns: SimAdCampaign[];
  creatives: SimAdCreative[];
  simulated: true;
}

/** Why a campaign did not take part. Every filtered candidate is counted, because "no ad was shown" with
 *  no explanation is the single most expensive kind of silence in an ad system. */
export type FilterReason =
  | "outside-flight"
  | "wrong-slot"
  | "targeting-miss"
  | "frequency-capped"
  | "daily-budget-spent"
  | "total-budget-spent"
  | "pacing-throttled";

export interface AuctionRequest {
  requestId: string;
  memberId: string;
  slot: AdSlot;
  at: number;
}

export interface AuctionOutcome {
  requestId: string;
  memberId: string;
  slot: AdSlot;
  at: number;
  winningCampaignId: string | null;
  winningCreativeId: string | null;
  /** Generalised second price: the winner pays what it took to beat the runner-up, never its own bid. */
  clearingPriceMicros: Micros;
  /** What the winner would have paid under a naive first-price auction, kept so the discount is visible. */
  firstPriceMicros: Micros;
  predictedCtr: number;
  candidates: number;
  eligible: number;
  filtered: Partial<Record<FilterReason, number>>;
  simulated: true;
}

export interface SimAdCharge {
  id: string;
  campaignId: string;
  advertiserId: string;
  requestId: string;
  memberId: string;
  event: "impression" | "click";
  amountMicros: Micros;
  at: number;
  simulated: true;
}

// ── the member facts an auction needs, indexed once instead of joined per request ──
export interface MemberAdFacts {
  memberId: string;
  track: string;
  industry: string;
  country: string;
  level: number;
  companySize: string;
  skills: Set<string>;
  openToWork: boolean;
  lastActiveAt: number;
  connectionCount: number;
}

/**
 * Flatten the corpus into the shape an auction reads. Done once for the whole run: doing it per request
 * is the classic way an ad server misses its latency budget.
 */
export function indexMemberFacts(net: SyntheticSocialNetwork): Map<string, MemberAdFacts> {
  // Newest stint wins, decided by start date rather than by array order, so this stays correct if the
  // generator ever emits positions in a different sequence.
  const latest = new Map<string, { level: number; companyId: string; startedAt: number }>();
  for (const p of net.positions) {
    const prev = latest.get(p.memberId);
    if (!prev || p.startedAt > prev.startedAt) latest.set(p.memberId, { level: p.level, companyId: p.companyId, startedAt: p.startedAt });
  }
  const size = new Map(net.companies.map((c) => [c.id, c.size]));
  const skills = new Map<string, Set<string>>();
  for (const s of net.skills) {
    const set = skills.get(s.memberId);
    if (set) set.add(s.skill); else skills.set(s.memberId, new Set([s.skill]));
  }
  const out = new Map<string, MemberAdFacts>();
  for (const m of net.members) {
    const l = latest.get(m.id);
    out.set(m.id, {
      memberId: m.id,
      track: m.track,
      industry: m.industry,
      country: m.country,
      level: l?.level ?? 0,
      companySize: (l && size.get(l.companyId)) ?? "1-10",
      skills: skills.get(m.id) ?? new Set(),
      openToWork: m.openToWork,
      lastActiveAt: m.lastActiveAt,
      connectionCount: m.connectionCount,
    });
  }
  return out;
}

/** Does this member fall inside the campaign's declared audience? Every clause narrows; absent = any. */
export function matchesTargeting(f: MemberAdFacts, t: SimAdTargeting, at: number): boolean {
  if (t.industries?.length && !t.industries.includes(f.industry)) return false;
  if (t.tracks?.length && !t.tracks.includes(f.track)) return false;
  if (t.countries?.length && !t.countries.includes(f.country)) return false;
  if (t.companySizes?.length && !t.companySizes.includes(f.companySize)) return false;
  if (t.minLevel !== undefined && f.level < t.minLevel) return false;
  if (t.maxLevel !== undefined && f.level > t.maxLevel) return false;
  if (t.openToWork !== undefined && f.openToWork !== t.openToWork) return false;
  if (t.skills?.length && !t.skills.some((s) => f.skills.has(s))) return false;
  if (t.activeWithinDays !== undefined && at - f.lastActiveAt > t.activeWithinDays * DAY_MS) return false;
  return true;
}

/**
 * Predicted click-through. Not a learned model, and it does not pretend to be one: it is a deterministic
 * function of how well the ad fits the member, which is enough to make RANKING behave the way a real
 * auction ranks. A campaign that matches tightly outranks a campaign that merely outbids it, and that
 * inversion is the whole reason ad auctions score by expected value rather than by bid.
 */
export function predictCtr(f: MemberAdFacts, c: SimAdCampaign): number {
  let ctr = 0.006; // a plausible baseline for a professional feed
  const t = c.targeting;
  if (t.tracks?.includes(f.track)) ctr += 0.010;
  if (t.industries?.includes(f.industry)) ctr += 0.006;
  if (t.skills?.some((s) => f.skills.has(s))) ctr += 0.008;
  if (c.objective === "hiring" && f.openToWork) ctr += 0.020;
  if (c.objective === "lead" && f.level >= 4) ctr += 0.006;
  if (c.objective === "awareness") ctr -= 0.002;
  // Hubs are jaded: the more a member sees, the less any one thing lands.
  if (f.connectionCount > 300) ctr *= 0.8;
  return Math.min(0.12, Math.max(0.0005, ctr));
}

// ── the ad server ────────────────────────────────────────────────────────────

export interface AdServerOptions {
  seed?: string;
  /** Even delivery: a campaign may not have spent more than this fraction ahead of the clock. */
  pacingSlack?: number;
}

export interface AdServerReport {
  requests: number;
  filled: number;
  fillRate: number;
  impressions: number;
  clicks: number;
  ctr: number;
  chargedMicros: Micros;
  /** Effective cost per thousand impressions actually charged, the number an advertiser checks. */
  effectiveCpmMicros: Micros;
  /** How much the second-price rule saved advertisers against their own bids. */
  discountMicros: Micros;
  uniqueMembersReached: number;
  campaignsExhausted: number;
  filtered: Partial<Record<FilterReason, number>>;
  simulated: true;
}

export interface AdServer {
  auction(req: AuctionRequest): AuctionOutcome;
  charges: SimAdCharge[];
  outcomes: AuctionOutcome[];
  spentTodayMicros(campaignId: string, at: number): Micros;
  spentTotalMicros(campaignId: string): Micros;
  report(): AdServerReport;
}

const dayOf = (at: number): number => Math.floor(at / DAY_MS);

/**
 * Build a stateful ad server over a market. State is deliberately explicit and in-memory: budgets spent
 * per day, budgets spent in total, and impressions per member per campaign per day. In production these
 * are the three counters that must be strongly consistent, and pretending otherwise is how ad systems
 * overspend a budget by 4% every day and call it rounding.
 */
export function createAdServer(market: SimAdMarket, facts: Map<string, MemberAdFacts>, opts: AdServerOptions = {}): AdServer {
  const r = rng(opts.seed ?? `${market.seed}:adserver`);
  const pacingSlack = opts.pacingSlack ?? 0.1;
  const charges: SimAdCharge[] = [];
  const outcomes: AuctionOutcome[] = [];
  const spentDay = new Map<string, Micros>();  // `${campaignId}:${day}`
  const spentTotal = new Map<string, Micros>();
  const shownDay = new Map<string, number>();  // `${campaignId}:${memberId}:${day}`
  const creativesByCampaign = new Map<string, SimAdCreative[]>();
  for (const cr of market.creatives) {
    const list = creativesByCampaign.get(cr.campaignId);
    if (list) list.push(cr); else creativesByCampaign.set(cr.campaignId, [cr]);
  }
  const advertiserOf = new Map(market.campaigns.map((c) => [c.id, c.advertiserId]));
  const totalFiltered: Partial<Record<FilterReason, number>> = {};
  const reached = new Set<string>();

  const spentTodayMicros = (id: string, at: number): Micros => spentDay.get(`${id}:${dayOf(at)}`) ?? 0;
  const spentTotalMicros = (id: string): Micros => spentTotal.get(id) ?? 0;

  function charge(c: SimAdCampaign, req: AuctionRequest, event: "impression" | "click", raw: Micros): void {
    // Micros are INTEGERS. That is the entire reason ad systems price in millionths: a fractional charge
    // is a rounding error that compounds across millions of impressions until the invoice and the ledger
    // disagree by real money. Rounding at the single point of charge keeps the books exactly closeable.
    const amountMicros = Math.round(raw);
    if (amountMicros <= 0) return;
    const dk = `${c.id}:${dayOf(req.at)}`;
    spentDay.set(dk, (spentDay.get(dk) ?? 0) + amountMicros);
    spentTotal.set(c.id, (spentTotal.get(c.id) ?? 0) + amountMicros);
    charges.push({
      id: `chg_${charges.length}`,
      campaignId: c.id,
      advertiserId: advertiserOf.get(c.id) ?? "unknown",
      requestId: req.requestId,
      memberId: req.memberId,
      event,
      amountMicros,
      at: req.at,
      simulated: true,
    });
  }

  function auction(req: AuctionRequest): AuctionOutcome {
    const f = facts.get(req.memberId);
    const filtered: Partial<Record<FilterReason, number>> = {};
    const drop = (why: FilterReason): void => {
      filtered[why] = (filtered[why] ?? 0) + 1;
      totalFiltered[why] = (totalFiltered[why] ?? 0) + 1;
    };
    // Expected value per single impression, which is the only unit two pricing models can be compared in.
    const ranked: { c: SimAdCampaign; ctr: number; ecpiMicros: Micros }[] = [];

    for (const c of market.campaigns) {
      if (req.at < c.startsAt || req.at > c.endsAt) { drop("outside-flight"); continue; }
      if (!c.slots.includes(req.slot)) { drop("wrong-slot"); continue; }
      if (!f || !matchesTargeting(f, c.targeting, req.at)) { drop("targeting-miss"); continue; }
      if ((shownDay.get(`${c.id}:${req.memberId}:${dayOf(req.at)}`) ?? 0) >= c.frequencyCapPerDay) { drop("frequency-capped"); continue; }
      if (spentTotalMicros(c.id) >= c.totalBudgetMicros) { drop("total-budget-spent"); continue; }
      const spentToday = spentTodayMicros(c.id, req.at);
      if (spentToday >= c.dailyBudgetMicros) { drop("daily-budget-spent"); continue; }
      // Even delivery: a campaign that has burned 90% of the day's budget by lunchtime sits out until
      // the clock catches up. Without this, every campaign spends out by 10am and the auction is empty
      // for the rest of the day, which is exactly what advertisers complain about.
      const elapsed = (req.at % DAY_MS) / DAY_MS;
      if (spentToday > c.dailyBudgetMicros * (elapsed + pacingSlack)) { drop("pacing-throttled"); continue; }

      const ctr = predictCtr(f, c);
      const ecpiMicros = c.pricingModel === "cpm" ? c.bidMicros / 1000 : c.bidMicros * ctr;
      ranked.push({ c, ctr, ecpiMicros });
    }

    const candidates = market.campaigns.length;
    if (!ranked.length) {
      const miss: AuctionOutcome = {
        requestId: req.requestId, memberId: req.memberId, slot: req.slot, at: req.at,
        winningCampaignId: null, winningCreativeId: null,
        clearingPriceMicros: 0, firstPriceMicros: 0, predictedCtr: 0,
        candidates, eligible: 0, filtered, simulated: true,
      };
      outcomes.push(miss);
      return miss;
    }

    // Rank by expected value, tie-break on id so the result never depends on array order.
    ranked.sort((a, b) => (b.ecpiMicros - a.ecpiMicros) || a.c.id.localeCompare(b.c.id));
    const win = ranked[0];
    const runnerUpEcpi = ranked.length > 1 ? ranked[1].ecpiMicros : 0;

    // GENERALISED SECOND PRICE. The winner pays the smallest amount that would still have won, plus one
    // micro, and never more than its own bid. This is the rule that makes bidding your true value safe,
    // and getting it wrong (charging first price) silently overcharges every advertiser on the platform.
    const clearingEcpi = Math.min(win.ecpiMicros, runnerUpEcpi + 1);
    const firstPriceMicros = Math.round(win.c.pricingModel === "cpm" ? win.ecpiMicros * 1000 : win.c.bidMicros);
    const clearingPriceMicros = Math.round(win.c.pricingModel === "cpm"
      ? clearingEcpi * 1000                                  // back to a CPM the advertiser can read
      : Math.min(win.c.bidMicros, clearingEcpi / win.ctr));  // back to a per-click price

    const creatives = creativesByCampaign.get(win.c.id) ?? [];
    const creative = creatives.length ? creatives[Math.floor(r() * creatives.length)] : null;

    // Serve it: the impression is recorded whatever the pricing model, the charge depends on it.
    const fk = `${win.c.id}:${req.memberId}:${dayOf(req.at)}`;
    shownDay.set(fk, (shownDay.get(fk) ?? 0) + 1);
    reached.add(req.memberId);
    if (win.c.pricingModel === "cpm") charge(win.c, req, "impression", clearingEcpi);

    const outcome: AuctionOutcome = {
      requestId: req.requestId, memberId: req.memberId, slot: req.slot, at: req.at,
      winningCampaignId: win.c.id,
      winningCreativeId: creative ? creative.id : null,
      clearingPriceMicros,
      firstPriceMicros,
      predictedCtr: win.ctr,
      candidates,
      eligible: ranked.length,
      filtered,
      simulated: true,
    };
    outcomes.push(outcome);

    // Did they click? CPC campaigns pay here and only here. A CPM click is still recorded, at zero, so
    // click-through can be measured for every campaign rather than only the ones that pay per click.
    if (r() < win.ctr) {
      if (win.c.pricingModel === "cpc") {
        charge(win.c, req, "click", clearingPriceMicros);
      } else {
        charges.push({
          id: `chg_${charges.length}`,
          campaignId: win.c.id,
          advertiserId: advertiserOf.get(win.c.id) ?? "unknown",
          requestId: req.requestId,
          memberId: req.memberId,
          event: "click",
          amountMicros: 0,
          at: req.at,
          simulated: true,
        });
      }
    }

    return outcome;
  }

  function report(): AdServerReport {
    const filled = outcomes.filter((o) => o.winningCampaignId !== null).length;
    const impressions = filled;
    const clicks = charges.filter((c) => c.event === "click").length;
    const chargedMicros = charges.reduce((a, c) => a + c.amountMicros, 0);
    const discountMicros = outcomes.reduce((a, o) => {
      if (o.winningCampaignId === null) return a;
      return a + Math.max(0, o.firstPriceMicros - o.clearingPriceMicros);
    }, 0);
    return {
      requests: outcomes.length,
      filled,
      fillRate: outcomes.length ? Math.round((filled / outcomes.length) * 1000) / 1000 : 0,
      impressions,
      clicks,
      ctr: impressions ? Math.round((clicks / impressions) * 10_000) / 10_000 : 0,
      chargedMicros,
      effectiveCpmMicros: impressions ? Math.round((chargedMicros / impressions) * 1000) : 0,
      discountMicros,
      uniqueMembersReached: reached.size,
      campaignsExhausted: market.campaigns.filter((c) => spentTotalMicros(c.id) >= c.totalBudgetMicros).length,
      filtered: totalFiltered,
      simulated: true,
    };
  }

  return { auction, charges, outcomes, spentTodayMicros, spentTotalMicros, report };
}

// ── an invoice, so the ledger is provably closed ─────────────────────────────

export interface SimAdInvoiceLine {
  campaignId: string;
  campaignName: string;
  impressions: number;
  clicks: number;
  amountMicros: Micros;
}

export interface SimAdInvoice {
  advertiserId: string;
  advertiserName: string;
  periodStart: number;
  periodEnd: number;
  lines: SimAdInvoiceLine[];
  totalMicros: Micros;
  simulated: true;
  /** Printed on every invoice so it can never be mistaken for a document about real money. */
  notice: string;
}

/**
 * Roll the charge ledger up per advertiser. The invariant that matters: the sum of every invoice equals
 * the sum of every charge, exactly, in integer micros. An ad system that cannot close its own books is
 * not an ad system, and this is the assertion the test suite holds it to.
 */
export function buildInvoices(market: SimAdMarket, charges: SimAdCharge[], periodStart: number, periodEnd: number): SimAdInvoice[] {
  const campaignName = new Map(market.campaigns.map((c) => [c.id, c.name]));
  const byAdvertiser = new Map<string, Map<string, SimAdInvoiceLine>>();
  for (const ch of charges) {
    if (ch.at < periodStart || ch.at > periodEnd) continue;
    const lines = byAdvertiser.get(ch.advertiserId) ?? new Map<string, SimAdInvoiceLine>();
    const line = lines.get(ch.campaignId) ?? {
      campaignId: ch.campaignId,
      campaignName: campaignName.get(ch.campaignId) ?? ch.campaignId,
      impressions: 0, clicks: 0, amountMicros: 0,
    };
    if (ch.event === "impression") line.impressions++; else line.clicks++;
    line.amountMicros += ch.amountMicros;
    lines.set(ch.campaignId, line);
    byAdvertiser.set(ch.advertiserId, lines);
  }
  const nameOf = new Map(market.advertisers.map((a) => [a.id, a.name]));
  return [...byAdvertiser.entries()]
    .map(([advertiserId, lines]) => ({
      advertiserId,
      advertiserName: nameOf.get(advertiserId) ?? advertiserId,
      periodStart,
      periodEnd,
      lines: [...lines.values()].sort((a, b) => a.campaignId.localeCompare(b.campaignId)),
      totalMicros: [...lines.values()].reduce((a, l) => a + l.amountMicros, 0),
      simulated: true as const,
      notice: "SIMULATED. No money moved. This document describes synthetic activity against synthetic members and may never be reported as revenue.",
    }))
    .sort((a, b) => a.advertiserId.localeCompare(b.advertiserId));
}

// ── generating a market to run against ───────────────────────────────────────

const CAMPAIGN_THEMES: readonly (readonly [AdObjective, string, string, string])[] = [
  ["hiring", "We are hiring", "Join a team that ships every week.", "See open roles"],
  ["lead", "Cut your close from 12 days to 4", "A finance workflow built for teams that close monthly.", "Book a walkthrough"],
  ["awareness", "The infrastructure layer nobody talks about", "Quietly running things you already depend on.", "Learn more"],
  ["engagement", "Read the teardown", "Twelve months of migration notes, written down honestly.", "Read it"],
  ["lead", "Stop paying for eleven tools", "One system for the work between sales and delivery.", "Compare plans"],
  ["hiring", "Engineering, remote-first", "Small team, long tenure, real ownership.", "Apply"],
  ["awareness", "Built for the middle of the funnel", "Where most software stops being useful.", "See how"],
  ["engagement", "Our security review, in public", "Every question a procurement team asks, answered.", "Read the doc"],
];

export interface MarketOptions {
  advertisers?: number;
  campaignsPerAdvertiser?: number;
  now?: number;
  /** Impressions one campaign can expect in a day on this corpus. Budgets are sized against it. */
  expectedDailyImpressions?: number;
}

/**
 * Build a plausible market against a corpus. Bids are drawn wide on purpose: an auction where everyone
 * bids the same never exercises the ranking, and an auction where budgets never run out never exercises
 * pacing. The interesting behaviour lives in the spread.
 */
export function buildAdMarket(net: SyntheticSocialNetwork, seed = "competitor-ads-v1", opts: MarketOptions = {}): SimAdMarket {
  const r = rng(seed);
  const now = opts.now ?? net.now;
  const advertiserCount = Math.max(1, opts.advertisers ?? Math.min(60, Math.max(8, Math.round(net.companies.length / 12))));
  const perAdvertiser = Math.max(1, opts.campaignsPerAdvertiser ?? 3);

  const industries = [...new Set(net.members.map((m) => m.industry))];
  const trackNames = [...new Set(net.members.map((m) => m.track))];
  const countries = [...new Set(net.members.map((m) => m.country))];
  const skillNames = [...new Set(net.skills.slice(0, 5000).map((s) => s.skill))];
  const sizes = [...new Set(net.companies.map((c) => c.size))];

  // Budgets have to be ANCHORED TO THE TRAFFIC or none of them ever binds. The first version drew a flat
  // range in currency units and produced a market where the largest spender used 1% of its budget: the
  // pacing and exhaustion paths, which are exactly the ones most likely to be wrong, never ran once.
  // An advertiser sizes a budget against the audience it is buying, so the generator does the same.
  const campaignCount = advertiserCount * perAdvertiser;
  const impressionsPerCampaign = opts.expectedDailyImpressions
    ?? Math.max(40, Math.round((net.members.length * 3 * 0.2) / Math.max(1, campaignCount)));

  const advertisers: SimAdvertiser[] = [];
  const campaigns: SimAdCampaign[] = [];
  const creatives: SimAdCreative[] = [];

  for (let i = 0; i < advertiserCount; i++) {
    const company = net.companies[Math.floor(r() * net.companies.length)];
    advertisers.push({
      id: `adv_${i}`,
      companyId: company.id,
      name: company.name,
      createdAt: between(r, now - 400 * DAY_MS, now - 30 * DAY_MS),
      simulated: true,
    });

    for (let k = 0; k < perAdvertiser; k++) {
      const [objective, headline, body, cta] = pick(r, CAMPAIGN_THEMES);
      const pricingModel: PricingModel = r() < 0.5 ? "cpm" : "cpc";
      // CPM bids sit in single-digit currency units per thousand; CPC bids in single-digit units per click.
      const bidMicros = pricingModel === "cpm" ? between(r, 2_000_000, 18_000_000) : between(r, 800_000, 9_000_000);
      // What a day of this campaign costs if it wins everything it could, then a funding multiple around
      // it: a third are deliberately underfunded and will pace and exhaust, most are about right, and a
      // fifth are whales that never feel a constraint. That spread is what makes the market interesting.
      const perImpressionMicros = pricingModel === "cpm" ? bidMicros / 1000 : bidMicros * 0.012;
      const fairDailyMicros = perImpressionMicros * impressionsPerCampaign;
      const funding = r() < 0.35 ? 0.12 + r() * 0.4 : r() < 0.8 ? 0.8 + r() * 1.4 : 3 + r() * 8;
      // A daily budget below the price of a single click is incoherent: one click would overshoot it
      // several times over and the budget would mean nothing. Real platforms refuse that combination, so
      // the floor is two clicks for CPC and twenty impressions for CPM.
      const floorMicros = pricingModel === "cpc" ? bidMicros * 2 : perImpressionMicros * 20;
      const dailyBudgetMicros = Math.max(Math.round(floorMicros), Math.round(fairDailyMicros * funding));
      // Flights start at least three days back, so a simulated "yesterday" mostly falls inside them and
      // the run measures the auction rather than measuring campaigns that had not launched yet.
      const startsAt = between(r, now - 60 * DAY_MS, now - 3 * DAY_MS);
      const id = `cmp_${campaigns.length}`;
      const targeting: SimAdTargeting = {};
      // Layer filters on: a few campaigns blanket everyone, most narrow hard. That spread is what makes
      // the eligible set differ from request to request, which is what an auction has to survive.
      if (r() < 0.7) targeting.tracks = pickSome(r, trackNames, between(r, 1, 3));
      if (r() < 0.5) targeting.industries = pickSome(r, industries, between(r, 1, 3));
      if (r() < 0.35) targeting.countries = pickSome(r, countries, between(r, 1, 4));
      if (r() < 0.4) targeting.skills = pickSome(r, skillNames, between(r, 1, 4));
      if (r() < 0.25) targeting.companySizes = pickSome(r, sizes, between(r, 1, 3));
      if (r() < 0.3) { targeting.minLevel = between(r, 0, 3); targeting.maxLevel = targeting.minLevel + between(r, 1, 4); }
      if (objective === "hiring" && r() < 0.6) targeting.openToWork = true;
      if (r() < 0.5) targeting.activeWithinDays = pick(r, [7, 30, 90, 180]);

      campaigns.push({
        id,
        advertiserId: `adv_${i}`,
        name: `${headline} (${objective})`,
        objective,
        pricingModel,
        bidMicros,
        dailyBudgetMicros,
        totalBudgetMicros: dailyBudgetMicros * between(r, 3, 30),
        targeting,
        frequencyCapPerDay: between(r, 1, 4),
        slots: r() < 0.6 ? ["feed"] : r() < 0.85 ? ["feed", "sidebar"] : ["feed", "sidebar", "message"],
        startsAt,
        endsAt: startsAt + between(r, 14, 120) * DAY_MS,
        simulated: true,
      });
      creatives.push({
        id: `crv_${creatives.length}`,
        campaignId: id,
        headline,
        body,
        ctaLabel: cta,
        landingUrl: `https://${advertisers[i].name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.test/offer`,
        simulated: true,
      });
    }
  }

  return { seed, advertisers, campaigns, creatives, simulated: true };
}

/**
 * Drive a day of traffic through the server. Requests are weighted by connection count, because active
 * hubs generate far more page views than the tail, and an auction tested on uniform traffic will look
 * healthy right up until it meets a real distribution.
 */
export function simulateAdDay(
  net: SyntheticSocialNetwork,
  market: SimAdMarket,
  opts: { requests?: number; seed?: string; dayStart?: number; facts?: Map<string, MemberAdFacts> } = {},
): { server: AdServer; report: AdServerReport } {
  const r = rng(opts.seed ?? `${market.seed}:traffic`);
  const facts = opts.facts ?? indexMemberFacts(net);
  const server = createAdServer(market, facts, { seed: `${market.seed}:server` });
  const requests = opts.requests ?? 20_000;
  const dayStart = opts.dayStart ?? net.now - DAY_MS;

  // A weighted bag: a member appears once per ten connections plus once for existing, so hubs dominate
  // the traffic mix the way they dominate a real feed.
  const bag: SimMember[] = [];
  for (const m of net.members) {
    bag.push(m);
    for (let k = 0; k < Math.floor(m.connectionCount / 10); k++) bag.push(m);
  }

  // Build the day's traffic, then serve it IN TIME ORDER. Pacing, frequency caps and budget exhaustion
  // are all stateful in time: feeding a server requests that jump from 4pm back to 9am makes every one
  // of those mechanisms read noise. Real traffic arrives sorted, so the simulation sorts.
  const pending: AuctionRequest[] = [];
  for (let i = 0; i < requests; i++) {
    const m = bag[Math.floor(r() * bag.length)];
    // Traffic follows the working day rather than arriving uniformly, so pacing has something to pace.
    const hour = Math.min(23, Math.max(0, Math.round(9 + (r() - 0.5) * 14)));
    pending.push({
      requestId: `req_${i}`,
      memberId: m.id,
      slot: r() < 0.7 ? "feed" : r() < 0.93 ? "sidebar" : "message",
      at: dayStart + hour * 3_600_000 + Math.floor(r() * 3_600_000),
    });
  }
  pending.sort((a, b) => a.at - b.at || a.requestId.localeCompare(b.requestId));
  for (const req of pending) server.auction(req);
  return { server, report: server.report() };
}
