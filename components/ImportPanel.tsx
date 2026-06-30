"use client";

import { useState } from "react";
import { Search, Loader2, Check, AlertTriangle } from "lucide-react";

// 2.8 Import on-ramp (PDR §5) — the "revive a dead project" wedge. Paste a URL → public-page audit
// (read-only, no ownership needed). Operating it later is gated on ownership verification.
interface Audit {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
}

export function ImportPanel() {
  const [open, setOpen] = useState(false);
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

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-2 text-xs text-muted-2 underline-offset-4 transition hover:text-text hover:underline"
      >
        Or audit an existing project — a live site, or a dead Replit/Bolt build →
      </button>
    );
  }

  return (
    <div className="mt-4 w-full max-w-xl rounded-2xl border border-border bg-surface/70 p-4 text-left">
      <div className="text-sm font-medium">Audit an existing project</div>
      <p className="mt-1 text-xs text-muted-2">
        Paste a URL — we read the public page and give you an honest read. To have the agents grow it, we verify you own it first.
      </p>
      <div className="mt-3 flex gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="yourproject.com"
          className="flex-1 rounded-xl glass-panel px-3 py-2.5 text-sm outline-none placeholder:text-muted-2 focus:border-coral/40"
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
        <div className="mt-3 space-y-2 text-sm">
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
        </div>
      )}
    </div>
  );
}
