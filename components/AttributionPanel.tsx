"use client";

import { useEffect, useMemo, useState } from "react";
import { TrendingUp, ArrowUpRight, Wrench, Pause, Eye, Radar } from "lucide-react";
import { channelLabel, type ChannelStat, type Verdict } from "@/lib/engine/attribution";

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

export default function AttributionPanel({ slug }: { slug: string }) {
  const [channels, setChannels] = useState<ChannelStat[] | null>(null);
  const [showExample, setShowExample] = useState(false);

  useEffect(() => {
    let on = true;
    fetch(`/api/attribution?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((d) => { if (on) setChannels(Array.isArray(d?.channels) ? d.channels : []); })
      .catch(() => { if (on) setChannels([]); });
    return () => { on = false; };
  }, [slug]);

  const real = channels ?? [];
  const rows = showExample ? EXAMPLE : real;
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
    </div>
  );
}
