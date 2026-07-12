// lib/core/deliberate.ts — PHASE 2 SEED: the nervous system, v0.
//
// A STRUCTURED, GOVERNED team deliberation. Given a task it (1) convenes the relevant roles from the ONE
// org, (2) records each participant's stance grounded in their REAL mandate + escalation rule, and (3)
// produces a governed Decision Record — who decided, what, why, and whether the safety floor forces it up
// to the founder. This is the *shape* of real agent reasoning and it's headless (runs in the CLI, no keys).
//
// HONEST SCOPE (no fabricated capability): the convening, the participants, their mandates, and the
// governed proceed/escalate decision are REAL. The reasoned back-and-forth is NOT here yet — the stances
// are mandate-derived, and every record is flagged `simulated: true`. Real model-reasoned debate plugs in
// at this exact seam when a provider/key is connected (mirrors the engine's simulated→real provider split).

import { ROLES, type OrgRole } from "@/lib/org/organization";

export interface Position {
  roleId: string;
  title: string;
  stance: string; // mandate-derived until a model is wired (see `simulated`)
}

export interface DecisionRecord {
  task: string;
  participants: string[]; // role titles, chair first
  positions: Position[];
  decision: "proceed" | "escalate-to-founder";
  decidedBy: string; // chair title
  rationale: string;
  simulated: boolean; // true until real model-reasoned debate is wired in
}

// High-consequence surface — mirrors the governance floor's spirit (money · legal · security · destructive).
const HIGH_RISK = ["money", "spend", "pay", "payment", "payout", "refund", "budget", "$", "sign", "contract", "legal", "delete", "security", "pricing", "price", "acquire", "hire", "fire", "wire", "transfer"];
const STOP = new Set(["the", "a", "an", "for", "to", "of", "and", "or", "in", "on", "with", "our", "your", "this", "that", "new", "it", "we", "is", "are"]);
const LEVEL_RANK: Record<string, number> = { exec: 3, director: 2, lead: 1, ic: 0 };

function tokens(s: string): string[] {
  return (s.toLowerCase().match(/[a-z0-9$]+/g) ?? []).filter((w) => w.length > 2 && !STOP.has(w));
}

// Convene the panel: the CEO chairs; the rest are the roles whose real mandate/responsibilities best match
// the task (deterministic — score, then seniority, then id). No keyword hit → the most senior cross-cut.
function convene(task: string, size: number): { chair: OrgRole; panel: OrgRole[] } {
  const chair = ROLES.find((r) => r.reportsTo === null) ?? ROLES[0];
  const words = new Set(tokens(task));
  const others = ROLES.filter((r) => r.id !== chair.id);
  const bySeniority = (a: OrgRole, b: OrgRole) => (LEVEL_RANK[b.level] - LEVEL_RANK[a.level]) || a.id.localeCompare(b.id);

  const scored = others
    .map((r) => {
      const hay = new Set(tokens(`${r.title} ${r.department} ${r.mandate} ${r.responsibilities.join(" ")}`));
      let score = 0;
      for (const w of words) if (hay.has(w)) score++;
      return { r, score };
    })
    .sort((a, b) => b.score - a.score || bySeniority(a.r, b.r));

  const matched = scored.filter((s) => s.score > 0).slice(0, size).map((s) => s.r);
  const panel = matched.length > 0 ? matched : [...others].sort(bySeniority).slice(0, size);
  return { chair, panel };
}

// The reasoner produces a participant's stance. DEFAULT = mandate-derived (deterministic, no model, no
// key). REAL model-reasoned debate plugs in HERE — same signature, async-ready — when a provider/key is
// connected (the last phase). Supply a real reasoner and the record is no longer flagged `simulated`.
export type Reasoner = (input: {
  roleId: string; title: string; mandate: string; escalatesWhen: string; task: string;
}) => string | Promise<string>;

const defaultReasoner: Reasoner = ({ mandate, escalatesWhen }) => `${mandate} (escalates when: ${escalatesWhen})`;

// The brain auto-connects: when a model key is present, the deliberation reasons for REAL (via the lazily-
// loaded model reasoner — kept out of the CLI/test import graph); otherwise it stays on the honest,
// mandate-derived default. An explicitly injected reasoner (e.g. in tests) always wins.
export function hasModelKey(): boolean {
  return !!(process.env.MODEL_API_KEY || process.env.ANTHROPIC_API_KEY);
}

export async function deliberate(
  task: string,
  opts: { size?: number; reasoner?: Reasoner } = {},
): Promise<DecisionRecord> {
  const clean = (task || "").trim();
  const { chair, panel } = convene(clean, opts.size ?? 3);
  const room = [chair, ...panel];
  const useModel = !opts.reasoner && hasModelKey();
  const reasoner: Reasoner = opts.reasoner ?? (useModel ? (await import("./model-reasoner")).modelReasoner : defaultReasoner);

  const positions: Position[] = [];
  for (const r of room) {
    const stance = await reasoner({ roleId: r.id, title: r.title, mandate: r.mandate, escalatesWhen: r.escalatesWhen, task: clean });
    positions.push({ roleId: r.id, title: r.title, stance });
  }

  const t = clean.toLowerCase();
  const highRisk = HIGH_RISK.some((k) => t.includes(k));
  const decision: DecisionRecord["decision"] = highRisk ? "escalate-to-founder" : "proceed";
  const rationale = highRisk
    ? "Touches a high-consequence class (money · legal · security · destructive) — the floor routes it to the founder."
    : `Within standing authorization — ${panel[0]?.title ?? chair.title} owns it; verify before done.`;

  return {
    task: clean,
    participants: room.map((r) => r.title),
    positions,
    decision,
    decidedBy: chair.title,
    rationale,
    simulated: !opts.reasoner && !useModel, // real reasoning (injected reasoner OR model key) → not simulated
  };
}
