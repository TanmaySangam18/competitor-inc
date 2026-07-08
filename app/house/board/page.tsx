"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, KeyRound, BarChart3, ShieldCheck, GraduationCap } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { LandingFunnel } from "@/components/house/LandingFunnel";

// Founder KPI board (Block 9). Reads aggregate funnel counts from /api/metrics (bearer-guarded by
// METRICS_SECRET) and shows them against the growth-model thresholds. No PII; numbers load only with
// the founder's token (kept on-device). Steer with live data instead of the GROWTH-MODEL.md priors.
const TOKEN_KEY = "cofounder:metrics:token";

interface Ppu {
  value: number;
  paidUsers: number;
  provenOutcomes: number;
  activatedCompanies: number;
  totalCompanies: number;
  signedUpUsers: number;
  activationRate: number; // 0–1
  freeToPaid: number; // 0–1
  costPerPpu: number | null;
  retention14d: number | null;
}

interface Metrics {
  locked?: boolean;
  persisted?: boolean;
  ppu?: Ppu;
  mrr?: number;
  goal?: number;
  funnel?: { visits: number; toolRuns: number; signups: number; paid: number };
  waitlist?: number;
  waitlistReferred?: number;
  demandTests?: number;
  demandSignups?: number;
  note?: string;
}

const pct = (n: number | undefined) => `${Math.round((n ?? 0) * 100)}%`;

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

