"use client";

import { Compass } from "lucide-react";
import type { Company } from "@/lib/engine/types";
import { coachFor } from "@/lib/engine/coach";

// 2.7 Founder Agent (PDR §1) — one grounded coaching insight tied to THIS company's live numbers + stage.
// Compact + single-insight (Hick's Law): the headline + the one metric to obsess over, detail on tap.
export function CoachCard({ company }: { company: Company }) {
  const insight = coachFor(company);
  return (
    <details className="mt-4 rounded-2xl border border-violet/25 bg-violet/[0.05] p-4">
      <summary className="flex cursor-pointer list-none items-start gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-violet/12 text-violet">
          <Compass size={16} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] uppercase tracking-wide text-violet">Coach · grounded in your numbers</span>
          <span className="mt-0.5 block text-sm font-medium text-text">{insight.headline}</span>
          <span className="mt-1 block text-xs text-muted-2">{insight.metric}</span>
        </span>
      </summary>
      <p className="mt-2 pl-11 text-sm text-muted">{insight.detail}</p>
    </details>
  );
}
