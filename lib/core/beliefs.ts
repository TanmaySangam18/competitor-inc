// lib/core/beliefs.ts — WHAT THE COMPANY BELIEVES, WHEN IT STARTED BELIEVING IT, AND WHO TOLD IT.
//
// WHY THIS EXISTS. Our memory was 104 lines of flat vector search over note text (lib/engine/memory.ts):
// embed, remember, recall. That is document RAG, and it has three failures that matter for a company that
// has to be RIGHT rather than merely relevant:
//
//   1. NOTHING EXPIRES. "Acme is on the builder plan" stays retrievable forever. When they upgrade, the
//      old note does not become false, it just sits next to the new one and both come back on a search.
//   2. NOTHING CONTRADICTS. Two notes can disagree and the store has no opinion. Whichever embeds closer
//      to the question wins, which means the answer depends on phrasing.
//   3. NOTHING HAS A SOURCE. A note the customer told us and a note we inferred are the same shape, so a
//      guess can end up backing a public claim and nobody can tell afterwards.
//
// Naive's "Brain" fixes the first two with beliefs carrying valid_from and valid_to. That part is worth
// copying exactly and this module does.
//
// THE THIRD FAILURE IS OURS TO FIX, AND IT IS THE POINT. Every belief carries a PROVENANCE GRADE:
//
//   observed  — came from a receipt, a tool result, a real API response. Has a source, and can be cited.
//   asserted  — a human or a document told us. Believable, not evidence.
//   inferred  — the model derived it. Useful for acting, never sufficient for claiming.
//
// and the rule the rest of the category does not have: **only an OBSERVED belief may back a claim that
// reaches a customer.** claimSupport() is the check, and it is what the publishing mandate's honesty rail
// is supposed to mean when it says "receipt-backed." Governing truth is the thing nobody else governs, and
// a memory that cannot tell evidence from a guess makes that claim impossible to keep.
//
// Pure and deterministic: no I/O, no clock, no embeddings. The store is plain data so it can live in
// memory for a test, Postgres in production, or a JSON file in a drill. Semantic search stays in
// lib/engine/memory.ts, which is mechanism; deciding what is true is policy, so it lives here.

export type Provenance = "observed" | "asserted" | "inferred";

/** Provenance ranked by how much weight it can carry. Higher wins a contradiction. */
const PROVENANCE_RANK: Record<Provenance, number> = { observed: 3, asserted: 2, inferred: 1 };

export interface Belief {
  id: string;
  /** Namespaced entity the claim is about, e.g. "customer:acme" or "product:checkout". */
  subject: string;
  /** The attribute claimed, e.g. "plan", "churn-risk", "primary-contact". */
  predicate: string;
  /** The claimed value, as text so the store stays schema-free. */
  object: string;
  provenance: Provenance;
  /** Where it came from: a receipt id, an audit sequence, a person, a document. */
  source: string;
  /** 0..1. Consolidation raises it; a contradiction from a stronger source lowers nothing, it supersedes. */
  confidence: number;
  validFrom: number;
  /** null means still believed. A number means we stopped believing it then. */
  validTo: number | null;
  /** The belief that replaced this one, so the history is a chain rather than a pile. */
  supersededBy: string | null;
  /** How many independent observations agree. 1 unless consolidated. */
  observedCount: number;
}

export interface BeliefStore {
  beliefs: Belief[];
  /** Monotonic id counter, so ids are stable and the store stays reproducible. */
  seq: number;
}

export const emptyStore = (): BeliefStore => ({ beliefs: [], seq: 0 });

export interface BeliefInput {
  subject: string;
  predicate: string;
  object: string;
  provenance: Provenance;
  source: string;
  confidence?: number;
}

const key = (b: { subject: string; predicate: string }): string => `${b.subject}::${b.predicate}`;

/** Beliefs held at a moment: valid window covers `at` and nothing has superseded them. */
export function currentBeliefs(store: BeliefStore, at: number): Belief[] {
  return store.beliefs.filter((b) => b.validFrom <= at && (b.validTo === null || b.validTo > at));
}

