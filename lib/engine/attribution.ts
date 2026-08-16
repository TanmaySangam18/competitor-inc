// Marketing attribution — the reporting view of the Revenue Loop's own data. We already capture a
// `source` on every event (utm/ref) and a real amount on every Polar revenue row; attribution is the
// per-channel rollup + honest verdicts on top. It is NOT a separate analytics product bolted on — it's
// the proof layer that answers "which marketing made money," which is exactly competitor.inc's moat
// (rivals govern spend/process; we govern outcome).
//
// THE HONESTY LINE (same invariant as growth.ts): a number only claims a basis it earned.
//  - views/signups per channel  → REAL (from our first-party pixel)
//  - revenue/ROAS per channel   → only REAL when spend is connected AND revenue is channel-attributed;
//    otherwise "missing" and we say so. We NEVER invent a ROAS to make a slide look good.

export type Channel = "paid-search" | "paid-social" | "organic-social" | "community" | "referral" | "email" | "direct" | "other";

export interface EventRow {
  type: "view" | "signup" | "purchase";
  source: string | null;
  createdAt?: string | number; // ISO or epoch — only needed for the time-series rollup
}

// Campaign rides inside `source` as a `/c:<campaign>` suffix (see TrackBeacon.beaconSource) — no
// schema change. parseCampaign extracts it; classifyChannel ignores it (its patterns match the prefix).
export function parseCampaign(source: string | null | undefined): string | null {
  const m = (source || "").match(/\/c:([a-z0-9_-]{1,40})/i);
  return m ? m[1].toLowerCase() : null;
}

// Optional inputs that only exist once the founder connects ad accounts (Phase 2, approval-gated).
export interface SpendInput {
  channel: Channel;
  spendCents: number;
  revenueCents?: number; // channel-attributed revenue (from CAPI/connected pixel); omit if unknown
}

export type Verdict = "scale" | "optimize" | "pause" | "watch";
export type Basis = "real" | "estimate" | "missing";

export interface ChannelStat {
  channel: Channel;
  views: number;
  signups: number;
  signupRate: number; // 0..1, real (both legs from our pixel)
  spendCents: number | null; // null until an ad account is connected
  revenueCents: number | null; // null unless channel-attributed revenue exists
  roas: number | null; // revenue / spend; null unless both are real
  basis: { traffic: Basis; money: Basis };
  verdict: Verdict;
  why: string;
}

// Group a raw utm/ref source string into a channel. Deterministic; unknown → "other"; empty → "direct".
export function classifyChannel(source: string | null | undefined): Channel {
  const s = (source || "").toLowerCase().trim();
  if (!s) return "direct";
  if (/google.*cpc|bing.*cpc|=cpc|paid.?search|sem\b|adwords|gclid/.test(s)) return "paid-search";
  if (/facebook.*(cpc|ad)|fb.*ad|meta.*ad|instagram.*ad|ig.*ad|tiktok.*ad|paid.?social/.test(s)) return "paid-social";
  if (/twitter|x\.com|t\.co|linkedin|mastodon|bluesky|bsky|instagram|\big\b|threads|tiktok/.test(s)) return "organic-social";
  if (/reddit|hacker.?news|news\.ycombinator|\bhn\b|indiehackers|producthunt|discord|slack|forum/.test(s)) return "community";
  if (/mail|email|newsletter|resend|klaviyo|\bcrm\b/.test(s)) return "email";
  if (/ref=|referr|partner|affiliate/.test(s)) return "referral";
  if (/direct|none|\(none\)/.test(s)) return "direct";
  return "other";
}

