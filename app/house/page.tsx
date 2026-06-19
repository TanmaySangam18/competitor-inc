"use client";

// /house — "The House": competitor.inc, run by its own agent crew (customer zero / dogfooding).
// The Office (the /delegation floor) builds the USER's company; The House is competitor.inc building
// and growing ITSELF — marketing, demand capture, sales — founder-gated (Tanmay approves the
// consequential moves). Simulated by default, same engine as everything else.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Building2, Megaphone, CheckCircle2, ShieldCheck, Users } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { getProvider } from "@/lib/roomie/provider";
import { AGENTS, type AgentRole, type Activity, type Company } from "@/lib/roomie/types";

const HOUSE: Company = {
  id: "house",
  name: "competitor.inc",
  slug: "competitor-inc",
  idea: "The honest AI co-founder — validate before you build, proof on every action, you keep 100%.",
  createdAt: 0,
  status: "operating",
  night: 0,
  ledger: { spent: 0, credited: 0, tasksDone: 0, tasksFailed: 0 },
  product: { url: "https://competitor.inc", status: "live" },
};

export default function House() {
  const [feed, setFeed] = useState<Activity[] | null>(null);

  // Generate a few "nights" of competitor.inc's own crew working — simulated, like the rest of the app.
  useEffect(() => {
    let acts: Activity[] = [];
    let c = { ...HOUSE };
    for (let i = 0; i < 4; i++) {
      const r = getProvider().shift(c);
      acts = [...r.activities, ...acts];
      c = { ...c, night: c.night + 1 };
    }
    setFeed(acts);
  }, []);

  const recent = (feed ?? []).slice(0, 14);
  const stats = useMemo(() => {
    const done = (feed ?? []).filter((a) => a.status === "done");
    return [
      { label: "Nights run", val: "4", icon: Building2, color: "text-coral" },
      { label: "Tasks shipped", val: String(done.length), icon: CheckCircle2, color: "text-mint" },
      { label: "Revenue share taken", val: "0%", icon: ShieldCheck, color: "text-mint" },
      { label: "Run by", val: "5 agents", icon: Users, color: "text-violet" },
    ];
  }, [feed]);

  return (
    <div id="main" className="min-h-screen">
      <header className="glass-nav sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 font-mono text-lg font-bold tracking-tight">
            <LogoMark size={34} />
            competitor.inc
          </Link>
          <div className="flex items-center gap-4 text-sm text-muted">
            <Link href="/delegation" className="transition hover:text-text">The Office →</Link>
            <Link href="/live" className="transition hover:text-text">Live board</Link>
            <Link href="/" className="inline-flex items-center gap-2 transition hover:text-text">
              <ArrowLeft size={15} /> Home
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-center gap-2 text-sm text-coral">
          <Megaphone size={15} /> THE HOUSE · CUSTOMER ZERO
        </div>
        <h1 className="mt-3 text-4xl font-bold md:text-5xl">competitor.inc, run by its own agents</h1>
        <p className="mt-3 max-w-2xl text-muted">
          We use our own product on ourselves. <strong className="text-text">The Office</strong> is the
          crew building <em>your</em> company; <strong className="text-text">The House</strong> is the
          crew marketing, selling, and growing <em>competitor.inc itself</em> — proof-first, founder-gated
          (consequential moves wait for the founder&apos;s yes), and a <strong className="text-text">big-bang
          surprise launch</strong>, never a public build-diary.
        </p>

        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
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

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_300px]">
          <section>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-muted">
              <ShieldCheck size={15} className="text-violet" /> The House Glass Box · what our own crew is doing
            </h2>
            <div className="mt-4 space-y-2.5">
              {feed === null ? (
                <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-2">
                  Waking the House crew…
                </div>
              ) : (
                recent.map((a) => {
                  const A = AGENTS[a.agent as AgentRole];
                  const failed = a.status === "failed-credited";
                  return (
                    <div key={a.id} className="flex items-center gap-3 rounded-xl glass-panel px-4 py-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-[10px] font-bold">{A.name.charAt(0)}</span>
                      <div className="min-w-0 flex-1 text-sm">
                        <span className="text-text">{a.action}</span>
                        <span className="ml-2 text-xs text-muted-2">{A.name} · night {a.night}</span>
                      </div>
                      {failed ? (
                        <span className="shrink-0 rounded-md bg-mint/12 px-2 py-1 text-[11px] text-mint">credited back</span>
                      ) : a.proof ? (
                        <span className="hidden shrink-0 text-[11px] text-mint sm:inline">{a.proof.value}</span>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <aside>
            <h2 className="text-sm font-semibold text-muted">The House crew</h2>
            <div className="mt-4 space-y-2.5">
              {(Object.keys(AGENTS) as AgentRole[]).map((role) => {
                const A = AGENTS[role];
                return (
                  <div key={role} className="rounded-xl glass-panel p-4">
                    <div className="text-sm font-medium">{A.name} <span className="text-muted-2">· {A.label}</span></div>
                    <div className="mt-1 text-[11px] leading-relaxed text-muted-2">{A.blurb}</div>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 rounded-xl border border-dashed border-border px-4 py-3 text-[11px] leading-relaxed text-muted-2">
              Simulated showcase of the concept. With keys connected, the House&apos;s consequential moves
              (spend, outreach, deploy) route through the founder&apos;s Approval Inbox — same gate as the Office.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
