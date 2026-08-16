// B1 — Growth Analyst ("Gauge"). Makes Sam Blond's North Star measurable: **new opportunities created
// per shift** (his leading indicator — "focus on demand until you have too much"). Reads the real
// activity log (no fabricated data), reuses the bottleneck diagnosis from gtm.ts, and produces a plain
// "what's the constraint + what to do this week" brief.
//
// Data note: our engine logs by NIGHT (shift), not calendar date, so we report per-shift + a rolling
// average rather than inventing calendar weeks. Honest to the data we actually have.

import type { Activity, Company } from "@/lib/core/types";
import { diagnoseBottleneck, type BottleneckDiagnosis } from "./gtm";

export interface NightPoint {
  night: number;
  opportunities: number;
}

export interface ChannelTally {
  channel: string;
  count: number;
}

export interface AnalystReport {
  northStar: string;
  totalOpportunities: number;
  perNight: NightPoint[];
  recentAvg: number; // avg opportunities/shift over the last up-to-3 shifts
  trend: "up" | "flat" | "down";
  conversionSignals: number;
  byChannel: ChannelTally[];
  bottleneck: BottleneckDiagnosis;
  brief: string;
}

const DEMAND_RE = /lead|outreach|prospect|opportunit|posted|seo|campaign|referral|intro|dm|cold email|community/i;
const CONV_RE = /signup|sign-up|demo|trial|convert|checkout|paid|customer|booked/i;

// Which channel a demand activity belongs to (best-effort, from the action/meta text).
function channelOf(text: string): string | null {
  const t = text.toLowerCase();
  if (/referral|intro|word of mouth/.test(t)) return "Referrals & intros";
  if (/seo|programmatic|search|blog|content/.test(t)) return "SEO / content";
  if (/reddit|indie hackers|community|forum|show hn|hacker news/.test(t)) return "Community posts";
  if (/twitter|x post|linkedin|social|bluesky|mastodon/.test(t)) return "Social";
  if (/cold email|outreach|dm|prospect|lead/.test(t)) return "Outbound";
  if (/ad|ppc|campaign/.test(t)) return "Ads";
  return null;
}

export function analyze(company: Company, activities: Activity[]): AnalystReport {
  const nights = Math.max(company.night, 0);
  const perNight: NightPoint[] = [];
  for (let n = 1; n <= nights; n++) {
    const opps = activities.filter((a) => a.night === n && DEMAND_RE.test(`${a.action} ${a.meta ?? ""}`)).length;
    perNight.push({ night: n, opportunities: opps });
  }
  const totalOpportunities = perNight.reduce((t, p) => t + p.opportunities, 0);

  const lastN = perNight.slice(-3);
  const recentAvg = lastN.length ? Math.round((lastN.reduce((t, p) => t + p.opportunities, 0) / lastN.length) * 10) / 10 : 0;

  // Trend: compare the last shift to the average of the prior ones.
  let trend: "up" | "flat" | "down" = "flat";
  if (perNight.length >= 2) {
    const last = perNight[perNight.length - 1].opportunities;
    const priorAvg = perNight.slice(0, -1).reduce((t, p) => t + p.opportunities, 0) / (perNight.length - 1);
    if (last > priorAvg + 0.5) trend = "up";
    else if (last < priorAvg - 0.5) trend = "down";
  }

  const conversionSignals = activities.filter((a) => CONV_RE.test(`${a.action} ${a.meta ?? ""}`)).length;

  const counts = new Map<string, number>();
  for (const a of activities) {
    const ch = channelOf(`${a.action} ${a.meta ?? ""}`);
    if (ch) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  }
  const byChannel = Array.from(counts.entries())
    .map(([channel, count]) => ({ channel, count }))
    .sort((a, b) => b.count - a.count);

  const bottleneck = diagnoseBottleneck(company, activities);

  const brief =
    bottleneck.bottleneck === "demand"
      ? `You've created ${totalOpportunities} opportunit${totalOpportunities === 1 ? "y" : "ies"} so far (${recentAvg}/shift recently). The constraint is demand — ${bottleneck.recommendation}`
      : `Demand is flowing (${totalOpportunities} opportunities, ${recentAvg}/shift). ${bottleneck.recommendation}`;

  return {
    northStar: "New opportunities created / shift",
    totalOpportunities,
    perNight,
    recentAvg,
    trend,
    conversionSignals,
    byChannel,
    bottleneck,
    brief,
  };
}
