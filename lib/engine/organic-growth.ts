// Organic Growth Engine — a reusable framework that turns a brand's REAL funnel + channel attribution
// into (1) a content plan aimed at the binding constraint, (2) a winners/losers channel readout, and
// (3) the next organic experiments. Built for ANY brand, not one. No paid-ads assumption; no fabricated
// social metrics — it reasons over the first-party funnel/attribution we actually capture and says
// "needs data" when a signal is missing. Pure + deterministic → cheap + fully testable. The growth crew
// runs this each cycle (drafts → your approval); the rationale lives in docs/PLAYBOOK-organic-growth.md.

import type { FunnelSnapshot } from "./growth";
import type { Channel } from "./attribution";

export type Constraint = "traffic" | "conversion" | "monetization" | "unknown";

// A minimal channel row (structurally compatible with attribution's ChannelStat) so this stays decoupled.
export interface ChannelInput {
  channel: Channel;
  views: number;
  signups: number;
  revenueCents?: number | null;
}

export interface ContentTheme {
  theme: string;
  format: string; // the shape of the content (short video, carousel, UGC, comparison, etc.)
  why: string; // why this theme serves the current constraint
  channels: Channel[]; // where it belongs (organic-first)
}
export interface ContentPlan {
  focus: string; // one line: what this phase is FOR
  themes: ContentTheme[];
  cadence: string; // how often, honestly scaled to a solo operator
}
export interface ChannelReadout {
  channel: Channel;
  verdict: "double-down" | "keep" | "cut" | "needs-data";
  convRate: number | null; // signups / views, null when not enough data
  note: string;
}
export interface OrganicExperiment {
  hypothesis: string;
  channel: Channel;
  metric: "views" | "signups" | "signup_rate" | "paying_customers";
  theme: string;
}
export interface OrganicPlan {
  constraint: Constraint;
  diagnosis: string; // plain-English "here's the bottleneck"
  contentPlan: ContentPlan;
  channels: ChannelReadout[];
  experiments: OrganicExperiment[];
}

// ── Diagnose the binding constraint (organic lens). Honest: "unknown" until the pixel is capturing. ──
// Thresholds are deliberate + documented, not magic: <50 views ⇒ you lack reach (traffic); reach but a
// weak signup rate (<2%) ⇒ conversion; signups but no revenue ⇒ monetization.
export function diagnoseConstraint(f: FunnelSnapshot): Constraint {
  if (f.basis.views === "missing") return "unknown";
  const views = f.views ?? 0;
  const signups = f.signups ?? 0;
  const paying = f.payingCustomers ?? 0;
  if (views < 50) return "traffic";
  const rate = views > 0 ? signups / views : 0;
  if (rate < 0.02) return "conversion";
  if (paying === 0) return "monetization";
  return "conversion"; // once traffic + some revenue exist, keep lifting conversion
}

const DIAGNOSIS: Record<Constraint, string> = {
  traffic: "Not enough reach yet — the top of the funnel is the bottleneck. Priority: awareness content that gets discovered.",
  conversion: "People arrive but few convert — the middle of the funnel is the bottleneck. Priority: trust + proof content.",
  monetization: "You have interest but little revenue — the bottom is the bottleneck. Priority: offer + activation content.",
  unknown: "Not enough captured data yet — instrument first (install the pixel, tag your links), then this sharpens.",
};

