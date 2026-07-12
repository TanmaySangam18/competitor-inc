"use client";

// STATS PIE (2026-07-12, founder: "add a pie chart which shows the stats"). A donut of where the org's
// real work went — activities grouped by department. HONEST: renders only real logged activities; with
// none, it shows a plain empty state, never a fake chart. Teal card, on-brand shades. No chart lib — a
// hand-rolled SVG donut (cheap, crisp, themeable).

import { useMemo } from "react";
import type { Activity } from "@/lib/engine/types";
import { ROLE_DEPARTMENT } from "@/lib/org/role-titles";

const DEPTS = ["Engineering", "Marketing", "Support", "Operations"] as const;
// A single-hue teal ramp — the pie stays monochromatic to the brand (not a rainbow).
const SHADE: Record<(typeof DEPTS)[number], string> = {
  Engineering: "#0f6e56",
  Marketing: "#1d9e75",
  Support: "#5dcaa5",
  Operations: "#9fe1cb",
};

export default function StatsPie({ activities, nights, tasksDone }: { activities: Activity[]; nights: number; tasksDone: number }) {
  const { slices, total } = useMemo(() => {
    const counts: Record<string, number> = { Engineering: 0, Marketing: 0, Support: 0, Operations: 0 };
    for (const a of activities) {
      if (a.undone) continue;
      counts[ROLE_DEPARTMENT[a.agent] ?? "Operations"] += 1;
    }
    const t = DEPTS.reduce((s, d) => s + counts[d], 0);
    return { slices: DEPTS.map((d) => ({ dept: d, n: counts[d] })), total: t };
  }, [activities]);

  // Build the donut arc dash offsets.
  const R = 54, C = 2 * Math.PI * R;
  let acc = 0;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text">Where the work went</h3>
        <span className="text-xs text-muted-2">{nights} {nights === 1 ? "night" : "nights"} · {tasksDone} done</span>
      </div>

      {total === 0 ? (
        <div className="grid h-40 place-items-center text-center text-sm text-muted-2">
          No work logged yet — run a shift and the breakdown appears here.
        </div>
      ) : (
        <div className="flex items-center gap-6">
          <svg viewBox="0 0 140 140" className="h-36 w-36 shrink-0 -rotate-90">
            <circle cx="70" cy="70" r={R} fill="none" stroke="var(--color-surface-2)" strokeWidth="18" />
            {slices.filter((s) => s.n > 0).map((s) => {
              const frac = s.n / total;
              const dash = frac * C;
              const el = (
                <circle
                  key={s.dept}
                  cx="70" cy="70" r={R} fill="none"
                  stroke={SHADE[s.dept]} strokeWidth="18"
                  strokeDasharray={`${dash} ${C - dash}`}
                  strokeDashoffset={-acc}
                />
              );
              acc += dash;
              return el;
            })}
          </svg>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-baseline gap-1.5">
              <span className="text-3xl font-semibold text-text">{total}</span>
              <span className="text-xs text-muted">actions</span>
            </div>
            <ul className="space-y-1.5">
              {slices.map((s) => (
                <li key={s.dept} className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: SHADE[s.dept] }} />
                  <span className="flex-1 text-muted">{s.dept}</span>
                  <span className="font-medium text-text">{s.n}</span>
                  <span className="w-9 text-right text-muted-2">{total ? Math.round((s.n / total) * 100) : 0}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
