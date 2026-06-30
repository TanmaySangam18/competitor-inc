import crypto from "node:crypto";

// v2 — the per-tenant hosting CONTRACT. Today every build ships to a GitHub repo + Pages URL; tomorrow
// it might be Vercel, a sandbox, or the user's own account (eject). This is the typed boundary every
// hosting backend must honor so the "Governed" promise is real: one tenant's build can never collide
// with or reach into another's. Pure helpers are unit-tested; backends (execution.ts) conform to it.

export interface TenantContext {
  companyId?: string;
  ownerEmail?: string;
}

// A short, stable, collision-resistant namespace for a tenant. Derived from the strongest identity
// available (companyId > ownerEmail). Stable so the same tenant always maps to the same namespace
// (idempotent re-runs hit the same repo), and distinct so two tenants can't share one.
export function tenantNamespace(t: TenantContext): string {
  const seed = (t.companyId || t.ownerEmail || "").trim().toLowerCase();
  if (!seed) return "";
  return crypto.createHash("sha256").update(seed).digest("hex").slice(0, 8);
}

// Namespace a base resource name (e.g. a repo slug) to a tenant. With no tenant identity we return the
// base unchanged (offline/sim parity — no behavior change). With one, we suffix the namespace so two
// tenants building "My App" get distinct, non-colliding repos that are still human-readable.
export function namespacedResource(base: string, t: TenantContext): string {
  const ns = tenantNamespace(t);
  if (!ns) return base;
  // keep it within GitHub's 100-char repo limit, leaving room for the suffix
  return `${base.slice(0, 80)}-${ns}`;
}

// The isolation guarantees a conforming backend must uphold — surfaced in docs + the "Governed" copy.
export function isolationContract(): string[] {
  return [
    "Per-tenant namespace: every provisioned resource is suffixed with the tenant's stable namespace — no cross-tenant name collisions.",
    "No shared mutable state: one tenant's build never writes into another tenant's repo/deploy.",
    "Public-by-default artifact: the shipped URL is publicly resolvable so the receipt stays checkable.",
    "Ejectable: the artifact is a real repo the founder owns and can take with them — no lock-in.",
  ];
}

// The contract a hosting backend implements. buildOnGitHub (execution.ts) is the first conformer.
export interface HostingProvider {
  readonly name: string;
  provision(tenant: TenantContext, spec: { repo: string; description: string; files: Record<string, string> }): Promise<{ ok: boolean; url?: string; error?: string }>;
}
