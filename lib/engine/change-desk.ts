import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { adrDoc, architectureDoc, nextAdrSeq, recallBrief, type ProductDoc, type ProductMemory } from "@/lib/org/product-memory";
import { wallFromMemory, wallBrief } from "@/lib/org/verification";
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
  wall: string; // the regression wall (P3), derived from the same memory — prior guarantees the change must keep
  changeGoal: string; // the request, framed as a continuation not a rebuild
}

/** Pure: frame a change request against the product's accumulated memory (recall + the regression wall). */
export function planChange(memory: ProductMemory, request: string): ChangePlan {
  return {
    recall: recallBrief(memory),
    wall: wallBrief(wallFromMemory(memory)),
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
  loadMemory: (client: SupabaseClient, userId: string, product: string) => Promise<ProductMemory>;
  dispatch: (opts: { goal: string; token: string; model?: string; recall?: string; wall?: string }) => Promise<{ url: string; repo: string } | { error: string }>;
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
  foundingGoal?: string; // the product's original purpose — used to seed the architecture anchor if missing
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

  const memory = await deps.loadMemory(input.client, input.userId, input.product);

  // Lay the compounding foundation if it's missing: no change should pile decisions onto an empty memory.
  // Seed the architecture anchor (best-effort persist), and add it to THIS load so the recall below already
  // reflects it. Honest fallback when the founding goal wasn't recorded at first-build time.
  if (!memory.docs.some((d) => d.kind === "architecture")) {
    const goal = input.foundingGoal?.trim() || `(founding goal not on record) — the product "${input.product}" as it now stands`;
    const arch = architectureDoc(input.product, goal, deps.now());
    memory.docs.push(arch);
    try {
      await deps.saveDoc(input.client, input.userId, input.companyId, input.product, arch);
    } catch (e) {
      console.error("[change-desk] architecture seed persist failed (will retry next change):", e instanceof Error ? e.message : "unknown");
    }
  }

  const { recall, wall, changeGoal } = planChange(memory, request);

  const built = await deps.dispatch({ goal: changeGoal, token: input.token, model: input.model, recall, wall });
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
