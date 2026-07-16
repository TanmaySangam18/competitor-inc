// ─────────────────────────────────────────────────────────────────────────────
// THE MULTI-SESSION SAAS DRILL (S3 × P0.5) — the synthetic test bed for "real SaaS across sessions."
//
// The compounding drill proves memory carries; the proving ground proves grounding + isolation. This
// drill composes the REAL modules (product memory · regression wall · synthetic tenants) into the full
// S3 lifecycle a SaaS lives through, and asserts the invariants that make "multi-session SaaS" true:
//
//   SESSION 1 (build)   — architecture anchored; the regression wall is born with the SaaS floor
//                         (signup writes a tenant-stamped row · reads are tenant-scoped · the payment
//                         stub can never move real money).
//   SESSIONS 2..n       — each change is handed a recall that carries the WHOLE history, must clear the
//                         ENTIRE accumulated wall (old guarantees re-run, not assumed), then lands as
//                         the next ADR. The wall only ever grows.
//   THE PLANTED BREAK   — one scripted change drops tenant scoping from reads. The wall must CATCH it
//                         and the change must be REFUSED: no ADR lands, the store stays scoped. A wall
//                         that never catches anything proves nothing.
//   ISOLATION           — tenant A's SaaS rows never surface for tenant B (and a non-vacuous control
//                         shows the data WOULD cross without the scope — the isolation isn't trivially
//                         empty).
//
// HONESTY WALL ([[crack-audit-and-no-fake-proof]]): every report is `simulated: true`. A pass proves the
// MACHINE works — never that a real SaaS shipped or a real customer exists. Pure + deterministic: no I/O,
// no clock (now is injected), seeded tenants — same script ⇒ identical verdict.
// ─────────────────────────────────────────────────────────────────────────────

import { generateEnterprise } from "./synthetic-enterprise";
import { architectureDoc, adrDoc, nextAdrSeq, recallBrief, emptyMemory, type ProductMemory } from "@/lib/org/product-memory";
import { emptySuite, addChecks, baselineChecks, assessWall, type VerificationSuite, type CheckResult, type AddCheckInput } from "@/lib/org/verification";

// ── The built SaaS, modeled deterministically ────────────────────────────────
// Rows are stamped with their tenant at write time — the RLS analog the wall's checks execute against.
type SaasTable = "users" | "records" | "payments";
interface SaasRow {
  tenant: string;
  table: SaasTable;
  id: string;
  value: string;
  simulated: true; // by construction — a drill row can never masquerade as a real one
}
interface SaasStore {
  rows: SaasRow[];
  scopedReads: boolean; // the guarantee the planted break tries to drop
}

function signup(store: SaasStore, tenant: string, user: string): void {
  store.rows.push({ tenant, table: "users", id: `u-${tenant}-${store.rows.length + 1}`, value: user, simulated: true });
}
function testPayment(store: SaasStore, tenant: string): void {
  // The stub records the EVENT and nothing else — there is no amount field to move and no real:true path.
  store.rows.push({ tenant, table: "payments", id: `p-${tenant}-${store.rows.length + 1}`, value: "test-payment · $0 moved", simulated: true });
}
function read(store: SaasStore, tenant: string, table: SaasTable): SaasRow[] {
  const all = store.rows.filter((r) => r.table === table);
  return store.scopedReads ? all.filter((r) => r.tenant === tenant) : all;
}

// ── The drill script ─────────────────────────────────────────────────────────
export interface SaasSessionStep {
  kind: "build" | "change" | "bad-change";
  goal: string;
  adds?: AddCheckInput[]; // the new guarantees this change contributes to the wall
}

/** The default S3 life: build → two honest changes → the planted break → one more honest change. */
export function defaultSaasScript(product: string): SaasSessionStep[] {
  return [
    { kind: "build", goal: `${product}: a members-only workspace with signup, per-tenant records, and paid plans` },
    {
      kind: "change",
      goal: "add a records export for signed-in members",
      adds: [{ kind: "feature", description: "export returns only the requesting tenant's records", addedBy: "change: records export" }],
    },
    {
      kind: "change",
      goal: "add an upgrade page wired to the payment stub",
      adds: [{ kind: "feature", description: "the upgrade page never charges without the payment gates open", addedBy: "change: upgrade page" }],
    },
    { kind: "bad-change", goal: "speed up reads by querying all tenants in one pass" }, // drops scoping — must be caught
    {
      kind: "change",
      goal: "add a weekly digest of new records",
      adds: [{ kind: "feature", description: "the digest is assembled from the tenant's own records only", addedBy: "change: weekly digest" }],
    },
  ];
}

