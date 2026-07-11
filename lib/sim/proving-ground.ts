// ─────────────────────────────────────────────────────────────────────────────
// THE SYNTHETIC PROVING GROUND (P0.5) — the capability crash-test harness.
//
// The founder's "slam competitor against the corpus to see if it can build a copilot-class tool":
// this is the deterministic rig that does it, for the S2 rung (grounded retrieval over a tenant's data
// — the mini-copilot capability every larger rung compounds on). It spends ZERO model tokens: it proves
// the MECHANISM (retrieval + grounding + tenant isolation + honest abstention) against the Synthetic
// Enterprise corpus, so a real build's grounded chat can be validated here before any customer touches it.
//
// Three load-bearing properties, each an invariant a Copilot-class product must never violate:
//   1. GROUNDING  — an answer cites only real artifacts that belong to the asking tenant.
//   2. ISOLATION  — a tenant's query can NEVER surface another tenant's artifacts (the RLS analog);
//                   proven non-vacuously by a control that shows the same term DOES match cross-tenant
//                   when the tenant filter is removed.
//   3. ABSTENTION — a query with no supporting evidence returns "I don't know", never a hallucination.
//
// HONESTY WALL ([[crack-audit-and-no-fake-proof]]): input is `simulated:true` corpus and every report is
// `simulated:true`. A proving-ground pass proves the machine works — it is NEVER a real receipt or metric.
// Pure + deterministic: no I/O, no clock, no network. Same seeds ⇒ identical verdict.
// ─────────────────────────────────────────────────────────────────────────────

import { generateEnterprise, type SyntheticEnterprise, type SimArtifact, type GenerateOptions } from "./synthetic-enterprise";

// ── Tokenization ─────────────────────────────────────────────────────────────
const STOPWORDS = new Set(["the", "a", "an", "of", "to", "on", "in", "re", "for", "and", "or", "vX", "vN"]);
function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

// ── The index (the "our Graph" substrate analog) ─────────────────────────────
// Every entry is stamped with its tenantSeed. Retrieval filters by tenant FIRST — the RLS boundary.
interface IndexedDoc {
  tenantSeed: string;
  artifact: SimArtifact;
  authorName: string;
  tokens: string[]; // searchable surface: title + kind + author + department + company
  tf: Map<string, number>;
}

export interface TenantIndex {
  simulated: true;
  docs: IndexedDoc[];
  tenants: string[];
}

function docText(e: SyntheticEnterprise, a: SimArtifact, authorName: string, department: string): string {
  return `${a.title} ${a.kind} ${authorName} ${department} ${e.company.name} ${e.company.industry}`;
}

export function indexEnterprises(enterprises: SyntheticEnterprise[]): TenantIndex {
  const docs: IndexedDoc[] = [];
  for (const e of enterprises) {
    const byId = new Map(e.people.map((p) => [p.id, p]));
    for (const a of e.artifacts) {
      const author = byId.get(a.authorId);
      const authorName = author?.name ?? "unknown";
      const department = author?.department ?? "unknown";
      const tokens = tokenize(docText(e, a, authorName, department));
      const tf = new Map<string, number>();
      for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
      docs.push({ tenantSeed: e.seed, artifact: a, authorName, tokens, tf });
    }
  }
  return { simulated: true, docs, tenants: enterprises.map((e) => e.seed) };
}

// ── Retrieval ─────────────────────────────────────────────────────────────────
export interface Hit {
  tenantSeed: string;
  artifactId: string;
  title: string;
  authorName: string;
  score: number;
}

function scoreDoc(d: IndexedDoc, queryTerms: string[]): number {
  // distinct query terms present (primary) + total term frequency (tie-break, scaled small)
  let distinct = 0;
  let total = 0;
  for (const q of queryTerms) {
    const f = d.tf.get(q) ?? 0;
    if (f > 0) distinct++;
    total += f;
  }
  return distinct + total / 1000;
}

