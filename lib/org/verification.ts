// ─────────────────────────────────────────────────────────────────────────────
// THE VERIFICATION EMPIRE (P3 — the reliability pillar). Verification must COMPOUND with the code.
//
// A product's test suite is a LONG-LIVED, growing thing: every build and every change ADDS checks and the
// suite never shrinks — so a change made months later still has to pass the very first build's checks. That
// accumulating set IS the regression wall. This is the test-side twin of Product Memory (P1): memory
// accumulates DECISIONS; this accumulates CHECKS.
//
// HONESTY FLOOR ([[crack-audit-and-no-fake-proof]]): the wall holds ONLY if every accumulated check
// actually RAN and passed. A check that wasn't run is "unknown" — NEVER assumed to pass (the same rule the
// ops desk uses for deploy health). "All green" must mean all were really checked. Pure + deterministic:
// injected clock/ids, no I/O.
// ─────────────────────────────────────────────────────────────────────────────

import type { ProductMemory } from "./product-memory";

export type CheckKind = "route" | "api" | "feature" | "regression";

export interface Check {
  id: string; // stable per product (e.g. "chk-1"); never renumbered
  kind: CheckKind;
  description: string; // what it verifies, in plain words
  addedAt: number;
  addedBy: string; // "first build" or the change request that introduced it — provenance for the wall
}

export interface VerificationSuite {
  product: string;
  checks: Check[]; // the regression wall — append-only; ordered by addedAt
}

export interface CheckResult {
  id: string;
  ran: boolean; // did the check actually execute this pass? (false ⇒ unknown, NOT pass)
  passed: boolean; // meaningful only when ran === true
  note?: string;
}

export const emptySuite = (product: string): VerificationSuite => ({ product, checks: [] });

/** The next check ordinal — checks are 1-indexed and never renumbered (stable ids across the product's life). */
export function nextCheckId(suite: VerificationSuite): string {
  const max = suite.checks.reduce((m, c) => Math.max(m, parseInt(c.id.replace(/\D/g, ""), 10) || 0), 0);
  return `chk-${max + 1}`;
}

export interface AddCheckInput {
  kind: CheckKind;
  description: string;
  addedBy: string;
}

/** Grow the wall: append a check. Dedupes on (kind, description) so re-running a build never double-adds
 *  the same guarantee — the wall grows with NEW guarantees, not repeats. */
export function addCheck(suite: VerificationSuite, input: AddCheckInput, opts: { now: number }): VerificationSuite {
  const exists = suite.checks.some((c) => c.kind === input.kind && c.description.trim() === input.description.trim());
  if (exists) return suite;
  const check: Check = { id: nextCheckId(suite), kind: input.kind, description: input.description.trim(), addedAt: opts.now, addedBy: input.addedBy };
  return { ...suite, checks: [...suite.checks, check] };
}

export function addChecks(suite: VerificationSuite, inputs: AddCheckInput[], opts: { now: number }): VerificationSuite {
  return inputs.reduce((s, i) => addCheck(s, i, opts), suite);
}

// The baseline guarantees EVERY built product must keep — the floor of the wall, laid at first build.
// (Richer per-feature checks are added on top as the product grows.)
export function baselineChecks(goal: string): AddCheckInput[] {
  const checks: AddCheckInput[] = [
    { kind: "route", description: "the home page serves a real page (HTTP 200, not the scaffold)", addedBy: "first build" },
    { kind: "api", description: "the items API responds to GET and POST without a 5xx", addedBy: "first build" },
    { kind: "feature", description: `the core flow works: ${goal.trim().slice(0, 100)}`, addedBy: "first build" },
  ];
  if (/\b(sign|login|account|auth|dashboard)\b/i.test(goal)) {
    checks.push({ kind: "feature", description: "signed-out users can't reach protected data (auth gate holds)", addedBy: "first build" });
  }
  return checks;
}

