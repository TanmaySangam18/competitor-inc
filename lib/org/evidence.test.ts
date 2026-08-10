import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  CONTROLS,
  FAMILY_LABELS,
  NOT_CERTIFIED_HEADER,
  collectEvidence,
  evidenceSnapshot,
  controlsCoverage,
  type ControlFamily,
  type EvidenceInputs,
} from "./evidence";
import { AuditLog, MemoryAuditSink } from "@/lib/core/audit";

const EM_DASH = /[—–]/; // em-dash or en-dash: banned in every rendered string
const NOW = new Date("2026-08-06T12:00:00.000Z");

describe("controls catalog", () => {
  it("covers all five families and points every control at a real system", () => {
    const families = new Set(CONTROLS.map((c) => c.family));
    expect([...families].sort()).toEqual(["A1", "C1", "CC6", "CC7", "CC8"]);
    for (const c of CONTROLS) {
      expect(c.system.length).toBeGreaterThan(5); // a file/module pointer, never blank
      expect(c.evidenceKinds.length).toBeGreaterThan(0);
      expect(c.statement).not.toMatch(EM_DASH);
      // the catalog never claims certification
      expect(c.statement.toLowerCase()).not.toContain("certified");
      expect(c.statement.toLowerCase()).not.toContain("soc 2 compliant");
    }
  });
});

