// ─────────────────────────────────────────────────────────────────────────────
// THE SYNTHETIC ENTERPRISE (SIM) — a deep, longitudinal, FAKE company generated deterministically.
//
// The founder's "30 years of data, every inch real in a fake world": a seeded generator that produces a
// referentially-consistent enterprise — org + people + a decades-long stream of documents, tickets,
// commits, and emails — as the crash-test substrate the capability ladder validates against (can a built
// copilot-class product ingest / isolate / ground on / scale against enterprise-shaped data?).
//
// HONESTY WALL (load-bearing, [[crack-audit-and-no-fake-proof]]): every enterprise is `simulated: true`.
// This data may NEVER count toward a real metric, receipt, or public number — it proves the MACHINE works,
// never that RESULTS happened. Code does scale + volume; a model (Fable) authors seed templates for
// texture later. Pure + deterministic: no I/O, no clock (now is injected) — same seed ⇒ identical corpus.
// ─────────────────────────────────────────────────────────────────────────────

export interface SimPerson {
  id: string;
  name: string;
  title: string;
  department: string;
  hiredAt: number; // ms; always within [foundedAt, now]
}

export type SimArtifactKind = "document" | "ticket" | "commit" | "email";

export interface SimArtifact {
  id: string;
  kind: SimArtifactKind;
  title: string;
  authorId: string; // always resolves to a SimPerson.id
  createdAt: number; // ms; always within [author.hiredAt, now]
  refId?: string; // commit → ticket id · email → recipient person id (referential integrity)
  state?: string; // ticket lifecycle
}

export interface SyntheticEnterprise {
  simulated: true; // THE WALL — literal true, never a real tenant
  seed: string;
  company: { name: string; industry: string; foundedAt: number; now: number };
  departments: string[];
  people: SimPerson[];
  artifacts: SimArtifact[];
}

export interface GenerateOptions {
  people?: number; // default 60
  years?: number; // simulated span, default 30
  artifactsPerYear?: number; // default 40 → scale by raising this
  now?: number; // injected clock for determinism (default: a fixed epoch, NOT Date.now())
}

// Fixed default "now" so a bare generate() is fully deterministic (no wall-clock leak into a sim corpus).
const FIXED_NOW = Date.UTC(2026, 0, 1);
const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;

// Deterministic RNG (mulberry32 + a string hash) — matches the codebase's provider.ts pattern.
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = ["Ava", "Liam", "Noah", "Mia", "Ravi", "Sana", "Diego", "Yuki", "Omar", "Lena", "Kai", "Nina", "Theo", "Priya", "Marcus", "Elena", "Jonas", "Amara", "Ingrid", "Rafael", "Naomi", "Kenji", "Sofia", "Dmitri"];
const LAST = ["Chen", "Patel", "Silva", "Kim", "Okafor", "Rossi", "Haddad", "Novak", "García", "Ito", "Larsson", "Mbeki", "Weber", "Costa", "Singh", "Bauer", "Torres", "Nguyen", "Adeyemi", "Volkov"];
const INDUSTRIES = ["logistics SaaS", "fintech", "healthcare IT", "e-commerce", "enterprise security", "developer tooling"];
const DEPARTMENTS = ["Engineering", "Product", "Design", "Sales", "Marketing", "Finance", "Legal", "Support", "Operations", "Data"];
const TITLES: Record<string, string[]> = {
  Engineering: ["Software Engineer", "Senior Engineer", "Staff Engineer", "Engineering Manager", "VP Engineering"],
  Product: ["Product Manager", "Senior PM", "Group PM", "Chief Product Officer"],
  Design: ["Product Designer", "Senior Designer", "Head of Design"],
  Sales: ["Account Executive", "Sales Manager", "VP Sales"],
  Marketing: ["Content Marketer", "Growth Lead", "CMO"],
  Finance: ["Analyst", "Controller", "CFO"],
  Legal: ["Counsel", "General Counsel"],
  Support: ["Support Engineer", "Support Lead"],
  Operations: ["Ops Specialist", "COO"],
  Data: ["Data Analyst", "Data Scientist", "Head of Data"],
};
const DOC_TYPES = ["Q{n} strategy memo", "{d} architecture RFC", "Incident postmortem #{n}", "{d} roadmap", "Board update Q{n}", "Onboarding guide v{n}", "Pricing analysis", "{d} runbook"];
const TICKET_TYPES = ["Login flow bug", "Latency regression", "Add {d} export", "Onboarding drop-off", "Billing edge case", "Search relevance", "Mobile layout fix", "Data pipeline stall"];
const TICKET_STATES = ["open", "in-progress", "in-review", "done", "wontfix"];
const COMMIT_VERBS = ["fix", "feat", "refactor", "perf", "chore", "docs", "test"];
const COMMIT_SUBJECTS = ["harden the {d} path", "cut p99 latency", "add {d} endpoint", "close the race in the queue", "tighten input validation", "ship the {d} view", "backfill the migration"];
const EMAIL_SUBJECTS = ["re: {d} sync", "heads-up on the {d} launch", "quick question — {d}", "weekly {d} update", "can you review the {d} doc?"];

