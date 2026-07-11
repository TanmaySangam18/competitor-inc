import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { applyVerdict, type PreparedDecision, type Verdict, type DecisionKind, type EnqueueInput } from "@/lib/org/decision-queue";

// Persistence for the executive decision queue (migration 0029). The pure state machine is
// lib/org/decision-queue.ts; this file is only the DB edge. Verdicts go through the principal's own RLS
// session; enqueue is service-role only (the org prepares — a client can never forge a draft). The
// status='pending' guard on update makes double-verdicts fail closed even under racing requests.

interface DecisionRow {
  id: string;
  kind: string;
  title: string;
  summary: string;
  artifact: string;
  prepared_by: string;
  status: string;
  revision: number;
  history: unknown;
  created_at: string;
}

function toDecision(r: DecisionRow): PreparedDecision {
  return {
    id: r.id,
    kind: r.kind as DecisionKind,
    title: r.title,
    summary: r.summary,
    artifact: r.artifact,
    preparedBy: r.prepared_by,
    status: r.status as PreparedDecision["status"],
    revision: r.revision ?? 0,
    history: Array.isArray(r.history) ? (r.history as PreparedDecision["history"]) : [],
    createdAt: Date.parse(r.created_at) || 0,
  };
}

/** The executive view: the principal's pending decisions, oldest first (RLS scopes to their own rows). */
export async function loadPendingDecisions(client: SupabaseClient): Promise<PreparedDecision[]> {
  const { data, error } = await client
    .from("prepared_decisions")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(50);
  if (error) throw new Error(`loadPendingDecisions: ${error.message}`);
  return ((data ?? []) as DecisionRow[]).map(toDecision);
}

/** The org prepares a decision (service-role only — RLS has no insert policy for sessions). */
export async function enqueueDecision(client: SupabaseClient, userId: string, companyId: string | null, input: EnqueueInput): Promise<void> {
  const { error } = await client.from("prepared_decisions").insert({
    user_id: userId,
    company_id: companyId,
    kind: input.kind,
    title: input.title,
    summary: input.summary,
    artifact: input.artifact,
    prepared_by: input.preparedBy,
    history: [{ at: Date.now(), event: `prepared by ${input.preparedBy}` }],
  });
  if (error) throw new Error(`enqueueDecision: ${error.message}`);
}

export interface VerdictApplied {
  ok: boolean;
  outcome: string; // 'executable' | 'closed' | 'revise' | an error reason
  item?: PreparedDecision;
}

/** The principal's verb, applied through their own session. Reuses the pure state machine, then persists
 *  with a status='pending' guard so a stale/racing verdict can never double-fire. */
export async function recordVerdict(client: SupabaseClient, id: string, verdict: Verdict): Promise<VerdictApplied> {
  const { data, error } = await client.from("prepared_decisions").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`recordVerdict: ${error.message}`);
  if (!data) return { ok: false, outcome: "not found" };

  const item = toDecision(data as DecisionRow);
  const res = applyVerdict({ items: [item] }, id, verdict, { now: Date.now() });
  if (res.outcome.kind === "error") return { ok: false, outcome: res.outcome.reason };
  const updated = res.state.items[0];

  const { data: written, error: upErr } = await client
    .from("prepared_decisions")
    .update({ status: updated.status, revision: updated.revision, history: updated.history, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "pending") // fail closed under races: only a still-pending row accepts a verdict
    .select("id");
  if (upErr) throw new Error(`recordVerdict update: ${upErr.message}`);
  if (!written?.length) return { ok: false, outcome: "decision is no longer pending" };
  return { ok: true, outcome: res.outcome.kind, item: updated };
}
