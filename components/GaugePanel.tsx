"use client";

import { useMemo } from "react";
import { Gauge, TrendingUp, TrendingDown, Minus, Target } from "lucide-react";
import type { Activity, Company } from "@/lib/engine/types";
import { analyze } from "@/lib/engine/analyst";

// B1 — Growth Analyst ("Gauge"). Surfaces the demand North Star: opportunities created per shift, the
// trend, channel mix, and the weekly "what's the constraint" brief. Reads the real activity log.
export default function GaugePanel({ company, activities }: { company: Company; activities: Activity[] }) {
  const r = useMemo(() => analyze(company, activities), [company, activities]);
  const max = Math.max(1, ...r.perNight.map((p) => p.opportunities));
  const TrendIcon = r.trend === "up" ? TrendingUp : r.trend === "down" ? TrendingDown : Minus;
  const trendColor = r.trend === "up" ? "text-mint" : r.trend === "down" ? "text-coral" : "text-muted-2";

  return (
    <div className="overflow-hidden rounded-2xl glass-panel p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Gauge size={15} className="text-violet" /> Demand tracker
        <span className="ml-auto flex items-center gap-1 text-xs font-medium">
          <TrendIcon size={13} className={trendColor} /> <span className={trendColor}>{r.trend}</span>
        </span>
      </div>
      <p className="mt-1 text-[11px] text-muted-2">North star: {r.northStar}</p>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div><div className="font-display text-2xl font-bold">{r.totalOpportunities}</div><div className="text-[10px] uppercase tracking-wide text-muted-2">opps total</div></div>
        <div><div className="font-display text-2xl font-bold">{r.recentAvg}</div><div className="text-[10px] uppercase tracking-wide text-muted-2">/ shift recent</div></div>
        <div><div className="font-display text-2xl font-bold">{r.conversionSignals}</div><div className="text-[10px] uppercase tracking-wide text-muted-2">conversions</div></div>
      </div>

      {/* opps per shift sparkline */}
      {r.perNight.length > 0 && (
        <div className="mt-5">
          <div className="text-[11px] uppercase tracking-wide text-muted-2">Opportunities / shift</div>
          <div className="mt-2 overflow-x-auto pb-1">
            <div className="flex items-end gap-1.5" style={{ minWidth: `${r.perNight.length * 20}px` }}>
              {r.perNight.map((p) => (
                <div key={p.night} className="group flex min-w-0 flex-1 flex-col items-center gap-1">
                  <div className="relative flex h-20 w-full items-end">
                    <span className="pointer-events-none absolute inset-x-0 -top-4 text-center text-[10px] text-muted-2 opacity-0 transition group-hover:opacity-100">{p.opportunities}</span>
                    <div className="w-full rounded-t bg-violet transition-all" style={{ height: `${(p.opportunities / max) * 100}%`, minHeight: p.opportunities > 0 ? 4 : 2, backgroundColor: p.opportunities > 0 ? "var(--color-violet)" : "var(--color-border)" }} />
                  </div>
                  <span className="text-[9px] text-muted-2">{p.night}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* channel mix */}
      {r.byChannel.length > 0 && (
        <div className="mt-4">
          <div className="text-[11px] uppercase tracking-wide text-muted-2">Where the demand work went</div>
          <ul className="mt-2 space-y-1">
            {r.byChannel.map((c) => (
              <li key={c.channel} className="flex items-center justify-between text-xs">
                <span className="text-muted">{c.channel}</span>
                <span className="font-mono text-muted-2">{c.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* the brief */}
      <div className="mt-4 flex gap-2 rounded-xl border border-violet/25 bg-violet/[0.04] p-3">
        <Target size={14} className="mt-0.5 shrink-0 text-violet" />
        <p className="text-xs text-text">{r.brief}</p>
      </div>
    </div>
  );
}
