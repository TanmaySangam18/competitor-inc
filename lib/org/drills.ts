// lib/org/drills.ts — THE OPERATIONAL DRILL PROGRAM (the scheduled layer over lib/sim/failure-drills.ts).
//
// The A3 simulation harness (lib/sim/failure-drills.ts) proves the control plane behaves under injected
// failure, in-process, on every QA run. THIS module is the calendar above it: the five drills a real
// company runs against real infrastructure on a cadence, with a results ledger and honest due-math. It
// does NOT re-implement the harness; the failover drill points at it as step one and then goes further
// (real staging, real keys, real backups).
//
// Honesty floor ([[crack-audit-and-no-fake-proof]]): a drill that has not run is "not yet run", never
// "passed". Due-math never rounds in our favor. recordDrill turns a REAL run into an evidence record for
// the SOC 2 evidence pipeline (lib/org/evidence.ts); nothing here mints evidence without a run. Rendered
// strings carry no em-dashes (founder-facing prose rule).
//
// Rails: pure functions, zero I/O. Persistence of DrillResult rows is the caller's concern (audit ledger
// or a Supabase table at connect); this module only defines, schedules, and reports.

import { collectEvidence, DRILL_CONTROL_MAP, type EvidenceRecord } from "./evidence";

// ── the registry ─────────────────────────────────────────────────────────────

export type DrillId = "backup-restore" | "failover" | "key-rotation" | "kill-switch" | "restore-from-audit";

export const QUARTERLY_DAYS = 90;

export interface DrillDefinition {
  id: DrillId;
  name: string;
  purpose: string;
  cadenceDays: number;
  steps: string[]; // concrete, runnable by a human or an agent with founder access
  evidenceOf: string; // which trust control a passing run proves (control id from lib/org/evidence.ts)
}

export const DRILLS: Record<DrillId, DrillDefinition> = {
  "backup-restore": {
    id: "backup-restore",
    name: "Backup restore",
    purpose: "Prove the Supabase backup is actually restorable and that tenant isolation survives a restore. A backup that has never been restored is a hope, not a control.",
    cadenceDays: QUARTERLY_DAYS,
    steps: [
      "Follow docs/runbooks/backup-restore-drill.md end to end.",
      "Restore the latest backup into a scratch Supabase project, never into production.",
      "Verify row counts on the key tables (revenue_events, approval_decisions, decision queue, products, entitlements) match the source within the backup window.",
      "Verify RLS still holds on the restored copy: an anon client must read zero rows from user-owned tables.",
      "Record a DrillResult with recordDrill, then destroy the scratch project.",
    ],
    evidenceOf: "A1.1",
  },
  failover: {
    id: "failover",
    name: "Provider failover",
    purpose: "Prove the platform degrades honestly when the model provider is gone: simulated mode is flagged as simulated and governance still blocks what it should.",
    cadenceDays: QUARTERLY_DAYS,
    steps: [
      "Run the A3 harness: npx vitest run lib/sim/failure-drills.test.ts and confirm the model-outage drill passes.",
      "In a preview deploy with all model keys removed, load the app and confirm it serves with simulated output clearly labeled.",
      "Attempt a governed action in the keyless deploy and confirm the policy floor still returns the expected verdict.",
      "Record a DrillResult with recordDrill, noting the deploy URL used.",
    ],
    evidenceOf: "A1.1",
  },
  "key-rotation": {
    id: "key-rotation",
    name: "Key rotation",
    purpose: "Prove every standing credential can be rotated in one sitting and that the old value stops working. Rotation that has never been rehearsed becomes an outage during an incident.",
    cadenceDays: QUARTERLY_DAYS,
    steps: [
      "List the standing credentials: Supabase service role key, Supabase anon key, GitHub token, Vercel token, any provider keys in Vercel env.",
      "Mint a replacement for each, update the Vercel environment variables, and redeploy.",
      "Verify the app works on the new values, then verify a request using an old value is rejected.",
      "Run node scripts/secret-scan.mjs to confirm no old value leaked into the repo.",
      "Record a DrillResult with recordDrill, naming which credentials rotated (names only, never values).",
    ],
    evidenceOf: "CC6.1",
  },
  "kill-switch": {
    id: "kill-switch",
    name: "Kill switch",
    purpose: "Prove a human can stop the org, one agent, or one customer out of band, and that the freeze has the intended blast radius and nothing more.",
    cadenceDays: QUARTERLY_DAYS,
    steps: [
      "In a production-like environment, freeze a test customer namespace through the control API or CLI (lib/core/killswitch.ts).",
      "Attempt a governed action for the frozen namespace and confirm it is halted.",
      "Attempt the same action for a different namespace and confirm it is unaffected.",
      "Engage and clear the global switch, confirming actions halt and resume.",
      "Record a DrillResult with recordDrill, then clear all switches.",
    ],
    evidenceOf: "CC7.1",
  },
  "restore-from-audit": {
    id: "restore-from-audit",
    name: "Restore from audit",
    purpose: "Prove the append-only audit ledger is usable in anger: a past day of governed actions can be reconstructed from it and the hash chain verifies end to end.",
    cadenceDays: QUARTERLY_DAYS,
    steps: [
      "Pick one past day and export that day's audit entries from the durable sink.",
      "Run verifyIntegrity (lib/core/audit.ts) over the exported chain and confirm every link holds.",
      "Reconstruct the day's actions (who, what, verdict, cost) from the entries alone, without any other source.",
      "Cross-check the reconstruction against the decision queue records for the same day.",
      "Record a DrillResult with recordDrill, noting the day reconstructed.",
    ],
    evidenceOf: "CC7.1",
  },
};