describe("collectEvidence — pure assembler, tagged correctly", () => {
  it("missing input categories produce NO records, never placeholders", () => {
    expect(collectEvidence({})).toEqual([]);
    expect(collectEvidence({ auditEvents: [], drillResults: [], ciRuns: [], adrPaths: [], keyRotations: [] })).toEqual([]);
  });

  it("tags each artifact category to its control", () => {
    const log = new AuditLog(new MemoryAuditSink());
    const entry = log.record({ actor: "engineering", action: "deploy", verdict: "AUTO" }, NOW);
    const inputs: EvidenceInputs = {
      auditEvents: [entry],
      drillResults: [
        { id: "key-rotation", ranAt: "2026-08-01T09:00:00.000Z", outcome: "passed", notes: "", runBy: "founder" },
        { id: "kill-switch", ranAt: "2026-08-02T09:00:00.000Z", outcome: "partial", notes: "", runBy: "founder" },
      ],
      ciRuns: [{ url: "https://github.com/x/competitor-inc/actions/runs/1", status: "success", at: "2026-08-03T09:00:00.000Z" }],
      adrPaths: ["docs/adr/0027-thirty-minute-company.md"],
      keyRotations: [{ name: "SUPABASE_SERVICE_ROLE_KEY", rotatedAt: "2026-08-04T09:00:00.000Z", by: "founder" }],
    };
    const records = collectEvidence(inputs, { now: NOW });

    const byKind = (kind: string) => records.filter((r) => r.kind === kind);
    expect(byKind("audit-event")).toHaveLength(1);
    expect(byKind("audit-event")[0].controlId).toBe("CC7.1");
    expect(byKind("audit-event")[0].pointer).toContain(entry.hash);
    expect(byKind("drill-result").map((r) => r.controlId).sort()).toEqual(["CC6.1", "CC7.1"]);
    expect(byKind("ci-run")[0].controlId).toBe("CC8.1");
    expect(byKind("ci-run")[0].pointer).toBe(inputs.ciRuns![0].url);
    expect(byKind("adr")[0].controlId).toBe("CC8.1");
    expect(byKind("adr")[0].pointer).toBe("docs/adr/0027-thirty-minute-company.md");
    expect(byKind("key-rotation")[0].controlId).toBe("CC6.1");
    // artifact timestamps ride through; never invented
    expect(byKind("key-rotation")[0].at).toBe("2026-08-04T09:00:00.000Z");
    // key rotation evidence names the credential, never a value
    expect(byKind("key-rotation")[0].summary).toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("the backup-restore drill proves BOTH availability (A1.1) and confidentiality (C1.1, RLS holds)", () => {
    const records = collectEvidence({
      drillResults: [{ id: "backup-restore", ranAt: "2026-08-05T09:00:00.000Z", outcome: "passed", notes: "", runBy: "founder" }],
    });
    expect(records.map((r) => r.controlId).sort()).toEqual(["A1.1", "C1.1"]);
  });

  it("an unknown drill id is never guessed onto a control", () => {
    const records = collectEvidence({
      drillResults: [{ id: "mystery-drill", ranAt: "2026-08-05T09:00:00.000Z", outcome: "passed", notes: "", runBy: "founder" }],
    });
    expect(records).toEqual([]);
  });
});

describe("evidenceSnapshot — the monthly doc, certification-honest", () => {
  it("ALWAYS opens with the mandatory not-certified header", () => {
    const empty = evidenceSnapshot([], { monthLabel: "2026-08" });
    expect(empty.header).toBe(NOT_CERTIFIED_HEADER);
    expect(empty.text.startsWith(NOT_CERTIFIED_HEADER)).toBe(true);
    expect(NOT_CERTIFIED_HEADER).toContain("not SOC 2 certified");

    const some = evidenceSnapshot(
      collectEvidence({ adrPaths: ["docs/adr/0001-adr-practice.md"] }, { now: NOW }),
      { monthLabel: "2026-08" },
    );
    expect(some.text.startsWith(NOT_CERTIFIED_HEADER)).toBe(true);
  });

  it("an empty month names every family gap plainly", () => {
    const snap = evidenceSnapshot([], { monthLabel: "2026-08" });
    expect(snap.gaps).toHaveLength(5);
    expect(snap.gaps).toContain("No evidence collected for A1 availability this month.");
    expect(snap.gaps).toContain("No evidence collected for CC6 access control this month.");
    for (const fc of snap.familyCounts) expect(fc.recordCount).toBe(0);
  });

  it("counts per family and only names the families that are actually empty", () => {
    const records = collectEvidence(
      {
        ciRuns: [
          { url: "https://github.com/x/r/actions/runs/1", status: "success", at: "2026-08-01T00:00:00.000Z" },
          { url: "https://github.com/x/r/actions/runs/2", status: "failure", at: "2026-08-02T00:00:00.000Z" },
        ],
        keyRotations: [{ name: "GITHUB_TOKEN", rotatedAt: "2026-08-03T00:00:00.000Z", by: "founder" }],
      },
      { now: NOW },
    );
    const snap = evidenceSnapshot(records, { monthLabel: "2026-08" });
    expect(snap.familyCounts.find((f) => f.family === "CC8")!.recordCount).toBe(2);
    expect(snap.familyCounts.find((f) => f.family === "CC6")!.recordCount).toBe(1);
    expect(snap.gaps).toEqual([
      "No evidence collected for CC7 monitoring this month.",
      "No evidence collected for A1 availability this month.",
      "No evidence collected for C1 confidentiality this month.",
    ]);
    expect(snap.text).toContain("Gaps this month:");
  });

  it("never claims certification anywhere in the rendered text", () => {
    const snap = evidenceSnapshot([], { monthLabel: "2026-08" });
    const lower = snap.text.toLowerCase();
    expect(lower).not.toContain("soc 2 compliant");
    expect(lower).not.toContain("is soc 2 certified"); // only the negated form may appear
    expect(snap.text).toContain("not SOC 2 certified");
  });
});

describe("controlsCoverage — for the trust page", () => {
  it("lists EVERY control, with honest zeros and null lastEvidenceAt when nothing exists", () => {
    const coverage = controlsCoverage([]);
    expect(coverage).toHaveLength(CONTROLS.length);
    for (const c of coverage) {
      expect(c.recordCount).toBe(0);
      expect(c.lastEvidenceAt).toBeNull();
    }
  });

  it("counts records per control and reports the LATEST evidence timestamp", () => {
    const records = collectEvidence({
      drillResults: [
        { id: "failover", ranAt: "2026-05-01T00:00:00.000Z", outcome: "passed", notes: "", runBy: "founder" },
        { id: "backup-restore", ranAt: "2026-07-01T00:00:00.000Z", outcome: "partial", notes: "", runBy: "founder" },
      ],
    });
    const coverage = controlsCoverage(records);
    const a1 = coverage.find((c) => c.controlId === "A1.1")!;
    expect(a1.recordCount).toBe(2); // failover + backup-restore both tag A1.1
    expect(a1.lastEvidenceAt).toBe("2026-07-01T00:00:00.000Z");
    const c1 = coverage.find((c) => c.controlId === "C1.1")!;
    expect(c1.recordCount).toBe(1);
    const cc8 = coverage.find((c) => c.controlId === "CC8.1")!;
    expect(cc8.recordCount).toBe(0);
    expect(cc8.lastEvidenceAt).toBeNull();
  });
});

describe("prose rails — no em-dashes in anything rendered", () => {
  it("snapshot text, gaps, summaries, and the header are em-dash free", () => {
    const records = collectEvidence(
      {
        auditEvents: [new AuditLog(new MemoryAuditSink()).record({ actor: "system", action: "spend", verdict: "QUEUE" }, NOW)],
        drillResults: [{ id: "restore-from-audit", ranAt: "2026-08-01T00:00:00.000Z", outcome: "passed", notes: "", runBy: "founder" }],
        ciRuns: [{ url: "https://github.com/x/r/actions/runs/9", status: "success", at: "2026-08-02T00:00:00.000Z" }],
        adrPaths: ["docs/adr/0025-content-gate-and-verify.md"],
        keyRotations: [{ name: "VERCEL_TOKEN", rotatedAt: "2026-08-03T00:00:00.000Z", by: "founder" }],
      },
      { now: NOW },
    );
    expect(NOT_CERTIFIED_HEADER).not.toMatch(EM_DASH);
    for (const r of records) {
      expect(r.summary).not.toMatch(EM_DASH);
      expect(r.pointer).not.toMatch(EM_DASH);
    }
    const snap = evidenceSnapshot(records, { monthLabel: "2026-08" });
    expect(snap.text).not.toMatch(EM_DASH);
    for (const g of snap.gaps) expect(g).not.toMatch(EM_DASH);
    for (const label of Object.values(FAMILY_LABELS)) expect(label).not.toMatch(EM_DASH);
  });
});

describe("renovate.json — supply-chain patching stays human-merged", () => {
  const raw = readFileSync(fileURLToPath(new URL("../../renovate.json", import.meta.url)), "utf8");

  it("is valid JSON extending config:recommended on a weekly Monday schedule", () => {
    const config = JSON.parse(raw);
    expect(config.extends).toContain("config:recommended");
    expect(config.extends).toContain("helpers:pinGitHubActionDigests"); // pinned Action digests
    expect(config.schedule).toEqual(["before 6am on Monday"]);
    expect(config.labels).toEqual(["dependencies"]);
    expect(config.prConcurrentLimit).toBeLessThanOrEqual(3);
    expect(config.separateMajorMinor).toBe(true);
  });

  it("automerge is FALSE everywhere: top level and every package rule (a human merges, CI is the arbiter)", () => {
    const config = JSON.parse(raw);
    expect(config.automerge).toBe(false);
    for (const rule of config.packageRules ?? []) {
      if ("automerge" in rule) expect(rule.automerge).toBe(false);
    }
    expect(raw).not.toContain('"automerge": true');
    expect(raw).not.toContain("automergeType");
  });

  it("the description states the human-merge rule and contains no em-dashes", () => {
    const config = JSON.parse(raw);
    expect(config.description.toLowerCase()).toContain("human merges");
    expect(config.description).not.toMatch(EM_DASH);
  });
});
