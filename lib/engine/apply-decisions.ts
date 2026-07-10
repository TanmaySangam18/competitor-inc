// ─────────────────────────────────────────────────────────────────────────────
// APPLY DECISIONS — the single unattended choke point (Consent Rails slice 2).
//
// Webhooks (Telegram/Slack) only RECORD the human's yes/no in approval_decisions; until now only the
// open browser applied them. This module lets the CRON apply them laptop-off — but every approved act
// must pass BOTH gates before executing unattended:
//   1. decideMandate — the customer's signed mandate (scopes, caps, kill switch, irreducible floor)
//   2. the policy engine's five-gate decide() — platform-level caps/forbidden floor (caller-supplied)
// Only a double-green act executes; everything else stays queued with the honest reason. Pure: no I/O.
// ─────────────────────────────────────────────────────────────────────────────

import { decideMandate, type CustomerMandate, type MandateAct } from "@/lib/org/customer-mandate";
import type { ApprovalKind } from "./types";

// Map an approval's kind to the mandate act class it exercises. Anything unmapped is treated as the
// most restrictive nearby class — unknown NEVER means "allowed".
const KIND_TO_ACT: Partial<Record<ApprovalKind, MandateAct>> = {
  deploy: "deploy",
  outreach: "outreach",
  spend: "spend_platform_budget",
  // Every social channel is publish_content through PLATFORM identities.
  bluesky: "publish_content",
  mastodon: "publish_content",
  twitter: "publish_content",
  linkedin: "publish_content",
  reddit: "publish_content",
  video: "publish_content",
  // "delete" is deliberately UNMAPPED → always holds (destructive; the human does it in the UI).
};

export interface RecordedDecision { approvalId: string; decision: "approved" | "rejected" }
export interface PendingItem { id: string; kind: ApprovalKind; title: string; amountCents?: number }

export interface ApplyPlan {
  execute: PendingItem[]; // double-green: run now, log with proof
  reject: PendingItem[]; // human said no: clear, nothing fires
  hold: { item: PendingItem; reason: string }[]; // approved but gated: stays queued, honest reason
}

// Decide what the cron may actually DO with the recorded decisions. policyAllows is injected so this
// stays pure (the caller wraps the real five-gate decide()); it defaults to deny — a missing policy
// check can never open the gate.
export function planDecisionApplication(
  pending: PendingItem[],
  recorded: RecordedDecision[],
  mandate: CustomerMandate,
  opts: { spentThisMonthCents?: number; policyAllows?: (item: PendingItem) => boolean } = {},
): ApplyPlan {
  const byId = new Map(recorded.map((d) => [d.approvalId, d.decision]));
  const policyAllows = opts.policyAllows ?? (() => false); // deny-by-default
  const plan: ApplyPlan = { execute: [], reject: [], hold: [] };

  for (const item of pending) {
    const decision = byId.get(item.id);
    if (!decision) continue; // no human word yet — untouched
    if (decision === "rejected") { plan.reject.push(item); continue; }

    const act = KIND_TO_ACT[item.kind];
    if (!act) { plan.hold.push({ item, reason: `no mandate mapping for "${item.kind}" — unattended execution refused (unknown ≠ allowed)` }); continue; }
    const m = decideMandate(act, mandate, { spendCents: item.amountCents ?? 0, spentThisMonthCents: opts.spentThisMonthCents ?? 0 });
    if (m.decision !== "auto") { plan.hold.push({ item, reason: m.reason }); continue; }
    if (!policyAllows(item)) { plan.hold.push({ item, reason: "the platform policy engine did not clear this act" }); continue; }
    plan.execute.push(item);
  }
  return plan;
}
