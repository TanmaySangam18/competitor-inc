"use client";

import { Users } from "lucide-react";
import { specialistsForRole } from "@/lib/engine/specialists";
import { AGENTS, type AgentRole } from "@/lib/engine/types";

// "Your specialist crew" — the idea-matched specialists (from the agency-agents-derived catalog) working under
// each core function. Idea-aware + deterministic (specialistsForRole), so it renders for ANY company, not just
// benchmark ideas. One specialist per active role keeps it a compact box that mirrors CrewBox's dimensions.
export default function SpecialistCrew({ idea, roles }: { idea: string; roles: AgentRole[] }) {
  const picks = roles
    .map((role) => ({ role, s: specialistsForRole(role, idea, 1)[0] }))
    .filter((p): p is { role: AgentRole; s: NonNullable<(typeof p)["s"]> } => Boolean(p.s))
    .slice(0, 8);

  return (
    <div className="glass-panel flex h-full min-h-[19rem] flex-col rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-2">
          <Users size={13} /> Your specialist crew
        </h2>
        <span className="text-[11px] text-muted-2">{picks.length} on the job</span>
      </div>
      <p className="mt-2 text-[11px] text-muted-2">Idea-matched specialists working under each function.</p>
      <div className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1">
        {picks.map(({ role, s }) => (
          <div key={role} className="flex items-start gap-2.5 rounded-xl border border-border bg-surface/40 px-3 py-2">
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet/15 text-[10px] font-bold text-violet">
              {s.name.slice(0, 2)}
            </span>
            <div className="min-w-0">
              <div className="text-[12.5px] font-medium">{s.name}</div>
              <div className="truncate text-[11px] text-muted-2">
                <span className="text-muted">{AGENTS[role].label}</span> · {s.focus}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
