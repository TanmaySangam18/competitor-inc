"use client";

import { useState } from "react";
import type { Company } from "@/lib/core/types";

// The Revenue Loop scoreboard chip (Block R): ONE founder-chosen outcome metric every shift is judged
// against. Moved from the dashboard page when the Stream replaced the cockpit; monochrome chrome,
// identical behavior.
const NORTH_STARS: { key: NonNullable<Company["growthGoal"]>["northStar"]; label: string }[] = [
  { key: "signups", label: "Signups" },
  { key: "paying_customers", label: "Paying customers" },
  { key: "revenue", label: "Revenue" },
];

export function GoalChip({ goal, imported, onSet }: { goal?: Company["growthGoal"]; imported: boolean; onSet: (g: Company["growthGoal"]) => void }) {
  const [editing, setEditing] = useState(false);
  // Sensible default per stage: an already-live import chases customers; a fresh idea chases signups.
  const [star, setStar] = useState<NonNullable<Company["growthGoal"]>["northStar"]>(goal?.northStar ?? (imported ? "paying_customers" : "signups"));
  const [target, setTarget] = useState(String(goal?.target ?? (imported ? 3 : 25)));

  if (!editing) {
    const meta = goal && NORTH_STARS.find((n) => n.key === goal.northStar);
    return (
      <button
        onClick={() => setEditing(true)}
        className={`inline-flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] transition ${
          goal ? "border-border text-muted hover:border-text hover:text-text" : "border-text text-text hover:bg-text hover:text-bg"
        }`}
      >
        {goal && meta ? `Goal: ${goal.northStar === "revenue" ? "$" : ""}${goal.target} ${meta.label}` : "Set your goal — what number matters?"}
      </button>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={star}
        onChange={(e) => setStar(e.target.value as typeof star)}
        aria-label="North-star metric"
        className="border border-border bg-bg px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-text outline-none focus:border-text"
      >
        {NORTH_STARS.map((n) => (
          <option key={n.key} value={n.key}>{n.label}</option>
        ))}
      </select>
      <input
        value={target}
        onChange={(e) => setTarget(e.target.value.replace(/[^0-9]/g, ""))}
        aria-label="Goal target"
        className="w-20 border border-border bg-bg px-2 py-1.5 font-mono text-[10px] text-text outline-none focus:border-text"
      />
      <button
        onClick={() => {
          const t = parseInt(target, 10);
          if (!Number.isFinite(t) || t <= 0) return;
          onSet({ northStar: star, target: t, setAt: Date.now() });
          setEditing(false);
        }}
        className="border border-text bg-text px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-bg transition hover:bg-bg hover:text-text"
      >
        Save goal
      </button>
      <button onClick={() => setEditing(false)} className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-2 transition hover:text-text">cancel</button>
    </div>
  );
}