// ── Content plan per constraint. Organic-first; channels are suggestions, not the (unsupported) claim
// that we post to them. Generalizes across brands — the THEMES adapt to the bottleneck, not the niche. ──
function contentPlanFor(constraint: Constraint): ContentPlan {
  switch (constraint) {
    case "traffic":
      return {
        focus: "Get discovered — maximize reach.",
        cadence: "High: 1 short-form video/day + 2 posts/week (batch on weekends).",
        themes: [
          { theme: "Education — solve one real problem your buyer Googles", format: "short-form video / carousel", why: "Discoverable, saves + shares drive reach", channels: ["organic-social", "community"] },
          { theme: "Trend-jack — your take on what's hot in the niche", format: "short-form video", why: "Rides existing attention for cheap reach", channels: ["organic-social"] },
          { theme: "Point of view — a strong opinion in your space", format: "post / thread", why: "Opinions travel; they earn follows + community pull", channels: ["organic-social", "community"] },
        ],
      };
    case "conversion":
      return {
        focus: "Turn visitors into signups — build trust.",
        cadence: "Medium: 3-4 posts/week, heavier on proof.",
        themes: [
          { theme: "Proof — real results, before/after, UGC, testimonials", format: "UGC video / review carousel", why: "Trust is the conversion blocker; proof removes it", channels: ["organic-social", "referral"] },
          { theme: "How it works — demystify the product/offer", format: "explainer / demo", why: "Reduces the 'will this work for me' friction", channels: ["organic-social", "email"] },
          { theme: "Objection-busting — answer the top hesitation head-on", format: "FAQ post / video", why: "Names + kills the exact reason people don't sign up", channels: ["community", "email"] },
        ],
      };
    case "monetization":
      return {
        focus: "Convert interest into revenue — make the offer.",
        cadence: "Medium: 3 posts/week + an email nurture sequence.",
        themes: [
          { theme: "Offer — bundles, first-order incentive, clear value", format: "product post / launch", why: "You have interest; a crisp offer converts it", channels: ["email", "organic-social"] },
          { theme: "Urgency/scarcity — real launches, limited runs", format: "launch content", why: "Moves the fence-sitters who already trust you", channels: ["email", "organic-social"] },
          { theme: "Post-purchase — reviews, referrals, reorders", format: "UGC + referral prompt", why: "Turns first buyers into repeat + word-of-mouth", channels: ["referral", "email"] },
        ],
      };
    default:
      return {
        focus: "Instrument, then get discovered.",
        cadence: "Start: 3-4 posts/week while the pixel gathers data.",
        themes: [
          { theme: "Install the pixel + tag your links (utm_source per platform)", format: "setup", why: "Nothing here is real until content→traffic→revenue is measured", channels: ["direct"] },
          { theme: "Education — one problem your buyer has", format: "short-form video", why: "A safe, discoverable starting theme while data builds", channels: ["organic-social"] },
        ],
      };
  }
}

// ── Winners/losers from real channel data. Honest: "needs-data" below a sample floor; never a verdict
// without evidence. Double-down = converts above the median; cut = real traffic but ~0 conversion. ──
const SAMPLE_FLOOR = 30; // views below this → not enough to judge a channel
export function channelReadout(channels: ChannelInput[]): ChannelReadout[] {
  const scored = channels.map((c) => {
    const convRate = c.views >= SAMPLE_FLOOR && c.views > 0 ? c.signups / c.views : null;
    return { ...c, convRate };
  });
  const rated = scored.filter((c) => c.convRate !== null).map((c) => c.convRate as number);
  const median = rated.length ? [...rated].sort((a, b) => a - b)[Math.floor(rated.length / 2)] : 0;
  return scored.map((c) => {
    if (c.convRate === null) {
      return { channel: c.channel, verdict: "needs-data", convRate: null, note: `Only ${c.views} views — not enough to judge yet.` };
    }
    if (c.convRate === 0) {
      return { channel: c.channel, verdict: "cut", convRate: 0, note: "Real traffic but ~0 conversion — stop pouring effort here." };
    }
    if (c.convRate >= median && rated.length > 1) {
      return { channel: c.channel, verdict: "double-down", convRate: c.convRate, note: `Converts at ${(c.convRate * 100).toFixed(1)}% — above your median. Pour effort here.` };
    }
    return { channel: c.channel, verdict: "keep", convRate: c.convRate, note: `Converts at ${(c.convRate * 100).toFixed(1)}% — steady; keep but don't over-invest.` };
  });
}

// ── Next organic experiments — biased to the constraint + the winning channels. ──
function nextExperiments(constraint: Constraint, readout: ChannelReadout[], plan: ContentPlan): OrganicExperiment[] {
  const winners = readout.filter((r) => r.verdict === "double-down").map((r) => r.channel);
  const targets: Channel[] = winners.length ? winners : (plan.themes[0]?.channels ?? ["organic-social"]);
  const metric: OrganicExperiment["metric"] =
    constraint === "traffic" ? "views" : constraint === "monetization" ? "paying_customers" : "signup_rate";
  return plan.themes.slice(0, 2).flatMap((t) =>
    targets.slice(0, 1).map((ch) => ({
      hypothesis: `"${t.theme}" on ${ch} will move ${metric} (the current constraint).`,
      channel: ch,
      metric,
      theme: t.theme,
    })),
  );
}

// The composer: real funnel + channels → a full organic plan. This is what the crew runs each cycle.
export function organicGrowthPlan(input: { funnel: FunnelSnapshot; channels: ChannelInput[] }): OrganicPlan {
  const constraint = diagnoseConstraint(input.funnel);
  const contentPlan = contentPlanFor(constraint);
  const channels = channelReadout(input.channels ?? []);
  const experiments = nextExperiments(constraint, channels, contentPlan);
  return { constraint, diagnosis: DIAGNOSIS[constraint], contentPlan, channels, experiments };
}
