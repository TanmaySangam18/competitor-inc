// ─────────────────────────────────────────────────────────────────────────────
// THE SUPPORT LOOP's ESCALATION POLICY (Connect-First Reset §4) — "support agent answers from the
// product's grounded data (cite-or-abstain, EXISTS in lib/engine/grounding.ts) → escalates on policy
// triggers only." This module is ONLY the escalation policy + the governed #support ping — the grounded
// answering itself is NOT reimplemented here (wire, don't duplicate; ADR-0002).
//
// The triggers are the human floor made explicit:
//   · legal mention   → always the human's (legal never auto-acts — the policy matrix's standing NEVER)
//   · refund mention  → money movement is the human's (finance prepares, the HUMAN moves — T3 floor)
//   · 3+ contacts     → the loop is failing this customer; a human breaks the loop
//   · negative + 2+   → churn risk compounding; cheaper to escalate than to lose them
//
// Pure policy + injectable delivery — unit-tested offline, keyless-safe.
// ─────────────────────────────────────────────────────────────────────────────

import { founderMention, postToDept, type OfficeDelivery, type OfficeDeps } from "./office";

export interface SupportTicket {
  id?: string;
  subject?: string;
  sentiment?: "positive" | "neutral" | "negative"; // upstream classifier's read, when one ran
  mentionsRefund?: boolean;
  mentionsLegal?: boolean;
  repeatCount?: number; // how many times this customer has come back on the same issue
}

export interface EscalationDecision {
  escalate: boolean;
  reason: string; // one line — why (or why not)
  triggers: string[]; // every rule that fired (empty when none)
}

/** The policy. Deterministic, every threshold visible — tune here, never in a prompt. */
export function shouldEscalate(t: SupportTicket): EscalationDecision {
  const triggers: string[] = [];
  if (t.mentionsLegal) triggers.push("mentions legal — legal is human-only, always");
  if (t.mentionsRefund) triggers.push("mentions refund — money movement is the human's (T3 floor)");
  if ((t.repeatCount ?? 0) >= 3) triggers.push(`${t.repeatCount} contacts on the same issue — the loop is failing this customer`);
  if (t.sentiment === "negative" && (t.repeatCount ?? 0) >= 2) triggers.push("negative sentiment on a repeat contact — churn risk");

  return triggers.length
    ? { escalate: true, reason: triggers[0], triggers }
    : { escalate: false, reason: "within policy — the grounded support agent keeps handling it", triggers };
}

export interface EscalationResult {
  decision: EscalationDecision;
  posted?: OfficeDelivery; // present only when an escalation actually posted
}

/**
 * Apply the policy; on escalation, post to #support with the @-mention (an escalation is BY DEFINITION
 * a human-needed event — the one case a department channel pings the human directly). Non-escalations
 * post NOTHING — the grounded agent (grounding.ts) is already answering; no noise.
 */
export async function escalateIfNeeded(t: SupportTicket, deps: OfficeDeps = {}): Promise<EscalationResult> {
  const decision = shouldEscalate(t);
  if (!decision.escalate) return { decision };

  const env = deps.env ?? process.env;
  const text = [
    `${founderMention(env)} — support escalation${t.id ? ` (ticket ${t.id})` : ""}`,
    t.subject ? `subject: ${t.subject.slice(0, 200)}` : "",
    `why: ${decision.triggers.join("; ")}`,
  ]
    .filter(Boolean)
    .join("\n");

  const posted = await postToDept("support", text, deps);
  return { decision, posted };
}
