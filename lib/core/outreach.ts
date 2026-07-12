// lib/core/outreach.ts — PHASE 4: the reach rail (qualify → gate → draft), honesty-first.
//
// Salvages lib/org/outreach: score a lead against our beachhead ICP (boutique software agencies), run the
// HARD no-spam gate (cold + no trigger + no consent = BLOCKED), and draft an honest, named-AI first-touch.
// Keyless — the deterministic fallback never fabricates a stat or spam-shaped copy. A model drafts richer
// copy when a key is wired (buildOutreachPrompt is the seam). SENDING (Gmail) + SOURCING (Explee) are
// separate seams that light up with their own keys — this is the drafting + governance brain of the rail.

import {
  AGENCY_ICP, qualifyLead, outreachGate, outreachFallback,
  type ICP, type Lead, type Qualification, type GateResult, type FirstTouch,
} from "@/lib/org/outreach";

export interface OutreachPlan {
  lead: Lead;
  qualification: Qualification;
  gate: GateResult; // the no-spam rail
  draft: FirstTouch | null; // drafted ONLY when the gate allows AND the lead isn't disqualified
  simulated: boolean; // true = keyless honest fallback; a model drafts when a key is wired
}

export function outreachFor(lead: Lead, opts: { icp?: ICP; offer?: string } = {}): OutreachPlan {
  const qualification = qualifyLead(lead, opts.icp ?? AGENCY_ICP);
  const gate = outreachGate(lead);
  const draft = gate.allowed && qualification.tier !== "disqualified" ? outreachFallback(lead, opts.offer) : null;
  return { lead, qualification, gate, draft, simulated: true };
}

export { AGENCY_ICP, qualifyLead, outreachGate };
export type { ICP, Lead, Qualification, GateResult, FirstTouch };