/**
 * The single thing believed about a subject and predicate, or null. When more than one is somehow current,
 * the strongest provenance wins, then the most recent. Deterministic, so the answer never depends on how
 * the question was phrased, which is the flat-vector-store failure this replaces.
 */
export function believe(store: BeliefStore, subject: string, predicate: string, at: number): Belief | null {
  const matches = currentBeliefs(store, at).filter((b) => b.subject === subject && b.predicate === predicate);
  if (!matches.length) return null;
  return [...matches].sort(
    (a, b) =>
      PROVENANCE_RANK[b.provenance] - PROVENANCE_RANK[a.provenance] ||
      b.validFrom - a.validFrom ||
      b.id.localeCompare(a.id),
  )[0];
}

export interface AssertResult {
  store: BeliefStore;
  belief: Belief;
  /** The belief this one replaced, when it displaced an existing claim. */
  superseded: Belief | null;
  /** True when the new belief actually changed what the company thinks. */
  changed: boolean;
}

/**
 * Record a belief. If something contradictory is already current for the same subject and predicate, it is
 * CLOSED rather than deleted: validTo is set and supersededBy points forward, so "what did we think in
 * March" stays answerable. Recording the same value again consolidates instead of duplicating.
 */
export function assertBelief(store: BeliefStore, input: BeliefInput, at: number): AssertResult {
  const existing = believe(store, input.subject, input.predicate, at);

  // Same value from a new source: this is corroboration, not news. Raise the count and the confidence
  // rather than storing a second identical row, which is how a note store turns ten mentions into ten
  // competing facts.
  if (existing && existing.object === input.object) {
    const strongest = PROVENANCE_RANK[input.provenance] > PROVENANCE_RANK[existing.provenance]
      ? input.provenance
      : existing.provenance;
    const consolidated: Belief = {
      ...existing,
      provenance: strongest,
      // Upgrading provenance means the source has to travel with it, or an observed belief could end up
      // citing the assertion it replaced.
      source: strongest === existing.provenance ? existing.source : input.source,
      observedCount: existing.observedCount + 1,
      confidence: Math.min(1, Math.max(existing.confidence, input.confidence ?? existing.confidence) + 0.05),
    };
    return {
      store: { ...store, beliefs: store.beliefs.map((b) => (b.id === existing.id ? consolidated : b)) },
      belief: consolidated,
      superseded: null,
      changed: false,
    };
  }

  const id = `blf_${store.seq}`;
  const belief: Belief = {
    id,
    subject: input.subject,
    predicate: input.predicate,
    object: input.object,
    provenance: input.provenance,
    source: input.source,
    confidence: input.confidence ?? (input.provenance === "observed" ? 0.9 : input.provenance === "asserted" ? 0.7 : 0.5),
    validFrom: at,
    validTo: null,
    supersededBy: null,
    observedCount: 1,
  };

  const beliefs = store.beliefs.map((b) =>
    existing && b.id === existing.id ? { ...b, validTo: at, supersededBy: id } : b,
  );

  return {
    store: { beliefs: [...beliefs, belief], seq: store.seq + 1 },
    belief,
    superseded: existing,
    changed: true,
  };
}

/** Stop believing something without replacing it. Used when a fact is withdrawn rather than corrected. */
export function retract(store: BeliefStore, beliefId: string, at: number): BeliefStore {
  return {
    ...store,
    beliefs: store.beliefs.map((b) => (b.id === beliefId && b.validTo === null ? { ...b, validTo: at } : b)),
  };
}

/** The full chain for one subject and predicate, oldest first. This is the "what did we think then" view. */
export function history(store: BeliefStore, subject: string, predicate: string): Belief[] {
  return store.beliefs
    .filter((b) => b.subject === subject && b.predicate === predicate)
    .sort((a, b) => a.validFrom - b.validFrom || a.id.localeCompare(b.id));
}

