"use client";

import { useEffect, useState } from "react";
import { Loader2, TrendingDown } from "lucide-react";

// Founder-only landing-funnel readout: the exact stages a launch visitor moves through, so we can
// see WHERE they drop. Public aggregate counts (no PII) from /api/track?slug=home — the same pixel
// the landing fires. Step conversion % between stages surfaces the biggest leak at a glance.

interface Counts {
  views: number;
  demoStarts: number;
  demoVerdicts: number;
  demoCtas: number;
  signups: number;
  persisted?: boolean;
}

const STAGES: { key: keyof Counts; label: string; hint: string }[] = [
  { key: "views", label: "Landed", hint: "Visited the page" },
  { key: "demoStarts", label: "Ran the demo", hint: "Engaged the hero" },
  { key: "demoVerdicts", label: "Saw a verdict", hint: "Got a result" },
  { key: "demoCtas", label: "Clicked to start", hint: "Hit a signup CTA" },
  { key: "signups", label: "Signed up", hint: "Became a lead" },
];

export function LandingFunnel({ slug = "home" }: { slug?: string }) {
  const [c, setC] = useState<Counts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch(`/api/track?slug=${encodeURIComponent(slug)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (alive) setC(d as Counts); })
      .catch(() => { if (alive) setC(null); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [slug]);

  const top = c?.views ?? 0;
  const stepPct = (prev: number, cur: number) => (prev > 0 ? Math.round((cur / prev) * 100) : 0);
  // Biggest drop between adjacent stages (the leak to fix first).
  let worst = { from: "", pct: 101 };
  if (c) {
    for (let i = 1; i < STAGES.length; i++) {
      const prev = (c[STAGES[i - 1].key] as number) ?? 0;
      const cur = (c[STAGES[i].key] as number) ?? 0;
      if (prev > 0) {
        const p = stepPct(prev, cur);
        if (p < worst.pct) worst = { from: `${STAGES[i - 1].label} → ${STAGES[i].label}`, pct: p };
      }
    }
  }

  return (
    <section className="mt-8 rounded-2xl glass-panel p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-2">Landing funnel · /{slug}</h2>
      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-2"><Loader2 size={14} className="animate-spin" /> loading…</div>
      ) : !c?.persisted && top === 0 ? (
        <p className="mt-3 text-sm text-muted-2">
          No funnel data yet. Once migrations are live and traffic arrives, each stage — landed → demo → verdict → CTA → signup — appears here with step conversion, so you can see exactly where visitors drop.
        </p>
      ) : (
        <>
          <div className="mt-4 space-y-2">
            {STAGES.map((s, i) => {
              const val = (c?.[s.key] as number) ?? 0;
              const ofTop = top > 0 ? Math.round((val / top) * 100) : 0;
              const prev = i > 0 ? ((c?.[STAGES[i - 1].key] as number) ?? 0) : val;
              const step = i > 0 ? stepPct(prev, val) : 100;
              return (
                <div key={s.key}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium text-text">{s.label} <span className="font-normal text-muted-2">· {s.hint}</span></span>
                    <span className="tabular-nums text-muted">{val.toLocaleString()}{i > 0 && <span className="ml-2 text-[11px] text-muted-2">{step}% of prev</span>}</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-text transition-all" style={{ width: `${ofTop}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          {worst.from && worst.pct <= 100 && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-bg/40 px-3 py-2 text-[12px] text-text">
              <TrendingDown size={13} /> Biggest drop: <span className="font-medium">{worst.from}</span> — only {worst.pct}% carry through. Fix this step first.
            </div>
          )}
        </>
      )}
    </section>
  );
}
