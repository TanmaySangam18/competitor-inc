import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// The products registry edge (migration 0030). Decision (c): a product attaches to a USER (always) +
// a COMPANY (optional). This is the owner-level "what products exist" truth the suite + product memory
// read from. Pure row-mapper is exported + unit-tested; the async calls are the thin Supabase edge.
// Service-role writes only (the build registers a product; a client can never forge one).

export interface Product {
  id: string;
  product: string; // stable slug (repo basename)
  repo: string | null; // "owner/name" when built via GitHub
  companyId: string | null; // optional grouping
  foundingGoal: string;
  createdAt: number;
}

interface ProductRow {
  id?: string;
  product?: string | null;
  repo?: string | null;
  company_id?: string | null;
  founding_goal?: string | null;
  created_at?: string | null;
}

/** Pure: one row → a Product, coercing bad fields to safe defaults (never throws). */
export function rowToProduct(r: ProductRow): Product {
  return {
    id: String(r.id ?? ""),
    product: String(r.product ?? ""),
    repo: r.repo ? String(r.repo) : null,
    companyId: r.company_id ? String(r.company_id) : null,
    foundingGoal: String(r.founding_goal ?? ""),
    createdAt: r.created_at ? Date.parse(r.created_at) || 0 : 0,
  };
}

export interface RegisterInput {
  userId: string;
  companyId?: string | null; // optional — a founder raw-build has none
  product: string;
  repo?: string | null;
  goal?: string;
}

/**
 * Register a product under its owner. Idempotent on (user_id, product): a re-run (or a re-build of the
 * same product) never duplicates or clobbers the founding record. Service-role write.
 */
export async function registerProduct(client: SupabaseClient, input: RegisterInput): Promise<void> {
  const { error } = await client.from("products").upsert(
    {
      user_id: input.userId,
      company_id: input.companyId ?? null,
      product: input.product,
      repo: input.repo ?? null,
      founding_goal: (input.goal ?? "").slice(0, 500),
    },
    { onConflict: "user_id,product", ignoreDuplicates: true }, // first registration wins; never overwrite the founding record
  );
  if (error) throw new Error(`registerProduct: ${error.message}`);
}

/** The owner's products, newest first (RLS scopes to auth.uid — a caller only ever sees their own). */
export async function listProductsForUser(client: SupabaseClient): Promise<Product[]> {
  const { data, error } = await client.from("products").select("*").order("created_at", { ascending: false }).limit(100);
  if (error) return []; // outage reads as empty, never a throw mid-request
  return ((data as ProductRow[]) ?? []).map(rowToProduct);
}
