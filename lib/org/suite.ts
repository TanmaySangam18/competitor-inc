// ─────────────────────────────────────────────────────────────────────────────
// THE SUITE (S4 / P4 — "our Graph" for one customer).
//
// S3 made building compound ACROSS SESSIONS of one product. S4's unlock is compounding ACROSS PRODUCTS:
// a customer's 2nd, 3rd, 5th product SHARE one substrate — one sign-on, one data layer, established
// conventions — so each new product REUSES instead of rebuilds. That reuse is why the suite's second
// product ships in a fraction of the first's time (the S4 exit criterion).
//
// This is the pure brief layer: given the products a customer already runs, produce the recall a NEW
// product's build is handed so it JOINS the suite. Empty for the first product (nothing to reuse yet).
// No I/O; deterministic. Wiring: fullstackPromptFile(goal, { suiteRecall }) injects it, exactly like
// product-memory's per-product recall — this is the per-CUSTOMER recall one level up.
// ─────────────────────────────────────────────────────────────────────────────

export interface ProductRef {
  slug: string;
  purpose: string; // one line — what that product is
}

export interface Suite {
  company: string;
  products: ProductRef[]; // products the customer already runs (chronological; most recent last)
}

export interface Reuse {
  firstProduct: boolean; // the customer's first product — nothing to reuse yet
  siblings: number; // how many products already exist
  sharesIdentity: boolean; // a 2nd+ product reuses the suite's ONE sign-on
  sharesData: boolean; // a 2nd+ product grounds on the customer's shared data layer
}

/** The honest read of what a new product inherits from the suite (the "why it's faster" measure). */
export function reuse(suite: Suite): Reuse {
  const n = suite.products.length;
  return { firstProduct: n === 0, siblings: n, sharesIdentity: n > 0, sharesData: n > 0 };
}

const RECALL_CAP = 1400; // keep the suite recall from crowding the per-product recall + the brief

/**
 * The recall a NEW product's build is handed so it joins the suite instead of standing alone. Empty for
 * the first product. For the 2nd+, it names the siblings and demands substrate reuse — one sign-on, the
 * shared data layer, matching conventions — so the suite stays coherent and the build compounds.
 */
export function suiteRecall(suite: Suite): string {
  if (suite.products.length === 0) return "";
  const out = [
    `PRODUCT SUITE — this customer ("${suite.company}") already runs ${suite.products.length} product(s), and this new one JOINS that suite. REUSE the shared substrate; do NOT rebuild it:`,
    `- ONE SIGN-ON: use the SAME authentication as the existing products — never a new/separate auth.`,
    `- SHARED DATA: the customer's data layer is shared across the suite (RLS-scoped to them); read/extend it, don't duplicate it.`,
    `- CONVENTIONS: match the existing products' stack + patterns so the suite stays one coherent whole.`,
    ``,
    `Products already in the suite:`,
    ...suite.products.map((p) => `- ${p.slug}: ${p.purpose}`),
  ].join("\n");
  return out.length > RECALL_CAP ? out.slice(0, RECALL_CAP - 1).trimEnd() + "…" : out;
}
