// ─────────────────────────────────────────────────────────────────────────────
// THE COMPOUNDING PROVING GROUND (S3) — the crash-test for building-across-sessions.
//
// S2 proved a product can be built + grounded. S3's unlock is COMPOUNDING: a product is a long-lived
// thing whose 5th change reads the first four. This harness simulates that multi-session life using ONLY
// the pure product-memory functions (architectureDoc / adrDoc / recallBrief) — no DB, no model, no I/O —
// and asserts the invariants that make compounding real:
//   ANCHORED         — the founding architecture doc exists after the first build (the gap we just closed)
//   ADRS MONOTONIC   — decisions are logged 1..n, never renumbered, never dropped
//   RECALL CARRIES    — each change's recall brief names EVERY prior decision + the founding purpose,
//                      so the agent continues the product instead of rebuilding it
//   RECALL BOUNDED    — recall never blows the build brief (a wall of text degrades one-shots)
//
// HONESTY WALL ([[crack-audit-and-no-fake-proof]]): simulated:true; proves the MACHINE compounds, never
// that a real product shipped. Deterministic (injected clock) — same script ⇒ same verdict.
// ─────────────────────────────────────────────────────────────────────────────

import { architectureDoc, adrDoc, nextAdrSeq, recallBrief, emptyMemory, type ProductMemory } from "@/lib/org/product-memory";

export interface SessionStep {
  kind: "build" | "change";
  goal: string; // build: the founding purpose · change: the requested change
}

export interface CompoundingChecks {
  anchored: boolean;
  adrsMonotonic: boolean;
  recallCarriesPrior: boolean;
  recallBounded: boolean;
}

export interface CompoundingReport {
  simulated: true;
  product: string;
  sessions: number;
  adrs: number;
  checks: CompoundingChecks;
  passed: boolean;
  notes: string[]; // human trail of any failing case (empty when all pass)
}

const RECALL_HARD_CAP = 2600; // must match product-memory.ts RECALL_CAP (recall is bounded there)

/**
 * Run a product through a scripted multi-session life and check the compounding invariants. The first
 * step MUST be a build (it lays the anchor); each `change` computes the recall it WOULD be handed, verifies
 * it carries the whole history, then appends the change as an ADR — exactly the live change-desk arc.
 */
export function proveCompounding(product: string, steps: SessionStep[], now0 = 1_800_000_000_000): CompoundingReport {
  const notes: string[] = [];
  const checks: CompoundingChecks = { anchored: false, adrsMonotonic: true, recallCarriesPrior: true, recallBounded: true };
  let memory: ProductMemory = emptyMemory(product);
  let now = now0;
  let changeCount = 0;

  steps.forEach((step, i) => {
    now += 1000;
    if (i === 0) {
      if (step.kind !== "build") notes.push("first step must be a build (lays the anchor)");
      memory.docs.push(architectureDoc(product, step.goal, now));
      checks.anchored = memory.docs.some((d) => d.kind === "architecture");
      return;
    }
    if (step.kind === "build") { notes.push(`step ${i}: a product is built once — extra 'build' treated as change`); }

    // The recall this change is handed — the crux: it must name the founding purpose + every prior ADR.
    const recall = recallBrief(memory);
    if (recall.length > RECALL_HARD_CAP) { checks.recallBounded = false; notes.push(`step ${i}: recall exceeded ${RECALL_HARD_CAP} chars`); }
    const priorAdrs = memory.docs.filter((d) => d.kind === "adr");
    for (const adr of priorAdrs) {
      if (!recall.includes(`ADR-${adr.seq}`)) { checks.recallCarriesPrior = false; notes.push(`step ${i}: recall dropped ADR-${adr.seq}`); }
    }
    // the founding purpose must survive into the recall (agent knows what it's continuing)
    if (priorAdrs.length >= 0 && !recall.includes(steps[0].goal.trim().slice(0, 24))) {
      checks.recallCarriesPrior = false;
      notes.push(`step ${i}: recall lost the founding purpose`);
    }

    // Append the change as the next ADR (mirrors change-desk.changeAdr).
    const seq = nextAdrSeq(memory);
    if (seq !== changeCount + 1) { checks.adrsMonotonic = false; notes.push(`step ${i}: ADR seq ${seq} not monotonic (expected ${changeCount + 1})`); }
    memory.docs.push(adrDoc(seq, `Change: ${step.goal.slice(0, 60)}`, {
      context: `change to ${product}: ${step.goal}`,
      decision: `Applied "${step.goal}" as a continuation, honoring prior decisions.`,
      consequences: `Product extended in place, not rebuilt.`,
    }, now));
    changeCount++;
  });

  const passed = checks.anchored && checks.adrsMonotonic && checks.recallCarriesPrior && checks.recallBounded;
  return { simulated: true, product, sessions: steps.length, adrs: changeCount, checks, passed, notes };
}
