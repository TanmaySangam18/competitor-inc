import { describe, it, expect } from "vitest";
import {
  startRun, begin, finish, report, missingFor, whatIsMissing, phaseById, credentialProblems,
  PHASES, TARGET_MINUTES, type PhaseId,
} from "./run";

const T0 = 1_700_000_000_000;
const min = (n: number) => T0 + n * 60_000;
// Shaped like the real things, because the module now checks shape and short stubs would fail.
const FULL_ENV = {
  FULLSTACK_BUILDS: "1",
  GITHUB_TOKEN: "ghp_" + "x".repeat(36),
  FULLSTACK_LLM_API_KEY: "gsk_" + "x".repeat(48),
  FULLSTACK_VERCEL_TOKEN: "x".repeat(24),
  AGENTMAIL_API_KEY: "x".repeat(32),
};

/** Drive every phase to done with a fully-credentialled env. */
function fullRun(endMinute = 30) {
  let r = startRun("a tool that finds real co-op postings", T0);
  PHASES.forEach((p, i) => {
    r = begin(r, p.id, min(i), FULL_ENV);
    r = finish(r, p.id, min(i + 0.5), { ok: true });
  });
  return report(r, min(endMinute));
}

describe("THE RULE: a phase that could not run is never done", () => {
  it("blocks a phase whose credentials are missing, and names them", () => {
    const r = begin(startRun("x", T0), "build", T0, {});
    const b = r.phases.find((p) => p.id === "build")!;
    expect(b.state).toBe("blocked");
    expect(b.reason).toContain("FULLSTACK_BUILDS");
    expect(b.reason).toContain("GITHUB_TOKEN");
  });

  it("REFUSES to let a blocked phase be marked done", () => {
    // This is the shortcut that would make a partial run look like a fast run.
    let r = begin(startRun("x", T0), "build", T0, {});
    r = finish(r, "build", min(1), { ok: true });
    expect(r.phases.find((p) => p.id === "build")!.state).toBe("blocked");
  });

  it("treats a blank variable as missing, not as set", () => {
    expect(missingFor(phaseById("deploy"), { FULLSTACK_VERCEL_TOKEN: "   " })).toEqual(["FULLSTACK_VERCEL_TOKEN"]);
  });

  it("lets a keyless phase run with an empty environment", () => {
    const r = begin(startRun("x", T0), "plan", T0, {});
    expect(r.phases.find((p) => p.id === "plan")!.state).toBe("running");
  });
});

describe("the 45 minute claim can only be true when everything ran", () => {
  it("is within target on a complete 30 minute run", () => {
    const rep = fullRun(30);
    expect(rep.complete).toBe(true);
    expect(rep.withinTarget).toBe(true);
    expect(rep.verdict).toMatch(/inside the 45 minute target/);
  });

  it("is NOT within target on a complete run that overran", () => {
    const rep = fullRun(TARGET_MINUTES + 5);
    expect(rep.complete).toBe(true);
    expect(rep.withinTarget).toBe(false);
    expect(rep.verdict).toMatch(/against a 45 minute target/);
  });

  it("is NEVER within target on a fast but incomplete run, which is the whole point", () => {
    let r = startRun("x", T0);
    for (const id of ["understand", "validate", "plan"] as PhaseId[]) {
      r = begin(r, id, T0, {});
      r = finish(r, id, T0 + 1000, { ok: true });
    }
    r = begin(r, "build", T0, {}); // no credentials
    const rep = report(r, min(12));
    expect(rep.complete).toBe(false);
    expect(rep.withinTarget).toBe(false);
    expect(rep.verdict).toMatch(/does not mean anything yet/);
  });

  it("counts a refusal as not done", () => {
    let r = begin(startRun("x", T0), "validate", T0, {});
    r = finish(r, "validate", min(2), { ok: false, reason: "nobody is searching for this" });
    const rep = report(r, min(3));
    expect(rep.complete).toBe(false);
    expect(rep.blocked[0].reason).toMatch(/nobody is searching/);
  });
});

