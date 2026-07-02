"use client";

import { useState } from "react";
import { AlertTriangle, Check, Gauge, MessagesSquare, Plus, Target, Trash2 } from "lucide-react";
import { useEngine } from "@/lib/engine/useEngine";
import type { Company } from "@/lib/engine/types";
import { netSpend } from "@/lib/engine/ledger";
import { LogoMark } from "@/components/Logo";
import { Stat } from "@/components/dashboard/Stat";

// Operate (EOS company-OS, flag-gated by NEXT_PUBLIC_OPERATE in the dashboard).
export function OperateTab({ r, c }: { r: ReturnType<typeof useEngine>; c: Company }) {
  const [rock, setRock] = useState("");
  const [issue, setIssue] = useState("");
  const net = netSpend(c);
  const resolvedApprovals = r.approvals.filter((a) => a.resolved).length;
  const doneRocks = r.operate.rocks.filter((rk) => rk.done).length;
  const autoIssues = r.activities
    .filter((a) => a.status === "failed-credited" || a.meta === "recommend killing")
    .slice(0, 4)
    .map((a) => (a.meta === "recommend killing" ? a.action : `${a.action} — credited back, not charged`));
  const openCount = r.operate.issues.filter((i) => !i.resolved).length + autoIssues.length;

  const score = [
    { label: "Net spend", val: "$" + net.toFixed(2) },
    { label: "Tasks shipped", val: String(c.ledger.tasksDone) },
    { label: "Validation", val: (c.validation?.confidence ?? "—") + "%" },
    { label: "Approvals handled", val: String(resolvedApprovals) },
    { label: "Marginal cost", val: "$0" },
    { label: "Open issues", val: String(openCount) },
  ];

  const review =
    `This quarter Apex shipped ${c.ledger.tasksDone} task${c.ledger.tasksDone === 1 ? "" : "s"} for ${c.name} ` +
    `at $${net.toFixed(2)} net spend — marginal cost ~$0 (BYOK / free-tier). Validation confidence ` +
    `${c.validation?.confidence ?? "—"}%. ${doneRocks}/${r.operate.rocks.length} Rocks done, ${openCount} open issue${openCount === 1 ? "" : "s"}. ` +
    (openCount > 0 ? "Recommended focus: run IDS on the top issue." : "Recommended focus: keep shipping the winners.");

  return (
    <div className="space-y-8">
      <section>
        <h2 className="flex items-center gap-2 text-sm font-semibold text-muted">
          <Gauge size={15} className="text-violet" /> Scorecard · the numbers that matter
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {score.map((s) => (
            <Stat key={s.label} label={s.label} val={s.val} />
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-muted">
            <Target size={15} className="text-coral" /> Rocks · this quarter ({doneRocks}/{r.operate.rocks.length})
          </h2>
          <div className="mt-4 space-y-2">
            {r.operate.rocks.length === 0 && (
              <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-xs text-muted-2">No Rocks yet — set 3–5 priorities for the quarter.</div>
            )}
            {r.operate.rocks.map((rk) => (
              <div key={rk.id} className="flex items-center gap-3 rounded-xl glass-panel px-3 py-2.5">
                <button onClick={() => r.toggleRock(rk.id)} aria-label="Toggle rock" className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${rk.done ? "border-mint bg-mint text-bg" : "border-muted-2"}`}>
                  {rk.done && <Check size={12} />}
                </button>
                <span className={`flex-1 text-sm ${rk.done ? "text-muted line-through" : "text-text"}`}>{rk.title}</span>
                <button onClick={() => r.deleteRock(rk.id)} aria-label="Delete rock" className="text-muted-2 transition hover:text-coral">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); r.addRock(rock); setRock(""); }} className="mt-3 flex gap-2">
            <input value={rock} onChange={(e) => setRock(e.target.value)} placeholder="Add a quarterly Rock…" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted-2 focus:border-coral/40" aria-label="New rock" />
            <button type="submit" className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm text-muted transition hover:text-text" aria-label="Add rock"><Plus size={15} /></button>
          </form>
        </section>

        <section>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-muted">
            <AlertTriangle size={15} className="text-amber" /> Issues · identify, discuss, solve
          </h2>
          <div className="mt-4 space-y-2">
            {autoIssues.map((t, i) => (
              <div key={"auto" + i} className="flex items-center gap-2 rounded-xl border border-amber/25 bg-amber/[0.05] px-3 py-2.5 text-sm">
                <span className="rounded bg-amber/15 px-1.5 py-0.5 text-[10px] font-medium uppercase text-amber">auto</span>
                <span className="flex-1 text-muted">{t}</span>
              </div>
            ))}
            {r.operate.issues.map((i) => (
              <div key={i.id} className="flex items-center gap-3 rounded-xl glass-panel px-3 py-2.5">
                <button onClick={() => r.resolveIssue(i.id)} aria-label="Resolve issue" className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${i.resolved ? "border-mint bg-mint text-bg" : "border-muted-2"}`}>
                  {i.resolved && <Check size={12} />}
                </button>
                <span className={`flex-1 text-sm ${i.resolved ? "text-muted line-through" : "text-text"}`}>{i.title}</span>
              </div>
            ))}
            {autoIssues.length === 0 && r.operate.issues.length === 0 && (
              <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-xs text-muted-2">No issues. Clean week.</div>
            )}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); r.addIssue(issue); setIssue(""); }} className="mt-3 flex gap-2">
            <input value={issue} onChange={(e) => setIssue(e.target.value)} placeholder="Log an issue…" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted-2 focus:border-coral/40" aria-label="New issue" />
            <button type="submit" className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm text-muted transition hover:text-text" aria-label="Add issue"><Plus size={15} /></button>
          </form>
        </section>
      </div>

      <section className="rounded-2xl glass-panel p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-muted">
          <MessagesSquare size={15} className="text-mint" /> Weekly review
        </h2>
        <div className="mt-3 flex items-start gap-2.5">
          <LogoMark size={24} className="mt-0.5 shrink-0" />
          <p className="text-sm leading-relaxed text-muted">{review}</p>
        </div>
      </section>
    </div>
  );
}
