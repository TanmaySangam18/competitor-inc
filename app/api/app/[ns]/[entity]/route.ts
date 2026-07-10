import { serviceClient } from "@/lib/engine/service";
import { overLimit, clientIp } from "@/lib/engine/ratelimit";

export const runtime = "nodejs";

// Tenant runtime (P2-lite): the CRUD surface for a provisioned tenant backend. A built product's
// end-users read/write their own rows here. The physical table is name-scoped per tenant
// (t_<ns>_<entity>) and its existence is verified against the tenant_backends registry before any
// query — a request can only touch a table that provisioning actually created. Fail-soft; bounded.
//
// NOTE: this uses the service role (RLS-bypassing) to keep P1 shippable without the end-user auth
// instance (that's P4). Rows are tenant-scoped by table name; per-END-USER isolation via auth.uid()
// RLS lands when P4 wires the built product's own Supabase Auth. Documented, not hidden.

const NS_RE = /^[0-9a-f]{8}$/;
const ENT_RE = /^[a-z0-9_]{1,40}$/;
const scopedTable = (ns: string, entity: string) => `t_${ns}_${entity}`;

async function registeredTables(sb: NonNullable<ReturnType<typeof serviceClient>>, ns: string): Promise<string[] | null> {
  const { data, error } = await sb.from("tenant_backends").select("tables").eq("tenant_id", ns).maybeSingle();
  if (error || !data) return null;
  return Array.isArray(data.tables) ? (data.tables as string[]) : [];
}

export async function GET(req: Request, ctx: { params: Promise<{ ns: string; entity: string }> }) {
  if (await overLimit(`app:${clientIp(req)}`)) return Response.json({ ok: false, error: "rate limited" }, { status: 429 });
  const { ns, entity } = await ctx.params;
  if (!NS_RE.test(ns) || !ENT_RE.test(entity)) return Response.json({ ok: false, error: "bad path" }, { status: 400 });
  const sb = serviceClient();
  if (!sb) return Response.json({ ok: true, persisted: false, rows: [] });
  try {
    const tables = await registeredTables(sb, ns);
    const table = scopedTable(ns, entity);
    if (!tables || !tables.includes(table)) return Response.json({ ok: false, error: "unknown entity" }, { status: 404 });
    const { data } = await sb.from(table).select("id, data, created_at").order("created_at", { ascending: false }).limit(200);
    return Response.json({ ok: true, persisted: true, rows: data ?? [] });
  } catch {
    return Response.json({ ok: true, persisted: false, rows: [] });
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ ns: string; entity: string }> }) {
  if (await overLimit(`app:${clientIp(req)}`)) return Response.json({ ok: false, error: "rate limited" }, { status: 429 });
  const { ns, entity } = await ctx.params;
  if (!NS_RE.test(ns) || !ENT_RE.test(entity)) return Response.json({ ok: false, error: "bad path" }, { status: 400 });
  const body = await req.json().catch(() => null);
  const data = body && typeof body === "object" && body.data && typeof body.data === "object" ? body.data : null;
  if (!data || JSON.stringify(data).length > 8000) return Response.json({ ok: false, error: "bad body (expect {data:{...}} ≤8KB)" }, { status: 400 });
  const sb = serviceClient();
  if (!sb) return Response.json({ ok: false, error: "backend not configured" }, { status: 503 });
  try {
    const tables = await registeredTables(sb, ns);
    const table = scopedTable(ns, entity);
    if (!tables || !tables.includes(table)) return Response.json({ ok: false, error: "unknown entity" }, { status: 404 });
    const { data: row, error } = await sb.from(table).insert({ data }).select("id, data, created_at").single();
    if (error) return Response.json({ ok: false, error: "insert failed" }, { status: 500 });
    return Response.json({ ok: true, row });
  } catch {
    return Response.json({ ok: false, error: "insert failed" }, { status: 500 });
  }
}