function rank(docs: IndexedDoc[], query: string, k: number): Hit[] {
  const queryTerms = [...new Set(tokenize(query))];
  const scored = docs
    .map((d) => ({ d, score: scoreDoc(d, queryTerms) }))
    .filter((x) => x.score >= 1) // at least one distinct query term matched
    .sort((a, b) => b.score - a.score || a.d.artifact.id.localeCompare(b.d.artifact.id)); // deterministic tie-break
  return scored.slice(0, k).map(({ d, score }) => ({
    tenantSeed: d.tenantSeed,
    artifactId: d.artifact.id,
    title: d.artifact.title,
    authorName: d.authorName,
    score,
  }));
}

/** Tenant-scoped retrieval — filters to the asking tenant FIRST (the RLS boundary), then ranks. */
export function retrieve(index: TenantIndex, opts: { tenant: string; query: string; k?: number }): Hit[] {
  const scoped = index.docs.filter((d) => d.tenantSeed === opts.tenant);
  return rank(scoped, opts.query, opts.k ?? 5);
}

/** UNSCOPED retrieval — the control that proves isolation is doing real work (never used to answer). */
export function retrieveUnscoped(index: TenantIndex, query: string, k = 20): Hit[] {
  return rank(index.docs, query, k);
}

// ── Grounded answering (deterministic; cannot hallucinate beyond citations) ────
export interface GroundedAnswer {
  simulated: true;
  tenant: string;
  abstained: boolean;
  answer: string;
  citations: Hit[]; // every claim in `answer` is backed by one of these; empty iff abstained
}

export function groundedAnswer(index: TenantIndex, opts: { tenant: string; query: string; k?: number }): GroundedAnswer {
  const hits = retrieve(index, opts);
  if (hits.length === 0) {
    return {
      simulated: true,
      tenant: opts.tenant,
      abstained: true,
      answer: `No supporting evidence for "${opts.query}" in this workspace's records.`,
      citations: [],
    };
  }
  // The answer is synthesized ONLY from retrieved artifacts — it references citation ids and nothing else.
  const lines = hits.map((h) => `• [${h.artifactId}] "${h.title}" — ${h.authorName}`);
  return {
    simulated: true,
    tenant: opts.tenant,
    abstained: false,
    answer: `Based on ${hits.length} record(s) in this workspace:\n${lines.join("\n")}`,
    citations: hits,
  };
}

// ── The proving battery ────────────────────────────────────────────────────────
export interface CheckResult {
  passed: number;
  total: number;
  failures: string[]; // human notes on any failing case (empty when all pass)
}
export interface ProvingReport {
  simulated: true;
  tenants: number;
  artifacts: number;
  checks: { grounding: CheckResult; isolation: CheckResult; abstention: CheckResult };
  passed: boolean;
  verdict: string;
}

// A token guaranteed absent from any templated corpus (for the abstention probe).
const NONSENSE_QUERY = "zylophonic quibbleflux unobtanium";

// Highest-frequency content token in a tenant's docs (a term we KNOW is present → grounding probe).
function topTokenFor(index: TenantIndex, tenant: string): string | null {
  const freq = new Map<string, number>();
  for (const d of index.docs) {
    if (d.tenantSeed !== tenant) continue;
    for (const [t, f] of d.tf) freq.set(t, (freq.get(t) ?? 0) + f);
  }
  let best: string | null = null;
  let bestF = 0;
  for (const [t, f] of freq) if (f > bestF) { best = t; bestF = f; }
  return best;
}

// A token present in BOTH tenants (for the non-vacuous isolation probe).
function sharedToken(index: TenantIndex, a: string, b: string): string | null {
  const inA = new Set<string>();
  for (const d of index.docs) if (d.tenantSeed === a) for (const t of d.tf.keys()) inA.add(t);
  const freqB = new Map<string, number>();
  for (const d of index.docs) if (d.tenantSeed === b) for (const [t, f] of d.tf) if (inA.has(t)) freqB.set(t, (freqB.get(t) ?? 0) + f);
  let best: string | null = null;
  let bestF = 0;
  for (const [t, f] of freqB) if (f > bestF) { best = t; bestF = f; }
  return best;
}

