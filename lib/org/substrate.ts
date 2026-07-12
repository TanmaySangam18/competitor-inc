// ─────────────────────────────────────────────────────────────────────────────
// THE SUBSTRATE (P4 — "our Graph"). The compounding ASSET: a customer's products share ONE data layer +
// one identity, so a customer's 5th product takes days, not weeks — it plugs into the graph the first four
// already filled instead of starting empty.
//
// A substrate belongs to ONE owner (the customer). Every product in their suite can contribute records and
// ground on ALL of them (cite-or-abstain, reusing lib/engine/grounding.ts). ISOLATION is by construction:
// a substrate only ever holds one owner's data, so a product can never reach another customer's graph —
// there's no cross-owner query surface at all. COMPOUNDING is the point: attach a new product and it
// immediately sees the accumulated graph.
//
// Pure + deterministic (no I/O). The runtime persistence (RLS-scoped rows) + the identity join are the
// live half, gated like the other pillars. This models the guarantees.
// ─────────────────────────────────────────────────────────────────────────────

import { groundOnRecords, type GroundRecord, type GroundResult } from "@/lib/engine/grounding";

export interface Substrate {
  owner: string; // the customer (user/company) — the ONLY isolation boundary; one substrate = one owner
  products: string[]; // product slugs plugged into this shared substrate (the suite)
  records: GroundRecord[]; // the shared company data every attached product can ground on
}

export const emptySubstrate = (owner: string): Substrate => ({ owner, products: [], records: [] });

/** A product joins the shared substrate. Idempotent — attaching twice is a no-op. On join it inherits the
 *  whole accumulated graph (see sharedContext) — that is the compounding: it starts full, not empty. */
export function attachProduct(substrate: Substrate, productId: string): Substrate {
  if (substrate.products.includes(productId)) return substrate;
  return { ...substrate, products: [...substrate.products, productId] };
}

/** A product contributes records to the shared graph. Deduped by record id so re-contributing is safe and
 *  the graph grows with NEW facts, not repeats. The contributing product is auto-attached. */
export function contribute(substrate: Substrate, productId: string, records: GroundRecord[]): Substrate {
  const withProduct = attachProduct(substrate, productId);
  const seen = new Set(withProduct.records.map((r) => r.id));
  const added = records.filter((r) => r.id && !seen.has(r.id));
  return { ...withProduct, records: [...withProduct.records, ...added] };
}

/** What a product inherits from the substrate: every shared record + the sibling products it now shares
 *  identity + data with. This is why the 2nd product ships faster — it starts with this, not nothing. */
export function sharedContext(substrate: Substrate, productId: string): { records: GroundRecord[]; siblings: string[] } {
  return {
    records: substrate.records,
    siblings: substrate.products.filter((p) => p !== productId),
  };
}

/** Ground a question over the customer's shared graph. Owner-scoped BY CONSTRUCTION — the substrate only
 *  holds this owner's records, so a citation can only ever be this owner's data. Cite-or-abstain (reusing
 *  the grounding primitive): no relevant record ⇒ an honest "no record", never a fabricated answer. */
export function groundOnSubstrate(substrate: Substrate, question: string, opts: { k?: number } = {}): GroundResult {
  return groundOnRecords(substrate.records, question, { k: opts.k, label: `${substrate.owner}'s company data` });
}
