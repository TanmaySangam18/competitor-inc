"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Copy, Loader2, Sparkles } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { useCopy } from "@/components/useCopy";
import { generateCrew, type CrewSpec } from "@/lib/engine/crew";
import type { ValidationResult } from "@/lib/engine/types";

// The free, no-signup lead magnet (Slice B). Type an idea → the crew scores it in a GLASS BOX (verdict +
// the evidence behind it + the crew that'd build it), all on one screen. Shareable link (/score?idea=…)
// so a scored idea spreads → recipient lands prefilled → scores their own → CTA into the real build flow.
// Uses the SAME validate engine as the product (POST /api/engine kind:"validate") — real verdicts, not demo.

const VERDICT: Record<ValidationResult["verdict"], { label: string; cls: string; ring: string }> = {
  strong: { label: "Strong signal", cls: "text-mint", ring: "var(--mint, #34d399)" },
  mixed: { label: "Mixed signal", cls: "text-[#d9a441]", ring: "#d9a441" },
  weak: { label: "Weak signal", cls: "text-coral", ring: "var(--coral, #f97362)" },
};

const SIGNAL_DOT: Record<string, string> = { positive: "bg-mint", weak: "bg-[#d9a441]", negative: "bg-coral" };

export default function Scorecard() {
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [crew, setCrew] = useState<CrewSpec | null>(null);
  const [scoredIdea, setScoredIdea] = useState("");
  const [err, setErr] = useState("");
  const { copied, copy } = useCopy(1500);
  const ranOnce = useRef(false);

  async function score(ideaText: string) {
    const t = ideaText.trim();
    if (t.length < 8) { setErr("Tell me a bit more about the idea (a sentence is plenty)."); return; }
    setErr("");
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/engine", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "validate", idea: t, nonce: Math.floor(Math.random() * 1e9) }),
      });
      const data = await res.json();
      if (!res.ok || !data?.validation) {
        setErr(data?.error?.includes("limit") ? "You've used your free scores — sign up to keep going." : (data?.error || "Couldn't score that — try again."));
        return;
      }
      setResult(data.validation as ValidationResult);
      setCrew(generateCrew(t));
      setScoredIdea(t);
    } catch {
      setErr("Network hiccup — try again.");
    } finally {
      setLoading(false);
    }
  }

  // Prefill + auto-score from a shared link (?idea=…). Runs once.
  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;
    try {
      const shared = new URLSearchParams(window.location.search).get("idea");
      if (shared && shared.trim()) {
        setIdea(shared);
        void score(shared);
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shareLink =
    result && typeof window !== "undefined"
      ? `${window.location.origin}/score?idea=${encodeURIComponent(scoredIdea)}`
      : "";

  const reset = () => { setResult(null); setCrew(null); setErr(""); };

  return (
    <div id="main" className="min-h-screen">
      <header className="glass-nav sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 font-mono text-lg font-bold tracking-tight">
            <LogoMark size={32} /> competitor.inc
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-text">
            <ArrowLeft size={15} /> Home
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-12">
        {!result && (
          <div className="text-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-coral">Free · no signup</div>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">
              Score your startup idea in <span className="gradient-text">30 seconds</span>.
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-muted">
              The crew reads your idea and gives you an honest verdict — the score, the evidence behind it, and
              the exact team that would build it. No fluff, no hype.
            </p>
            <div className="mx-auto mt-8 max-w-xl">
              <textarea
                value={idea}
                onChange={(e) => { setIdea(e.target.value); if (err) setErr(""); }}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) score(idea); }}
                placeholder="e.g. A booking marketplace that connects college students with local tutors."
                rows={3}
                className={`w-full resize-none rounded-2xl glass-panel px-4 py-3.5 text-sm outline-none placeholder:text-muted-2 focus:border-coral/40 ${err ? "border-coral/60" : ""}`}
                aria-label="Your startup idea"
              />
              {err && <p className="mt-2 text-left text-xs font-medium text-coral" role="alert">{err}</p>}
              <button
                onClick={() => score(idea)}
                disabled={loading}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-coral px-6 py-3.5 font-semibold text-bg transition hover:brightness-110 disabled:opacity-60 sm:w-auto"
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Scoring — the crew is weighing in…</> : <><Sparkles size={16} /> Score my idea</>}
              </button>
              <p className="mt-3 text-xs text-muted-2">Free to try. Your idea stays yours.</p>
            </div>
          </div>
        )}

        {result && (
          <ScoreResult
            result={result}
            crew={crew}
            idea={scoredIdea}
            shareLink={shareLink}
            copied={copied}
            onCopy={() => copy(shareLink)}
            onReset={reset}
          />
        )}
      </div>
    </div>
  );
}

