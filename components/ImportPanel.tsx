"use client";

import { useState } from "react";
import { Search, Loader2, Check, AlertTriangle, Rocket } from "lucide-react";

// Import-and-sell on-ramp (the wedge): paste an ALREADY-BUILT product → public-page audit (read-only,
// no ownership needed) → "grow this with my crew", which adopts it as a company focused on distribution.
// Operating it for real is gated on ownership verification later.
interface Audit {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
}

export function ImportPanel({ onGrow }: { onGrow?: (url: string, title: string) => void }) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ title?: string; audit?: Audit; error?: string } | null>(null);

  async function run() {
    if (!url.trim()) return;
    setBusy(true);
    setRes(null);
    try {
      const r = await fetch("/api/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      }).then((x) => x.json());
      setRes(r.ok ? { title: r.title, audit: r.audit } : { error: r.error || "couldn't audit that" });
    } catch {
      setRes({ error: "couldn't reach the auditor" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full rounded-2xl border border-coral/25 bg-coral/[0.03] p-5 text-left">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Rocket size={15} className="text-coral" /> Already built something that isn&apos;t selling?
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-2">
        Paste it — a live site, or a dead Replit / Bolt / Lovable build. We read the public page and give you
        an honest read; then the crew&apos;s whole job is getting it customers. (To run it for real, we verify
        you own it first.)
      </p>
      <div className="mt-3 flex gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="yourproject.com"
          className="flex-1 rounded-xl glass-panel px-3 py-2.5 text-sm outline-none placeholder:text-muted-2 focus:border-coral/40"
          aria-label="Your existing project URL"
        />
        <button
          onClick={run}
          disabled={busy || !url.trim()}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-text px-4 py-2.5 text-sm font-semibold text-bg transition hover:opacity-90 disabled:opacity-50"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Audit
        </button>
      </div>

      {res?.error && (
        <div className="mt-3 flex items-center gap-2 text-xs text-amber">
          <AlertTriangle size={13} /> {res.error}
        </div>
      )}

      {res?.audit && (
        <div className="mt-4 space-y-2.5 text-sm">
          <div className="text-text">{res.audit.summary}</div>
          {(
            [
              ["Strengths", res.audit.strengths],
              ["Weaknesses", res.audit.weaknesses],
              ["Opportunities", res.audit.opportunities],
            ] as const
          ).map(([label, items]) =>
            items.length > 0 ? (
              <div key={label}>
                <div className="text-[11px] uppercase tracking-wide text-muted-2">{label}</div>
                <ul className="mt-0.5 space-y-0.5">
                  {items.map((it, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-muted">
                      <Check size={12} className="mt-0.5 shrink-0 text-mint" /> {it}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null
          )}
          {onGrow && (
            <button
              onClick={() => onGrow(url, res.title || url)}
              className="group mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-coral px-5 py-2.5 text-sm font-semibold text-bg transition hover:brightness-110"
            >
              <Rocket size={15} /> Grow this with my crew
              <span className="transition group-hover:translate-x-0.5">→</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