export const DRILL_IDS = Object.keys(DRILLS) as DrillId[];

// ── results ──────────────────────────────────────────────────────────────────

export type DrillOutcome = "passed" | "failed" | "partial";

export interface DrillResult {
  id: DrillId;
  ranAt: string; // ISO timestamp of the real run
  outcome: DrillOutcome;
  notes: string;
  runBy: string; // "founder", an agent id, never blank
}

export const NOT_YET_RUN = "not yet run";

const DAY_MS = 86_400_000;

function lastRunOf(results: DrillResult[], id: DrillId): string | null {
  let last: string | null = null;
  for (const r of results) {
    if (r.id !== id) continue;
    if (last === null || new Date(r.ranAt).getTime() > new Date(last).getTime()) last = r.ranAt;
  }
  return last;
}

// ── due math ─────────────────────────────────────────────────────────────────

export interface DueDrill {
  id: DrillId;
  name: string;
  cadenceDays: number;
  lastRun: string | null; // ISO of the most recent run, null when the drill has never run
  lastRunLabel: string; // "not yet run" when null, honest and literal
  overdueDays: number | null; // days past cadence; null for never-run (cannot honestly quantify)
}

// Drills that are due: never ran, or last ran longer ago than their cadence. Sorted most-overdue first;
// never-run drills sort ahead of everything (there is no more overdue state than "never").
export function dueDrills(results: DrillResult[], opts: { now: Date }): DueDrill[] {
  const nowMs = opts.now.getTime();
  const due: DueDrill[] = [];
  for (const id of DRILL_IDS) {
    const def = DRILLS[id];
    const lastRun = lastRunOf(results, id);
    if (lastRun === null) {
      due.push({ id, name: def.name, cadenceDays: def.cadenceDays, lastRun: null, lastRunLabel: NOT_YET_RUN, overdueDays: null });
      continue;
    }
    const daysSince = (nowMs - new Date(lastRun).getTime()) / DAY_MS;
    if (daysSince > def.cadenceDays) {
      due.push({
        id,
        name: def.name,
        cadenceDays: def.cadenceDays,
        lastRun,
        lastRunLabel: `last run ${lastRun.slice(0, 10)}`,
        overdueDays: Math.floor(daysSince - def.cadenceDays),
      });
    }
  }
  return due.sort((a, b) => {
    if (a.overdueDays === null && b.overdueDays === null) return 0; // keep registry order among never-run
    if (a.overdueDays === null) return -1;
    if (b.overdueDays === null) return 1;
    return b.overdueDays - a.overdueDays;
  });
}