export function generateEnterprise(seed: string, opts: GenerateOptions = {}): SyntheticEnterprise {
  const rng = mulberry32(hash(`ent:${seed}`));
  const now = opts.now ?? FIXED_NOW;
  const years = Math.max(1, opts.years ?? 30);
  const foundedAt = now - Math.round(years * YEAR_MS);
  const peopleCount = Math.max(1, opts.people ?? 60);
  const artifactCount = Math.max(0, Math.round((opts.artifactsPerYear ?? 40) * years));

  const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];
  const between = (lo: number, hi: number) => lo + rng() * (hi - lo);
  const fill = (tpl: string) =>
    tpl.replace("{n}", String(1 + Math.floor(rng() * 9))).replace(/\{d\}/g, () => pick(["billing", "auth", "search", "export", "onboarding", "reporting", "sync"]));

  const company = {
    name: `${pick(["Northwind", "Contoso", "Meridian", "Halcyon", "Everpeak", "Blue Harbor"])} ${pick(["Systems", "Labs", "Technologies", "Works", "Group"])}`,
    industry: pick(INDUSTRIES),
    foundedAt,
    now,
  };

  // People — hired at random points across the company's life (integrity: hiredAt ∈ [foundedAt, now]).
  const people: SimPerson[] = Array.from({ length: peopleCount }, (_, i) => {
    const department = pick(DEPARTMENTS);
    return {
      id: `p${i}`,
      name: `${pick(FIRST)} ${pick(LAST)}`,
      title: pick(TITLES[department]),
      department,
      hiredAt: Math.round(between(foundedAt, now)),
    };
  });

  // Artifacts — a longitudinal stream; each authored by a real person AFTER their hire date.
  const artifacts: SimArtifact[] = [];
  const ticketIds: string[] = [];
  for (let i = 0; i < artifactCount; i++) {
    const r = rng();
    const kind: SimArtifactKind = r < 0.4 ? "document" : r < 0.65 ? "ticket" : r < 0.9 ? "commit" : "email";
    const author = people[Math.floor(rng() * people.length)];
    const createdAt = Math.round(between(author.hiredAt, now)); // authored after they were hired
    const id = `${kind[0]}${i}`;
    if (kind === "ticket") ticketIds.push(id);
    const art: SimArtifact = {
      id,
      kind,
      authorId: author.id,
      createdAt,
      title:
        kind === "document" ? fill(pick(DOC_TYPES))
        : kind === "ticket" ? fill(pick(TICKET_TYPES))
        : kind === "commit" ? `${pick(COMMIT_VERBS)}: ${fill(pick(COMMIT_SUBJECTS))}`
        : fill(pick(EMAIL_SUBJECTS)),
    };
    if (kind === "ticket") art.state = pick(TICKET_STATES);
    // Referential links: a commit may close an existing ticket; an email addresses another person.
    if (kind === "commit" && ticketIds.length && rng() < 0.6) art.refId = ticketIds[Math.floor(rng() * ticketIds.length)];
    if (kind === "email") art.refId = people[Math.floor(rng() * people.length)].id;
    artifacts.push(art);
  }
  artifacts.sort((a, b) => a.createdAt - b.createdAt); // chronological, like a real history

  return { simulated: true, seed, company, departments: [...DEPARTMENTS], people, artifacts };
}

// A compact, honest read of a corpus — powers the proving-ground report (counts, span, integrity proof).
export interface CorpusStats {
  simulated: true;
  people: number;
  artifacts: number;
  byKind: Record<SimArtifactKind, number>;
  spanYears: number;
  integrityOk: boolean; // every authorId resolves, every createdAt ∈ [author.hiredAt, now], refs resolve
}

export function corpusStats(e: SyntheticEnterprise): CorpusStats {
  const byId = new Map(e.people.map((p) => [p.id, p]));
  const ids = new Set(e.people.map((p) => p.id));
  const ticketIds = new Set(e.artifacts.filter((a) => a.kind === "ticket").map((a) => a.id));
  const byKind: Record<SimArtifactKind, number> = { document: 0, ticket: 0, commit: 0, email: 0 };
  let integrityOk = true;
  for (const a of e.artifacts) {
    byKind[a.kind]++;
    const author = byId.get(a.authorId);
    if (!author || a.createdAt < author.hiredAt || a.createdAt > e.company.now) integrityOk = false;
    if (a.refId) {
      const resolves = a.kind === "commit" ? ticketIds.has(a.refId) : ids.has(a.refId);
      if (!resolves) integrityOk = false;
    }
  }
  return {
    simulated: true,
    people: e.people.length,
    artifacts: e.artifacts.length,
    byKind,
    spanYears: Math.round((e.company.now - e.company.foundedAt) / YEAR_MS),
    integrityOk,
  };
}
