"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Building2, Moon, CheckCircle2, Wallet, ShieldCheck } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import type { Activity, ApprovalItem, Company } from "@/lib/roomie/types";
import { AGENTS, type AgentRole } from "@/lib/roomie/types";

interface Store {
  companies: Company[];
  activities: Record<string, Activity[]>;
  approvals: Record<string, ApprovalItem[]>;
}

export default function Live() {
  const [store, setStore] = useState<Store | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("roomie:v2");
      setStore(raw ? (JSON.parse(raw) as Store) : { companies: [], activities: {}, approvals: {} });
    } catch {
      setStore({ companies: [], activities: {}, approvals: {} });
    }
  }, []);

  const companies = store?.companies ?? [];
  const allActivities = Object.values(store?.activities ?? {}).flat();
  const allApprovals = Object.values(store?.approvals ?? {}).flat();
  const totals = {
    companies: companies.length,
    nights: companies.reduce((t, c) => t + c.night, 0),
    tasks: companies.reduce((t, c) => t + c.ledger.tasksDone, 0),
    spend: companies.reduce((t, c) => t + (c.ledger.spent - (c.ledger.credited ?? 0)), 0),
    approvals: allApprovals.filter((a) => a.resolved).length,
  };

  const recent = allActivities.filter((a) => !a.undone).slice(0, 12);

  const stats = [
    { label: "Companies", val: String(totals.companies), icon: Building2, color: "text-coral" },
    { label: "Nights run", val: String(totals.nights), icon: Moon, color: "text-violet" },
    { label: "Tasks shipped", val: String(totals.tasks), icon: CheckCircle2, color: "text-mint" },
    { label: "Net spend", val: "$" + totals.spend.toFixed(2), icon: Wallet, color: "text-amber" },
    { label: "Approvals handled", val: String(totals.approvals), icon: ShieldCheck, color: "text-mint" },
  ];

  return (
    <div id="main" className="min-h-screen">
      <header className="glass-nav sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 font-mono text-lg font-bold tracking-tight">
            <LogoMark size={34} />
            competitor.inc
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-text">
            <ArrowLeft size={15} /> Home
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-center gap-2 text-sm text-mint">
          <span className="live-dot inline-block h-2 w-2 rounded-full bg-mint" /> LIVE WORKSPACE
        </div>
        <h1 className="mt-3 text-4xl font-bold md:text-5xl">What competitor.inc is doing</h1>
        <p className="mt-3 max-w-xl text-muted">
          A public, real-time view of every company competitor.inc has validated and is building — the
          Glass Box, out in the open.
        </p>

        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-5">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl glass-panel p-5"
            >
              <s.icon size={18} className={s.color} />
              <div className="mt-3 font-display text-3xl font-bold">{s.val}</div>
              <div className="mt-1 text-xs text-muted-2">{s.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_320px]">
          <section>
            <h2 className="text-sm font-semibold text-muted">Live activity</h2>
            <div className="mt-4 space-y-2.5">
              {recent.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-2">
                  No activity yet. <Link href="/dashboard" className="text-coral">Start a company</Link> and the board lights up.
                </div>
              ) : (
                recent.map((a) => {
                  const A = AGENTS[a.agent as AgentRole];
                  return (
                    <div key={a.id} className="flex items-center gap-3 rounded-xl glass-panel px-4 py-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-[10px] font-bold">{A.name.charAt(0)}</span>
                      <div className="min-w-0 flex-1 text-sm">
                        <span className="text-text">{a.action}</span>
                        <span className="ml-2 text-xs text-muted-2">{A.name} · night {a.night}</span>
                      </div>
                      {a.proof && <span className="hidden text-[11px] text-mint sm:inline">{a.proof.value}</span>}
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <aside>
            <h2 className="text-sm font-semibold text-muted">Companies</h2>
            <div className="mt-4 space-y-2.5">
              {companies.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-xs text-muted-2">None yet.</div>
              ) : (
                companies.map((c) => (
                  <div key={c.id} className="rounded-xl glass-panel p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{c.name}</span>
                      <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-2">{c.status}</span>
                    </div>
                    <div className="mt-1.5 truncate text-xs text-muted-2">{c.idea}</div>
                    {c.validation && (
                      <span
                        className={`mt-2.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                          c.validation.verdict === "strong"
                            ? "border-white/30 bg-white/10 text-text"
                            : c.validation.verdict === "mixed"
                            ? "border-white/15 bg-white/[0.05] text-muted"
                            : "border-white/10 text-muted-2"
                        }`}
                      >
                        <ShieldCheck size={10} /> Validated · {c.validation.confidence}%
                      </span>
                    )}
                    <div className="mt-3 flex gap-4 text-xs text-muted">
                      <span>{c.night} nights</span>
                      <span>{c.ledger.tasksDone} tasks</span>
                      <span>${(c.ledger.spent - (c.ledger.credited ?? 0)).toFixed(2)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