const CHANNEL_LABEL: Record<Channel, string> = {
  "paid-search": "Paid search",
  "paid-social": "Paid social",
  "organic-social": "Organic social",
  community: "Community",
  referral: "Referral",
  email: "Email",
  direct: "Direct",
  other: "Other",
};
// The core rollup. Traffic (views→signups per channel) is always real from our pixel. Money legs
// (revenue/ROAS) fill in only from a connected ad account; absent that they stay null with basis
// "missing" — and the verdict falls back to conversion+volume signals, which ARE real.
export function attributeChannels(events: EventRow[], spend: SpendInput[] = []): ChannelStat[] {
  const byChannel = new Map<Channel, { views: number; signups: number }>();
  for (const e of events) {
    const c = classifyChannel(e.source);
    const agg = byChannel.get(c) ?? { views: 0, signups: 0 };
    if (e.type === "view") agg.views++;
    else if (e.type === "signup") agg.signups++;
    byChannel.set(c, agg);
  }
  const spendByChannel = new Map<Channel, SpendInput>();
  for (const s of spend) spendByChannel.set(s.channel, s);
  for (const s of spend) if (!byChannel.has(s.channel)) byChannel.set(s.channel, { views: 0, signups: 0 });

  // Median signup rate across channels with enough traffic — the bar a channel is judged against.
  // True median (average the two middle values for an even count) so a channel can actually sit above
  // or below it; picking one side would let a channel be its own unbeatable bar in small samples.
  const rates = [...byChannel.entries()].filter(([, a]) => a.views >= 20).map(([, a]) => a.signups / a.views).sort((x, y) => x - y);
  const mid = Math.floor(rates.length / 2);
  const medianRate = rates.length === 0 ? 0.02 : rates.length % 2 ? rates[mid] : (rates[mid - 1] + rates[mid]) / 2;

  const stats: ChannelStat[] = [];
  for (const [channel, a] of byChannel) {
    const signupRate = a.views > 0 ? a.signups / a.views : 0;
    const sp = spendByChannel.get(channel);
    const spendCents = sp ? sp.spendCents : null;
    const revenueCents = sp && typeof sp.revenueCents === "number" ? sp.revenueCents : null;
    const roas = spendCents != null && spendCents > 0 && revenueCents != null ? revenueCents / spendCents : null;
    const moneyBasis: Basis = roas != null ? "real" : spendCents != null ? "estimate" : "missing";
    const trafficBasis: Basis = a.views > 0 ? "real" : "missing";

    const { verdict, why } = decideChannel({ views: a.views, signupRate, medianRate, roas });
    stats.push({ channel, views: a.views, signups: a.signups, signupRate, spendCents, revenueCents, roas, basis: { traffic: trafficBasis, money: moneyBasis }, verdict, why });
  }
  // Rank: real ROAS desc first, then signup rate desc, then volume.
  return stats.sort((x, y) => (y.roas ?? -1) - (x.roas ?? -1) || y.signupRate - x.signupRate || y.views - x.views);
}

// Per-channel verdict. When ROAS is real, money decides (>3x scale, <1x pause, else optimize). When
// it isn't, conversion vs the median decides — a real signal that needs no ad spend to compute.
function decideChannel(p: { views: number; signupRate: number; medianRate: number; roas: number | null }): { verdict: Verdict; why: string } {
  if (p.roas != null) {
    if (p.roas >= 3) return { verdict: "scale", why: `ROAS ${p.roas.toFixed(1)}x — every $1 returns $${p.roas.toFixed(2)}. Put more here.` };
    if (p.roas < 1) return { verdict: "pause", why: `ROAS ${p.roas.toFixed(1)}x — losing money on every dollar. Pause and diagnose.` };
    return { verdict: "optimize", why: `ROAS ${p.roas.toFixed(1)}x — profitable but thin. Tune creative/targeting before scaling.` };
  }
  if (p.views < 20) return { verdict: "watch", why: `Only ${p.views} views — too little signal to judge yet. Keep measuring.` };
  if (p.signupRate >= p.medianRate * 1.5) return { verdict: "scale", why: `${(p.signupRate * 100).toFixed(1)}% signup rate — well above your ${(p.medianRate * 100).toFixed(1)}% median. Do more of this. (Connect ad spend to see ROAS.)` };
  if (p.signupRate <= p.medianRate * 0.5) return { verdict: "pause", why: `${(p.signupRate * 100).toFixed(1)}% signup rate — less than half your median. The traffic isn't converting.` };
  return { verdict: "optimize", why: `${(p.signupRate * 100).toFixed(1)}% signup rate — around your median. Worth improving the landing before you spend more.` };
}

