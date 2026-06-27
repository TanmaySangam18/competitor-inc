"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, KeyRound, BarChart3 } from "lucide-react";
import { LogoMark } from "@/components/Logo";

// Founder KPI board (Block 9). Reads aggregate funnel counts from /api/metrics (bearer-guarded by
// METRICS_SECRET) and shows them against the growth-model thresholds. No PII; numbers load only with
// the founder's token (kept on-device). Steer with live data instead of the GROWTH-MODEL.md priors.
const TOKEN_KEY = "cofounder:metrics:token";

interface Metrics {
  locked?: boolean;
  persisted?: boolean;
  waitlist?: number;
  waitlistReferred?: number;
  demandTests?: number;
  demandSignups?: number;
  note?: string;
}

function Stat({ label, value, target, hint }: { label: string; value: string; target?: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-bg/40 p-4">
      <div className="text-xs uppercase tracking-wide text-muted-2">{label}</div>
      <div className="mt-1 flex items-end gap-2">
        <span className="font-display text-3xl font-bold">{value}</span>
        {target && <span className="mb-1 text-sm text-muted-2">/ {target}</span>}
      </div>
      {hint && <div className="mt-1 text-xs text-muted-2">{hint}</div>}
    </div>
  );
}

export default function Board() {
  const [token, setToken] = useState("");
  const [m, setM] = useState<Metrics | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async (t: string) => {
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/metrics", { headers: t ? { authorization: `Bearer ${t}` } : {} });
      if (r.status === 401) {
        setErr("Token rejected. Check METRICS_SECRET.");
        setM(null);
      } else {
        setM((await r.json()) as Metrics);
      }
    } catch {
      setErr("Couldn't reach /api/metrics.");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    let t = "";
    try {
      t = localStorage.getItem(TOKEN_KEY) || "";
    } catch {
      /* ignore */
    }
    setToken(t);
    load(t);
  }, [load]);

  function saveAndLoad() {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* ignore */
    }
    load(token);
  }

  const locked = m?.locked;
  const persisted = m?.persisted;

  return (
    <div className="min-h-screen">
      <header className="glass-nav sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <Link href="/house" className="flex items-center gap-2.5 font-mono text-lg font-bold tracking-tight">
            <LogoMark size={32} /> Founder board
          </Link>
          <Link href="/house" className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-text">
            <ArrowLeft size={15} /> House
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <BarChart3 size={16} className="text-coral" /> Live funnel — vs the growth model
        </div>

        {locked && (
          <div className="mt-4 rounded-2xl border border-amber/30 bg-amber/[0.06] px-4 py-3 text-sm text-muted">
            The board is off. Set <span className="font-mono text-text">METRICS_SECRET</span> in your deploy env, then
            paste it below. {m?.note}
          </div>
        )}

        {/* Token entry (kept on-device only) */}
        <div className="mt-4 flex items-center gap-2">
          <div className="relative flex-1">
            <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-2" />
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveAndLoad()}
              placeholder="METRICS_SECRET (stored on this device only)"
              className="w-full rounded-xl glass-panel py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-muted-2 focus:border-coral/40"
            />
          </div>
          <button
            onClick={saveAndLoad}
            disabled={busy}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-text px-4 py-2.5 text-sm font-semibold text-bg transition hover:opacity-90 disabled:opacity-50"
          >
            <RefreshCw size={14} className={busy ? "animate-spin" : ""} /> Load
          </button>
        </div>
        {err && <p className="mt-2 text-xs text-coral">{err}</p>}
        {!persisted && !locked && (
          <p className="mt-2 text-xs text-muted-2">Connected, but no database yet — numbers light up once Supabase is set.</p>
        )}

        {/* The numbers we actually capture today */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Stat label="Waitlist signups" value={String(m?.waitlist ?? 0)} target="2,000" hint="Pre-launch goal · P(reach) 25–45%" />
          <Stat label="Referred signups" value={String(m?.waitlistReferred ?? 0)} hint="Viral loop working when this share climbs" />
          <Stat label="Live demand tests" value={String(m?.demandTests ?? 0)} hint="Make the gate real, not an estimate" />
          <Stat label="Demand-test signups" value={String(m?.demandSignups ?? 0)} hint="Real interest in users' ideas" />
        </div>

        {/* KPIs that need a key/feature before they read live — shown with their thresholds (honest) */}
        <div className="mt-6 text-xs font-semibold uppercase tracking-wide text-muted-2">Wire these up next</div>
        <div className="mt-2 grid gap-4 sm:grid-cols-3">
          <Stat label="Free → paid" value="—" target="≥4%" hint="Needs Stripe (OpenView median 2–5%)" />
          <Stat label="PMF score" value="—" target="≥40%" hint="Needs the Sean-Ellis survey" />
          <Stat label="Monthly churn" value="—" target="<5%" hint="Needs ≥1 paid cohort" />
        </div>

        <p className="mt-8 text-xs text-muted-2">
          Thresholds from <span className="text-muted">docs/GROWTH-MODEL.md</span>. Update the model once these read live.
        </p>
      </div>
    </div>
  );
}
