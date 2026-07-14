// lib/core/precedent.ts — THE PRECEDENT STORE (Tier C4 · REQUIREMENTS §1, ORG role #53 Precedent Clerk).
//
// Every human ruling on an escalation becomes machine-readable policy so the SAME question never reaches
// the human twice. Agents consult() before escalating; a hit returns the prior ruling and the escalation is
// answered without a human. This is what makes the founder's "~10 min/day" real and compounds into a
// switching-cost moat (institutional memory). Keyless + in-memory; a durable store wires at connect.
//
// Honest scope: matching is by NORMALIZED question + scope (deterministic), not fuzzy semantic match — a
// genuinely novel phrasing still escalates (default-deny), which is the safe direction.

export interface Precedent {
  id: string;
  question: string; // the original question, verbatim
  normalized: string; // the match key
  ruling: string; // the human's decision, in machine-usable terms
  scope?: string; // optional namespace (e.g. a customer id) so rulings don't leak across tenants
  setBy: string; // "human" (or a named backup human)
  at: string; // ISO timestamp
}

export function normalizeQuestion(q: string): string {
  return (q || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export interface ConsultResult { found: boolean; precedent?: Precedent; }

export class PrecedentStore {
  private items: Precedent[] = [];
  private seq = 0;

  // Write a human ruling to policy. Re-ruling the same (question, scope) updates it (rulings evolve).
  record(input: { question: string; ruling: string; scope?: string; setBy?: string }, at: Date = new Date()): Precedent {
    const normalized = normalizeQuestion(input.question);
    const existing = this.items.find((p) => p.normalized === normalized && p.scope === input.scope);
    const p: Precedent = {
      id: existing?.id ?? `pre-${++this.seq}`,
      question: input.question, normalized, ruling: input.ruling,
      scope: input.scope, setBy: input.setBy ?? "human", at: at.toISOString(),
    };
    if (existing) Object.assign(existing, p);
    else this.items.push(p);
    return p;
  }

  // Agents call this BEFORE escalating. A hit means "already ruled — apply it, don't ask again".
  consult(question: string, scope?: string): ConsultResult {
    const normalized = normalizeQuestion(question);
    const precedent = this.items.find((p) => p.normalized === normalized && p.scope === scope);
    return precedent ? { found: true, precedent } : { found: false };
  }

  all(): Precedent[] { return this.items.slice(); }
  get size(): number { return this.items.length; }
}

export const precedents = new PrecedentStore();
