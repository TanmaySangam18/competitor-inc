// GTM-strategist module (P1 of docs/BLOND-GTM-AGENT.md) — encodes Sam Blond's PUBLIC, sourced GTM
// frameworks into a deterministic, model-free plan so it works WITHOUT an API key (same posture as
// simulatedAudit/the simulated engine; a model later makes the copy sharper). Nothing here impersonates
// anyone or fabricates results — it proposes a plan; sending/spending stays human-approved.
//
// Sources (see scratchpad/sam-blond-brief.md for the full sourced brief):
//  - Concentric-circles outbound + "do things that don't scale": 20VC E1139, SaaStr "9 Easy Sales Concepts"
//  - Demand is THE bottleneck ("focus on demand until you have too much"; track new opps/week): 20VC, SaaStr
//  - Lead-source hierarchy referrals(~3x) > inbound > outbound > closed-lost: SaaStr Podcast #184
//  - Obsess over implementation (first 30 days predict churn): SaaStr "9 Easy Sales Concepts" #9

import type { Activity, Company } from "./types";

export interface ICPTier {
  tier: string;
  who: string;
  trigger: string;
  why: string;
  priority: number; // 1 = start here
}

export interface ChannelRank {
  channel: string;
  source: "referral" | "inbound" | "outbound" | "closed-lost";
  weight: number; // relative conversion strength (referral anchored at ~3x average)
  note: string;
}

export interface BottleneckDiagnosis {
  bottleneck: "demand" | "conversion";
  signal: string;
  recommendation: string;
  principle: string;
  source: string;
}

export interface GTMPlan {
  northStar: string;
  icp: ICPTier[];
  channels: ChannelRank[];
  bottleneck: BottleneckDiagnosis;
}

const SRC_CONCENTRIC = "Sam Blond, 20VC E1139 / SaaStr '9 Easy Sales Concepts'";
const SRC_DEMAND = "Sam Blond, 20VC E1139 — 'demand is the bottleneck, not conversion'";
const SRC_SOURCES = "Sam Blond, SaaStr Podcast #184 — lead-source hierarchy";

// The concentric-circles targeting model: start inside your trust graph, move outward only as brand
// recognition grows. "Do not blast people who have likely never heard of you." Each tier is customized
// to THIS company but stays deterministic (no model needed).
export function buildICP(company: Company): ICPTier[] {
  const idea = (company.idea || "this product").trim();
  const noun = company.name || "your product";
  return [
    {
      tier: "Personal network",
      who: "People you already know who have the exact problem (ex-colleagues, classmates, friends-of-friends).",
      trigger: "You can name them. Warm intro, zero cold.",
      why: "Referrals/warm contacts convert ~3x the average — start where trust already exists.",
      priority: 1,
    },
    {
      tier: "Investor / advisor network",
      who: "Anyone backing or advising you, and their portfolio/contacts who fit.",
      trigger: "A one-line ask: 'who do you know with [the problem]?'",
      why: "Borrowed trust. One intro from a respected name beats 100 cold emails.",
      priority: 2,
    },
    {
      tier: "Employee / peer network",
      who: "Your (and any teammate's) former coworkers and communities in the space.",
      trigger: "Make outreach everyone's job — each person mines their own graph.",
      why: "Each layer out from your direct network inserts risk; stay close first.",
      priority: 3,
    },
    {
      tier: "Customer referrals",
      who: "Every happy early user → ask for one intro to someone with the same pain.",
      trigger: "Right after a win / activation moment.",
      why: "Your happy customers are an army of potential salespeople — the compounding loop.",
      priority: 4,
    },
    {
      tier: "Trigger-based cold (last)",
      who: `Accounts with a relevant event who fit ${noun} — e.g. recently funded, hiring for it, or publicly complaining about ${idea}.`,
      trigger: "A fresh, specific trigger — never an untargeted blast.",
      why: "Only go cold once there's brand recognition and a real trigger; trigger emails reply ~20% vs ~1% for blasts.",
      priority: 5,
    },
  ];
}

// Rank the channels by Blond's source-quality hierarchy. Weights are RELATIVE conversion strength with
// referrals anchored at ~3x average (his stated number); they are a prioritization signal, NOT a
// fabricated forecast.
export function rankChannels(): ChannelRank[] {
  return [
    { channel: "Warm intros & referrals", source: "referral", weight: 3.0, note: "Highest conversion. Ask every happy user + your network for one intro." },
    { channel: "Inbound (SEO 'alternative'/use-case pages, honest community posts)", source: "inbound", weight: 1.5, note: "Compounds; top channel for a no-audience maker's first 1,000 customers." },
    { channel: "Trigger-based outbound (one pain, one CTA, 3-touch)", source: "outbound", weight: 1.0, note: "Works when targeted + creative — not spray-and-pray. ~80% of Brex revenue was outbound done well." },
    { channel: "Closed-lost / no-reply re-engagement", source: "closed-lost", weight: 0.6, note: "Cheap to revisit; lowest yield. Do after the above." },
  ];
}

// Diagnose the real constraint. Blond: it's "almost always demand, not conversion" — and for a new or
// just-imported company with little activity, demand IS the honest answer. Looks at the actual activity
// log for demand-creation signals vs conversion signals before deciding.
export function diagnoseBottleneck(company: Company, activities: Activity[] = []): BottleneckDiagnosis {
  const text = activities.map((a) => `${a.action} ${a.meta ?? ""}`).join(" ").toLowerCase();
  const demandSignals = (text.match(/lead|outreach|prospect|opportunit|posted|seo|campaign|referral|intro/g) || []).length;
  const conversionSignals = (text.match(/signup|sign-up|demo|trial|convert|checkout|paid|customer/g) || []).length;

  // A young company (few nights / little demand work) is demand-constrained by default — the most common
  // and most-missed diagnosis. Only call "conversion" when there's clear demand but weak downstream.
  const earlyStage = company.night < 3 || demandSignals < 3;

  if (earlyStage || demandSignals <= conversionSignals) {
    return {
      bottleneck: "demand",
      signal: earlyStage
        ? "Early stage with little demand-creation activity yet."
        : `Only ${demandSignals} demand-creation signals in the log so far.`,
      recommendation: "Pour effort into creating new opportunities (network intros first, then trigger-based outbound). Don't optimize conversion yet.",
      principle: "Demand is the bottleneck, not conversion — focus on demand until you have too much.",
      source: SRC_DEMAND,
    };
  }
  return {
    bottleneck: "conversion",
    signal: `Healthy demand activity (${demandSignals} signals) but comparatively few conversions (${conversionSignals}).`,
    recommendation: "Demand is flowing — now tighten the funnel: be prescriptive about how to buy, use the presumptive close, obsess over the first-30-day implementation.",
    principle: "Once demand is abundant, conversion + implementation become the lever (first 30 days predict churn).",
    source: "Sam Blond, SaaStr '9 Easy Sales Concepts' (#6 prescriptive, #7 presumptive close, #9 implementation)",
  };
}

export function buildGTMPlan(company: Company, activities: Activity[] = []): GTMPlan {
  return {
    northStar: "New opportunities created / week",
    icp: buildICP(company),
    channels: rankChannels(),
    bottleneck: diagnoseBottleneck(company, activities),
  };
}

