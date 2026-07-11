import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { adrDoc, nextAdrSeq, recallBrief, type ProductDoc, type ProductMemory } from "@/lib/org/product-memory";
import { loadProductMemory, saveProductDoc } from "./product-memory-db";
import { dispatchFullstackBuild } from "./fullstack-build";

// ─────────────────────────────────────────────────────────────────────────────
// THE CHANGE DESK (R9) — subscribers request REAL code changes to a product post-build.
//
// This is P1 (product memory) realized as a user-facing capability: a change is NOT a rebuild. It loads the
// product's memory, hands the agent the recall brief (so it CONTINUES the product and honors prior ADRs),
// dispatches an incremental build, and — when that build ships — records the change as a new ADR. That is
// the compounding loop closed end to end: build → memory → change → memory.
//
// Governance: a change is a `build_software` (+ `deploy`) act — the ROUTE gates it through the customer's
// mandate (Consent Rails) before calling here. This engine is the mechanism; deps are injectable so the
// whole flow is unit-tested with zero network.
// ─────────────────────────────────────────────────────────────────────────────

export interface ChangePlan {
  recall: string; // the product-memory recall brief (empty on a product with no memory yet)
  changeGoal: string; // the request, framed as a continuation not a rebuild
}

/** Pure: frame a change request against the product's accumulated memory. */
export function planChange(memory: ProductMemory, request: string): ChangePlan {
  return {
    recall: recallBrief(memory),
    changeGoal: `Apply this change to the EXISTING product (extend it, do NOT rebuild from scratch): ${request.trim()}`,
  };
}

/** Pure: the ADR that records an accepted change on the product's decision log (next ordinal). */
export function changeAdr(memory: ProductMemory, request: string, now: number): ProductDoc {
  const seq = nextAdrSeq(memory);
  const r = request.trim();
  return adrDoc(
    seq,
    `Change: ${r.slice(0, 80)}`,
    {
      context: `A subscriber requested a change to "${memory.product}": ${r}`,
      decision: `Applied the requested change via the Change Desk, continuing the existing product and honoring its prior decisions.`,
      consequences: `Product extended in place, not rebuilt. Live status is verified separately (build-status) before any "live" claim.`,
    },
    now,
  );
}

// Injectable seam — real defaults are the DB + the build dispatcher; tests pass fakes.
export interface ChangeDeps {
  loadMemory: (client: SupabaseClient, companyId: string, product: string) => Promise<ProductMemory>;
  dispatch: (opts: { goal: string; token: string; model?: string; recall?: string }) => Promise<{ url: string; repo: string } | { error: string }>;
  saveDoc: (client: SupabaseClient, userId: string, companyId: string, product: string, doc: ProductDoc) => Promise<void>;
  now: () => number;
}

const defaultDeps: ChangeDeps = {
  loadMemory: loadProductMemory,
  dispatch: (o) => dispatchFullstackBuild(o),
  saveDoc: saveProductDoc,
  now: () => Date.now(),
};

export interface ChangeInput {
  client: SupabaseClient; // service-role client (records the ADR; product_docs writes are service-role only)
  userId: string;
  companyId: string;
  product: string;
  request: string;
  token: string;
  model?: string;
}

export type ChangeResult =
  | { ok: true; url: string; repo: string; adrSeq: number; memoryRecorded: boolean }
  | { ok: false; error: string };

/**
 * Run a change: load memory → plan (recall + continuation goal) → dispatch the incremental build → on a
 * successful dispatch, record the ADR. The ADR write is best-effort: a build that shipped is never reported
 * as failed just because the memory write hiccupped (memoryRecorded says which happened).
 */
export async function runChange(input: ChangeInput, deps: ChangeDeps = defaultDeps): Promise<ChangeResult> {
  const request = input.request?.trim();
  if (!request) return { ok: false, error: "empty change request" };
  if (!input.product?.trim()) return { ok: false, error: "product required" };

  const memory = await deps.loadMemory(input.client, input.companyId, input.product);
  const { recall, changeGoal } = planChange(memory, request);

  const built = await deps.dispatch({ goal: changeGoal, token: input.token, model: input.model, recall });
  if ("error" in built) return { ok: false, error: built.error };

  const adr = changeAdr(memory, request, deps.now());
  let memoryRecorded = true;
  try {
    await deps.saveDoc(input.client, input.userId, input.companyId, input.product, adr);
  } catch (e) {
    memoryRecorded = false; // the change shipped; the decision log just didn't persist — surface it, don't fail
    console.error("[change-desk] ADR persist failed:", e instanceof Error ? e.message : "unknown");
  }
  return { ok: true, url: built.url, repo: built.repo, adrSeq: adr.seq, memoryRecorded };
}
