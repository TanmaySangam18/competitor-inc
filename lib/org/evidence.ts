// lib/org/evidence.ts — THE SOC 2 EVIDENCE PIPELINE (certification-honest).
//
// competitor.inc holds NO certification. This module never claims one. It does the boring, load-bearing
// half of a future audit: a controls catalog that maps trust-service-criteria families to the systems that
// ACTUALLY exist in this repo, and a pure assembler that turns real artifacts (audit rows, drill results,
// CI runs, ADRs, key rotations) into tagged evidence records. Missing inputs produce NO records — an empty
// month reads as an empty month ([[crack-audit-and-no-fake-proof]]). Every rendered doc opens with the
// standing not-certified header, so no downstream surface (trust page, snapshot email) can quietly imply
// more than the truth.
//
// Rails: pure functions, zero I/O, zero secrets. Rendered strings carry no em-dashes (founder-facing
// prose rule). The trust page (app/trust/page.tsx) stays static truth; controlsCoverage() is the shape it
// can consume later WITHOUT changing its honesty posture.

import type { AuditEntry } from "@/lib/core/audit";

// ── the controls catalog ─────────────────────────────────────────────────────

export type ControlFamily = "CC6" | "CC7" | "CC8" | "A1" | "C1";

export const FAMILY_LABELS: Record<ControlFamily, string> = {
  CC6: "access control",
  CC7: "monitoring",
  CC8: "change management",
  A1: "availability",
  C1: "confidentiality",
};

export interface Control {
  id: string; // e.g. "CC6.1"
  family: ControlFamily;
  statement: string; // what we claim the system does, in plain words (no em-dashes)
  system: string; // pointer to the real module(s) that implement it
  evidenceKinds: string[]; // the kinds of EvidenceRecord that can prove it
}

export const CONTROLS: Control[] = [
  {
    id: "CC6.1",
    family: "CC6",
    statement:
      "Secrets are read by name through a scoped vault client, every access is audited, customer keys are revocable in one call, and connected services pass one governed rail.",
    system: "lib/core/vault.ts + lib/core/connections.ts + lib/core/connect-rail.ts",
    evidenceKinds: ["key-rotation", "drill-result", "audit-event"],
  },
  {
    id: "CC7.1",
    family: "CC7",
    statement:
      "Every governed action lands in an append-only, hash-chained audit ledger; alerts fire on cap breaches and forbidden attempts; a kill switch can halt the org, one agent, or one customer.",
    system: "lib/core/audit.ts + lib/engine/alerts.ts + lib/core/killswitch.ts",
    evidenceKinds: ["audit-event", "drill-result"],
  },
  {
    id: "CC8.1",
    family: "CC8",
    statement:
      "Every push runs the full QA gate in CI (types, tests, build, smoke) before anything ships, and architecture changes are recorded as ADRs.",
    system: ".github/workflows/qa.yml + docs/adr/",
    evidenceKinds: ["ci-run", "adr"],
  },
  {
    id: "A1.1",
    family: "A1",
    statement:
      "Database backups are test-restored on a quarterly drill cadence and provider failover degrades to an honest simulated mode instead of failing silently.",
    system: "lib/org/drills.ts + docs/runbooks/backup-restore-drill.md + lib/sim/failure-drills.ts",
    evidenceKinds: ["drill-result"],
  },
  {
    id: "C1.1",
    family: "C1",
    statement:
      "Tenant data is isolated by row-level security keyed to the authenticated user, and RLS is re-verified on every backup-restore drill.",
    system: "supabase/migrations (RLS policies, see 0008_tighten_rls.sql) + docs/runbooks/backup-restore-drill.md",
    evidenceKinds: ["drill-result"],
  },
];

const CONTROL_BY_ID = new Map(CONTROLS.map((c) => [c.id, c]));

// Which control(s) each operational drill proves. First entry = the drill's PRIMARY control (what
// recordDrill in lib/org/drills.ts returns). Kept here, not in drills.ts, so the import points one way.
export const DRILL_CONTROL_MAP: Record<string, string[]> = {
  "backup-restore": ["A1.1", "C1.1"], // the drill verifies both restorability and that RLS still holds
  failover: ["A1.1"],
  "key-rotation": ["CC6.1"],
  "kill-switch": ["CC7.1"],
  "restore-from-audit": ["CC7.1"],
};

// ── evidence records ─────────────────────────────────────────────────────────

export interface EvidenceRecord {
  id: string; // deterministic within one assembly: kind + ordinal
  controlId: string;
  kind: string; // "audit-event" | "drill-result" | "ci-run" | "adr" | "key-rotation"
  summary: string; // one honest line, no em-dashes
  at: string; // ISO timestamp of the underlying artifact (collection time only when the artifact has none)
  pointer: string; // where the artifact lives: audit hash, drill result, CI run url, ADR path
}

// Structural twin of drills.ts DrillResult (kept structural here to avoid a circular import).
export interface DrillResultInput {
  id: string;
  ranAt: string;
  outcome: "passed" | "failed" | "partial";
  notes: string;
  runBy: string;
}

export interface CiRunInput {
  url: string;
  status: "success" | "failure";
  at: string; // ISO
}

export interface KeyRotationInput {
  name: string; // the credential name, never the value
  rotatedAt: string; // ISO
  by: string;
}

