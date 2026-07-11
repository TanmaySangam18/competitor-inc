// ─────────────────────────────────────────────────────────────────────────────
// BLOCK 3 — THE OUTREACH ENGINE (keyless core)
//
// The Revenue department's targeting + qualification + first-touch drafting for the GTM beachhead
// ([[gtm-beachhead-agencies]]): boutique software agencies / technical consultants. Pure + tested; the
// actual SENDING (warmed email via Instantly, SMS via Twilio) activates when those keys land — this is
// the brain that decides WHO to reach, WHETHER we're allowed to, and WHAT to say.
//
// HARD RAIL (survives the autonomy mandate): NO scraped-list spam. A contact is only reachable with a
// real trigger, a warm source, or explicit permission — enforced by outreachGate(), the outbound
// equivalent of the policy engine's forbidden floor. This is what keeps us the opposite of a money-printer.
// ─────────────────────────────────────────────────────────────────────────────

export interface ICP {
  name: string;
  sizeMin: number; // employee count band (inclusive)
  sizeMax: number;
  positiveSignals: string[]; // fit signals we look for
  disqualifiers: string[]; // signals that rule a lead OUT
  buyerTitles: string[]; // who actually buys
}

// The beachhead, encoded. Change this one object to re-aim the whole outreach engine at a new segment.
export const AGENCY_ICP: ICP = {
  name: "Boutique software agency / technical consultancy",
  sizeMin: 2,
  sizeMax: 30,
  positiveSignals: [
    "builds custom software for clients",
    "capacity-constrained (waitlist / 'not taking new clients')",
    "actively hiring developers",
    "publishes client case studies",
    "technical founder",
    "retainer or project-based pricing",
  ],
  disqualifiers: [
    "enterprise (50+ staff)",
    "design/marketing only (no software delivery)",
    "staffing or recruiting agency",
    "product startup (not a services business)",
  ],
  buyerTitles: ["founder", "ceo", "managing director", "principal", "head of delivery", "cto", "owner"],
};

export type LeadSource = "referral" | "inbound" | "community" | "event" | "list";
export type LeadTier = "hot" | "warm" | "cold" | "disqualified";

export interface Lead {
  id: string;
  name?: string;
  title?: string;
  company: string;
  companySize?: number;
  signals?: string[]; // observed signals about this lead (matched loosely against the ICP)
  source: LeadSource;
  triggerReason?: string; // a specific, recent, REAL reason to reach out (their post, a job listing, a launch)
  contactPermission?: boolean; // explicit opt-in or a prior relationship
}

export interface Qualification {
  fit: number; // 0–100
  tier: LeadTier;
  reasons: string[];
}

const has = (list: string[] | undefined, needle: string) =>
  (list ?? []).some((s) => s.toLowerCase().includes(needle.toLowerCase()) || needle.toLowerCase().includes(s.toLowerCase()));

// Score how well a lead fits the ICP + assign a tier. Deterministic. Disqualifiers hard-cap to
// "disqualified" so we never chase a bad-fit contact no matter how many soft signals match.
export function qualifyLead(lead: Lead, icp: ICP = AGENCY_ICP): Qualification {
  const reasons: string[] = [];

  const disqualified = icp.disqualifiers.filter((d) => has(lead.signals, d));
  if (disqualified.length > 0) {
    return { fit: 0, tier: "disqualified", reasons: disqualified.map((d) => `disqualified: ${d}`) };
  }
  // Size out of band (when known) is also a hard disqualifier.
  if (lead.companySize != null && (lead.companySize < icp.sizeMin || lead.companySize > icp.sizeMax)) {
    return { fit: 0, tier: "disqualified", reasons: [`disqualified: team size ${lead.companySize} outside ${icp.sizeMin}–${icp.sizeMax}`] };
  }

  let fit = 0;
  const titleMatch = lead.title ? icp.buyerTitles.some((t) => lead.title!.toLowerCase().includes(t)) : false;
  if (titleMatch) { fit += 30; reasons.push(`buyer title: ${lead.title}`); }
  if (lead.companySize != null) { fit += 15; reasons.push(`team size ${lead.companySize} in band`); }

  const matched = icp.positiveSignals.filter((s) => has(lead.signals, s));
  fit += Math.min(40, matched.length * 12);
  for (const m of matched) reasons.push(`signal: ${m}`);

  if (lead.triggerReason) { fit += 15; reasons.push(`trigger: ${lead.triggerReason}`); }
  fit = Math.max(0, Math.min(100, fit));

  // Tier: hot needs a real trigger AND strong fit (so "hot" always means reach-out-now-with-a-reason).
  const tier: LeadTier =
    fit >= 70 && lead.triggerReason ? "hot" : fit >= 45 ? "warm" : "cold";
  return { fit, tier, reasons };
}

