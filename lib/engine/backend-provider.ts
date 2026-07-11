import type { TenantContext } from "./hosting";
import { tenantNamespace } from "./hosting";
import {
  validateBackendSpec, tenantTable, scopedFunctionPath,
  type BackendProvider, type BackendSpec, type TenantBackend,
} from "./backend";
import { serviceClient } from "./service";

// P1 conformer to the BackendProvider contract: provisions a real per-tenant backend on the shared
// Postgres via the safe `provision_tenant_table` RPC (migration 0015). Fail-soft — returns
// { ok:false } when Supabase/the migration isn't there, so callers degrade honestly instead of
// throwing. The DDL is gated behind the RPC's strict name check, so a bad spec can't inject SQL.

// The minimal client surface we use — lets tests inject a fake without a live DB.
export interface ProvisionClient {
  rpc(fn: string, args: Record<string, unknown>): Promise<{ error: { message: string } | null }>;
  from(table: string): { upsert(row: Record<string, unknown>): Promise<{ error: { message: string } | null }> };
}

export async function provisionBackend(
  tenant: TenantContext,
  spec: BackendSpec,
  client: ProvisionClient | null = serviceClient() as unknown as ProvisionClient | null,
): Promise<{ ok: boolean; backend?: TenantBackend; error?: string }> {
  const ns = tenantNamespace(tenant);
  if (!ns) return { ok: false, error: "no tenant identity" };

  const valid = validateBackendSpec(spec);
  if (!valid.ok) return { ok: false, error: valid.error };

  if (!client) return { ok: false, error: "backend not configured (Supabase + migration 0015 required)" };

  const tables: string[] = [];
  try {
    for (const e of spec.entities) {
      const table = tenantTable(tenant, e.name);
      const { error } = await client.rpc("provision_tenant_table", { p_table: table, p_owned: e.ownedByUser });
      if (error) return { ok: false, error: `provision ${e.name}: ${error.message}` };
      tables.push(table);
    }
    const functions = spec.functions.map((f) => scopedFunctionPath(tenant, f.name));
    const backend: TenantBackend = {
      tenantId: ns, schema: "public", tables, authEnabled: spec.auth, functions, status: "provisioned",
    };
    const reg = await client.from("tenant_backends").upsert({
      tenant_id: ns, schema: "public", tables, functions, auth_enabled: spec.auth, spec, status: "provisioned", updated_at: new Date().toISOString(),
    });
    if (reg.error) return { ok: false, error: `registry: ${reg.error.message}` };
    // seed an empty operator memory row so the nightly loop has somewhere to write (best-effort)
    await client.from("operator_memory").upsert({ tenant_id: ns, updated_at: new Date().toISOString() }).catch(() => {});
    return { ok: true, backend };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "provision failed" };
  }
}