export interface EvidenceInputs {
  auditEvents?: AuditEntry[];
  drillResults?: DrillResultInput[];
  ciRuns?: CiRunInput[];
  adrPaths?: string[];
  keyRotations?: KeyRotationInput[];
}

// Pure assembler: real artifacts in, tagged evidence out. A category that was not provided (or is empty)
// produces NOTHING. There are no placeholder records, ever — a gap is reported as a gap by the snapshot.
export function collectEvidence(inputs: EvidenceInputs, opts: { now?: Date } = {}): EvidenceRecord[] {
  const collectedAt = (opts.now ?? new Date()).toISOString();
  const records: EvidenceRecord[] = [];
  let n = 0;
  const push = (controlId: string, kind: string, summary: string, at: string, pointer: string) => {
    n += 1;
    records.push({ id: `ev-${kind}-${n}`, controlId, kind, summary, at, pointer });
  };

  for (const e of inputs.auditEvents ?? []) {
    push(
      "CC7.1",
      "audit-event",
      `Audit ledger entry: actor ${e.actor}, action ${e.action}${e.verdict ? `, verdict ${e.verdict}` : ""}.`,
      e.ts,
      `audit seq ${e.seq}, hash ${e.hash}`,
    );
  }

  for (const d of inputs.drillResults ?? []) {
    const controls = DRILL_CONTROL_MAP[d.id];
    if (!controls) continue; // unknown drill id: never guessed onto a control
    for (const controlId of controls) {
      push(
        controlId,
        "drill-result",
        `Operational drill ${d.id} ran with outcome ${d.outcome} (run by ${d.runBy}).`,
        d.ranAt,
        `drill result: ${d.id} at ${d.ranAt}`,
      );
    }
  }

  for (const r of inputs.ciRuns ?? []) {
    push("CC8.1", "ci-run", `CI qa gate run finished with status ${r.status}.`, r.at, r.url);
  }

  for (const p of inputs.adrPaths ?? []) {
    push("CC8.1", "adr", `Architecture decision recorded at ${p}.`, collectedAt, p);
  }

  for (const k of inputs.keyRotations ?? []) {
    push("CC6.1", "key-rotation", `Credential ${k.name} rotated by ${k.by}.`, k.rotatedAt, `key rotation: ${k.name} at ${k.rotatedAt}`);
  }

  return records;
}

// ── the monthly snapshot ─────────────────────────────────────────────────────

// The MANDATORY standing header. Every rendered snapshot opens with this exact line. Do not soften it,
// do not drop it, do not let any caller replace it with a certification claim.
export const NOT_CERTIFIED_HEADER =
  "competitor.inc is not SOC 2 certified. This is an evidence collection log that prepares for a future audit, nothing more.";

export interface FamilyCount {
  family: ControlFamily;
  label: string;
  recordCount: number;
}

export interface EvidenceSnapshot {
  header: string; // always NOT_CERTIFIED_HEADER
  monthLabel: string;
  familyCounts: FamilyCount[]; // every family, honest zeros included
  gaps: string[]; // plain sentences naming what has NO evidence this month
  text: string; // the rendered doc, header first
}

export function evidenceSnapshot(records: EvidenceRecord[], opts: { monthLabel: string }): EvidenceSnapshot {
  const families = Object.keys(FAMILY_LABELS) as ControlFamily[];
  const countByFamily = new Map<ControlFamily, number>(families.map((f) => [f, 0]));
  for (const r of records) {
    const control = CONTROL_BY_ID.get(r.controlId);
    if (!control) continue; // a record tagged to an unknown control never inflates a family count
    countByFamily.set(control.family, (countByFamily.get(control.family) ?? 0) + 1);
  }

  const familyCounts: FamilyCount[] = families.map((f) => ({
    family: f,
    label: FAMILY_LABELS[f],
    recordCount: countByFamily.get(f) ?? 0,
  }));

  const gaps = familyCounts
    .filter((fc) => fc.recordCount === 0)
    .map((fc) => `No evidence collected for ${fc.family} ${fc.label} this month.`);

  const lines: string[] = [
    NOT_CERTIFIED_HEADER,
    "",
    `Evidence snapshot for ${opts.monthLabel}. ${records.length} record${records.length === 1 ? "" : "s"} collected.`,
    "",
    ...familyCounts.map(
      (fc) => `${fc.family} ${fc.label}: ${fc.recordCount} record${fc.recordCount === 1 ? "" : "s"}.`,
    ),
  ];
  if (gaps.length > 0) {
    lines.push("", "Gaps this month:", ...gaps);
  }

  return { header: NOT_CERTIFIED_HEADER, monthLabel: opts.monthLabel, familyCounts, gaps, text: lines.join("\n") };
}

// ── coverage for the trust page ──────────────────────────────────────────────

export interface ControlCoverage {
  controlId: string;
  recordCount: number;
  lastEvidenceAt: string | null; // null means no evidence yet, rendered honestly by the caller
}

// Per-control coverage over a set of records. Every control in the catalog appears, including the ones
// with zero evidence, so the trust page can show honest gaps instead of hiding them.
export function controlsCoverage(records: EvidenceRecord[]): ControlCoverage[] {
  return CONTROLS.map((control) => {
    const mine = records.filter((r) => r.controlId === control.id);
    let last: string | null = null;
    for (const r of mine) {
      if (last === null || new Date(r.at).getTime() > new Date(last).getTime()) last = r.at;
    }
    return { controlId: control.id, recordCount: mine.length, lastEvidenceAt: last };
  });
}
