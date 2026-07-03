import type { TenantContext } from "./hosting";
import { tenantNamespace } from "./hosting";

// Backend-provisioning contract — the layer that turns a static built site into a real SaaS with a
// database, user accounts, and server functions. It EXTENDS the hosting contract (hosting.ts): same
// per-tenant isolation promise, one more organ. Pure helpers here are unit-tested; a real provisioner
// (Supabase/Postgres) conforms to `BackendProvider` and is wired only once founder infra keys exist —
// until then this is the typed foundation + the offline Operator brain, NOT a shipped provisioner.
//
// Architecture decision (playbook: TRIZ Ideal-Final-Result + Levels' cheap-infra): do NOT spin a
// separate database per customer (slow, costly, ops-heavy). One shared multi-tenant Postgres, hard
// per-tenant isolation via a `tenant_id` + Row-Level Security. The "per-tenant DB" promise is kept by
// provable isolation, not by physical separation — same guarantee, a fraction of the cost.

// ── The spec the model authors from an idea (mirrors generateSiteFiles, one layer deeper) ──
export interface EntitySpec {
  name: string; // logical entity, e.g. "flashcard_deck"
  columns: { name: string; type: "text" | "int" | "bool" | "timestamptz" | "jsonb" | "uuid"; required?: boolean }[];
  ownedByUser: boolean; // true → rows are per-end-user (RLS on user_id); false → tenant-global config
}
export interface FunctionSpec {
  name: string; // logical function, e.g. "generate_cards"
  purpose: string; // one line — what it does
  needsAuth: boolean; // true → only a signed-in end-user may call it
}
export interface BackendSpec {
  auth: boolean; // does the product have end-user accounts?
  entities: EntitySpec[];
  functions: FunctionSpec[];
}

export interface TenantBackend {
  tenantId: string; // == tenantNamespace(tenant)
  schema: string; // the tenant's isolated logical namespace
  tables: string[]; // fully-scoped physical table names
  authEnabled: boolean;
  functions: string[]; // scoped function route slugs
  status: "provisioned" | "pending" | "failed";
}

// The contract a real backend provisioner implements (parallels HostingProvider). One conformer will
// be `SupabaseBackendProvider` once SUPABASE_SERVICE_ROLE_KEY + a provisioning path exist.
export interface BackendProvider {
  readonly name: string;
  provision(tenant: TenantContext, spec: BackendSpec): Promise<{ ok: boolean; backend?: TenantBackend; error?: string }>;
}

// ── Tenant isolation (the Governed promise, at the data layer) ──
const SLUG = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40);

// Physical, collision-proof table name for a tenant's entity. Two tenants with a "profile" table get
// distinct physical names AND distinct RLS — belt and suspenders.
export function tenantTable(tenant: TenantContext, entity: string): string {
  const ns = tenantNamespace(tenant);
  const base = SLUG(entity) || "entity";
  return ns ? `t_${ns}_${base}` : `t_${base}`;
}
export function scopedFunctionPath(tenant: TenantContext, fn: string): string {
  const ns = tenantNamespace(tenant);
  const base = SLUG(fn) || "fn";
  return ns ? `/api/app/${ns}/${base}` : `/api/app/${base}`;
}

// Two tenants are isolated iff every scoped name differs. Used in tests + a runtime guard before any
// provision writes, so a namespace-collision bug can never silently cross tenants.
export function tenantsIsolated(a: TenantContext, b: TenantContext, entities: string[]): boolean {
  const na = tenantNamespace(a), nb = tenantNamespace(b);
  if (!na || !nb || na === nb) return false;
  return entities.every((e) => tenantTable(a, e) !== tenantTable(b, e));
}

// The RLS policy a provisioner must attach to a user-owned table. Rows are visible only to their owner
// (auth.uid()) — the same posture as our own app's tables. Returned as SQL so the spec is inspectable.
export function rlsPolicyFor(table: string, ownedByUser: boolean): string {
  if (ownedByUser) {
    return `alter table ${table} enable row level security;\n` +
      `create policy ${table}_owner on ${table} using (user_id = auth.uid()) with check (user_id = auth.uid());`;
  }
  // tenant-global config: readable by the tenant's signed-in users, writable only via service role.
  return `alter table ${table} enable row level security;\n` +
    `create policy ${table}_read on ${table} for select using (auth.role() = 'authenticated');`;
}