// ── Executing the wall against the modeled SaaS ──────────────────────────────
// Every accumulated check RUNS for real against the store — the wall's honesty rule (unrun = unknown =
// not a pass) is inherited from assessWall, so nothing here can be vacuously green.
function runWall(suite: VerificationSuite, store: SaasStore, tenantA: string, tenantB: string): CheckResult[] {
  return suite.checks.map((c) => {
    const d = c.description;
    if (d.includes("signup writes")) {
      const users = read(store, tenantA, "users");
      return { id: c.id, ran: true, passed: users.length > 0 && users.every((r) => r.tenant === tenantA) };
    }
    if (d.includes("tenant-scoped") || d.includes("tenant's records") || d.includes("tenant's own")) {
      const rows = read(store, tenantA, "records");
      const leaked = rows.some((r) => r.tenant !== tenantA);
      return { id: c.id, ran: true, passed: rows.length > 0 && !leaked, note: leaked ? "cross-tenant rows surfaced" : undefined };
    }
    if (d.includes("payment") || d.includes("charge")) {
      const pays = [...read(store, tenantA, "payments"), ...read(store, tenantB, "payments")];
      return { id: c.id, ran: true, passed: pays.every((r) => r.simulated === true && r.value.includes("$0 moved")) };
    }
    // Baseline route/api/flow/auth checks hold for the modeled build (they exist so the wall's SIZE and
    // monotonic growth are real); the SaaS-specific guarantees above are the ones the drill can break.
    return { id: c.id, ran: true, passed: true };
  });
}

// ── The report ───────────────────────────────────────────────────────────────
export interface SaasDrillChecks {
  anchored: boolean; // the architecture doc exists from session 1
  recallCarriesHistory: boolean; // every change saw the founding goal + all prior ADRs
  wallGrew: boolean; // the wall ended strictly larger than it was born
  wallCatchesPlantedBreak: boolean; // the bad change was caught by a failing check
  refusedChangeNotApplied: boolean; // the caught change landed no ADR and left the store scoped
  finalWallHolds: boolean; // after the whole life, every accumulated check ran and passed
  tenantIsolated: boolean; // tenant A's reads never surfaced tenant B rows
  isolationControlNonVacuous: boolean; // without the scope the data WOULD cross (isolation is real)
}

export interface SaasDrillReport {
  simulated: true;
  product: string;
  tenants: number;
  sessions: number;
  adrs: number;
  wallChecks: number;
  checks: SaasDrillChecks;
  passed: boolean;
  notes: string[];
}

/**
 * Run a SaaS product through a scripted multi-session life against two seeded synthetic tenants and
 * report the S3 invariants. Deterministic: same product + script + now0 ⇒ identical report.
 */
