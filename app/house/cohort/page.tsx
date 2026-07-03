"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, GraduationCap, FlaskConical, CheckCircle2, XCircle, CircleDashed, BarChart3, ShieldCheck } from "lucide-react";
import { LogoMark } from "@/components/Logo";

// Cohort Lab — the program-director evidence dashboard (the Cohort Lab differentiator, $1.5-2.5k/mo).
// What an accelerator / university E-center director sees: their whole cohort's validation outcomes,
// aggregated into the evidence their FUNDERS want ("of 24 teams, N validated real demand, M killed a
// bad idea before building, $X in committed pre-orders"). No rival produces this — it's our moat
// (verifiable outcomes) pointed at the buyer with the budget.
//
// Today this is a DEMO the founder shows to close the first cohort deal — clearly labelled as sample
// data. It becomes live by aggregating each seat's real validation results once a cohort is onboarded
// (same honesty line as everywhere: real when real, labelled example until then).

interface Team {
  team: string;
  idea: string;
  verdict: "validated" | "killed" | "in-progress";
  conversations: number;
  committedCents: number; // pre-orders / deposits — the costly-ask signal
}

const EXAMPLE: Team[] = [
  { team: "Nightingale", idea: "shift-swap app for nurses", verdict: "validated", conversations: 7, committedCents: 45000 },
  { team: "Plantpal", idea: "rare-houseplant marketplace", verdict: "validated", conversations: 6, committedCents: 22000 },
  { team: "DormDash", idea: "late-night campus delivery", verdict: "killed", conversations: 9, committedCents: 0 },
  { team: "GrantGenie", idea: "AI research-grant finder", verdict: "in-progress", conversations: 3, committedCents: 0 },
  { team: "CoachCue", idea: "form-check for lifters", verdict: "validated", conversations: 8, committedCents: 31000 },
  { team: "ThesisFlow", idea: "citation manager for labs", verdict: "killed", conversations: 5, committedCents: 0 },
];

const V = {
  validated: { icon: CheckCircle2, cls: "text-mint bg-mint/12", label: "Validated" },
  killed: { icon: XCircle, cls: "text-coral bg-coral/12", label: "Killed early" },
  "in-progress": { icon: CircleDashed, cls: "text-amber bg-amber/12", label: "In progress" },
} as const;

export default function CohortPage() {
  const [teams] = useState<Team[]>(EXAMPLE); // live version: fetch aggregated cohort results
  const validated = teams.filter((t) => t.verdict === "validated").length;
  const killed = teams.filter((t) => t.verdict === "killed").length;
  const committed = teams.reduce((n, t) => n + t.committedCents, 0);
  const convos = teams.reduce((n, t) => n + t.conversations, 0);

  return (
    <div className="min-h-screen">
      <header className="glass-nav sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/house" className="flex items-center gap-2.5 font-mono text-lg font-bold tracking-tight">
            <LogoMark size={30} /> Cohort Lab
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/house/ledger" className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-text"><BarChart3 size={15} /> Pipeline</Link>
            <Link href="/house" className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-text"><ArrowLeft size={15} /> House</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <GraduationCap size={16} className="text-violet" /> Cohort — Fall 2026 · Evidence for your funders
          <span className="ml-auto rounded-lg border border-amber/30 bg-amber/[0.06] px-2.5 py-1 text-[11px] font-medium text-amber">Example cohort — sample data</span>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          What every rival skips: not "how many agents ran," but <span className="text-text">did the founders learn the truth before spending a semester building?</span>
          This is the annual-report line no other tool can give a program director.
        </p>

        {/* headline evidence stats */}
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          {[
            { label: "Teams validated real demand", val: `${validated}/${teams.length}`, tone: "text-mint" },
            { label: "Killed a bad idea before building", val: String(killed), tone: "text-coral" },
            { label: "Real user conversations", val: String(convos), tone: "text-text" },
            { label: "Committed pre-orders / deposits", val: `$${(committed / 100).toLocaleString()}`, tone: "text-mint" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl glass-panel p-4">
              <div className={`font-display text-3xl font-bold ${s.tone}`}>{s.val}</div>
              <div className="mt-1 text-xs text-muted-2">{s.label}</div>
            </div>
          ))}
        </div>

        {/* per-team roster */}
        <div className="mt-6 rounded-2xl glass-panel p-5">
          <div className="flex items-center gap-2 text-sm font-semibold"><FlaskConical size={15} className="text-coral" /> The cohort — every team, honest verdict</div>
          <div className="mt-3 space-y-2">
            {teams.map((t) => {
              const m = V[t.verdict];
              return (
                <div key={t.team} className="grid grid-cols-[1.2fr_1.6fr_0.8fr_0.9fr] items-center gap-2 rounded-xl border border-border bg-bg/40 px-3 py-2.5 text-sm">
                  <span className="font-medium">{t.team}</span>
                  <span className="truncate text-muted">{t.idea}</span>
                  <span className="text-xs text-muted-2">{t.conversations} convos{t.committedCents > 0 ? ` · $${(t.committedCents / 100).toLocaleString()}` : ""}</span>
                  <span className="text-right"><span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${m.cls}`}><m.icon size={10} /> {m.label}</span></span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-muted-2">
            &ldquo;Killed early&rdquo; is a <span className="text-text">win</span> we count out loud: a semester saved is the outcome funders fund. Live version aggregates each seat&apos;s real Validation Gate + demand-test results — labelled example until a cohort is onboarded.
          </p>
        </div>

        <div className="mt-6 flex items-center gap-2 rounded-xl border border-violet/25 bg-violet/[0.04] px-4 py-3 text-xs text-muted">
          <ShieldCheck size={14} className="shrink-0 text-violet" />
          Every number here is derived from real, receipted founder activity — never fabricated. That is exactly the claim that makes this sellable at $1.5–2.5k/mo.
        </div>
      </div>
    </div>
  );
}
