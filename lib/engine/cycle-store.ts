import "server-only";

// Persistence for the "watch the org run" surface. A supervised operating cycle runs in-process each
// nightly tick; without persistence its per-agent lifecycle + desk packets vanish into logs. This stores
// a bounded snapshot per cycle so the founder can watch history accrue night-to-night. Fail-soft
// everywhere: no DB / missing table ⇒ returns false/[] and the caller degrades honestly (no throw).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { SupervisorOutcome } from "./supervisor";

export interface CycleRow {
  id: string;
  companyId: string;
  night: number;
  goal: string;
  outcome: SupervisorOutcome;
  createdAt: string;
}

function emptyOutcome(): SupervisorOutcome {
  return { instances: [], completed: [], failed: [], packets: [], artifacts: [], refundedCents: 0, log: [] };
}

// Bound the stored blob so a snapshot row stays small even for a big goal (keeps the JSON column lean).
function trimOutcome(o: SupervisorOutcome): SupervisorOutcome {
  return {
    instances: o.instances.slice(0, 40),
    completed: o.completed.slice(0, 40),
    failed: o.failed.slice(0, 40),
    packets: o.packets.slice(0, 20),
    artifacts: o.artifacts.slice(0, 20),
    refundedCents: o.refundedCents,
    log: o.log.slice(-24),
  };
}

export async function persistCycle(
  sb: SupabaseClient | null,
  companyId: string,
  night: number,
  goal: string,
  outcome: SupervisorOutcome,
): Promise<boolean> {
  if (!sb || !companyId) return false;
  try {
    const { error } = await sb.from("operating_cycles").insert({
      company_id: companyId,
      night,
      goal: goal.slice(0, 400),
      outcome: trimOutcome(outcome),
    });
    if (error) {
      console.error("[cycle-store] persist failed:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[cycle-store] persist threw:", e instanceof Error ? e.message : "unknown");
    return false;
  }
}

// Read the most recent cycles the caller owns. When `sb` is the SESSION client, RLS restricts rows to the
// signed-in owner; not signed in / no DB ⇒ []. Never throws.
export async function recentCycles(sb: SupabaseClient | null, limit = 20): Promise<CycleRow[]> {
  if (!sb) return [];
  const n = Math.min(50, Math.max(1, Math.floor(limit)));
  try {
    const { data, error } = await sb
      .from("operating_cycles")
      .select("id, company_id, night, goal, outcome, created_at")
      .order("created_at", { ascending: false })
      .limit(n);
    if (error) {
      console.error("[cycle-store] read failed:", error.message);
      return [];
    }
    const rows = (data ?? []) as Array<{
      id: string;
      company_id: string;
      night: number | null;
      goal: string | null;
      outcome: SupervisorOutcome | null;
      created_at: string;
    }>;
    return rows.map((r) => ({
      id: r.id,
      companyId: r.company_id,
      night: r.night ?? 0,
      goal: r.goal ?? "",
      outcome: r.outcome ?? emptyOutcome(),
      createdAt: r.created_at,
    }));
  } catch (e) {
    console.error("[cycle-store] read threw:", e instanceof Error ? e.message : "unknown");
    return [];
  }
}