export function proveGround(seeds: string[], opts: GenerateOptions = {}): ProvingReport {
  const enterprises = seeds.map((s) => generateEnterprise(s, opts));
  const index = indexEnterprises(enterprises);

  const grounding: CheckResult = { passed: 0, total: 0, failures: [] };
  const isolation: CheckResult = { passed: 0, total: 0, failures: [] };
  const abstention: CheckResult = { passed: 0, total: 0, failures: [] };

  for (const e of enterprises) {
    // 1) GROUNDING — a known-present term returns cited hits, all belonging to this tenant.
    grounding.total++;
    const term = topTokenFor(index, e.seed);
    const ga = term ? groundedAnswer(index, { tenant: e.seed, query: term }) : null;
    const grounded =
      !!ga &&
      !ga.abstained &&
      ga.citations.length > 0 &&
      ga.citations.every((c) => c.tenantSeed === e.seed) &&
      // every cited id resolves to a REAL artifact of this tenant (no invented citation)
      ga.citations.every((c) => e.artifacts.some((art) => art.id === c.artifactId));
    if (grounded) grounding.passed++;
    else grounding.failures.push(`grounding failed for tenant ${e.seed} (term=${term})`);

    // 3) ABSTENTION — nonsense query yields no answer, no citations.
    abstention.total++;
    const na = groundedAnswer(index, { tenant: e.seed, query: NONSENSE_QUERY });
    if (na.abstained && na.citations.length === 0) abstention.passed++;
    else abstention.failures.push(`abstention failed for tenant ${e.seed} (hallucinated ${na.citations.length} citations)`);
  }

  // 2) ISOLATION — for every ordered pair, a shared term is filtered to the asking tenant only,
  //    while the UNSCOPED control proves that term genuinely matches both (isolation isn't vacuous).
  for (let i = 0; i < enterprises.length; i++) {
    for (let j = 0; j < enterprises.length; j++) {
      if (i === j) continue;
      const a = enterprises[i].seed;
      const b = enterprises[j].seed;
      const term = sharedToken(index, a, b);
      if (!term) continue; // no shared vocabulary → nothing to isolate (skip, not a failure)
      isolation.total++;
      const raw = retrieveUnscoped(index, term);
      const rawHasA = raw.some((h) => h.tenantSeed === a);
      const rawHasB = raw.some((h) => h.tenantSeed === b);
      const scopedA = retrieve(index, { tenant: a, query: term, k: 50 });
      const leaked = scopedA.some((h) => h.tenantSeed !== a);
      // pass = control proves the term matches both tenants AND the scoped query leaks nothing from B
      if (rawHasA && rawHasB && !leaked) isolation.passed++;
      else isolation.failures.push(`isolation ${a}←${b} (term=${term}, rawA=${rawHasA} rawB=${rawHasB} leaked=${leaked})`);
    }
  }

  const passed =
    grounding.passed === grounding.total &&
    isolation.passed === isolation.total &&
    abstention.passed === abstention.total;

  const verdict = passed
    ? `PASS — grounding ${grounding.passed}/${grounding.total}, isolation ${isolation.passed}/${isolation.total}, abstention ${abstention.passed}/${abstention.total}. The S2 grounding mechanism holds on ${enterprises.length} synthetic tenants (${index.docs.length} artifacts). (simulated — proves the machine, not a result.)`
    : `FAIL — grounding ${grounding.passed}/${grounding.total}, isolation ${isolation.passed}/${isolation.total}, abstention ${abstention.passed}/${abstention.total}. See failures.`;

  return {
    simulated: true,
    tenants: enterprises.length,
    artifacts: index.docs.length,
    checks: { grounding, isolation, abstention },
    passed,
    verdict,
  };
}
