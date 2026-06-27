"use client";

import { Users } from "lucide-react";
import { generateCrew } from "@/lib/engine/crew";

// Surfaces the bespoke specialists generated for THIS company's idea (on top of the core five).
// Pure render of generateCrew(idea) — no fetch, no state. Different ideas show different crews.
export default function CrewCard({ idea }: { idea: string }) {
  const crew = generateCrew(idea);
  return (
    <div className="rounded-2xl border border-border bg-bg/40 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Users size={15} className="text-violet" /> Your specialist crew
        <span className="rounded-full border border-violet/30 bg-violet/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-violet">
          {crew.domain}
        </span>
      </div>
      <p className="mt-1.5 text-xs text-muted-2">{crew.summary}</p>
      <div className="mt-3 space-y-2">
        {crew.specialists.map((s) => (
          <div key={s.name} className="flex items-start gap-2.5 rounded-xl border border-border bg-surface/40 px-3 py-2">
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet/15 text-[11px] font-bold text-violet">
              {s.name.slice(0, 2)}
            </span>
            <div className="min-w-0">
              <div className="text-sm font-medium">{s.name}</div>
              <div className="text-xs text-muted-2">{s.focus}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
