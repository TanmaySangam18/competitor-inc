"use client";

import { useEffect, useMemo, useState } from "react";
import { TrendingUp, ArrowUpRight, Wrench, Pause, Eye, Radar, Megaphone, CalendarRange } from "lucide-react";
import { channelLabel, type ChannelStat, type CampaignStat, type WeekPoint, type Verdict } from "@/lib/engine/attribution";

// The attribution surface: which marketing made money, per channel, with honest verdicts. Traffic
// legs are real from our pixel; ROAS shows only when an ad account is connected (Phase 2). When the
// company has no channel data yet, we render a clearly-labelled EXAMPLE so the shape is legible —
// never passed off as the customer's real numbers (the honesty invariant, in the UI).

const VERDICT: Record<Verdict, { label: string; cls: string; icon: typeof ArrowUpRight }> = {
  scale: { label: "SCALE", cls: "text-mint bg-mint/12", icon: ArrowUpRight },
  optimize: { label: "OPTIMIZE", cls: "text-amber bg-amber/12", icon: Wrench },
  pause: { label: "PAUSE", cls: "text-coral bg-coral/12", icon: Pause },
  watch: { label: "WATCH", cls: "text-muted-2 bg-surface-2", icon: Eye },
};

const EXAMPLE: ChannelStat[] = [
  { channel: "community", views: 1420, signups: 128, signupRate: 0.09, spendCents: null, revenueCents: null, roas: null, basis: { traffic: "real", money: "missing" }, verdict: "scale", why: "9.0% signup rate — well above your 3.1% median. Do more of this. (Connect ad spend to see ROAS.)" },
  { channel: "paid-search", views: 3100, signups: 96, signupRate: 0.031, spendCents: 40000, revenueCents: 156000, roas: 3.9, basis: { traffic: "real", money: "real" }, verdict: "scale", why: "ROAS 3.9x — every $1 returns $3.90. Put more here." },
  { channel: "organic-social", views: 2200, signups: 44, signupRate: 0.02, spendCents: null, revenueCents: null, roas: null, basis: { traffic: "real", money: "missing" }, verdict: "optimize", why: "2.0% signup rate — around your median. Worth improving the landing before you spend more." },
  { channel: "paid-social", views: 5400, signups: 38, signupRate: 0.007, spendCents: 60000, revenueCents: 22000, roas: 0.37, basis: { traffic: "real", money: "real" }, verdict: "pause", why: "ROAS 0.4x — losing money on every dollar. Pause and diagnose." },
];