describe("the report is specific enough to act on", () => {
  it("times each phase separately, so the slow one is identifiable", () => {
    const rep = fullRun();
    expect(rep.perPhaseMs).toHaveLength(PHASES.length);
    expect(rep.perPhaseMs.every((p) => p.ms === 30_000)).toBe(true);
  });

  it("does not time a phase that never started", () => {
    expect(report(startRun("x", T0), min(5)).perPhaseMs).toEqual([]);
  });

  it("never reports negative elapsed time from a clock that went backwards", () => {
    expect(report(startRun("x", T0), T0 - 99_999).elapsedMs).toBe(0);
  });

  it("names every missing credential and which phase needs it", () => {
    const missing = whatIsMissing({});
    expect(missing.map((m) => m.key)).toEqual([
      "FULLSTACK_BUILDS", "GITHUB_TOKEN", "FULLSTACK_LLM_API_KEY", "FULLSTACK_VERCEL_TOKEN", "AGENTMAIL_API_KEY",
    ]);
    expect(missing[0].forPhase).toBe("Write the software");
    expect(missing.every((m) => m.problem === "absent")).toBe(true);
  });

  it("reports nothing missing once everything is set", () => {
    expect(whatIsMissing(FULL_ENV)).toEqual([]);
  });
});

describe("every phase is tied to a goal step, so no work drifts loose", () => {
  it("names a step for all of them", () => {
    for (const p of PHASES) expect(p.goalStep, p.id).toBeGreaterThan(0);
  });

  it("has no em-dashes in anything a student reads", () => {
    const rep = fullRun(60);
    const strings = [...PHASES.map((p) => p.label), rep.verdict, ...rep.blocked.map((b) => b.reason)];
    for (const s of strings) expect(s, s).not.toMatch(/—/);
  });
});

describe("PRESENCE IS NOT VALIDITY: the false green that actually happened", () => {
  it("blocks the real 8-character clipboard debris that GitHub answered 401 to", () => {
    // Verbatim shape of the value found in .env.local: a bad pbpaste, reported READY by a presence check.
    const junk = { FULLSTACK_BUILDS: "1", GITHUB_TOKEN: "8710xxxx", FULLSTACK_LLM_API_KEY: "8710xxxx" };
    const r = begin(startRun("x", T0), "build", T0, junk);
    const b = r.phases.find((p) => p.id === "build")!;
    expect(b.state).toBe("blocked");
    expect(b.reason).toMatch(/GITHUB_TOKEN does not look right/);
    expect(b.reason).toMatch(/starts with ghp_/);
  });

  it("accepts a correctly shaped GitHub token", () => {
    expect(credentialProblems(phaseById("build"), FULL_ENV)).toEqual([]);
  });

  it("rejects a token with the right prefix but too short to be real", () => {
    const problems = credentialProblems(phaseById("build"), { ...FULL_ENV, GITHUB_TOKEN: "ghp_short" });
    expect(problems).toHaveLength(1);
    expect(problems[0].problem).toBe("malformed");
  });

  it("rejects a Vercel token containing whitespace, which is the other common bad paste", () => {
    const problems = credentialProblems(phaseById("deploy"), { FULLSTACK_VERCEL_TOKEN: "abc def ghi jkl mno pqr" });
    expect(problems[0].problem).toBe("malformed");
  });

  it("distinguishes absent from malformed, because the fixes are different", () => {
    const absent = credentialProblems(phaseById("deploy"), {});
    const bad = credentialProblems(phaseById("deploy"), { FULLSTACK_VERCEL_TOKEN: "x" });
    expect(absent[0].problem).toBe("absent");
    expect(bad[0].problem).toBe("malformed");
    expect(bad[0].hint).toBeTruthy();
  });

  it("still says nothing is wrong when every credential is well formed", () => {
    expect(whatIsMissing(FULL_ENV)).toEqual([]);
  });
});