/** Everything currently believed about one entity, so an agent can be briefed without a search query. */
export function entityView(store: BeliefStore, subject: string, at: number): Record<string, Belief> {
  const out: Record<string, Belief> = {};
  for (const b of currentBeliefs(store, at).filter((x) => x.subject === subject)) {
    const held = out[b.predicate];
    if (!held || PROVENANCE_RANK[b.provenance] > PROVENANCE_RANK[held.provenance] || b.validFrom > held.validFrom) {
      out[b.predicate] = b;
    }
  }
  return out;
}

export interface Contradiction {
  subject: string;
  predicate: string;
  beliefs: Belief[];
}

/**
 * Where the company currently believes two different things at once. A flat note store cannot answer this
 * at all, which is why it can hand a confident wrong answer to a customer. Surfacing it is the point:
 * these go to a human, they are not resolved by picking.
 */
export function contradictions(store: BeliefStore, at: number): Contradiction[] {
  const groups = new Map<string, Belief[]>();
  for (const b of currentBeliefs(store, at)) {
    const k = key(b);
    groups.set(k, [...(groups.get(k) ?? []), b]);
  }
  const out: Contradiction[] = [];
  for (const [k, list] of groups) {
    if (new Set(list.map((b) => b.object)).size < 2) continue;
    const [subject, predicate] = k.split("::");
    out.push({ subject, predicate, beliefs: [...list].sort((a, b) => a.id.localeCompare(b.id)) });
  }
  return out.sort((a, b) => key(a).localeCompare(key(b)));
}

// ── the part that is ours, not copied ────────────────────────────────────────

export interface ClaimSupport {
  supported: boolean;
  belief: Belief | null;
  /** Plain reason, safe to show a human deciding whether to publish. */
  reason: string;
}

/** Only evidence may back a public claim. A guess can guide action; it can never be quoted. */
export function canBackAClaim(b: Belief | null): boolean {
  return !!b && b.provenance === "observed" && b.source.trim().length > 0;
}

/**
 * Could the company say this out loud? This is what the publishing mandate's honesty rail means by
 * "receipt-backed", made checkable. An asserted or inferred belief is refused BY GRADE, not by confidence,
 * because a confident guess is still a guess and that distinction is the whole moat.
 */
export function claimSupport(store: BeliefStore, subject: string, predicate: string, at: number): ClaimSupport {
  const b = believe(store, subject, predicate, at);
  if (!b) return { supported: false, belief: null, reason: `nothing known about ${predicate} for ${subject}` };
  if (b.provenance === "inferred") {
    return { supported: false, belief: b, reason: `this was inferred, not observed. Useful for deciding, not for saying.` };
  }
  if (b.provenance === "asserted") {
    return { supported: false, belief: b, reason: `we were told this by ${b.source}. Believable, but not evidence we can cite.` };
  }
  if (!b.source.trim()) {
    return { supported: false, belief: b, reason: `marked observed but carries no source, so it cannot be cited` };
  }
  return { supported: true, belief: b, reason: `observed, source: ${b.source}` };
}

/** Everything the company holds that it must NOT repeat publicly, for a human to review in one place. */
export function unciteable(store: BeliefStore, at: number): Belief[] {
  return currentBeliefs(store, at)
    .filter((b) => !canBackAClaim(b))
    .sort((a, b) => key(a).localeCompare(key(b)) || a.id.localeCompare(b.id));
}

export interface BeliefStats {
  total: number;
  current: number;
  superseded: number;
  byProvenance: Record<Provenance, number>;
  contradictions: number;
  /** Share of current beliefs that could back a public claim. The honesty ratio. */
  citeableShare: number;
}

export function beliefStats(store: BeliefStore, at: number): BeliefStats {
  const current = currentBeliefs(store, at);
  const byProvenance: Record<Provenance, number> = { observed: 0, asserted: 0, inferred: 0 };
  for (const b of current) byProvenance[b.provenance]++;
  const citeable = current.filter(canBackAClaim).length;
  return {
    total: store.beliefs.length,
    current: current.length,
    superseded: store.beliefs.filter((b) => b.supersededBy !== null).length,
    byProvenance,
    contradictions: contradictions(store, at).length,
    citeableShare: current.length ? Math.round((citeable / current.length) * 1000) / 1000 : 0,
  };
}
