"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, Plus, Trash2, ChevronRight, ChevronLeft, ShieldCheck } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { FOUNDER_EMAILS } from "@/lib/engine/founders";
import { useAuth } from "@/lib/engine/useAuth";

// Same on-device unlock the House uses when Supabase isn't configured (dev convenience only — it can't
// fire off localhost, so a deployed site without Supabase stays locked to strangers).
function hostIsLocalhost(): boolean {
  if (typeof window === "undefined") return false;
  return /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);
}

// The CRM Ledger (Blond "Predictable Revenue" pipeline, founder tool) — track cohort-owner deals from
// cold target to signed Cohort Lab license, and see projected MRR against the $10K goal. Client-only:
// founder-gated like the rest of the House, persisted to localStorage (this is the founder's own
// pipeline, not customer data). No fabricated deals — you enter what's real.

const STAGES = [
  { key: "target", label: "Target", weight: 0.02 },
  { key: "contacted", label: "Contacted", weight: 0.05 },
  { key: "call", label: "Call booked", weight: 0.2 },
  { key: "pilot", label: "Pilot", weight: 0.5 },
  { key: "license", label: "License (won)", weight: 1 },
  { key: "passed", label: "Passed", weight: 0 },
] as const;
type StageKey = (typeof STAGES)[number]["key"];

interface Deal {
  id: string;
  name: string; // program / org
  contact: string; // person + role (optional)
  stage: StageKey;
  mrr: number; // expected monthly $ (Cohort Lab ~1500-2500)
  note: string;
  at: number;
}

const KEY = "cofounder:ledger:v1";
const GOAL_MRR = 10000;
const uid = () => (crypto?.randomUUID ? crypto.randomUUID() : String(Math.random()));
const stageMeta = (k: StageKey) => STAGES.find((s) => s.key === k)!;

