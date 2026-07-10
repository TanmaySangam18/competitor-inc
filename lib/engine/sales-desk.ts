// THE SALES DESK (Block 6c) — Resleeve's "sales agents", our way: revives the dormant outreach brain
// (lib/org/outreach.ts) under Consent Rails. A lead goes qualify → consent gate → mandate check →
// honest draft → THE APPROVAL DESK. Nothing here ever sends — the draft queues as a normal "outreach"
// approval, and execution stays behind the existing policy floor + the customer's signed mandate
// (the cron's apply-decisions choke point re-checks decideMandate before anything unattended fires).
//
// Pure + deterministic: no I/O, no model call (the fallback drafter never fabricates); the route wraps it.

import { qualifyLead, outreachGate, outreachFallback, type Lead, type Qualification, type GateResult, type FirstTouch } from "@/lib/org/outreach";
import { decideMandate, type CustomerMandate, type MandateDecision } from "@/lib/org/customer-mandate";

export type SalesOutcome =
  | { ok: false; stage: "kill-switch" | "disqualified" | "gate"; qualification?: Qualification; gate?: GateResult; reason: string }
  | {
      ok: true;
      qualification: Qualification;
      gate: GateResult;
      mandate: MandateDecision; // how the SEND will be governed (auto within scope vs needs-you)
      draft: FirstTouch;
      approval: { kind: "outreach"; title: string; detail: string };
    };

export function processLead(lead: Lead, mandate: CustomerMandate): SalesOutcome {
  // The kill switch outranks everything — a halted company doesn't even draft.
  if (mandate.killSwitch) return { ok: false, stage: "kill-switch", reason: "kill switch is on — everything is halted" };

  const qualification = qualifyLead(lead);
  if (qualification.tier === "disqualified") {
    return { ok: false, stage: "disqualified", qualification, reason: qualification.reasons.join("; ") };
  }

  // THE HARD RAIL: no consent path ⇒ no draft at all (we don't prepare spam we'd never send).
  const gate = outreachGate(lead);
  if (!gate.allowed) return { ok: false, stage: "gate", qualification, gate, reason: gate.reason };

  // The mandate verdict rides along so the desk shows HOW the send is governed — but the draft always
  // queues for a human here; unattended execution re-checks the mandate at the cron choke point.
  const verdict = decideMandate("outreach", mandate);
  const draft = outreachFallback(lead);
  return {
    ok: true,
    qualification,
    gate,
    mandate: verdict,
    draft,
    approval: {
      kind: "outreach",
      title: `First touch → ${lead.name ?? lead.company} (${qualification.tier}, fit ${qualification.fit})`,
      detail: `${gate.reason} · send governed: ${verdict.decision}\nSubject: ${draft.subject}\n\n${draft.body}`,
    },
  };
}
