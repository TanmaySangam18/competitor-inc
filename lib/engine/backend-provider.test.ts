import { describe, it, expect } from "vitest";
import { provisionBackend, type ProvisionClient } from "./backend-provider";
import type { BackendSpec } from "./backend";

// A fake Supabase surface that records calls — lets us test provisioning without a live DB.
function fakeClient(opts: { rpcError?: string; upsertError?: string } = {}) {
  const calls: { rpc: { fn: string; args: Record<string, unknown> }[]; upserts: { table: string; row: Record<string, unknown> }[] } = { rpc: [], upserts: [] };
  const client: ProvisionClient = {
    async rpc(fn, args) { calls.rpc.push({ fn, args }); return { error: opts.rpcError ? { message: opts.rpcError } : null }; },
    from(table) {
      return { async upsert(row: Record<string, unknown>) { calls.upserts.push({ table, row }); return { error: opts.upsertError ? { message: opts.upsertError } : null }; } };
    },
  };
  return { client, calls };
}

const A = { companyId: "co-a" };
const spec: BackendSpec = {
  auth: true,
  entities: [
    { name: "flashcard deck", columns: [{ name: "title", type: "text" }], ownedByUser: true },
    { name: "config", columns: [], ownedByUser: false },
  ],
  functions: [{ name: "generate cards", purpose: "make cards", needsAuth: true }],
};

describe("provisionBackend", () => {
  it("provisions each entity via the safe RPC with the scoped name + owned flag", async () => {
    const { client, calls } = fakeClient();
    const res = await provisionBackend(A, spec, client);
    expect(res.ok).toBe(true);
    expect(calls.rpc).toHaveLength(2);
    expect(calls.rpc[0].fn).toBe("provision_tenant_table");
    expect(calls.rpc[0].args.p_table).toMatch(/^t_[0-9a-f]{8}_flashcard_deck$/);
    expect(calls.rpc[0].args.p_owned).toBe(true);
    expect(calls.rpc[1].args.p_owned).toBe(false); // config is tenant-global
    expect(res.backend?.tables).toHaveLength(2);
    expect(res.backend?.authEnabled).toBe(true);
  });

  it("registers the backend + seeds operator memory", async () => {
    const { client, calls } = fakeClient();
    await provisionBackend(A, spec, client);
    const tables = calls.upserts.map((u) => u.table);
    expect(tables).toContain("tenant_backends");
    expect(tables).toContain("operator_memory");
  });

  it("rejects an invalid spec before any DDL runs (user-owned entity, auth off)", async () => {
    const { client, calls } = fakeClient();
    const res = await provisionBackend(A, { ...spec, auth: false }, client);
    expect(res.ok).toBe(false);
    expect(calls.rpc).toHaveLength(0);
  });

  it("fail-soft when Supabase/migration isn't configured (client null)", async () => {
    const res = await provisionBackend(A, spec, null);
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/not configured/);
  });

  it("surfaces an RPC error without registering", async () => {
    const { client, calls } = fakeClient({ rpcError: "permission denied" });
    const res = await provisionBackend(A, spec, client);
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/permission denied/);
    expect(calls.upserts).toHaveLength(0);
  });

  it("needs a tenant identity", async () => {
    const { client } = fakeClient();
    const res = await provisionBackend({}, spec, client);
    expect(res.ok).toBe(false);
  });
});
