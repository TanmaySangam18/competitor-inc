import type { AgentRole } from "./types";

// The Rationale Stream (PDR §6) — derive the "why" behind any action, grounded in the agent's governing
// principle. Pure + deterministic so it works for EVERY activity (real, simulated, historical) with no
// storage. This is the substrate the Glass Box, the founder/customer views, and the proof board read —
// so everyone tells the same story (coherence = the trust wedge).

export interface Rationale {
  why: string;
  principle: string;
}

// Each agent acts under one stated principle — its lens on every decision.
const PRINCIPLES: Record<AgentRole, string> = {
  ceo: "Every move sits inside the unit economics — protect runway, cut what doesn't convert.",
  engineering: "Proof-of-Work: a task is done only with a verifiable artifact, never on a hunch.",
  marketing: "Validate demand before scaling spend — a costly signal beats raw reach.",
  support: "Help first; never make a promise the company can't keep.",
  growth: "Test small, bounded, and reversible — then scale only what actually converts.",
};

// A one-line why tied to what the action actually was.
function whyFor(action: string, meta?: string): string {
  const a = `${action} ${meta ?? ""}`.toLowerCase();
  if (/credited|failed/.test(a)) return "Failed work is credited back, never charged — you only pay for results.";
  if (/ship|built|deploy|mvp|site|repo|build/.test(a)) return "Shipped with a verifiable artifact so you can check it really happened — not marked done on a hunch.";
  if (/test|ctr|signup|demand|ad|spend/.test(a)) return "A small, bounded demand test — we scale only the channels that actually convert.";
  if (/audit|runway|churn|metric|review/.test(a)) return "A nightly read on the numbers so the company never drifts off-strategy.";
  if (/approv|sign off|queued|outreach|post|campaign/.test(a)) return "Anything that touches real money, real people, or production waits for your sign-off.";
  if (/support|reply|ticket|email answered/.test(a)) return "Handled within policy; anything that makes a commitment escalates to you.";
  return "Logged, gated, and reversible — visible in the Glass Box for you to verify or undo.";
}

export function rationaleFor(agent: AgentRole, action: string, meta?: string): Rationale {
  return {
    why: whyFor(action, meta),
    principle: PRINCIPLES[agent] ?? "Every action is logged, gated, and reversible.",
  };
}
