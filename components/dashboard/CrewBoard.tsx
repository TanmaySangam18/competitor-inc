"use client";

import { useMemo } from "react";
import { Loader2, Inbox, CheckCircle2, Moon, Network } from "lucide-react";
import type { useEngine } from "@/lib/engine/useEngine";
import { AGENTS, type AgentRole } from "@/lib/engine/types";
import { generateCrewFromIdea, matchBenchmarkCompany } from "@/lib/engine/dynamic-crew";

// The Crew Board — the board metaphor done natively (no Miro dependency). One glanceable strip of what
// the crew is doing, fed entirely from real engine state: nothing invented. Three honest columns:
//   Working tonight  — live during a shift (r.working), else idle
//   Awaiting your yes — the pending Approval Inbox, with inline approve/reject (the board IS the control)
//   Shipped ✓        — recent done activities carrying real proof
// This strengthens the Glass Box; it never becomes a separate source of truth.

const agentName = (role: AgentRole) => AGENTS[role]?.name ?? role;

export function CrewBoard({ r }: { r: ReturnType<typeof useEngine> }) {
  const working = r.working === "shift";
  const pending = r.pendingApprovals;
  const shipped = r.activities.filter((a) => a.status === "done" && !a.undone).slice(0, 6);

  // Dynamic crew (deterministic — same idea, same crew) when the idea matches a benchmark we hold
  // real org data for; otherwise the default five and no roster strip. Computed on the fly, no storage.
  const crew = useMemo(() => {
    const idea = r.company?.idea;
    if (!idea || !matchBenchmarkCompany(idea)) return null;
    try {
      return generateCrewFromIdea(idea);
    } catch {
      return null;
    }
  }, [r.company?.idea]);

  return (
    <div className="rounded-3xl glass-panel p-5 sm:p-6">
      <div className="flex items-center gap-2 text-sm font-semibold">
        Crew board
        <span className="text-muted-2">· what everyone&apos;s on</span>
      </div>

      {crew && (
        <div className="mt-4 rounded-2xl border border-border bg-bg/30 p-3">
          <div className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-2">
            <Network size={13} className="text-violet" /> Custom crew · modeled on {crew.benchmarkCompany}
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {crew.agents.map((a) => (
              <div key={a.role} className="rounded-xl border border-border bg-surface/60 p-2.5">
                <div className="truncate text-xs font-medium text-text">
                  {agentName(a.role)}
                  {a.name.toLowerCase() !== agentName(a.role).toLowerCase() && (
                    <span className="text-muted-2"> · {a.name.toLowerCase()}</span>
                  )}
                </div>
                <div className="mt-0.5 truncate text-[10px] text-muted-2" title={a.playbook}>
                  Plays {a.playbook}
                </div>
                {a.subAgents && a.subAgents.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5 border-l border-border pl-2">
                    {a.subAgents.map((s) => (
                      <li key={s.name} className="truncate text-[10px] text-muted" title={s.focus}>
                        {s.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {/* Working */}
        <Column icon={working ? Loader2 : Moon} spin={working} tone="text-violet" label="Working tonight" count={working ? 1 : 0}>
          {working ? (
            <Card>
              <div className="text-xs font-medium text-text">The crew is running tonight&apos;s shift…</div>
              <div className="mt-1 text-[11px] text-muted-2">Validating, building, drafting — results land in the other columns.</div>
            </Card>
          ) : (
            <Empty>Idle — run tonight&apos;s shift to put the crew to work.</Empty>
          )}
        </Column>

        {/* Awaiting approval — the actionable column */}
        <Column icon={Inbox} tone="text-coral" label="Awaiting your yes" count={pending.length}>
          {pending.length === 0 ? (
            <Empty>Inbox clear — nothing needs you.</Empty>
          ) : (
            pending.map((ap) => (
              <Card key={ap.id} accent="coral">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-coral">{agentName(ap.agent)} · {ap.kind}</div>
                <div className="mt-0.5 truncate text-xs font-medium text-text" title={ap.title}>{ap.title}</div>
                <div className="mt-2 flex gap-1.5">
                  <button onClick={() => r.resolveApproval(ap.id, true)} className="flex-1 rounded-lg bg-coral py-1 text-[11px] font-semibold text-bg transition hover:brightness-110">Approve</button>
                  <button onClick={() => r.resolveApproval(ap.id, false)} className="rounded-lg border border-border px-2.5 py-1 text-[11px] text-muted transition hover:text-text">No</button>
                </div>
              </Card>
            ))
          )}
        </Column>

        {/* Shipped */}
        <Column icon={CheckCircle2} tone="text-mint" label="Shipped" count={shipped.length}>
          {shipped.length === 0 ? (
            <Empty>Nothing shipped yet — verified work shows up here.</Empty>
          ) : (
            shipped.map((a) => (
              <div key={a.id} className={a.parentActivityId ? "pl-3" : undefined}>
                <Card accent="mint">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-mint">
                    {agentName(a.agent)}
                    {a.parentActivityId && <span className="ml-1 normal-case text-muted-2">· sub-agent</span>}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-text" title={a.action}>{a.action}</div>
                  {a.proof && <div className="mt-1 truncate text-[10px] text-mint">✓ {a.proof.kind === "metric" ? a.proof.value : a.proof.kind}</div>}
                </Card>
              </div>
            ))
          )}
        </Column>
      </div>
    </div>
  );
}

function Column({ icon: Icon, spin, tone, label, count, children }: { icon: typeof Inbox; spin?: boolean; tone: string; label: string; count: number; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-bg/30 p-3">
      <div className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-2">
        <Icon size={13} className={`${tone} ${spin ? "animate-spin" : ""}`} /> {label}
        <span className="ml-auto rounded-full bg-surface-2 px-1.5 text-[10px] text-muted">{count}</span>
      </div>
      <div className="mt-2 space-y-2">{children}</div>
    </div>
  );
}

function Card({ children, accent }: { children: React.ReactNode; accent?: "coral" | "mint" }) {
  const border = accent === "coral" ? "border-coral/25" : accent === "mint" ? "border-mint/25" : "border-border";
  return <div className={`rounded-xl border ${border} bg-surface/60 p-2.5`}>{children}</div>;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-[11px] text-muted-2">{children}</div>;
}
