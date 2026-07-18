"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCopy } from "@/components/useCopy";
import { generateCrew, type CrewSpec } from "@/lib/engine/crew";
import type { ValidationResult } from "@/lib/engine/types";

// Free, no-signup lead magnet. Type an idea → the crew scores it (verdict + evidence + the crew that'd
// build it). Shareable /score?idea=… (auto-scores on load). Direction B: mono chrome, flat panels, NO icons.

const VERDICT: Record<ValidationResult["verdict"], { label: string; cls: string; ring: string }> = {
  strong: { label: "Strong signal", cls: "text-mint", ring: "var(--mint, #34d399)" },
  mixed: { label: "Mixed signal", cls: "text-muted", ring: "#8f8f8f" },
  weak: { label: "Weak signal", cls: "text-coral", ring: "var(--color-coral, #111111)" },
};

const SIGNAL_DOT: Record<string, string> = { positive: "bg-mint", weak: "bg-muted", negative: "bg-coral" };

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
      // Funnel-proof: log the tool run (top of the funnel). Fire-and-forget.
      fetch("/api/track", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: "score", type: "tool", source: "score-tool" }) }).catch(() => {});
    } catch {
      setErr("Network hiccup — try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;
    try {
      const shared = new URLSearchParams(window.location.search).get("idea");
      if (shared && shared.trim()) { setIdea(shared); void score(shared); }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shareLink = result && typeof window !== "undefined" ? `${window.location.origin}/score?idea=${encodeURIComponent(scoredIdea)}` : "";
  const reset = () => { setResult(null); setCrew(null); setErr(""); };

  return (
    // ADR-0009: the bespoke sticky header was removed — app/score/page.tsx provides the shared site chrome.
    <div className="mx-auto max-w-3xl px-6 py-12">
        {!result && (
          <div className="text-center">
            <div className="font-mono text-xs font-semibold uppercase tracking-wider text-coral">Free · no signup</div>
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
                className={`w-full resize-none rounded-xl glass-panel px-4 py-3.5 text-sm outline-none placeholder:text-muted-2 focus:border-coral/40 ${err ? "border-coral/60" : ""}`}
                aria-label="Your startup idea"
              />
              {err && <p className="mt-2 text-left text-xs font-medium text-coral" role="alert">{err}</p>}
              <button
                onClick={() => score(idea)}
                disabled={loading}
                className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-coral px-6 py-3.5 font-mono font-semibold text-bg transition hover:brightness-110 disabled:opacity-60 sm:w-auto"
              >
                {loading ? "scoring — the crew is weighing in…" : "Score my idea"}
              </button>
              <p className="mt-3 font-mono text-xs text-muted-2">Free to try. Your idea stays yours.</p>
            </div>
          </div>
        )}

        {result && (
          <ScoreResult result={result} crew={crew} idea={scoredIdea} copied={copied} onCopy={() => copy(shareLink)} onReset={reset} />
        )}
    </div>
  );
}

function ScoreResult({
  result, crew, idea, copied, onCopy, onReset,
}: {
  result: ValidationResult;
  crew: CrewSpec | null;
  idea: string;
  copied: boolean;
  onCopy: () => void;
  onReset: () => void;
}) {
  const v = VERDICT[result.verdict];
  return (
    <div>
      <div className="flex items-center justify-between gap-3 font-mono text-sm">
        <button onClick={onReset} className="text-muted transition hover:text-text">← score another</button>
        <button onClick={onCopy} className="rounded-lg border border-border px-3 py-1.5 text-muted transition hover:text-text">
          {copied ? "link copied" : "share result"}
        </button>
      </div>

      <p className="mt-4 font-mono text-xs uppercase tracking-wider text-muted-2">Your idea</p>
      <p className="mt-1 text-lg font-medium text-text">&ldquo;{idea}&rdquo;</p>

      <div className="mt-6 grid gap-4 md:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-6 text-center">
          <div
            className="flex h-28 w-28 items-center justify-center rounded-full"
            style={{ background: `conic-gradient(${v.ring} ${result.confidence * 3.6}deg, var(--border, #2a2a2a) 0deg)` }}
          >
            <div className="flex h-[92px] w-[92px] flex-col items-center justify-center rounded-full bg-surface">
              <span className="font-mono text-3xl font-bold">{result.confidence}</span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-2">/ 100</span>
            </div>
          </div>
          <div className={`mt-3 font-mono text-sm font-semibold ${v.cls}`}>{v.label}</div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-2">The crew&apos;s honest take</div>
          <p className="mt-2 text-sm text-text">{result.recommendation}</p>
          {result.experiments?.length > 0 && (
            <>
              <div className="mt-4 font-mono text-xs font-semibold uppercase tracking-wider text-muted-2">The evidence</div>
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
        <div className="mt-4 rounded-xl border border-border bg-surface p-6">
          <div className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-2">
            The crew that would build it · {crew.domain}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {crew.specialists.map((s) => (
              <span key={s.name} className="rounded-md border border-border bg-bg/40 px-3 py-1 font-mono text-xs text-muted">
                <span className="font-semibold text-text">{s.name}</span> · {s.focus.split("—")[0].trim()}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href={`/signup?idea=${encodeURIComponent(idea)}`}
          className="inline-flex w-full items-center justify-center rounded-lg bg-coral px-6 py-3.5 font-mono font-semibold text-bg transition hover:brightness-110 sm:w-auto"
        >
          Build this for real →
        </Link>
        <button
          onClick={onCopy}
          className="inline-flex w-full items-center justify-center rounded-lg border border-border px-6 py-3.5 font-mono text-sm font-semibold text-text transition hover:bg-bg/40 sm:w-auto"
        >
          {copied ? "link copied" : "share your score"}
        </button>
      </div>
    </div>
  );
}