// Guard the model's spec before anything is provisioned (no unbounded tables, valid names, auth sanity).
export function validateBackendSpec(spec: BackendSpec): { ok: boolean; error?: string } {
  if (spec.entities.length > 12) return { ok: false, error: "too many entities (cap 12) — keep the MVP tight" };
  if (spec.functions.length > 12) return { ok: false, error: "too many functions (cap 12)" };
  for (const e of spec.entities) {
    if (!SLUG(e.name)) return { ok: false, error: `unnamed entity` };
    if (e.ownedByUser && !spec.auth) return { ok: false, error: `entity "${e.name}" is user-owned but auth is off` };
    if (e.columns.length > 24) return { ok: false, error: `entity "${e.name}" has too many columns` };
  }
  if (spec.functions.some((f) => f.needsAuth) && !spec.auth) return { ok: false, error: "an authed function needs auth on" };
  return { ok: true };
}

// ── The Felix Operator: each provisioned company gets its own persistent operating agent ──
// Nat Eliason's Felix credited a 3-LAYER MEMORY as "the single biggest unlock." We replicate the
// PATTERN (public, not his code): a durable brain per tenant that runs the backend's ops. Roles mirror
// Felix's sub-agents (Iris=support, Remy=sales) generalized. This is what makes "run a company" real
// past the build — but every outward/paid action still routes through decide() + the Approval Inbox.

export type OperatorRole = "support" | "sales" | "growth" | "ops";

export interface SemanticFact { key: string; value: string; confidence: number; hits: number } // durable knowledge
export interface Episode { night: number; role: OperatorRole; summary: string } // what happened, in order
export interface Skill { skill: string; when: string } // procedural: a playbook the operator can apply
export interface OperatorMemory {
  semantic: SemanticFact[]; // Layer 1 — knowledge graph (facts that persist)
  episodic: Episode[]; // Layer 2 — episodic log (recent events)
  procedural: Skill[]; // Layer 3 — skills/playbooks
}

export function emptyMemory(): OperatorMemory {
  return { semantic: [], episodic: [], procedural: [] };
}

// Record an episode; keep the episodic log bounded (recency window) so context stays cheap.
const EPISODIC_WINDOW = 40;
export function recordEpisode(mem: OperatorMemory, ep: Episode): OperatorMemory {
  return { ...mem, episodic: [...mem.episodic, ep].slice(-EPISODIC_WINDOW) };
}

// Consolidation — Felix's "unlock": when the same lesson recurs in the episodic log, promote it to a
// durable semantic fact (raising confidence on repeats). This is how the operator gets *wiser* over
// nights instead of just remembering more. Deterministic + pure.
export function consolidate(mem: OperatorMemory, key: string, value: string): OperatorMemory {
  const existing = mem.semantic.find((f) => f.key === key);
  const semantic = existing
    ? mem.semantic.map((f) => (f.key === key ? { ...f, value, hits: f.hits + 1, confidence: Math.min(1, f.confidence + 0.15) } : f))
    : [...mem.semantic, { key, value, confidence: 0.55, hits: 1 }];
  // keep the strongest ~50 facts
  semantic.sort((a, b) => b.confidence - a.confidence || b.hits - a.hits);
  return { ...mem, semantic: semantic.slice(0, 50) };
}

// Compose a compact, role-filtered context string for the operator's next model call. Highest-
// confidence facts first, the relevant skills, and the last few episodes — a budget-bounded brief,
// not the whole history (the difference between a smart agent and an expensive one).
export function composeContext(mem: OperatorMemory, role: OperatorRole, maxFacts = 8): string {
  const facts = mem.semantic.slice(0, maxFacts).map((f) => `- ${f.key}: ${f.value}${f.confidence >= 0.85 ? " (high confidence)" : ""}`);
  const skills = mem.procedural.filter((s) => s.when.includes(role) || s.when === "always").map((s) => `- ${s.skill}`);
  const recent = mem.episodic.filter((e) => e.role === role || e.role === "ops").slice(-5).map((e) => `- night ${e.night}: ${e.summary}`);
  return [
    facts.length ? `What you know:\n${facts.join("\n")}` : "",
    skills.length ? `Skills you can apply:\n${skills.join("\n")}` : "",
    recent.length ? `Recently:\n${recent.join("\n")}` : "",
  ].filter(Boolean).join("\n\n");
}
