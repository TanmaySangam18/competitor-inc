"use client";

import { useCallback, useEffect, useState } from "react";
import { FlaskConical, Copy, Check, RefreshCw } from "lucide-react";
import { useCopy } from "@/components/useCopy";

// The bridge from "AI estimate" to a real, measured demand test. Stands up a live public page
// (/t/<slug>) for the idea, captures real signups, and reads them back against a pre-set threshold.
// Gated: when Supabase isn't connected, it honestly says so instead of pretending.
interface State {
  live: boolean;
  persisted: boolean;
  signups: number;
  goal: number;
  verdict: "strong" | "mixed" | "weak";
}

const verdictTone: Record<string, { text: string; label: string }> = {
  strong: { text: "text-mint", label: "strong signal" },
  mixed: { text: "text-amber", label: "early signal" },
  weak: { text: "text-muted-2", label: "not yet" },
};

export default function DemandTestPanel({ slug, idea }: { slug: string; idea: string }) {
  const [s, setS] = useState<State | null>(null);
  const [busy, setBusy] = useState(false);
  const { copied, copy: copyText } = useCopy(1500);
  const link = typeof window !== "undefined" ? `${window.location.origin}/t/${slug}` : `/t/${slug}`;

  const refresh = useCallback(async () => {
    try {
      const r = await fetch(`/api/demand?slug=${encodeURIComponent(slug)}`);
      const d = await r.json();
      if (d?.ok) {
        setS({
          live: !!d.live,
          persisted: !!d.persisted,
          signups: d.signups ?? 0,
          goal: d.goal ?? 25,
          verdict: (d.verdict as State["verdict"]) ?? "weak",
        });
      }
    } catch {
      /* fail-soft */
    }
  }, [slug]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function launch() {
    setBusy(true);
    try {
      const headline = idea.trim().replace(/^./, (c) => c.toUpperCase()).slice(0, 140);
      await fetch("/api/demand", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "create",
          slug,
          headline,
          subhead: "We're building this. Want in early? Leave your email and we'll tell you the moment it's ready.",
          goal: 25,
        }),
      });
      await refresh();
    } catch {
      /* fail-soft */
    } finally {
      setBusy(false);
    }
  }

  const copy = () => copyText(link);

  // Supabase not connected → honest "this unlocks when the DB is connected" (also advertises the feature).
  if (s && !s.persisted) {
    return (
      <div className="mt-4 rounded-2xl border border-border bg-bg/40 px-4 py-3 text-sm text-muted-2">
        <span className="font-medium text-muted">Want a real demand test?</span> A live page that captures
        actual signups turns this estimate into measured proof — it activates once your database is connected.
      </div>
    );
  }

  // Connected, no test yet → offer to launch.
  if (s && !s.live) {
    return (
      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-coral/25 bg-coral/[0.04] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted">
          <span className="font-medium text-text">Make it real.</span> Launch a live page and measure actual demand.
        </div>
        <button
          onClick={launch}
          disabled={busy}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-coral px-4 py-2.5 text-sm font-semibold text-bg transition hover:brightness-110 disabled:opacity-50"
        >
          <FlaskConical size={15} /> {busy ? "Launching…" : "Launch demand test"}
        </button>
      </div>
    );
  }

  // Live test → show the share link + measured signups vs goal + honest verdict.
  if (s && s.live) {
    const tone = verdictTone[s.verdict];
    return (
      <div className="mt-4 rounded-2xl border border-border bg-bg/40 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <FlaskConical size={15} className="text-coral" /> Live demand test
            <span className="rounded-full border border-mint/30 bg-mint/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-mint">
              real signups
            </span>
          </div>
          <button onClick={refresh} className="inline-flex items-center gap-1 text-xs text-muted-2 transition hover:text-text">
            <RefreshCw size={12} /> refresh
          </button>
        </div>
        <div className="mt-3 flex items-end gap-2">
          <span className={`font-display text-3xl font-bold ${tone.text}`}>{s.signups}</span>
          <span className="mb-1 text-sm text-muted-2">/ {s.goal} signups · {tone.label}</span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            readOnly
            value={link}
            className="w-full rounded-lg border border-border bg-bg/50 px-3 py-2 text-xs text-muted outline-none"
          />
          <button
            onClick={copy}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-muted transition hover:text-text"
          >
            {copied ? <Check size={13} className="text-mint" /> : <Copy size={13} />} {copied ? "Copied" : "Copy link"}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-2">Share this link in your ads or communities. Real signups, measured against your goal.</p>
      </div>
    );
  }

  return null; // initial load
}
