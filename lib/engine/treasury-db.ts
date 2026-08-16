import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ruleSpend, applyDebit, type Envelope, type TreasuryVerdict } from "@/lib/core/treasury";
import { absoluteBlock, POLICY } from "@/lib/core/policy";
import { killSwitch } from "@/lib/core/killswitch";
import type { AgentRole } from "@/lib/core/types";

// Treasury persistence + the governed spend GATE (migration 0034, ADR-0020). Composes the pure
// ruleSpend (envelope + policy caps) with the DB and the governance spine. The executor calls gateSpend
// BEFORE any charge; an AUTO verdict records the debit and lets it run silently; anything else escalates
// or blocks and nothing is charged. Service-role writes (the executor path); owners read via RLS.

function monthKey(now = Date.now()): string {
  return new Date(now).toISOString().slice(0, 7); // YYYY-MM (UTC)
}

/** Load a department's envelope, rolling the month if the stored key is stale (spend resets). Missing row
 *  ⇒ a zero-cap envelope (nothing auto-spends until the human sets a budget). */
async function loadEnvelope(sb: SupabaseClient, userId: string, department: string, now = Date.now()): Promise<Envelope> {
  const { data } = await sb.from("treasury_envelopes").select("monthly_cap_usd, spent_this_month_usd, month_key").eq("user_id", userId).eq("department", department).maybeSingle();
  const cap = Number(data?.monthly_cap_usd ?? 0);
  const stale = !data || data.month_key !== monthKey(now);
  return { department, monthlyCapUsd: cap > 0 ? cap : 0, spentThisMonthUsd: stale ? 0 : Number(data?.spent_this_month_usd ?? 0) };
}

/** Persist a debit (service-role). Upserts the running spend + current month key. */
async function recordDebit(sb: SupabaseClient, userId: string, env: Envelope, amountUsd: number, now = Date.now()): Promise<void> {
  const next = applyDebit(env, amountUsd);
  const { error } = await sb.from("treasury_envelopes").upsert({
    user_id: userId, department: env.department, monthly_cap_usd: env.monthlyCapUsd,
    spent_this_month_usd: next.spentThisMonthUsd, month_key: monthKey(now), updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export interface GateResult { allow: boolean; verdict: TreasuryVerdict; }

/**
 * The governed spend gate the executor calls before charging. The department's ENVELOPE is the human's
 * standing pre-authorization, so it — not a per-item matrix approval — decides in-budget spend. Order:
 * the ABSOLUTE FLOOR first (kill switch · forbidden set · per-agent NEVER cell — never bypassable), then
 * the envelope rule (which itself enforces the per-transaction cap + the budget). Only an AUTO envelope
 * verdict records the debit and allows it (silent); escalate/block ⇒ allow:false, nothing charged.
 */
export async function gateSpend(
  sb: SupabaseClient,
  input: { userId: string; department: AgentRole; amountUsd: number; memo: string },
  opts: { now?: number } = {},
): Promise<GateResult> {
  const halt = killSwitch.haltReason({ agent: input.department });
  if (halt) return { allow: false, verdict: { decision: "block", reason: halt } };
  const floor = absoluteBlock({ type: "spend", agent: input.department, amountUsd: input.amountUsd }, POLICY);
  if (floor) return { allow: false, verdict: { decision: "block", reason: floor } };
  const env = await loadEnvelope(sb, input.userId, input.department, opts.now);
  const verdict = ruleSpend(env, { department: input.department, kind: "debit", amountUsd: input.amountUsd, memo: input.memo });
  if (verdict.decision === "auto") {
    await recordDebit(sb, input.userId, env, input.amountUsd, opts.now);
    return { allow: true, verdict };
  }
  return { allow: false, verdict };
}

/** The one human act: set (or change) a department's monthly cap — the standing authorization. Call
 *  with the SESSION client so RLS enforces ownership. Preserves the month's spend (rolls it if stale):
 *  changing a cap never erases what was already spent. */
export async function setCap(sb: SupabaseClient, userId: string, department: string, capUsd: number, now = Date.now()): Promise<void> {
  const env = await loadEnvelope(sb, userId, department, now);
  const { error } = await sb.from("treasury_envelopes").upsert({
    user_id: userId, department, monthly_cap_usd: Math.max(0, capUsd),
    spent_this_month_usd: env.spentThisMonthUsd, month_key: monthKey(now), updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

/** All envelopes for the founder digest / the /connect status. Read-only. */
export async function listEnvelopes(sb: SupabaseClient, userId: string): Promise<Envelope[]> {
  const { data } = await sb.from("treasury_envelopes").select("department, monthly_cap_usd, spent_this_month_usd").eq("user_id", userId);
  return (data ?? []).map((r) => ({ department: String(r.department), monthlyCapUsd: Number(r.monthly_cap_usd ?? 0), spentThisMonthUsd: Number(r.spent_this_month_usd ?? 0) }));
}
