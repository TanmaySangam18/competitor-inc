import { describe, it, expect } from "vitest";
import {
  DRILLS,
  DRILL_IDS,
  NOT_YET_RUN,
  QUARTERLY_DAYS,
  dueDrills,
  drillReport,
  recordDrill,
  type DrillResult,
} from "./drills";
import { DRILL_CONTROL_MAP } from "./evidence";

const NOW = new Date("2026-08-06T12:00:00.000Z");
const DAY_MS = 86_400_000;
const daysAgo = (n: number) => new Date(NOW.getTime() - n * DAY_MS).toISOString();

const EM_DASH = /[—–]/; // em-dash or en-dash: banned in every rendered string

describe("drill registry", () => {
  it("defines exactly the five operational drills, quarterly, with concrete steps", () => {
    expect(DRILL_IDS.sort()).toEqual(
      ["backup-restore", "failover", "key-rotation", "kill-switch", "restore-from-audit"].sort(),
    );
    for (const id of DRILL_IDS) {
      const d = DRILLS[id];
      expect(d.cadenceDays).toBe(QUARTERLY_DAYS);
      expect(d.steps.length).toBeGreaterThanOrEqual(3);
      expect(d.purpose.length).toBeGreaterThan(20);
      // every drill maps into the evidence pipeline, and evidenceOf is its primary control there
      expect(DRILL_CONTROL_MAP[id]?.[0]).toBe(d.evidenceOf);
    }
  });
});

describe("dueDrills — the due math", () => {
  it("with no results, every drill is due and labeled 'not yet run' (never 'passed')", () => {
    const due = dueDrills([], { now: NOW });
    expect(due).toHaveLength(DRILL_IDS.length);
    for (const d of due) {
      expect(d.lastRun).toBeNull();
      expect(d.lastRunLabel).toBe(NOT_YET_RUN);
      expect(d.overdueDays).toBeNull();
      expect(JSON.stringify(d)).not.toContain("passed");
    }
  });

  it("a drill run within cadence is NOT due; one past cadence IS", () => {
    const results: DrillResult[] = [
      { id: "kill-switch", ranAt: daysAgo(10), outcome: "passed", notes: "test ns frozen + cleared", runBy: "founder" },
      { id: "key-rotation", ranAt: daysAgo(120), outcome: "passed", notes: "all creds rotated", runBy: "founder" },
    ];
    const due = dueDrills(results, { now: NOW });
    const ids = due.map((d) => d.id);
    expect(ids).not.toContain("kill-switch"); // 10 days ago, fresh
    expect(ids).toContain("key-rotation"); // 120 days ago, 30 days past the 90-day cadence
    expect(due.find((d) => d.id === "key-rotation")!.overdueDays).toBe(30);
  });

  it("sorts most-overdue first, with never-run drills ahead of everything", () => {
    const results: DrillResult[] = [
      { id: "failover", ranAt: daysAgo(100), outcome: "passed", notes: "", runBy: "founder" }, // 10 over
      { id: "key-rotation", ranAt: daysAgo(200), outcome: "partial", notes: "", runBy: "founder" }, // 110 over
      { id: "kill-switch", ranAt: daysAgo(5), outcome: "passed", notes: "", runBy: "founder" }, // fresh
    ];
    const due = dueDrills(results, { now: NOW });
    // never-run: backup-restore, restore-from-audit (registry order) then key-rotation then failover
    expect(due.map((d) => d.id)).toEqual(["backup-restore", "restore-from-audit", "key-rotation", "failover"]);
  });

  it("uses the MOST RECENT run per drill, not the first", () => {
    const results: DrillResult[] = [
      { id: "failover", ranAt: daysAgo(200), outcome: "failed", notes: "", runBy: "founder" },
      { id: "failover", ranAt: daysAgo(3), outcome: "passed", notes: "rerun after fix", runBy: "founder" },
    ];
    expect(dueDrills(results, { now: NOW }).map((d) => d.id)).not.toContain("failover");
  });
});