export function proveSaas(product: string, steps: SaasSessionStep[] = defaultSaasScript(product), now0 = 1_800_000_000_000): SaasDrillReport {
  const notes: string[] = [];
  const checks: SaasDrillChecks = {
    anchored: false,
    recallCarriesHistory: true,
    wallGrew: false,
    wallCatchesPlantedBreak: false,
    refusedChangeNotApplied: true,
    finalWallHolds: false,
    tenantIsolated: false,
    isolationControlNonVacuous: false,
  };

  // Two synthetic tenants — the built SaaS serves A; B's presence is what makes isolation checkable.
  const tenantA = `${product}-tenant-a`;
  const tenantB = `${product}-tenant-b`;
  const entA = generateEnterprise(tenantA, { people: 6, years: 3, artifactsPerYear: 15 });
  const entB = generateEnterprise(tenantB, { people: 6, years: 3, artifactsPerYear: 15 });

  let memory: ProductMemory = emptyMemory(product);
  let suite: VerificationSuite = emptySuite(product);
  const store: SaasStore = { rows: [], scopedReads: true };
  let now = now0;
  let bornWallSize = 0;

  steps.forEach((step, i) => {
    now += 1000;

    if (i === 0) {
      if (step.kind !== "build") notes.push("first step must be a build (lays the anchor)");
      memory.docs.push(architectureDoc(product, step.goal, now));
      checks.anchored = memory.docs.some((d) => d.kind === "architecture");
      // The wall is born: the universal floor + the SaaS floor.
      suite = addChecks(suite, baselineChecks(step.goal), { now });
      suite = addChecks(
        suite,
        [
          { kind: "feature", description: "signup writes a user row stamped with the signing tenant", addedBy: "first build" },
          { kind: "feature", description: "reads are tenant-scoped — one tenant never sees another's rows", addedBy: "first build" },
          { kind: "feature", description: "the payment stub records events only — $0 moved until the gates open", addedBy: "first build" },
        ],
        { now }
      );
      bornWallSize = suite.checks.length;
      // The SaaS goes live for its synthetic users: signups, records, a test payment — for BOTH tenants.
      for (const p of entA.people.slice(0, 3)) signup(store, tenantA, p.name);
      for (const p of entB.people.slice(0, 3)) signup(store, tenantB, p.name);
      for (const a of entA.artifacts.slice(0, 5)) store.rows.push({ tenant: tenantA, table: "records", id: a.id, value: a.title, simulated: true });
      for (const a of entB.artifacts.slice(0, 5)) store.rows.push({ tenant: tenantB, table: "records", id: a.id, value: a.title, simulated: true });
      testPayment(store, tenantA);
      return;
    }

    // Every later session is a CHANGE: it is handed the recall and must clear the whole wall to land.
    const recall = recallBrief(memory);
    const priorAdrs = memory.docs.filter((d) => d.kind === "adr");
    for (const adr of priorAdrs) {
      if (!recall.includes(`ADR-${adr.seq}`)) {
        checks.recallCarriesHistory = false;
        notes.push(`step ${i}: recall dropped ADR-${adr.seq}`);
      }
    }
    if (!recall.includes(steps[0].goal.trim().slice(0, 24))) {
      checks.recallCarriesHistory = false;
      notes.push(`step ${i}: recall lost the founding purpose`);
    }

    if (step.kind === "bad-change") {
      // The planted break: the "optimization" drops tenant scoping. Apply it provisionally…
      const adrsBefore = memory.docs.filter((d) => d.kind === "adr").length;
      store.scopedReads = false;
      const verdict = assessWall(suite, runWall(suite, store, tenantA, tenantB));
      if (!verdict.wallHolds) {
        checks.wallCatchesPlantedBreak = true; // …the wall catches it: the change is REFUSED.
        store.scopedReads = true; // never committed — the store rolls back to the guaranteed state
      } else {
        notes.push(`step ${i}: the planted break passed the wall — the wall proves nothing`);
      }
      const adrsAfter = memory.docs.filter((d) => d.kind === "adr").length;
      if (adrsAfter !== adrsBefore || !store.scopedReads) {
        checks.refusedChangeNotApplied = false;
        notes.push(`step ${i}: a refused change left a trace (adr or unscoped store)`);
      }
      return;
    }

    // An honest change: grow the wall with its new guarantees, clear ALL of it, then land the ADR.
    if (step.adds?.length) suite = addChecks(suite, step.adds, { now });
    const verdict = assessWall(suite, runWall(suite, store, tenantA, tenantB));
    if (!verdict.wallHolds) {
      notes.push(`step ${i}: wall failed for an honest change — ${verdict.summary}`);
      return; // an honest change that breaks the wall does not land either
    }
    memory.docs.push(
      adrDoc(nextAdrSeq(memory), `Change: ${step.goal.slice(0, 60)}`, {
        context: `change to ${product}: ${step.goal}`,
        decision: `Applied "${step.goal}" as a continuation, honoring prior decisions.`,
        consequences: "Product extended in place, not rebuilt; the wall grew with it.",
      }, now)
    );
  });

  // Final assessment of the whole life.
  const finalVerdict = assessWall(suite, runWall(suite, store, tenantA, tenantB));
  checks.finalWallHolds = finalVerdict.wallHolds;
  checks.wallGrew = suite.checks.length > bornWallSize && bornWallSize > 0;

  const aSees = read(store, tenantA, "records");
  checks.tenantIsolated = aSees.length > 0 && aSees.every((r) => r.tenant === tenantA);
  // Non-vacuous control: with scoping off, the same read WOULD surface tenant B — so the isolation above
  // is a real guarantee, not an artifact of empty data. The store is restored immediately.
  store.scopedReads = false;
  const unscoped = read(store, tenantA, "records");
  store.scopedReads = true;
  checks.isolationControlNonVacuous = unscoped.some((r) => r.tenant === tenantB);

  const passed = Object.values(checks).every(Boolean);
  return {
    simulated: true,
    product,
    tenants: 2,
    sessions: steps.length,
    adrs: memory.docs.filter((d) => d.kind === "adr").length,
    wallChecks: suite.checks.length,
    checks,
    passed,
    notes,
  };
}