const money = (c: number | null) => (c == null ? "—" : `$${(c / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);

const EXAMPLE_CAMPAIGNS: CampaignStat[] = [
  { campaign: "launch-week", channel: "community", views: 640, signups: 61, signupRate: 0.095, verdict: "scale", why: "9.5% signup rate — top of your campaigns. Do more of this." },
  { campaign: "spring-promo", channel: "paid-search", views: 1800, signups: 51, signupRate: 0.028, verdict: "optimize", why: "2.8% signup rate — mid-pack. Tune the message before spending more." },
  { campaign: "meme-thread", channel: "organic-social", views: 900, signups: 7, signupRate: 0.008, verdict: "pause", why: "0.8% signup rate — well under your campaign median. Rework or stop." },
];

const EXAMPLE_SERIES: WeekPoint[] = [
  { week: "2026-W22", paidViews: 300, organicViews: 520, paidSignups: 6, organicSignups: 31 },
  { week: "2026-W23", paidViews: 900, organicViews: 480, paidSignups: 14, organicSignups: 28 },
  { week: "2026-W24", paidViews: 1400, organicViews: 610, paidSignups: 19, organicSignups: 40 },
  { week: "2026-W25", paidViews: 1600, organicViews: 940, paidSignups: 22, organicSignups: 66 },
  { week: "2026-W26", paidViews: 1200, organicViews: 1350, paidSignups: 17, organicSignups: 92 },
];

export default function AttributionPanel({ slug }: { slug: string }) {
  const [channels, setChannels] = useState<ChannelStat[] | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignStat[]>([]);
  const [series, setSeries] = useState<WeekPoint[]>([]);
  const [showExample, setShowExample] = useState(false);

  useEffect(() => {
    let on = true;
    fetch(`/api/attribution?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!on) return;
        setChannels(Array.isArray(d?.channels) ? d.channels : []);
        setCampaigns(Array.isArray(d?.campaigns) ? d.campaigns : []);
        setSeries(Array.isArray(d?.series) ? d.series : []);
      })
      .catch(() => { if (on) setChannels([]); });
    return () => { on = false; };
  }, [slug]);

  const real = channels ?? [];
  const rows = showExample ? EXAMPLE : real;
  const campaignRows = showExample ? EXAMPLE_CAMPAIGNS : campaigns;
  const seriesRows = showExample ? EXAMPLE_SERIES : series;
  const portfolio = useMemo(() => {
    const withRoas = rows.filter((s) => s.roas != null && s.spendCents != null);
    if (!withRoas.length) return null;
    const spend = withRoas.reduce((n, s) => n + (s.spendCents ?? 0), 0);
    const rev = withRoas.reduce((n, s) => n + (s.revenueCents ?? 0), 0);
    return { spend, rev, roas: spend > 0 ? rev / spend : 0 };
  }, [rows]);

  return (
    <div className="rounded-2xl glass-panel p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Radar size={15} className="text-violet" /> Attribution — which marketing made money
        <button
          onClick={() => setShowExample((v) => !v)}
          className="ml-auto rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-muted transition hover:text-text"
        >
          {showExample ? "Show my data" : "Show example"}
        </button>
      </div>

      {showExample && (
        <div className="mt-3 rounded-lg border border-amber/30 bg-amber/[0.06] px-3 py-2 text-[11px] text-amber">
          Example data — illustrative shape only, not your numbers. Toggle back to see your live channels.
        </div>
      )}

      {/* portfolio ROAS — only when ad spend is connected; otherwise honest prompt */}
      <div className="mt-4 rounded-xl border border-violet/25 bg-violet/[0.04] p-3.5">
        {portfolio ? (
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
            <div><span className="font-display text-2xl font-bold">{portfolio.roas.toFixed(1)}x</span> <span className="text-xs text-muted-2">blended ROAS</span></div>
            <div className="text-sm text-muted">{money(portfolio.rev)} revenue on {money(portfolio.spend)} spend</div>
          </div>
        ) : (
          <p className="text-xs text-muted">
            <span className="font-semibold text-violet">ROAS &amp; ROI unlock when you connect an ad account.</span>{" "}
            Until then we measure what our pixel sees for real — traffic and conversion per channel, below. We never invent a return.
          </p>
        )}
      </div>

      {/* channel table */}
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted-2">
          No channel data yet. Install the pixel and tag your links (<code className="text-muted">?utm_source=</code>) — each visit&apos;s
          source flows in here automatically. Try <button onClick={() => setShowExample(true)} className="text-violet underline-offset-2 hover:underline">the example</button> to see the shape.
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          <div className="grid grid-cols-[1.3fr_0.7fr_0.7fr_0.8fr_0.8fr] gap-2 px-2 text-[10px] font-semibold uppercase tracking-wide text-muted-2">
            <span>Channel</span><span className="text-right">Views</span><span className="text-right">Signups</span><span className="text-right">Conv · ROAS</span><span className="text-right">Verdict</span>
          </div>
          {rows.map((s) => {
            const V = VERDICT[s.verdict];
            return (
              <div key={s.channel} className="rounded-xl border border-border bg-bg/40 p-3">
                <div className="grid grid-cols-[1.3fr_0.7fr_0.7fr_0.8fr_0.8fr] items-center gap-2 text-sm">
                  <span className="font-medium">{channelLabel(s.channel)}</span>
                  <span className="text-right font-mono text-xs">{s.views.toLocaleString()}</span>
                  <span className="text-right font-mono text-xs">{s.signups.toLocaleString()}</span>
                  <span className="text-right font-mono text-xs">
                    {(s.signupRate * 100).toFixed(1)}%
                    {s.roas != null && <span className="text-mint"> · {s.roas.toFixed(1)}x</span>}
                  </span>
                  <span className="text-right">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${V.cls}`}><V.icon size={10} /> {V.label}</span>
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-muted-2">{s.why}</p>
              </div>
            );
          })}
          <p className="pt-1 text-[10px] text-muted-2">
            <TrendingUp size={10} className="mr-1 inline" />
            Conversion is real from our pixel. ROAS appears per channel once its ad account is connected — paid budget always waits for your approval.
          </p>
        </div>
      )}

      {/* campaigns — tagged traffic only, so a campaign is never invented from ambient visits */}
      {campaignRows.length > 0 && (
        <div className="mt-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted">
            <Megaphone size={13} className="text-amber" /> Campaigns
            <span className="text-[10px] font-normal text-muted-2">— tag links with ?utm_campaign= to appear here</span>
          </div>
          <div className="mt-2 space-y-1.5">
            {campaignRows.map((c) => {
              const V = VERDICT[c.verdict];
              return (
                <div key={c.campaign} className="flex items-center gap-3 rounded-xl border border-border bg-bg/40 px-3 py-2 text-xs">
                  <span className="min-w-0 flex-1 truncate font-mono">{c.campaign}</span>
                  <span className="shrink-0 text-muted-2">{channelLabel(c.channel)}</span>
                  <span className="shrink-0 font-mono">{c.views.toLocaleString()}v · {c.signups}s · {(c.signupRate * 100).toFixed(1)}%</span>
                  <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${V.cls}`}><V.icon size={10} /> {V.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* paid vs organic over time — the "how did each contribute" answer, weekly */}
      {seriesRows.length > 1 && (
        <div className="mt-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted">
            <CalendarRange size={13} className="text-violet" /> Paid vs organic — weekly signups
          </div>
          <div className="mt-3 flex items-end gap-1.5" style={{ height: 90 }}>
            {(() => {
              const max = Math.max(1, ...seriesRows.map((w) => w.paidSignups + w.organicSignups));
              return seriesRows.map((w) => (
                <div key={w.week} className="group flex min-w-0 flex-1 flex-col items-center gap-1 self-stretch">
                  <div className="flex w-full flex-1 flex-col justify-end gap-px" title={`${w.week}: ${w.organicSignups} organic + ${w.paidSignups} paid signups`}>
                    <div className="w-full rounded-t-sm bg-coral/70" style={{ height: `${(w.paidSignups / max) * 100}%`, minHeight: w.paidSignups > 0 ? 3 : 0 }} />
                    <div className="w-full rounded-t-sm bg-mint/70" style={{ height: `${(w.organicSignups / max) * 100}%`, minHeight: w.organicSignups > 0 ? 3 : 0 }} />
                  </div>
                  <span className="text-[9px] text-muted-2">{w.week.slice(5)}</span>
                </div>
              ));
            })()}
          </div>
          <div className="mt-1.5 flex items-center gap-4 text-[10px] text-muted-2">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-mint/70" /> organic</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-coral/70" /> paid</span>
          </div>
        </div>
      )}
    </div>
  );
}