function ScoreResult({
  result, crew, idea, shareLink, copied, onCopy, onReset,
}: {
  result: ValidationResult;
  crew: CrewSpec | null;
  idea: string;
  shareLink: string;
  copied: boolean;
  onCopy: () => void;
  onReset: () => void;
}) {
  const v = VERDICT[result.verdict];
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <button onClick={onReset} className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-text">
          <ArrowLeft size={14} /> Score another
        </button>
        <button
          onClick={onCopy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition hover:text-text"
        >
          {copied ? <Check size={14} className="text-mint" /> : <Copy size={14} />} {copied ? "Link copied" : "Share result"}
        </button>
      </div>

      <p className="mt-4 text-sm text-muted-2">Your idea</p>
      <p className="mt-1 text-lg font-medium text-text">&ldquo;{idea}&rdquo;</p>

      {/* Glass box: the verdict + the evidence behind it + the crew — everything visible, one screen. */}
      <div className="mt-6 grid gap-4 md:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-surface p-6 text-center">
          <div
            className="flex h-28 w-28 items-center justify-center rounded-full"
            style={{ background: `conic-gradient(${v.ring} ${result.confidence * 3.6}deg, var(--border, #2a2a2a) 0deg)` }}
          >
            <div className="flex h-[92px] w-[92px] flex-col items-center justify-center rounded-full bg-surface">
              <span className="text-3xl font-bold">{result.confidence}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-2">/ 100</span>
            </div>
          </div>
          <div className={`mt-3 text-sm font-semibold ${v.cls}`}>{v.label}</div>
        </div>

        <div className="rounded-3xl border border-border bg-surface p-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-2">The crew&apos;s honest take</div>
          <p className="mt-2 text-sm text-text">{result.recommendation}</p>
          {result.experiments?.length > 0 && (
            <>
              <div className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-2">The evidence</div>
              <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {result.experiments.slice(0, 4).map((e) => (
                  <li key={e.key} className="flex items-start gap-2 text-sm text-muted">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${SIGNAL_DOT[e.signal] ?? "bg-muted"}`} />
                    <span><span className="text-text">{e.label}</span> — {e.metric}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {crew && (
        <div className="mt-4 rounded-3xl border border-border bg-surface p-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-2">
            The crew that would build it · {crew.domain}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {crew.specialists.map((s) => (
              <span key={s.name} className="rounded-full border border-border bg-bg/40 px-3 py-1 text-xs text-muted">
                <span className="font-semibold text-text">{s.name}</span> · {s.focus.split("—")[0].trim()}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href={`/signup?idea=${encodeURIComponent(idea)}`}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-coral px-6 py-3.5 font-semibold text-bg transition hover:brightness-110 sm:w-auto"
        >
          Build this for real <ArrowRight size={16} />
        </Link>
        <button
          onClick={onCopy}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-6 py-3.5 text-sm font-semibold text-text transition hover:bg-bg/40 sm:w-auto"
        >
          {copied ? "Link copied" : "Share your score"}
        </button>
      </div>
    </div>
  );
}
