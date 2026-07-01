"use client";

import { useState } from "react";
import { Radar, Loader2, ExternalLink, TrendingUp, TrendingDown, Minus, AlertTriangle, Search } from "lucide-react";

// Block V — Demand Radar UI. Type an idea → the crew crawls the live web and returns a SOURCE-CITED
// demand report. Every signal links to the real page it came from ("don't trust us, click it").
interface Signal { source: string; title: string; url: string; metric?: string; date?: string }
interface SourceResult { source: string; reachable: boolean; count: number; engagement: number; signals: Signal[]; note?: string }
interface Report {
  idea: string; query: string; sources: SourceResult[];
  totalSignals: number; totalEngagement: number; competition: number;
  trend: "rising" | "steady" | "cooling" | "unknown";
  demandScore: number; verdict: "strong" | "mixed" | "weak"; broadened: boolean; summary: string; citations: string[];
}

const verdictColor = (v: Report["verdict"]) =>
  v === "strong" ? "text-mint" : v === "mixed" ? "text-amber" : "text-coral";

export default function DemandRadarPanel({ initialIdea = "" }: { initialIdea?: string }) {
  const [idea, setIdea] = useState(initialIdea);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [err, setErr] = useState("");

  async function scan() {
    const q = idea.trim();
    if (q.length < 3) { setErr("Describe the idea in a sentence."); return; }
    setErr(""); setBusy(true); setReport(null);
    try {
      const r = await fetch("/api/radar", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ idea: q }),
      }).then((x) => x.json());
      if (r.ok) setReport(r.report);
      else setErr(r.error || "couldn't scan just now");
    } catch {
      setErr("couldn't reach the radar");
    } finally {
      setBusy(false);
    }
  }

  const TrendIcon = report?.trend === "rising" ? TrendingUp : report?.trend === "cooling" ? TrendingDown : Minus;

  return (
    <div className="w-full rounded-2xl border border-violet/25 bg-violet/[0.04] p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Radar size={16} className="text-violet" /> Demand Radar
        <span className="ml-auto rounded-md bg-violet/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-violet">
          real web · cited
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-2">
        No signups needed. The crew reads the live web for real demand and shows you every source it read.
      </p>

      <div className="mt-3 flex gap-2">
        <input
          value={idea}
          onChange={(e) => { setIdea(e.target.value); if (err) setErr(""); }}
          onKeyDown={(e) => e.key === "Enter" && scan()}
          placeholder="e.g. AI meal-prep planner for night-shift nurses"
          className="flex-1 rounded-xl glass-panel px-3 py-2.5 text-sm outline-none placeholder:text-muted-2 focus:border-violet/40"
          aria-label="Your idea"
        />
        <button
          onClick={scan}
          disabled={busy || idea.trim().length < 3}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-violet px-4 py-2.5 text-sm font-semibold text-bg transition hover:brightness-110 disabled:opacity-50"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Scan demand
        </button>
      </div>

      {err && <div className="mt-3 flex items-center gap-2 text-xs text-coral"><AlertTriangle size={13} /> {err}</div>}
      {busy && <div className="mt-4 text-xs text-muted-2">Reading Hacker News, StackExchange, GitHub… live.</div>}

      {report && (
        <div className="mt-5 space-y-4">
          {/* headline score */}
          <div className="flex items-center gap-4 rounded-xl border border-border bg-bg/40 p-4">
            <div className="text-center">
              <div className={`font-display text-4xl font-bold ${verdictColor(report.verdict)}`}>{report.demandScore}</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-2">demand</div>
            </div>
            <div className="min-w-0 flex-1">
              <div className={`text-sm font-semibold uppercase tracking-wide ${verdictColor(report.verdict)}`}>{report.verdict}</div>
              <p className="mt-1 text-xs text-muted">{report.summary}</p>
            </div>
          </div>

          {report.broadened && (
            <div className="flex items-start gap-2 rounded-lg border border-amber/30 bg-amber/[0.06] p-2.5 text-[11px] text-amber">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" />
              <span>Broadened to “{report.query}” for recall — check the cited sources below actually match your idea; they may be adjacent, not exact.</span>
            </div>
          )}

          {/* signal breakdown */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border border-border bg-bg/40 p-2">
              <div className="font-display text-lg font-bold">{report.totalSignals}</div>
              <div className="text-[10px] text-muted-2">demand signals</div>
            </div>
            <div className="rounded-lg border border-border bg-bg/40 p-2">
              <div className="font-display text-lg font-bold">{report.competition}</div>
              <div className="text-[10px] text-muted-2">competitors</div>
            </div>
            <div className="rounded-lg border border-border bg-bg/40 p-2">
              <div className="flex items-center justify-center gap-1 font-display text-lg font-bold"><TrendIcon size={15} /> {report.trend}</div>
              <div className="text-[10px] text-muted-2">trend</div>
            </div>
          </div>

          {/* per-source, with cited links */}
          <div className="space-y-3">
            {report.sources.map((s) => (
              <div key={s.source} className="rounded-xl border border-border bg-bg/40 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold">{s.source}</span>
                  <span className="text-muted-2">{s.reachable ? `${s.count.toLocaleString()} matches · ${s.engagement.toLocaleString()} engagement` : (s.note || "unreachable")}</span>
                </div>
                {s.signals.length > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {s.signals.map((sig, i) => (
                      <li key={i}>
                        <a href={sig.url} target="_blank" rel="noopener noreferrer"
                          className="group flex items-start gap-1.5 text-xs text-muted transition hover:text-text">
                          <ExternalLink size={12} className="mt-0.5 shrink-0 text-violet" />
                          <span className="min-w-0">
                            <span className="underline-offset-2 group-hover:underline">{sig.title}</span>
                            {sig.metric && <span className="ml-1 text-muted-2">· {sig.metric}</span>}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          <p className="text-[10px] text-muted-2">
            {report.citations.length} sources read live for “{report.query}”. Click any to verify — we never fabricate a signal.
          </p>
        </div>
      )}
    </div>
  );
}
