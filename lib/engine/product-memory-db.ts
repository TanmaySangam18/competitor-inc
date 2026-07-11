import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { architectureDoc, emptyMemory, type ProductDoc, type ProductDocKind, type ProductMemory } from "@/lib/org/product-memory";

// Persistence for Product Memory (P1, migration 0028). Mirrors org_runs: the OWNER reads their product's
// docs (auth.uid RLS); WRITES are service-role only (the build / Change-Desk step executor records
// architecture + ADRs under the cron). Pure row-mappers are exported + unit-tested; the async calls are the
// thin Supabase edge. Fail-safe: a garbage row degrades to a harmless doc, never a throw mid-build.

interface ProductDocRow {
  product?: string;
  kind?: string;
  seq?: number | string | null;
  title?: string | null;
  body?: string | null;
  created_at?: string | null;
}

const KINDS: ProductDocKind[] = ["architecture", "adr", "roadmap"];

/** Pure: one row → a ProductDoc, coercing bad fields to safe defaults (never throws). */
export function rowToProductDoc(r: ProductDocRow): ProductDoc {
  const kind = (KINDS.includes(r.kind as ProductDocKind) ? r.kind : "adr") as ProductDocKind;
  const seq = Number.isFinite(Number(r.seq)) ? Math.max(0, Math.trunc(Number(r.seq))) : 0;
  const createdAt = r.created_at ? Date.parse(r.created_at) || 0 : 0;
  return { kind, seq, title: String(r.title ?? ""), body: String(r.body ?? ""), createdAt };
}

/** Pure: rows → a ProductMemory (null/empty ⇒ empty memory ⇒ recall is empty ⇒ a fresh build). */
export function rowsToMemory(product: string, rows: ProductDocRow[] | null): ProductMemory {
  if (!rows || rows.length === 0) return emptyMemory(product);
  return { product, docs: rows.map(rowToProductDoc) };
}

/** Load a product's full memory for the recall brief. Keyed on the registry identity (user_id, product)
 *  per decision (c) — company is optional, so a founder raw-build (no company) still has memory under its
 *  owner. Any DB error ⇒ empty memory (a build never blocks on a memory outage — it starts fresh). */
export async function loadProductMemory(client: SupabaseClient, userId: string, product: string): Promise<ProductMemory> {
  const { data, error } = await client
    .from("product_docs")
    .select("product,kind,seq,title,body,created_at")
    .eq("user_id", userId)
    .eq("product", product)
    .order("kind", { ascending: true })
    .order("seq", { ascending: true });
  if (error) return emptyMemory(product);
  return rowsToMemory(product, (data as ProductDocRow[]) ?? null);
}

/** Lay the compounding foundation: write the founding architecture doc (seq 0) IF the product has none
 *  yet. Idempotent — a product is anchored exactly once, so re-runs never duplicate or overwrite it.
 *  Returns true if it seeded, false if the anchor already existed. This is what makes every SUBSEQUENT
 *  change build on a foundation instead of an empty memory (the S3 compounding spine). */
export async function seedArchitectureIfMissing(
  client: SupabaseClient,
  userId: string,
  companyId: string | null,
  product: string,
  goal: string,
  now: number = Date.now(),
): Promise<boolean> {
  const memory = await loadProductMemory(client, userId, product);
  if (memory.docs.some((d) => d.kind === "architecture")) return false;
  await saveProductDoc(client, userId, companyId, product, architectureDoc(product, goal, now));
  return true;
}

/** Record one product doc (architecture on first build; an ADR per accepted change). Service-role write.
 *  companyId is optional (decision c) — a founder raw-build files under its owner with no company. */
export async function saveProductDoc(
  client: SupabaseClient,
  userId: string,
  companyId: string | null,
  product: string,
  doc: ProductDoc,
): Promise<void> {
  const { error } = await client.from("product_docs").insert({
    company_id: companyId,
    user_id: userId,
    product,
    kind: doc.kind,
    seq: doc.seq,
    title: doc.title,
    body: doc.body,
  });
  if (error) throw new Error(`saveProductDoc: ${error.message}`);
}