// Founding-member reservation count — reads the public aggregate from /api/interest (no PII, no auth).
function FoundingTally() {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    let on = true;
    fetch("/api/interest?app=founding-operator")
      .then((r) => r.json())
      .then((d: { count?: number }) => { if (on) setCount(typeof d.count === "number" ? d.count : 0); })
      .catch(() => {});
    return () => { on = false; };
  }, []);
  return (
    <Stat
      label="Founding members"
      value={count === null ? "…" : String(count)}
      target="proven intent"
      hint="Reserved to pay when paid opens (F1-safe capture)"
    />
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
          <div className="flex items-center gap-4">
            <Link href="/house/ledger" className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-text">
              <BarChart3 size={15} /> Pipeline
            </Link>
            <Link href="/house/cohort" className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-text">
              <GraduationCap size={15} /> Cohort Lab
            </Link>
            <Link href="/house/proof" className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-text">
              <ShieldCheck size={15} /> Proof ledger
            </Link>
            <Link href="/house" className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-text">
              <ArrowLeft size={15} /> House
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <BarChart3 size={16} className="text-coral" /> North Star — Proven Paying Users
          <DeployFreshness />
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

        {/* The North Star — Proven Paying Users (paid AND ≥1 verified, receipted outcome). */}
        <div className="mt-6 rounded-3xl border border-coral/30 bg-coral/[0.05] p-6">
          <div className="text-xs uppercase tracking-wide text-coral">Proven Paying Users · the only number we chase</div>
          <div className="mt-1 flex items-end gap-3">
            <span className="font-display text-6xl font-bold">{m?.ppu?.value ?? 0}</span>
            <span className="mb-2 text-sm text-muted-2">/ 50–150 · 4-week target</span>
          </div>
          <p className="mt-2 max-w-xl text-sm text-muted">
            On a paid plan <span className="text-muted-2">(demand)</span> · with a verified, receipted Glass-Box outcome{" "}
            <span className="text-muted-2">(delivery + trust)</span>. Signups test none of these.
          </p>
        </div>

        {/* MRR vs the $10K / 60-day goal — the revenue we're driving to (docs/PLAN-10K-60DAY.md). */}
        <div className="mt-5 rounded-3xl border border-mint/30 bg-mint/[0.05] p-6">
          <div className="flex items-baseline justify-between">
            <div className="text-xs uppercase tracking-wide text-mint">MRR · list-price from active subs</div>
            <div className="text-xs text-muted-2">60-day goal</div>
          </div>
          <div className="mt-1 flex items-end gap-2">
            <span className="font-display text-5xl font-bold">${(m?.mrr ?? 0).toLocaleString()}</span>
            <span className="mb-1.5 text-sm text-muted-2">/ ${(m?.goal ?? 10000).toLocaleString()}</span>
          </div>
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-mint transition-all"
              style={{ width: `${Math.min(100, ((m?.mrr ?? 0) / (m?.goal || 10000)) * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-2">
            Estimate off list price; settled revenue lives in revenue_events. Never counts toward PPU without a verified outcome.
          </p>
        </div>

        {/* THE FUNNEL — the proof: real count at every step + conversion between. Zero = a real zero. */}
        {(() => {
          const f = m?.funnel;
          const steps = [
            { label: "Visits", n: f?.visits ?? 0, hint: "landed" },
            { label: "Tool runs", n: f?.toolRuns ?? 0, hint: "/sell + /score" },
            { label: "Signups", n: f?.signups ?? 0, hint: "created an account" },
            { label: "Paid", n: f?.paid ?? 0, hint: "active subscription" },
            { label: "Settled", n: Math.round(m?.mrr ?? 0), hint: "$ MRR", money: true },
          ];
          const conv = (a: number, b: number) => (a > 0 ? `${Math.round((b / a) * 100)}%` : "—");
          return (
            <div className="mt-6 rounded-2xl border border-border bg-bg/40 p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-text">The funnel · does it convert?</div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {steps.map((s, i) => (
                  <div key={s.label}>
                    <div className="text-[11px] uppercase tracking-wide text-muted-2">{s.label}</div>
                    <div className="mt-1 font-display text-2xl font-bold">{s.money ? "$" : ""}{s.n.toLocaleString()}</div>
                    <div className="mt-0.5 text-[11px] text-muted-2">{s.hint}</div>
                    {i > 0 && <div className="mt-1 text-[11px] text-mint">{conv(steps[i - 1].n, s.n)} of prev</div>}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-muted-2">
                Real counts (0 is a real 0). Fix the widest leak first: pour effort into the step with the lowest conversion.
              </p>
            </div>
          );
        })()}

        {/* Input funnel — the diagnostics beneath the North Star. */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Paid users" value={String(m?.ppu?.paidUsers ?? 0)} hint="Active Operator subscriptions" />
          <Stat label="Proven outcomes" value={String(m?.ppu?.provenOutcomes ?? 0)} hint="Real, receipted agent actions" />
          <Stat label="Activation" value={pct(m?.ppu?.activationRate)} target="rising" hint="Companies with a first verified action" />
          <Stat label="Free → paid" value={pct(m?.ppu?.freeToPaid)} target="≥4%" hint="OpenView median 2–5%" />
        </div>

        {/* Diagnostics — watch to debug the funnel; NEVER a goal. */}
        <div className="mt-8 text-xs font-semibold uppercase tracking-wide text-muted-2">Diagnostics — watch, don&apos;t chase</div>
        <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Waitlist signups" value={String(m?.waitlist ?? 0)} hint="A funnel input, not a goal" />
          <Stat label="Referred signups" value={String(m?.waitlistReferred ?? 0)} hint="Viral loop working when this climbs" />
          <Stat label="Live demand tests" value={String(m?.demandTests ?? 0)} hint="Real demand reads, not estimates" />
          <Stat label="Demand-test signups" value={String(m?.demandSignups ?? 0)} hint="Interest in users' ideas" />
        </div>

        {/* KPIs still awaiting instrumentation — shown honestly so we don't fake them. */}
        <div className="mt-6 text-xs font-semibold uppercase tracking-wide text-muted-2">Unit economics &amp; retention</div>
        <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Stat
            label="14-day retention"
            value={m?.ppu?.retention14d != null ? pct(m.ppu.retention14d) : "—"}
            target="rising"
            hint="Share of paid users committed >14 days out (forward proxy)"
          />
          <Stat
            label="Cost per PPU"
            value={m?.ppu?.costPerPpu != null ? `$${m.ppu.costPerPpu.toFixed(2)}` : "—"}
            target="bounded"
            hint="Net spend ÷ PPU — keep under your cap"
          />
          <Stat label="PMF score" value="—" target="≥40%" hint="Needs the Sean-Ellis survey" />
        </div>

        {/* Founding-member reservations — the F1-safe "want to pay" capture (pre-EAD proven intent). */}
        <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FoundingTally />
        </div>

        {/* Landing funnel — where launch visitors drop (public aggregate pixel, no PII). */}
        <LandingFunnel slug="home" />

        <p className="mt-8 text-xs text-muted-2">
          North Star + thresholds: kill signups as a goal; chase Proven Paying Users (50–150 in 4 weeks). A hundred
          paying, proven, retained users beats ten thousand dead emails.
        </p>
      </div>
    </div>
  );
}

// Deploy freshness — commits and prod are different states; this chip reconciles them at a glance.
// Green under 24h, amber under 72h, red beyond (a red chip is how a silently-blocked deploy pipeline
// announces itself instead of hiding for days).
function DeployFreshness() {
  const [builtAt, setBuiltAt] = useState<number | null>(null);
  useEffect(() => {
    fetch("/api/version").then((r) => r.json()).then((d) => setBuiltAt(d?.builtAt ?? null)).catch(() => {});
  }, []);
  if (!builtAt) return null;
  const hours = (Date.now() - builtAt) / 36e5;
  const label = hours < 1 ? "built <1h ago" : hours < 48 ? `built ${Math.round(hours)}h ago` : `built ${Math.round(hours / 24)}d ago`;
  const tone = hours < 24 ? "text-mint bg-mint/10" : hours < 72 ? "text-amber bg-amber/10" : "text-coral bg-coral/10";
  return <span className={`ml-auto rounded-full px-2.5 py-1 text-[10px] font-semibold ${tone}`} title="Production build age — red means deploys may be silently failing">{label}</span>;
}