export default function LedgerPage() {
  const { user } = useAuth();
  const [localhost, setLocalhost] = useState(false);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState({ name: "", contact: "", mrr: "2000", note: "" });

  useEffect(() => { setLocalhost(hostIsLocalhost()); }, []);
  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setDeals(JSON.parse(raw)); } catch { /* ignore */ }
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) try { localStorage.setItem(KEY, JSON.stringify(deals)); } catch { /* ignore */ } }, [deals, loaded]);

  const configured = FOUNDER_EMAILS.length > 0 && !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isFounder = configured ? !!user && !user.guest && FOUNDER_EMAILS.includes(user.email.toLowerCase()) : localhost;

  const totals = useMemo(() => {
    const won = deals.filter((d) => d.stage === "license").reduce((n, d) => n + d.mrr, 0);
    const weighted = deals.reduce((n, d) => n + d.mrr * stageMeta(d.stage).weight, 0);
    const open = deals.filter((d) => d.stage !== "license" && d.stage !== "passed").reduce((n, d) => n + d.mrr, 0);
    return { won, weighted: Math.round(weighted), open };
  }, [deals]);

  function add() {
    const name = form.name.trim();
    if (!name) return;
    setDeals((d) => [{ id: uid(), name, contact: form.contact.trim(), stage: "target", mrr: Math.max(0, parseInt(form.mrr, 10) || 0), note: form.note.trim(), at: Date.now() }, ...d]);
    setForm({ name: "", contact: "", mrr: "2000", note: "" });
  }
  function move(id: string, dir: 1 | -1) {
    setDeals((ds) => ds.map((d) => {
      if (d.id !== id) return d;
      const i = STAGES.findIndex((s) => s.key === d.stage);
      const ni = Math.max(0, Math.min(STAGES.length - 1, i + dir));
      return { ...d, stage: STAGES[ni].key };
    }));
  }
  const remove = (id: string) => setDeals((ds) => ds.filter((d) => d.id !== id));

  if (!isFounder) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg mesh px-6 text-center">
        <div>
          <LogoMark size={40} className="mx-auto" />
          <p className="mt-4 text-sm text-muted">The Ledger is founder-only. Sign in with a founder email.</p>
          <Link href="/house" className="mt-6 inline-flex items-center gap-2 text-xs text-muted-2 hover:text-text"><ArrowLeft size={13} /> House</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="glass-nav sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/house" className="flex items-center gap-2.5 font-mono text-lg font-bold tracking-tight">
            <LogoMark size={30} /> Pipeline ledger
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/house/board" className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-text"><BarChart3 size={15} /> Board</Link>
            <Link href="/house/proof" className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-text"><ShieldCheck size={15} /> Proof</Link>
            <Link href="/house" className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-text"><ArrowLeft size={15} /> House</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* progress to $10K */}
        <div className="rounded-3xl border border-coral/30 bg-coral/[0.05] p-6">
          <div className="text-xs uppercase tracking-wide text-coral">Cohort-owner pipeline → $10K MRR</div>
          <div className="mt-1 flex flex-wrap items-end gap-x-8 gap-y-2">
            <div><span className="font-display text-4xl font-bold">${totals.won.toLocaleString()}</span> <span className="text-sm text-muted-2">/ ${GOAL_MRR.toLocaleString()} won MRR</span></div>
            <div className="text-sm text-muted">${totals.weighted.toLocaleString()} weighted · ${totals.open.toLocaleString()} open pipeline</div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-border">
            <div className="h-full rounded-full bg-coral transition-all" style={{ width: `${Math.min(100, (totals.won / GOAL_MRR) * 100)}%` }} />
          </div>
          <p className="mt-2 text-[11px] text-muted-2">Weighted = Σ(expected MRR × stage probability). You enter real deals only — this mirrors your actual conversations, nothing invented.</p>
        </div>

        {/* add a deal */}
        <div className="mt-6 grid gap-2 sm:grid-cols-[1.4fr_1.4fr_0.7fr_auto]">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Program / org (e.g. NU IDEA)" className="rounded-xl glass-panel px-3 py-2.5 text-sm outline-none placeholder:text-muted-2" />
          <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="Contact + role (optional)" className="rounded-xl glass-panel px-3 py-2.5 text-sm outline-none placeholder:text-muted-2" />
          <input value={form.mrr} onChange={(e) => setForm({ ...form, mrr: e.target.value.replace(/[^0-9]/g, "") })} placeholder="$/mo" className="rounded-xl glass-panel px-3 py-2.5 text-sm outline-none placeholder:text-muted-2" aria-label="Expected MRR" />
          <button onClick={add} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-text px-4 py-2.5 text-sm font-semibold text-bg transition hover:opacity-90"><Plus size={15} /> Add</button>
        </div>
        <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Note — why they'd care, next step…" className="mt-2 w-full rounded-xl glass-panel px-3 py-2.5 text-sm outline-none placeholder:text-muted-2" />

        {/* stage columns */}
        <div className="mt-6 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          {STAGES.map((st) => {
            const inStage = deals.filter((d) => d.stage === st.key);
            return (
              <div key={st.key} className="rounded-2xl border border-border bg-bg/40 p-3">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-muted-2">
                  <span>{st.label}</span><span>{inStage.length}</span>
                </div>
                <div className="mt-2 space-y-2">
                  {inStage.map((d) => (
                    <div key={d.id} className="rounded-xl border border-border bg-surface/50 p-2.5">
                      <div className="text-sm font-medium leading-tight">{d.name}</div>
                      {d.contact && <div className="text-[11px] text-muted-2">{d.contact}</div>}
                      <div className="mt-0.5 text-[11px] text-mint">${d.mrr.toLocaleString()}/mo</div>
                      {d.note && <div className="mt-1 text-[11px] text-muted line-clamp-2">{d.note}</div>}
                      <div className="mt-2 flex items-center gap-1">
                        <button onClick={() => move(d.id, -1)} aria-label="Back a stage" className="grid h-6 w-6 place-items-center rounded border border-border text-muted-2 hover:text-text"><ChevronLeft size={12} /></button>
                        <button onClick={() => move(d.id, 1)} aria-label="Forward a stage" className="grid h-6 w-6 place-items-center rounded border border-border text-muted-2 hover:text-text"><ChevronRight size={12} /></button>
                        <button onClick={() => remove(d.id)} aria-label="Remove" className="ml-auto grid h-6 w-6 place-items-center rounded border border-border text-muted-2 hover:text-coral"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  ))}
                  {inStage.length === 0 && <div className="rounded-lg border border-dashed border-border px-2 py-3 text-center text-[10px] text-muted-2">—</div>}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-[11px] text-muted-2">
          Seed this from <Link href="/dashboard" className="underline-offset-2 hover:text-text">docs/gtm/cohort-targets.md</Link> once the target list lands.
          5 licenses at ~$2k/mo = the goal. Move a card right as each conversation advances.
        </p>
      </div>
    </div>
  );
}
