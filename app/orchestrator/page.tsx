"use client";

// Founder/dev view of the autonomous-company engine: type a goal → the agent org decomposes it and runs
// (spawn → work → verify → hand off → terminate), escalating irreducible acts to the Accountability Spine.
// Runs the deterministic simulated path today (keyless, $0); the same view lights up with real builds when
// a model-backed / OpenHands executor is wired. Reads the /api/engine kind:"goal" outcome.

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Loader2, Play } from "lucide-react";
import { getConnections } from "@/lib/engine/config";

interface Instance {
  id: string;
  taskId: string;
  role: string;
  status: string;
  model: string;
  budgetCents: number;
  spentCents: number;
}
interface Packet {
  id: string;
  kind: string;
  title: string;
  actionRequired: string;
}
interface Outcome {
  instances: Instance[];
  completed: string[];
  failed: string[];
  packets: Packet[];
  artifacts: { taskId: string; role: string; url: string }[];
  refundedCents: number;
  log: string[];
}

const STATUS_TONE: Record<string, string> = {
  done: "bg-text text-bg",
  handed_off: "bg-text text-bg",
  terminated: "border border-border text-muted",
  failed: "border border-dashed border-text text-coral",
};

export default function OrchestratorPage() {
  const [goal, setGoal] = useState("");
  const [busy, setBusy] = useState(false);
  const [buildReal, setBuildReal] = useState(false);
  const [out, setOut] = useState<Outcome | null>(null);
  const [mode, setMode] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    const g = goal.trim();
    if (!g || busy) return;
    setBusy(true);
    setErr(null);
    setOut(null);
    setMode(null);
    try {
      const body: Record<string, unknown> = { kind: "goal", goal: g };
      if (buildReal) {
        body.build = true;
        body.connections = getConnections();
      }
      const res = await fetch("/api/engine", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "run failed");
      setOut(data.outcome as Outcome);
      setMode(typeof data.mode === "string" ? data.mode : null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "run failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main id="main" className="min-h-screen bg-bg text-text mesh">
      <header className="glass-nav sticky top-0 z-20">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-5">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted transition hover:text-text">
            <ArrowLeft size={16} /> Dashboard
          </Link>
          <span className="text-muted-2">/</span>
          <span className="text-sm font-semibold">The Org · goal runner</span>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Give the company a goal.</h1>
        <p className="mt-2 text-sm text-muted">
          A supervisor decomposes it, spawns an agent per task that verifies its own work independently, hands
          off, and terminates — and routes anything only a human can do to your Accountability Spine.
        </p>

        <div className="mt-6 flex gap-2">
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
            placeholder="build a PM-tools aggregator with a simple UX"
            aria-label="Goal for the agent org"
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none transition placeholder:text-muted-2 focus:border-text"
          />
          <button
            onClick={run}
            disabled={busy || !goal.trim()}
            className="hover-lift shrink-0 rounded-xl bg-text px-4 py-2.5 text-sm font-medium text-bg transition hover:opacity-90 disabled:opacity-50"
          >
            {busy ? <Loader2 className="animate-spin" size={15} /> : <Play size={15} />}
          </button>
        </div>

        <label className="mt-3 flex items-center gap-2 text-xs text-muted">
          <input type="checkbox" checked={buildReal} onChange={(e) => setBuildReal(e.target.checked)} />
          Build for real — ship a live site to your connected GitHub (else a $0 simulated run)
        </label>

        {err && <p className="mt-4 text-sm text-coral">{err}</p>}

        {out && (
          <div className="reveal mt-8 space-y-6">
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
              <span><b className="text-text">{out.completed.length}</b> completed</span>
              <span><b className="text-text">{out.failed.length}</b> failed</span>
              <span><b className="text-text">{out.packets.length}</b> for you (spine)</span>
              <span><b className="text-text">${(out.refundedCents / 100).toFixed(2)}</b> unspent budget returned</span>
              {mode && (
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${mode === "real" ? "bg-text text-bg" : "border border-border text-muted-2"}`}>
                  {mode === "real" ? "real build" : "simulated"}
                </span>
              )}
            </div>

            {out.artifacts.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-2">Shipped · live sites (click to verify)</h2>
                <div className="mt-3 space-y-2">
                  {out.artifacts.map((a) => (
                    <a
                      key={a.taskId}
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass-panel hover-lift flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-text"
                    >
                      <ExternalLink size={14} className="shrink-0 text-muted" />
                      <span className="truncate font-mono text-[12px]">{a.url}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-2">The org · one agent per task</h2>
              <div className="mt-3 space-y-2">
                {out.instances.map((i) => (
                  <div key={i.id} className="glass-panel flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm">
                    <span className="font-mono text-[11px] text-muted-2">{i.taskId}</span>
                    <span className="font-medium">{i.role}</span>
                    <span className="text-[11px] text-muted-2">{i.model}</span>
                    <span className={`ml-auto rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_TONE[i.status] ?? "border border-border text-muted"}`}>
                      {i.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {out.packets.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-2">Your desk · only you can do these</h2>
                <div className="mt-3 space-y-2">
                  {out.packets.map((p) => (
                    <div key={p.id} className="clay-chip rounded-xl px-4 py-2.5 text-sm">
                      <div className="font-medium">{p.title} <span className="text-[11px] text-muted-2">· {p.kind}</span></div>
                      <div className="text-[12px] text-muted">{p.actionRequired}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <details className="text-xs text-muted-2">
              <summary className="cursor-pointer">Trace</summary>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-[11px] leading-5">{out.log.join("\n")}</pre>
            </details>

            <p className="text-[11px] text-muted-2">
              Simulated run — deterministic and $0. Wires to real builds (verified live URLs) when a build
              executor is connected.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
