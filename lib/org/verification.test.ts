import { describe, it, expect } from "vitest";
import { emptySuite, addCheck, addChecks, baselineChecks, assessWall, nextCheckId, wallFromMemory, wallBrief, type VerificationSuite, type CheckResult } from "./verification";
import { architectureDoc, adrDoc } from "./product-memory";

const T = 1_800_000_000_000;
const pass = (id: string): CheckResult => ({ id, ran: true, passed: true });
const fail = (id: string, note?: string): CheckResult => ({ id, ran: true, passed: false, note });

describe("verification empire (P3) — the regression wall that compounds", () => {
  it("the wall GROWS with each build/change and never renumbers", () => {
    let s = emptySuite("notes-app");
    s = addChecks(s, baselineChecks("a notes app with tags"), { now: T });
    const afterBuild = s.checks.length;
    expect(afterBuild).toBeGreaterThanOrEqual(3);
    // a later change adds a NEW check on top — prior checks remain
    s = addCheck(s, { kind: "feature", description: "tags can be renamed", addedBy: "change: rename tags" }, { now: T + 1000 });
    expect(s.checks.length).toBe(afterBuild + 1);
    expect(s.checks[0].id).toBe("chk-1"); // first check keeps its id forever
    expect(s.checks.at(-1)!.id).toBe(nextCheckId({ ...s, checks: s.checks.slice(0, -1) })); // stable ordinal
    expect(s.checks.at(-1)!.addedBy).toContain("change:"); // provenance recorded
  });

  it("dedupes identical guarantees — the wall grows with NEW guarantees, not repeats", () => {
    let s = addChecks(emptySuite("x"), baselineChecks("a booking page"), { now: T });
    const n = s.checks.length;
    s = addChecks(s, baselineChecks("a booking page"), { now: T + 1 }); // re-run same build
    expect(s.checks.length).toBe(n); // no double-add
  });

  it("auth products get the isolation guarantee in their baseline", () => {
    const withAuth = baselineChecks("a SaaS with accounts and a dashboard");
    expect(withAuth.some((c) => /auth gate holds/i.test(c.description))).toBe(true);
    const noAuth = baselineChecks("a single-page tip calculator");
    expect(noAuth.some((c) => /auth gate/i.test(c.description))).toBe(false);
  });

  it("HONESTY: the wall holds ONLY when every check ran AND passed", () => {
    const s = addChecks(emptySuite("p"), baselineChecks("a thing"), { now: T });
    const ids = s.checks.map((c) => c.id);
    // all pass → wall holds
    expect(assessWall(s, ids.map(pass)).wallHolds).toBe(true);
    // one fails → wall drops, and it's named
    const oneFail = assessWall(s, [pass(ids[0]), fail(ids[1], "500 on POST"), pass(ids[2])]);
    expect(oneFail.wallHolds).toBe(false);
    expect(oneFail.failed[0]).toMatchObject({ id: ids[1], note: "500 on POST" });
  });

  it("HONESTY: an UNRUN check is 'unknown', never assumed to pass", () => {
    const s = addChecks(emptySuite("p"), baselineChecks("a thing"), { now: T });
    const ids = s.checks.map((c) => c.id);
    // only two of three ran → wall does NOT hold, the third is unrun (not a silent pass)
    const partial = assessWall(s, [pass(ids[0]), pass(ids[1])]);
    expect(partial.wallHolds).toBe(false);
    expect(partial.unrun.map((u) => u.id)).toEqual([ids[2]]);
    expect(partial.summary.toLowerCase()).toContain("unknown is not a pass");
    // a check that "ran: false" is also unrun, even if passed:true is (dishonestly) set
    expect(assessWall(s, [pass(ids[0]), pass(ids[1]), { id: ids[2], ran: false, passed: true }]).wallHolds).toBe(false);
  });

  it("an empty suite never 'holds' (nothing verified is not the same as safe)", () => {
    expect(assessWall(emptySuite("p"), []).wallHolds).toBe(false);
  });

  it("is deterministic — same inputs ⇒ identical suite", () => {
    const a = addChecks(emptySuite("p"), baselineChecks("a thing"), { now: T });
    const b = addChecks(emptySuite("p"), baselineChecks("a thing"), { now: T });
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
  });
});

describe("wallFromMemory — the wall as derived state (no persistence gap)", () => {
  const T2 = 1_800_000_000_000;
  const memory = () => ({
    product: "notes-app",
    docs: [
      architectureDoc("notes-app", "a notes app with accounts and a dashboard", T2),
      adrDoc(1, "Ground answers on stored notes", { context: "c", decision: "Retrieve then answer", consequences: "k" }, T2),
      adrDoc(2, "Add tags to notes", { context: "c", decision: "Tags as a first-class field", consequences: "k" }, T2),
    ],
  });

  it("rebuilds the wall from memory: baseline from the founding goal + one regression check per ADR", () => {
    const wall = wallFromMemory(memory());
    // the goal mentions accounts/dashboard → the auth baseline check joins the floor (4 baseline) + 2 ADRs
    expect(wall.checks.length).toBe(6);
    expect(wall.checks.filter((c) => c.kind === "regression").length).toBe(2);
    expect(wall.checks.some((c) => c.addedBy === "ADR-1")).toBe(true);
    expect(wall.checks.some((c) => c.description.includes("Add tags to notes"))).toBe(true);
  });

  it("is deterministic and in lock-step with memory — an ADR added grows the wall by exactly one", () => {
    const m = memory();
    const before = wallFromMemory(m).checks.length;
    m.docs.push(adrDoc(3, "Export notes", { context: "c", decision: "CSV export", consequences: "k" }, T2));
    expect(wallFromMemory(m).checks.length).toBe(before + 1);
    expect(JSON.stringify(wallFromMemory(m))).toEqual(JSON.stringify(wallFromMemory(m)));
  });

  it("wallBrief renders every guarantee for the change prompt (and is empty on an empty wall)", () => {
    const brief = wallBrief(wallFromMemory(memory()));
    expect(brief).toContain("THE REGRESSION WALL — 6 guarantees");
    expect(brief).toContain("ADR-2");
    expect(brief).toContain("must EXTEND the product without breaking");
    expect(wallBrief(emptySuite("p"))).toBe("");
  });
});