export interface WallVerdict {
  total: number;
  passed: number;
  failed: { id: string; description: string; note?: string }[];
  unrun: { id: string; description: string }[]; // accumulated checks with no result this pass — honest gap
  wallHolds: boolean; // true IFF every accumulated check ran AND passed
  summary: string;
}

/**
 * The regression wall verdict. wallHolds is true ONLY when every check in the suite ran and passed — a
 * failed check OR an unrun check drops the wall. This is what a change must clear before it ships: it can
 * ADD checks, but it can never leave an existing one failing or unverified.
 */
export function assessWall(suite: VerificationSuite, results: CheckResult[]): WallVerdict {
  const byId = new Map(results.map((r) => [r.id, r]));
  const failed: WallVerdict["failed"] = [];
  const unrun: WallVerdict["unrun"] = [];
  let passed = 0;

  for (const c of suite.checks) {
    const r = byId.get(c.id);
    if (!r || !r.ran) unrun.push({ id: c.id, description: c.description });
    else if (r.passed) passed++;
    else failed.push({ id: c.id, description: c.description, note: r.note });
  }

  const total = suite.checks.length;
  const wallHolds = total > 0 && failed.length === 0 && unrun.length === 0;
  const summary = wallHolds
    ? `Wall holds — ${passed}/${total} checks ran and passed. Safe to ship.`
    : `Wall does NOT hold — ${passed}/${total} passed, ${failed.length} failed, ${unrun.length} unverified. ${failed.length ? "A prior guarantee broke." : "Not everything was checked — unknown is not a pass."}`;

  return { total, passed, failed, unrun, wallHolds, summary };
}

// ── The wall as DERIVED state (no persistence gap) ───────────────────────────
// The wall can always be RECONSTRUCTED from product memory: the founding goal lays the baseline, and every
// ADR on record contributes the guarantee it introduced. Deriving (instead of persisting a second table)
// means the wall can never drift out of sync with the decision log — one source of truth, zero migrations.

// The founding goal lives in the architecture doc's body, first line under "## What this product is".
function foundingGoal(body: string): string {
  const lines = body.split("\n");
  const i = lines.findIndex((l) => l.trim().toLowerCase() === "## what this product is");
  if (i < 0) return "";
  for (let j = i + 1; j < lines.length; j++) {
    const t = lines[j].trim();
    if (t && !t.startsWith("#")) return t;
  }
  return "";
}

/** Rebuild a product's regression wall from its memory. Deterministic: same memory ⇒ same wall. */
export function wallFromMemory(memory: ProductMemory, now = 0): VerificationSuite {
  const arch = memory.docs.find((d) => d.kind === "architecture");
  const goal = (arch && foundingGoal(arch.body)) || memory.product;
  let suite = addChecks(emptySuite(memory.product), baselineChecks(goal), { now });
  const adrs = memory.docs.filter((d) => d.kind === "adr").sort((a, b) => a.seq - b.seq);
  for (const adr of adrs) {
    suite = addCheck(
      suite,
      {
        kind: "regression",
        description: `the guarantee from ADR-${adr.seq} still holds: ${adr.title.replace(/^ADR-\d+:\s*/i, "")}`,
        addedBy: `ADR-${adr.seq}`,
      },
      { now }
    );
  }
  return suite;
}

/**
 * The wall rendered as a build-brief section — injected into every CHANGE alongside the recall, so the
 * agent is told exactly which prior guarantees it must not break. Empty string when the wall is empty.
 */
export function wallBrief(suite: VerificationSuite): string {
  if (suite.checks.length === 0) return "";
  const lines = suite.checks.map((c, i) => `${i + 1}. [${c.kind}] ${c.description} (from: ${c.addedBy})`);
  return [
    `THE REGRESSION WALL — ${suite.checks.length} guarantees already on record for this product. Your change`,
    `must EXTEND the product without breaking a single one of them; the build gate and runtime smoke will`,
    `re-verify. A change that would regress any guarantee must be reworked, not shipped:`,
    ...lines,
  ].join("\n");
}