// ── the status report ────────────────────────────────────────────────────────

export interface DrillStatus {
  id: DrillId;
  name: string;
  lastRun: string | null;
  lastOutcome: DrillOutcome | null; // null until a real run exists, never assumed
  due: boolean;
  statusLine: string; // one honest sentence, no em-dashes
}

export interface DrillProgramReport {
  generatedAt: string;
  drills: DrillStatus[];
  dueCount: number;
  neverRunCount: number;
  headline: string;
}

export function drillReport(results: DrillResult[], opts: { now: Date }): DrillProgramReport {
  const nowMs = opts.now.getTime();
  const dueIds = new Set(dueDrills(results, opts).map((d) => d.id));
  const drills: DrillStatus[] = DRILL_IDS.map((id) => {
    const def = DRILLS[id];
    const lastRun = lastRunOf(results, id);
    if (lastRun === null) {
      return {
        id,
        name: def.name,
        lastRun: null,
        lastOutcome: null,
        due: true,
        statusLine: `${def.name}: ${NOT_YET_RUN}. First run is due now.`,
      };
    }
    const latest = results
      .filter((r) => r.id === id)
      .sort((a, b) => new Date(b.ranAt).getTime() - new Date(a.ranAt).getTime())[0];
    const daysSince = Math.floor((nowMs - new Date(lastRun).getTime()) / DAY_MS);
    const due = dueIds.has(id);
    const dueClause = due
      ? `Overdue by ${Math.floor(daysSince - def.cadenceDays)} day(s).`
      : `Next run due in ${def.cadenceDays - daysSince} day(s).`;
    return {
      id,
      name: def.name,
      lastRun,
      lastOutcome: latest.outcome,
      due,
      statusLine: `${def.name}: last run ${lastRun.slice(0, 10)}, outcome ${latest.outcome}. ${dueClause}`,
    };
  });
  const dueCount = drills.filter((d) => d.due).length;
  const neverRunCount = drills.filter((d) => d.lastRun === null).length;
  const headline =
    neverRunCount === DRILL_IDS.length
      ? `No operational drills have run yet. All ${DRILL_IDS.length} are due.`
      : `${dueCount} of ${DRILL_IDS.length} drills due; ${neverRunCount} have never run.`;
  return { generatedAt: opts.now.toISOString(), drills, dueCount, neverRunCount, headline };
}

// ── recording a real run as evidence ─────────────────────────────────────────

const OUTCOMES: readonly DrillOutcome[] = ["passed", "failed", "partial"];

// Validate a DrillResult and mint its PRIMARY evidence record (the drill's evidenceOf control). Throws on
// a malformed result: bad evidence is worse than no evidence. Callers persisting the run should also feed
// the result through collectEvidence, which may tag secondary controls (backup-restore also proves C1.1).
export function recordDrill(result: DrillResult, opts: { now?: Date } = {}): EvidenceRecord {
  const def = (DRILLS as Record<string, DrillDefinition | undefined>)[result.id];
  if (!def) throw new Error(`recordDrill: unknown drill id "${result.id}"`);
  if (!OUTCOMES.includes(result.outcome)) throw new Error(`recordDrill: invalid outcome "${result.outcome}"`);
  if (Number.isNaN(new Date(result.ranAt).getTime())) throw new Error(`recordDrill: ranAt is not a valid timestamp: "${result.ranAt}"`);
  if (typeof result.runBy !== "string" || result.runBy.trim() === "") throw new Error("recordDrill: runBy is required (who actually ran it)");
  if (typeof result.notes !== "string") throw new Error("recordDrill: notes must be a string (empty is allowed, missing is not)");

  const records = collectEvidence({ drillResults: [result] }, opts);
  const primaryControl = DRILL_CONTROL_MAP[result.id]?.[0] ?? def.evidenceOf;
  const primary = records.find((r) => r.controlId === primaryControl) ?? records[0];
  if (!primary) throw new Error(`recordDrill: no evidence record produced for drill "${result.id}"`);
  return primary;
}