describe("drillReport — honesty lines", () => {
  it("empty program: all 'not yet run', no outcome invented, honest headline", () => {
    const report = drillReport([], { now: NOW });
    expect(report.neverRunCount).toBe(DRILL_IDS.length);
    expect(report.dueCount).toBe(DRILL_IDS.length);
    expect(report.headline).toBe(`No operational drills have run yet. All ${DRILL_IDS.length} are due.`);
    for (const d of report.drills) {
      expect(d.lastOutcome).toBeNull();
      expect(d.statusLine).toContain(NOT_YET_RUN);
      expect(d.statusLine).not.toContain("passed");
    }
  });

  it("a run drill reports its real outcome and due state; a failed run is reported as failed", () => {
    const results: DrillResult[] = [
      { id: "backup-restore", ranAt: daysAgo(95), outcome: "failed", notes: "row counts off on products", runBy: "founder" },
      { id: "kill-switch", ranAt: daysAgo(30), outcome: "passed", notes: "", runBy: "founder" },
    ];
    const report = drillReport(results, { now: NOW });
    const backup = report.drills.find((d) => d.id === "backup-restore")!;
    expect(backup.lastOutcome).toBe("failed");
    expect(backup.due).toBe(true);
    expect(backup.statusLine).toContain("outcome failed");
    expect(backup.statusLine).toContain("Overdue by 5 day(s)");
    const kill = report.drills.find((d) => d.id === "kill-switch")!;
    expect(kill.due).toBe(false);
    expect(kill.statusLine).toContain("Next run due in 60 day(s)");
  });
});

describe("recordDrill — validation + the evidence bridge", () => {
  const good: DrillResult = {
    id: "key-rotation",
    ranAt: "2026-08-01T09:00:00.000Z",
    outcome: "passed",
    notes: "rotated service role + anon + GitHub token; old values rejected",
    runBy: "founder",
  };

  it("returns the drill's PRIMARY evidence record, tagged to its evidenceOf control", () => {
    const record = recordDrill(good);
    expect(record.controlId).toBe(DRILLS["key-rotation"].evidenceOf); // CC6.1
    expect(record.kind).toBe("drill-result");
    expect(record.at).toBe(good.ranAt);
    expect(record.summary).toContain("key-rotation");
    expect(record.summary).toContain("passed");
    expect(record.pointer).toContain("key-rotation");
  });

  it("throws on an unknown drill id, a bad outcome, a bad timestamp, and a blank runBy", () => {
    expect(() => recordDrill({ ...good, id: "made-up" as never })).toThrow(/unknown drill id/);
    expect(() => recordDrill({ ...good, outcome: "great" as never })).toThrow(/invalid outcome/);
    expect(() => recordDrill({ ...good, ranAt: "yesterday-ish" })).toThrow(/valid timestamp/);
    expect(() => recordDrill({ ...good, runBy: "  " })).toThrow(/runBy/);
  });
});

describe("prose rails — no em-dashes in anything rendered", () => {
  it("registry strings (names, purposes, steps, evidenceOf) are em-dash free", () => {
    for (const id of DRILL_IDS) {
      const d = DRILLS[id];
      for (const s of [d.name, d.purpose, d.evidenceOf, ...d.steps]) expect(s).not.toMatch(EM_DASH);
    }
  });

  it("report + due output strings are em-dash free, run or not", () => {
    const results: DrillResult[] = [
      { id: "failover", ranAt: daysAgo(120), outcome: "partial", notes: "", runBy: "founder" },
    ];
    const report = drillReport(results, { now: NOW });
    expect(report.headline).not.toMatch(EM_DASH);
    for (const d of report.drills) expect(d.statusLine).not.toMatch(EM_DASH);
    for (const d of dueDrills(results, { now: NOW })) expect(d.lastRunLabel).not.toMatch(EM_DASH);
    const evidence = recordDrill({ id: "kill-switch", ranAt: daysAgo(1), outcome: "passed", notes: "", runBy: "founder" });
    expect(evidence.summary).not.toMatch(EM_DASH);
    expect(evidence.pointer).not.toMatch(EM_DASH);
  });
});
