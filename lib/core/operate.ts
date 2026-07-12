// lib/core/operate.ts — PHASE 5: the autonomous operate loop (spine) + support intake.
//
// A product our org runs improves ITSELF. Two intakes feed one loop:
//   • WATCH (proactive): signals from the live product — errors, perf, usage, security, feedback.
//   • TICKETS (reactive): the end-user (our customer's customer) raises a bug / question / request.
// Both flow into: diagnose + prioritize → the GOVERNANCE GATE (auto vs the owner's approval vs blocked) →
// fix → verify-before-done → a regression test → an honest report. Keyless spine: the Watch (real
// monitoring) + Fix (deploy) steps light up on their seams; here we do the routing + prioritization +
// governance deterministically.
//
// TWO HUMANS in the trust model: the PRODUCT OWNER (our customer, who set the mandate) and the END-USER
// (who raised the ticket). The org acts on the owner's standing authorization; anything consequential
// (scope, money, account, sensitive data) goes to the OWNER — never decided unilaterally for an end-user.

export type SignalKind = "error" | "perf" | "usage" | "security" | "feedback";
export interface Signal { kind: SignalKind; severity: 1 | 2 | 3 | 4 | 5; detail: string; source?: string }

export type TicketType = "bug" | "info" | "feature" | "billing" | "abuse";
export interface Ticket { id: string; from?: string; type: TicketType; body: string }

// ── Ticket triage — where an end-user request goes, and how much autonomy it gets ──────────────────────
export type Route = "answer" | "fix" | "owner-decision" | "human-escalate" | "drop";
export interface TicketTriage { route: Route; autonomy: "auto" | "approve" | "block"; why: string }

export function triageTicket(t: Ticket): TicketTriage {
  switch (t.type) {
    case "info":
      return { route: "answer", autonomy: "auto", why: "grounded answer from the product's own docs/behavior (cite-or-abstain); replies as a named AI" };
    case "bug":
      return { route: "fix", autonomy: "auto", why: "enters the fix loop → verify-before-done → a regression test so it can't recur" };
    case "feature":
      return { route: "owner-decision", autonomy: "approve", why: "adding scope is the product owner's call — queued to them, not the end-user" };
    case "billing":
      return { route: "human-escalate", autonomy: "block", why: "money / account = the human floor — escalates to the owner; never auto" };
    case "abuse":
      return { route: "drop", autonomy: "block", why: "out of scope / abuse — filed, not acted on" };
  }
}

// A bug ticket becomes a high-signal error for the improvement loop.
export function ticketToSignal(t: Ticket): Signal {
  return { kind: "error", severity: 4, detail: t.body, source: `ticket:${t.id}` };
}

// ── The improvement loop — signals → governed actions → honest report ──────────────────────────────────
export type Lane = "auto" | "owner-approval" | "blocked";
export interface OperateAction { signal: Signal; task: string; lane: Lane; why: string }
export interface OperateCycle {
  product: string;
  diagnosed: Signal[]; // severity-first
  actions: OperateAction[];
  summary: { auto: number; ownerApproval: number; blocked: number; regulated: boolean };
  report: string;
}

const VERB: Record<SignalKind, string> = {
  error: "Fix", perf: "Optimize", usage: "Improve", security: "Patch", feedback: "Address",
};

function laneFor(sig: Signal, regulated: boolean): { lane: Lane; why: string } {
  // Security is always the owner's call. Regulated products (biotech/PHI) get the tight gate — almost
  // everything waits for the owner, and nothing autonomous touches sensitive data.
  if (sig.kind === "security") return { lane: "owner-approval", why: "security change — always the owner's call" };
  if (regulated) return { lane: "owner-approval", why: "regulated product — the owner approves every change (nothing autonomous on sensitive data)" };
  // Otherwise: reversible fixes run unattended (the safety is verify-before-done + rollback + a regression
  // test, not withholding the fix). Only CRITICAL (sev-5: data loss / outage) loops the owner in first.
  if (sig.severity >= 5) return { lane: "owner-approval", why: "critical (data loss / outage) — the owner is looped in before the fix ships" };
  return { lane: "auto", why: "reversible, low-risk → fixed under standing authorization, verify-before-done + rollback" };
}

export function improve(input: { product: string; signals: Signal[]; regulated?: boolean }): OperateCycle {
  const regulated = input.regulated === true;
  const diagnosed = [...input.signals].sort((a, b) => b.severity - a.severity);
  const actions: OperateAction[] = diagnosed.map((signal) => {
    const { lane, why } = laneFor(signal, regulated);
    return { signal, task: `${VERB[signal.kind]}: ${signal.detail}`, lane, why };
  });
  const auto = actions.filter((a) => a.lane === "auto").length;
  const ownerApproval = actions.filter((a) => a.lane === "owner-approval").length;
  const blocked = actions.filter((a) => a.lane === "blocked").length;
  const report =
    `${auto} improvement${auto === 1 ? "" : "s"} ship on their own (verified before done), ` +
    `${ownerApproval} need your OK, ${blocked} held.`;
  return { product: input.product, diagnosed, actions, summary: { auto, ownerApproval, blocked, regulated }, report };
}