export interface GateResult { allowed: boolean; reason: string }

// THE HARD RAIL. A lead is reachable ONLY with a warm source, explicit permission, or a specific real
// trigger. A cold scraped list with no trigger + no consent is BLOCKED — the outbound forbidden floor.
export function outreachGate(lead: Lead): GateResult {
  if (lead.contactPermission) return { allowed: true, reason: "explicit permission / prior relationship" };
  if (lead.source === "referral") return { allowed: true, reason: "warm referral" };
  if (lead.source === "inbound") return { allowed: true, reason: "they reached in first" };
  if ((lead.source === "community" || lead.source === "event") && lead.triggerReason)
    return { allowed: true, reason: `warm channel + trigger: ${lead.triggerReason}` };
  if (lead.source === "list" && lead.triggerReason)
    return { allowed: true, reason: `sourced list but has a specific trigger: ${lead.triggerReason}` };
  return { allowed: false, reason: "cold contact with no trigger or consent — blocked (no scraped-list spam)" };
}

// Our offer, one place. The message drafter always sells THIS.
const OUR_OFFER =
  "an autonomous software delivery + growth team — we build, ship, support, and sell your client software so you can take on more work without hiring";

export interface FirstTouch { subject: string; body: string }

// The model prompt for a personalized first-touch, grounded in the Sales Floor canon with the honesty
// guardrail hard-wired. (The engine calls a model with this; the deterministic fallback below guarantees
// the tool never produces spam-shaped or fabricated copy.)
export function buildOutreachPrompt(lead: Lead, offer: string = OUR_OFFER): string {
  const q = qualifyLead(lead);
  return (
    `You are the SDR at competitor.inc writing ONE short, human first-touch message to ${lead.name ?? "a prospect"}` +
    `${lead.title ? `, ${lead.title}` : ""} at ${lead.company} — a boutique software agency.\n` +
    `Why them (their fit): ${q.reasons.join("; ") || "fits our ICP"}.\n` +
    `${lead.triggerReason ? `The specific reason you're reaching out NOW: ${lead.triggerReason}.\n` : ""}` +
    `What we offer: ${offer}.\n` +
    `Rules (non-negotiable): open with THEIR specific trigger, not us. Lead with the pain (capacity/hiring), ` +
    `not a feature list. ONE clear ask (a 15-min call). Under 90 words. No fabricated stats, no fake urgency, ` +
    `no "hope this finds you well". Be a real person. Frameworks to draw on: Challenger (a teaching insight), ` +
    `PAS (problem-agitate-solve), and a single specific CTA. Return ONLY JSON: {"subject":string,"body":string}.`
  );
}

// Deterministic, honest fallback — never fabricates a number, always anchors on the real trigger.
export function outreachFallback(lead: Lead, offer: string = OUR_OFFER): FirstTouch {
  const first = (lead.name ?? "there").split(" ")[0];
  const hook = lead.triggerReason
    ? `Saw ${lead.triggerReason} — that's usually the moment an agency's delivery capacity gets tight.`
    : `Reaching out because ${lead.company} builds client software and that delivery load only grows.`;
  return {
    subject: `${lead.company} — more client work without more hires?`,
    body:
      `Hi ${first},\n\n${hook}\n\n` +
      `We give agencies ${offer} — so you can say yes to the next client without a new hire. ` +
      `Everything is founder-approved and every result is receipted (no black box).\n\n` +
      `Worth a 15-minute call this week to see if it fits ${lead.company}? No deck — just your delivery bottleneck and whether we can take it.\n\n— competitor.inc`,
  };
}
