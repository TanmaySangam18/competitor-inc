// ─────────────────────────────────────────────────────────────────────────────
// GROUNDING (P4 substrate seed) — the runtime twin of the Synthetic Proving Ground's contract.
//
// The platform's own primitive for answering a question grounded on a customer's OWN records (their company
// memory / stored items). It is the reference every generated grounded feature (R10) must match, and the
// first piece of the "our Graph" substrate: retrieval + cite-or-abstain over a tenant's data.
//
// THREE invariants, identical to the proving ground (lib/sim/proving-ground.ts):
//   • GROUNDING  — the answer is built ONLY from retrieved records; it can cite nothing it didn't retrieve.
//   • ISOLATION  — this primitive grounds over WHATEVER records it is handed; the CALLER passes only the
//                  current tenant's rows (RLS is the boundary). It can never invent or reach other data.
//   • ABSTENTION — no relevant record ⇒ an explicit "no record" answer with empty citations, never a guess.
//
// Pure + deterministic (no model, no I/O): a free, honest extractive answer. A model may LATER phrase the
// answer from these same citations, but never beyond them. Shareable (no server-only) so it's unit-tested.
// ─────────────────────────────────────────────────────────────────────────────

export interface GroundRecord {
  id: string;
  text: string; // the searchable + citable content of one record (a note, ticket, doc, item, …)
}

export interface GroundCitation {
  id: string;
  snippet: string; // a short, verbatim excerpt of the cited record (proof the answer is backed by it)
  score: number;
}

export interface GroundResult {
  abstained: boolean;
  answer: string;
  citations: GroundCitation[]; // empty iff abstained; every id resolves to an input record
}

const STOPWORDS = new Set(["the", "a", "an", "of", "to", "on", "in", "for", "and", "or", "is", "it", "my", "me", "with", "about", "how", "what", "which", "do", "does"]);

function tokenize(s: string): string[] {
  return s.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

interface Scored {
  record: GroundRecord;
  score: number;
  tf: Map<string, number>;
}

function indexRecord(r: GroundRecord): Scored {
  const tf = new Map<string, number>();
  for (const t of tokenize(r.text)) tf.set(t, (tf.get(t) ?? 0) + 1);
  return { record: r, score: 0, tf };
}

function snippet(text: string, max = 140): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max - 1).trimEnd() + "…" : t;
}

/**
 * Retrieve the top-k records relevant to a query. Score = distinct query terms present (primary) + total
 * term frequency (tie-break). A record scoring 0 (no query term present) is never returned — that is what
 * makes abstention honest. Deterministic tie-break on id so results are stable.
 */
export function retrieveRecords(records: GroundRecord[], query: string, k = 5): GroundCitation[] {
  const terms = [...new Set(tokenize(query))];
  if (terms.length === 0) return [];
  return records
    .map(indexRecord)
    .map((s) => {
      let distinct = 0, total = 0;
      for (const q of terms) { const f = s.tf.get(q) ?? 0; if (f > 0) distinct++; total += f; }
      return { ...s, score: distinct + total / 1000 };
    })
    .filter((s) => s.score >= 1)
    .sort((a, b) => b.score - a.score || a.record.id.localeCompare(b.record.id))
    .slice(0, k)
    .map((s) => ({ id: s.record.id, snippet: snippet(s.record.text), score: s.score }));
}

/**
 * Answer a question grounded on the given records. The caller MUST pass only records the current tenant is
 * allowed to see (RLS boundary). The answer is synthesized purely from retrieved citations — it can never
 * reference a record it didn't retrieve, and it abstains when nothing is relevant.
 */
export function groundOnRecords(records: GroundRecord[], question: string, opts: { k?: number; label?: string } = {}): GroundResult {
  const citations = retrieveRecords(records, question, opts.k ?? 5);
  const where = opts.label ? ` in ${opts.label}` : "";
  if (citations.length === 0) {
    return { abstained: true, answer: `No supporting record${where} for "${question.trim()}".`, citations: [] };
  }
  const lines = citations.map((c) => `• [${c.id}] ${c.snippet}`);
  return {
    abstained: false,
    answer: `Based on ${citations.length} of your record(s)${where}:\n${lines.join("\n")}`,
    citations,
  };
}