// Campaign-level rollup — answers "which CAMPAIGNS work," not just which channels. Only events that
// carry a campaign tag participate (untagged traffic can't honestly be assigned to a campaign).
export interface CampaignStat {
  campaign: string;
  channel: Channel;
  views: number;
  signups: number;
  signupRate: number;
  verdict: Verdict;
  why: string;
}

export function attributeCampaigns(events: EventRow[]): CampaignStat[] {
  const byCampaign = new Map<string, { channel: Channel; views: number; signups: number }>();
  for (const e of events) {
    const campaign = parseCampaign(e.source);
    if (!campaign) continue;
    const agg = byCampaign.get(campaign) ?? { channel: classifyChannel(e.source), views: 0, signups: 0 };
    if (e.type === "view") agg.views++;
    else if (e.type === "signup") agg.signups++;
    byCampaign.set(campaign, agg);
  }
  const rates = [...byCampaign.values()].filter((a) => a.views >= 20).map((a) => a.signups / a.views).sort((x, y) => x - y);
  const mid = Math.floor(rates.length / 2);
  const medianRate = rates.length === 0 ? 0.02 : rates.length % 2 ? rates[mid] : (rates[mid - 1] + rates[mid]) / 2;

  const out: CampaignStat[] = [];
  for (const [campaign, a] of byCampaign) {
    const signupRate = a.views > 0 ? a.signups / a.views : 0;
    const d = a.views < 20
      ? { verdict: "watch" as Verdict, why: `Only ${a.views} views — too little signal to judge yet.` }
      : signupRate >= medianRate * 1.5
        ? { verdict: "scale" as Verdict, why: `${(signupRate * 100).toFixed(1)}% signup rate — top of your campaigns. Do more of this.` }
        : signupRate <= medianRate * 0.5
          ? { verdict: "pause" as Verdict, why: `${(signupRate * 100).toFixed(1)}% signup rate — well under your campaign median. Rework or stop.` }
          : { verdict: "optimize" as Verdict, why: `${(signupRate * 100).toFixed(1)}% signup rate — mid-pack. Tune the message before spending more.` };
    out.push({ campaign, channel: a.channel, views: a.views, signups: a.signups, signupRate, ...d });
  }
  return out.sort((x, y) => y.signupRate - x.signupRate || y.views - x.views);
}

// Weekly paid-vs-organic contribution — answers "how did paid and organic contribute over time."
// ISO-week buckets (UTC Monday), newest last, capped to the most recent `weeks`.
export interface WeekPoint {
  week: string; // e.g. "2026-W27"
  paidViews: number;
  organicViews: number;
  paidSignups: number;
  organicSignups: number;
}

const PAID: Channel[] = ["paid-search", "paid-social"];

export function isoWeek(d: Date): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day); // shift to the Thursday of this ISO week
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 864e5 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function weeklySeries(events: EventRow[], weeks = 8): WeekPoint[] {
  const byWeek = new Map<string, WeekPoint>();
  for (const e of events) {
    if (e.createdAt == null || e.type === "purchase") continue;
    const d = new Date(e.createdAt);
    if (isNaN(d.getTime())) continue;
    const wk = isoWeek(d);
    const p = byWeek.get(wk) ?? { week: wk, paidViews: 0, organicViews: 0, paidSignups: 0, organicSignups: 0 };
    const paid = PAID.includes(classifyChannel(e.source));
    if (e.type === "view") paid ? p.paidViews++ : p.organicViews++;
    else paid ? p.paidSignups++ : p.organicSignups++;
    byWeek.set(wk, p);
  }
  return [...byWeek.values()].sort((a, b) => a.week.localeCompare(b.week)).slice(-weeks);
}

// Portfolio ROI when spend is connected across channels. Null (honestly) until ad accounts exist.
export function portfolioRoi(stats: ChannelStat[]): { spendCents: number; revenueCents: number; roas: number } | null {
  const withSpend = stats.filter((s) => s.spendCents != null && s.roas != null);
  if (withSpend.length === 0) return null;
  const spendCents = withSpend.reduce((n, s) => n + (s.spendCents ?? 0), 0);
  const revenueCents = withSpend.reduce((n, s) => n + (s.revenueCents ?? 0), 0);
  return { spendCents, revenueCents, roas: spendCents > 0 ? revenueCents / spendCents : 0 };
}
