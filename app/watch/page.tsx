"use client";

// "Watch the org run" — the live surface for the ephemeral-agent supervised cycle. Type a goal → the
// supervisor spawns one agent per task (spawn → work → verify → hand off → terminate), routes the
// irreducible acts to your desk, and returns the full outcome, which this page renders as a live
// lifecycle view. Reads persisted nightly cycles from /api/cycles (RLS-scoped to the owner). Desk
// approvals hit the real /api/execute keystone (policy floor + human-in-the-loop), which stays
// fail-closed in a keyless/simulated run — so nothing fires unless a tool is connected and you're signed in.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Play, Loader2, ExternalLink, Crown, Code2, Megaphone, LifeBuoy, TrendingUp,
  Factory, Lock, History, Check, ShieldCheck, Clock, RotateCcw, type LucideIcon,
} from "lucide-react";

interface Instance {
  id: string; taskId: string; role: string; status: string; model: string; budgetCents: number; spentCents: number;
}
interface Packet {
  id: string; kind: string; title: string; actionRequired: string; summary?: string; preparedBy?: string;
}
interface Outcome {
  instances: Instance[]; completed: string[]; failed: string[]; packets: Packet[];
  artifacts: { taskId: string; role: string; url: string }[]; refundedCents: number; log: string[];
}
interface Cycle { id: string; night: number; goal: string; createdAt: string; outcome: Outcome; }

const ROLE_ICON: Record<string, LucideIcon> = {
  ceo: Crown, engineering: Code2, marketing: Megaphone, support: LifeBuoy, growth: TrendingUp, manufacturing: Factory,
};
const PIPELINE: { id: string; label: string }[] = [
  { id: "plan", label: "plan" }, { id: "build", label: "build" }, { id: "verify", label: "verify" },
  { id: "launch", label: "launch" }, { id: "announce", label: "announce" }, { id: "retain", label: "retain" }, { id: "care", label: "care" },
];
// SpineActKind → a /api/execute action. Anything not listed is a human-only irreducible act (money,
// signatures, KYC, vendor review) — we never auto-execute those; the founder does them on their own rail.
const EXECUTABLE: Record<string, string> = {
  approve_outreach: "outreach", approve_support: "outreach", approve_publish: "outreach",
};

const STATE_TONE: Record<string, string> = {
  done: "bg-text text-bg",
  working: "border border-text text-text",
  failed: "border border-dashed border-text text-coral",
  queued: "border border-border text-muted-2",
};
// Instance-status → chip tone (the lifecycle states from agent-lifecycle.ts).
const STATUS_TONE: Record<string, string> = {
  done: "bg-text text-bg",
  handed_off: "bg-text text-bg",
  terminated: "border border-border text-muted",
  failed: "border border-dashed border-text text-coral",
  working: "border border-text text-text",
  verifying: "border border-text text-text",
  spawned: "border border-border text-muted",
};

function taskState(out: Outcome, id: string): "done" | "failed" | "working" | "queued" {
  if (out.completed.includes(id)) return "done";
  if (out.failed.includes(id)) return "failed";
  if (out.instances.some((i) => i.taskId === id)) return "working";
  return "queued";
}

type PacketUi = { status: "idle" | "sending" | "sent" | "recorded" | "human"; msg?: string };

