"use client";

// TEAM ROSTER (2026-07-12) — the company's staff shown with REAL software-company titles + what each is
// doing, derived from real activities (latest action per role). HONEST: status comes only from logged
// work; a role with nothing logged reads "idle", never a fake task. Teal card, initials avatars.

import { useMemo } from "react";
import type { Activity, AgentRole } from "@/lib/engine/types";
import { ROLE_TITLE, ROLE_INITIALS } from "@/lib/org/role-titles";

type Status = { kind: "needs-you" | "done" | "idle"; note: string };

export default function TeamRoster({ activities, roles }: { activities: Activity[]; roles: AgentRole[] }) {
  const byRole = useMemo(() => {
    const map = new Map<AgentRole, Status>();
    for (const role of roles) {
      const mine = activities.filter((a) => a.agent === role && !a.undone);
      const pending = mine.find((a) => a.status === "pending-approval");
      const latest = mine[0]; // activities arrive newest-first
      if (pending) map.set(role, { kind: "needs-you", note: pending.action });
      else if (latest) map.set(role, { kind: "done", note: latest.action });
      else map.set(role, { kind: "idle", note: "waiting for the next shift" });
    }
    return map;
  }, [activities, roles]);

  const working = roles.filter((r) => byRole.get(r)?.kind !== "idle").length;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text">Your team</h3>
        <span className="text-xs text-muted-2">{working} active · {roles.length} roles</span>
      </div>
      <ul className="space-y-0.5">
        {roles.map((role) => {
          const s = byRole.get(role)!;
          return (
            <li key={role} className="flex items-center gap-3 border-b border-border/60 py-2 last:border-0">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-mint/10 text-[10px] font-semibold text-mint">
                {ROLE_INITIALS[role]}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium text-text">{ROLE_TITLE[role]}</div>
                <div className="truncate text-[11px] text-muted">{s.note}</div>
              </div>
              {s.kind === "needs-you" ? (
                <span className="shrink-0 rounded-md border border-amber/40 px-2 py-0.5 text-[10px] font-medium text-amber">needs you</span>
              ) : s.kind === "done" ? (
                <span className="flex shrink-0 items-center gap-1 text-[10px] text-mint"><span className="h-1.5 w-1.5 rounded-full bg-mint" />done</span>
              ) : (
                <span className="shrink-0 text-[10px] text-muted-2">idle</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
