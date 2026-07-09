"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/Logo";

// BLOCK 7 surface — the FUNDING PACK, rendered from /api/funding (real, verified data only). Founder-gated
// by METRICS_SECRET (same token as the board + proof ledger). Every claim shows its status + basis so it
// reads as evidence, not a pitch. Private/Ring-0 today; this is the artifact shown to an investor.
const TOKEN_KEY = "cofounder:metrics:token";

interface PackClaim { label: string; value: string; status: "proven" | "in-progress" | "not-yet"; basis: string }
interface FundingPack {
  headline: string;
  org: { departments: number; positions: number; gatedActionClasses: number };
  claims: PackClaim[];
  autonomyRatePct: number;
  goalProgressPct: number;
  honestyNote: string;
  generatedAt: string;
}
interface Resp { locked?: boolean; persisted?: boolean; pack?: FundingPack; note?: string }

const STATUS: Record<PackClaim["status"], { label: string; cls: string }> = {
  proven: { label: "proven", cls: "bg-text text-bg" },
  "in-progress": { label: "in progress", cls: "border border-border text-muted" },
  "not-yet": { label: "not yet", cls: "text-muted-2" },
};

export default function FundingPackPage() {
  const [token, setToken] = useState("");
  const [r, setR] = useState<Resp | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async (t: string) => {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/funding", { headers: t ? { authorization: `Bearer ${t}` } : {} });
      if (res.status === 401) { setErr("Token rejected. Check METRICS_SECRET."); setR(null); }
      else setR((await res.json()) as Resp);
    } catch {
      setErr("Couldn't reach /api/funding.");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    let t = "";
    try { t = localStorage.getItem(TOKEN_KEY) || ""; } catch { /* ignore */ }
    setToken(t);
    load(t);
  }, [load]);

  function saveAndLoad() {
    try { localStorage.setItem(TOKEN_KEY, token); } catch { /* ignore */ }
    load(token);
  }

  const pack = r?.pack;

  return (
    <div className="min-h-screen">
      <header className="glass-nav sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <Link href="/house" className="flex items-center gap-2.5 font-mono text-sm text-muted transition hover:text-text">
            <LogoMark size={28} /> ← the house
          </Link>
          <button onClick={() => load(token)} disabled={busy} className="font-mono text-xs text-muted transition hover:text-text disabled:opacity-50">
            {busy ? "loading…" : "refresh"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="font-mono text-xs font-semibold uppercase tracking-wider text-coral">Founder · private</div>
        <h1 className="mt-2 text-3xl font-bold">The funding pack</h1>
        <p className="mt-2 text-sm text-muted">
          Assembled from verified data only — settled revenue, live-checked receipts, real autonomy counts.
          Every line shows its <span className="text-text">status</span> and its <span className="text-text">basis</span>, so it&apos;s evidence, not a pitch.
        </p>

        {/* Token gate */}
        {(!r || r.locked || err) && (
          <div className="mt-6 rounded-2xl glass-panel p-5">
            {r?.locked && <p className="mb-3 text-sm text-muted-2">{r.note || "Set METRICS_SECRET to open the pack."}</p>}
            {err && <p className="mb-3 text-sm text-coral">{err}</p>}
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="METRICS_SECRET"
                className="min-w-[220px] flex-1 rounded-lg border border-border bg-bg/40 px-3 py-2 font-mono text-sm outline-none focus:border-coral/40"
              />
              <button onClick={saveAndLoad} className="rounded-lg bg-coral px-4 py-2 font-mono text-sm font-semibold text-bg transition hover:brightness-110">
                unlock
              </button>
            </div>
          </div>
        )}

        {pack && !r?.locked && (
          <div className="mt-6 space-y-6">
            <div className="rounded-2xl glass-panel p-6">
              <p className="text-lg font-medium text-text">{pack.headline}</p>
              <p className="mt-2 font-mono text-xs text-muted-2">
                {pack.org.departments} departments · {pack.org.positions} positions · {pack.org.gatedActionClasses} founder-gated action classes
                {r?.persisted === false ? " · (no data source — honest zeros)" : ""}
              </p>
            </div>

            {/* Two headline meters */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Meter label="Goal progress" pct={pack.goalProgressPct} caption="collected ÷ $10,000 (trailing 30d)" />
              <Meter label="Autonomy rate" pct={pack.autonomyRatePct} caption="actions run without a human" />
            </div>

            {/* Claims */}
            <div className="rounded-2xl glass-panel p-2">
              {pack.claims.map((c, i) => (
                <div key={c.label} className={`flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3 ${i > 0 ? "border-t border-border" : ""}`}>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-medium ${STATUS[c.status].cls}`}>{STATUS[c.status].label}</span>
                  <span className="text-sm font-medium text-text">{c.label}</span>
                  <span className="ml-auto font-mono text-sm text-text">{c.value}</span>
                  <span className="w-full text-[12px] leading-relaxed text-muted-2">{c.basis}</span>
                </div>
              ))}
            </div>

            <p className="rounded-2xl border border-border bg-bg/40 p-4 text-[13px] leading-relaxed text-muted">{pack.honestyNote}</p>
            <p className="font-mono text-[11px] text-muted-2">generated {new Date(pack.generatedAt).toLocaleString()}</p>
          </div>
        )}
      </main>
    </div>
  );
}

function Meter({ label, pct, caption }: { label: string; pct: number; caption: string }) {
  const w = Math.max(0, Math.min(100, pct));
  return (
    <div className="rounded-2xl glass-panel p-5">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-xs uppercase tracking-wider text-muted-2">{label}</span>
        <span className="font-mono text-lg font-bold text-text">{w}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full border border-border bg-bg/40">
        <div className="h-full rounded-full bg-text transition-all" style={{ width: `${w}%` }} />
      </div>
      <p className="mt-2 text-[12px] text-muted-2">{caption}</p>
    </div>
  );
}