export default function WatchPage() {
  const [goal, setGoal] = useState("");
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<Outcome | null>(null);
  const [mode, setMode] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [pkt, setPkt] = useState<Record<string, PacketUi>>({});

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/cycles?limit=12");
      const d = await res.json();
      if (Array.isArray(d.cycles)) setCycles(d.cycles as Cycle[]);
    } catch { /* fail-soft: history is optional */ }
  }, []);
  useEffect(() => { loadHistory(); }, [loadHistory]);

  async function run() {
    const g = goal.trim();
    if (!g || busy) return;
    setBusy(true); setErr(null); setOut(null); setMode(null); setPkt({});
    try {
      const res = await fetch("/api/engine", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "goal", goal: g, operate: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "run failed");
      setOut(data.outcome as Outcome);
      setMode(typeof data.mode === "string" ? data.mode : null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "run failed");
    } finally { setBusy(false); }
  }

  async function approve(p: Packet) {
    const action = EXECUTABLE[p.kind];
    if (!action) {
      setPkt((s) => ({ ...s, [p.id]: { status: "human", msg: "Human-only act — open it and do it on your own rail." } }));
      return;
    }
    setPkt((s) => ({ ...s, [p.id]: { status: "sending" } }));
    try {
      const res = await fetch("/api/execute", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, agent: p.preparedBy ?? "unknown", item: { kind: action, title: p.title, detail: p.actionRequired } }),
      });
      const d = await res.json();
      if (d.ok && !d.disabled) setPkt((s) => ({ ...s, [p.id]: { status: "sent", msg: "Sent." } }));
      else setPkt((s) => ({ ...s, [p.id]: { status: "recorded", msg: "Approved. Nothing fired — connect the tool + sign in to send for real ($0 governed run)." } }));
    } catch {
      setPkt((s) => ({ ...s, [p.id]: { status: "recorded", msg: "Approved and recorded." } }));
    }
  }

  const doneN = out?.completed.length ?? 0;
  const failN = out?.failed.length ?? 0;
  const deskN = out?.packets.length ?? 0;
  const refunded = out ? (out.refundedCents / 100).toFixed(2) : "0.00";

  return (
    <main id="main" className="min-h-screen bg-bg text-text mesh">
      <header className="glass-nav sticky top-0 z-20">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-5">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted transition hover:text-text">
            <ArrowLeft size={16} /> Dashboard
          </Link>
          <span className="text-muted-2">/</span>
          <span className="text-sm font-semibold">Watch the org run</span>
          <Link href="/orchestrator" className="ml-auto text-xs text-muted transition hover:text-text">Goal runner →</Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Watch the company run.</h1>
        <p className="mt-2 text-sm text-muted">
          Give it a goal. A supervisor spawns one agent per task, each verifies its work independently
          (never self-graded), hands off, and terminates — returning any unspent budget. Irreducible acts
          land on your desk. Deterministic and $0.
        </p>

        <div className="mt-6 flex gap-2">
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
            placeholder="ship a study-timer app for students"
            aria-label="Goal for the agent org"
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none transition placeholder:text-muted-2 focus:border-text"
          />
          <button
            onClick={run}
            disabled={busy || !goal.trim()}
            className="hover-lift shrink-0 rounded-xl bg-text px-4 py-2.5 text-sm font-medium text-bg transition hover:opacity-90 disabled:opacity-50"
            aria-label="Run a cycle"
          >
            {busy ? <Loader2 className="animate-spin" size={15} /> : <Play size={15} />}
          </button>
        </div>

        {err && <p className="mt-4 text-sm text-coral">{err}</p>}

        {out && (
          <div className="reveal mt-8 space-y-7">
            {/* metrics */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric label="Tasks done" value={String(doneN)} />
              <Metric label="Failed" value={String(failN)} />
              <Metric label="Your desk" value={String(deskN)} accent />
              <Metric label="Budget returned" value={`$${refunded}`} />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
              <span><b className="text-text">{out.instances.length}</b> agents spawned</span>
              {mode && (
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${mode !== "simulated" ? "bg-text text-bg" : "border border-border text-muted-2"}`}>
                  {mode === "simulated" ? "simulated · $0" : `real build · ${mode}`}
                </span>
              )}
            </div>

            {/* pipeline */}
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-2">Task pipeline</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {PIPELINE.map((t) => {
                  const st = taskState(out, t.id);
                  if (st === "queued" && !out.instances.some((i) => i.taskId === t.id) && !out.completed.includes(t.id) && !out.failed.includes(t.id)) {
                    // only show queued tasks that are actually part of this run's plan
                    if (!out.completed.length && !out.failed.length) return null;
                  }
                  return (
                    <span key={t.id} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium ${STATE_TONE[st]}`}>
                      {st === "done" && <Check size={12} />}
                      {st === "working" && <Loader2 size={12} className="animate-spin" />}
                      {st === "failed" && <RotateCcw size={12} />}
                      {st === "queued" && <Clock size={12} />}
                      {t.label}
                    </span>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-2">
                <span>■ done</span><span>◌ working</span><span>⤾ failed</span><span>◔ queued</span>
              </div>
            </div>

            {/* shipped artifacts */}
            {out.artifacts.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-2">Shipped · live (click to verify)</h2>
                <div className="mt-3 space-y-2">
                  {out.artifacts.map((a) => (
                    <a key={a.taskId} href={a.url} target="_blank" rel="noopener noreferrer"
                      className="glass-panel hover-lift flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm">
                      <ExternalLink size={14} className="shrink-0 text-muted" />
                      <span className="truncate font-mono text-[12px]">{a.url}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="grid items-start gap-6 lg:grid-cols-2">
            {/* live agents */}
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-2">The org · one agent per task</h2>
              <div className="mt-3 max-h-[46vh] space-y-2 overflow-y-auto pr-1">
                {out.instances.map((i) => {
                  const Icon = ROLE_ICON[i.role] ?? Code2;
                  const st = out.completed.includes(i.taskId) ? "done" : out.failed.includes(i.taskId) ? "failed" : i.status;
                  return (
                    <div key={i.id} className="glass-panel flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted">
                        <Icon size={15} />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{i.role}</span>
                          <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted-2">{i.model}</span>
                        </div>
                        <div className="truncate text-[11px] text-muted-2">
                          {i.taskId} · spent ${(i.spentCents / 100).toFixed(2)}
                          {i.budgetCents > i.spentCents && <> · returned ${((i.budgetCents - i.spentCents) / 100).toFixed(2)}</>}
                        </div>
                      </div>
                      <span className={`ml-auto shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_TONE[i.status] ?? "border border-border text-muted"}`}>
                        {st === "handed_off" ? "handed off" : st}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-2">
                <ShieldCheck size={12} /> every &ldquo;done&rdquo; was verified by a different role — no agent grades its own work.
              </p>
            </div>

            {/* your desk */}
            {out.packets.length > 0 && (
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-2">Your desk · {deskN} items</h2>
                  <Lock size={12} className="text-muted-2" />
                  <span className="text-[11px] text-muted-2">nothing sends until you approve</span>
                </div>
                <div className="mt-3 max-h-[46vh] space-y-2 overflow-y-auto pr-1">
                  {out.packets.map((p) => {
                    const ui = pkt[p.id] ?? { status: "idle" as const };
                    const humanOnly = !EXECUTABLE[p.kind];
                    return (
                      <div key={p.id} className="clay-chip rounded-xl px-4 py-3 text-sm">
                        <div className="font-medium">{p.title} <span className="text-[11px] text-muted-2">· {p.kind}</span></div>
                        <div className="mt-0.5 text-[12px] text-muted">{p.actionRequired}</div>
                        <div className="mt-2 flex items-center gap-2">
                          {ui.status === "idle" && (
                            <button onClick={() => approve(p)}
                              className="hover-lift rounded-lg bg-text px-3 py-1.5 text-[12px] font-medium text-bg transition hover:opacity-90">
                              {humanOnly ? "Open" : "Approve"}
                            </button>
                          )}
                          {ui.status === "sending" && <span className="flex items-center gap-1.5 text-[12px] text-muted"><Loader2 size={12} className="animate-spin" /> approving…</span>}
                          {(ui.status === "sent" || ui.status === "recorded" || ui.status === "human") && (
                            <span className="flex items-center gap-1.5 text-[12px] text-muted"><Check size={12} /> {ui.msg}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            </div>

            <details className="text-xs text-muted-2">
              <summary className="cursor-pointer">Trace</summary>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-[11px] leading-5">{out.log.join("\n")}</pre>
            </details>
          </div>
        )}

        {/* nightly history */}
        <div className="mt-12 border-t border-border pt-6">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-2">
            <History size={13} /> Nightly history
          </h2>
          {cycles.length === 0 ? (
            <p className="mt-3 text-[12px] text-muted-2">
              No persisted cycles yet. When the nightly scheduler runs with <code className="font-mono">SUPERVISED_CYCLE=1</code> and a company is operating,
              each night&rsquo;s cycle is saved here (sign in as the owner to see them). Run one above to preview the live view now.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {cycles.map((c) => (
                <button key={c.id} onClick={() => { setOut(c.outcome); setMode("simulated"); setPkt({}); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="glass-panel hover-lift flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm">
                  <span className="font-mono text-[11px] text-muted-2">night {c.night}</span>
                  <span className="truncate">{c.goal}</span>
                  <span className="ml-auto shrink-0 text-[11px] text-muted-2">
                    {c.outcome.completed.length} done · {c.outcome.packets.length} to desk
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3">
      <p className="text-[12px] text-muted-2">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${accent ? "text-coral" : ""}`}>{value}</p>
    </div>
  );
}
