import { describe, it, expect } from "vitest";
import {
  initLoop,
  activeObjective,
  startNext,
  evaluate,
  recallForNextIteration,
  nextIterationGoal,
  needsHuman,
  advance,
  digest,
  LOOP_PHASES,
  type LoopState,
  type IterationOutcome,
} from "./loop-engine";

const NOW = Date.UTC(2026, 6, 15);

const roadmap = [
  { goal: "Ship the Stream surface", successCriteria: ["stream renders", "decision pins to top"], maxIterations: 3 },
  { goal: "Wire the incident loop", successCriteria: ["sentry webhook received"] },
];

const met = (crit: string): { criterion: string; passed: boolean; proof: string } => ({ criterion: crit, passed: true, proof: `receipt:${crit}` });

describe("Loop Engine — the outer Loop Engineering cycle", () => {
  it("covers the eight canonical phases in order", () => {
    expect(LOOP_PHASES).toEqual(["plan", "build", "test", "review", "fix", "deploy", "monitor", "learn"]);
  });

  it("initLoop seeds a roadmap of pending objectives; startNext promotes exactly one", () => {
    let s = initLoop("competitor.inc", roadmap);
    expect(s.objectives).toHaveLength(2);
    expect(s.objectives.every((o) => o.status === "pending")).toBe(true);
    s = startNext(s);
    expect(activeObjective(s)?.goal).toBe("Ship the Stream surface");
    expect(s.objectives.filter((o) => o.status === "active")).toHaveLength(1); // never two at once
    expect(s.status).toBe("running");
  });

  it("evaluate is EVIDENCE-based: unknown ≠ met (the honesty floor)", () => {
    const obj = initLoop("t", roadmap).objectives[0];
    expect(evaluate(obj, []).met).toBe(false); // no evidence → not met
    expect(evaluate(obj, [{ criterion: "stream renders", passed: true }]).met).toBe(false); // passed but NO proof → not met
    expect(evaluate(obj, [met("stream renders")]).unmet).toEqual(["decision pins to top"]); // partial
    expect(evaluate(obj, [met("stream renders"), met("decision pins to top")]).met).toBe(true); // fully evidenced
  });

  it("a fully-evidenced objective is marked met and the loop AUTO-ADVANCES to the next", () => {
    let s = startNext(initLoop("competitor.inc", roadmap));
    const outcome: IterationOutcome = {
      objectiveId: "obj-1",
      evidence: [met("stream renders"), met("decision pins to top")],
      learnings: [{ kind: "win", note: "Stream shipped; tabs retired" }],
    };
    s = advance(s, outcome, NOW);
    expect(s.objectives[0].status).toBe("met");
    expect(activeObjective(s)?.goal).toBe("Wire the incident loop"); // advanced automatically, no human prompt
    expect(s.status).toBe("running");
  });

  it("an unmet objective iterates, carrying learnings FORWARD (continues, doesn't restart)", () => {
    let s = startNext(initLoop("competitor.inc", roadmap));
    s = advance(s, {
      objectiveId: "obj-1",
      evidence: [met("stream renders")], // one criterion still unmet
      learnings: [{ kind: "failure", note: "pin overlapped the header at <768px" }],
    }, NOW);
    expect(s.objectives[0].status).toBe("active"); // still on it
    expect(s.objectives[0].iterations).toBe(1);
    const recalled = recallForNextIteration(s, "obj-1");
    expect(recalled).toContain("pin overlapped the header at <768px");
    const goal = nextIterationGoal(s.objectives[0], ["decision pins to top"], recalled);
    expect(goal).toContain("CONTINUE (do not restart)");
    expect(goal).toContain("pin overlapped the header"); // the learning is fed into the next plan
  });

  it("hits the iteration cap → blocks and escalates instead of looping forever", () => {
    let s = startNext(initLoop("competitor.inc", roadmap)); // obj-1 maxIterations = 3
    const fail: IterationOutcome = { objectiveId: "obj-1", evidence: [], learnings: [{ kind: "failure", note: "still broken" }] };
    s = advance(s, fail, NOW);
    s = advance(s, fail, NOW);
    expect(s.objectives[0].status).toBe("active"); // 2 iterations, cap not hit
    s = advance(s, fail, NOW); // 3rd — hits the cap
    expect(s.objectives[0].status).toBe("blocked");
    expect(s.objectives[0].blockedReason).toContain("after 3 iterations");
    expect(s.status).toBe("needs-human");
  });

  it("a human-gated action pauses the loop (escalation reuses autopilot, not a second copy)", () => {
    let s = startNext(initLoop("competitor.inc", roadmap));
    // prod-deploy is founder-gated in autopilot → needsHuman true → loop must pause, nothing auto-runs
    expect(needsHuman({ type: "prod-deploy", agent: "ceo" })).toBe(true);
    expect(needsHuman({ type: "post", agent: "marketing" })).toBe(false); // ordinary work runs unattended
    s = advance(s, {
      objectiveId: "obj-1",
      evidence: [met("stream renders"), met("decision pins to top")], // even fully met…
      learnings: [],
      action: { type: "prod-deploy", agent: "ceo" }, // …a prod deploy still needs the human
    }, NOW);
    expect(s.status).toBe("needs-human");
    expect(s.objectives[0].status).toBe("active"); // NOT marked met — it waits for the yes
  });

  it("all objectives met ⇒ status all-met (the roadmap is finished)", () => {
    let s = startNext(initLoop("t", [{ goal: "only one", successCriteria: ["done"] }]));
    s = advance(s, { objectiveId: "obj-1", evidence: [met("done")], learnings: [] }, NOW);
    expect(s.status).toBe("all-met");
    expect(activeObjective(s)).toBeUndefined();
  });

  it("digest is a human-legible Slack summary with progress + blockers", () => {
    let s = startNext(initLoop("competitor.inc", roadmap));
    s = advance(s, { objectiveId: "obj-1", evidence: [], learnings: [{ kind: "failure", note: "flaky test" }] }, NOW);
    const d = digest(s);
    expect(d).toContain("competitor.inc");
    expect(d).toContain("0/2 objectives met");
    expect(d).toContain("Now: Ship the Stream surface (iteration 1/3)");
    expect(d).toContain("flaky test");
  });

  it("learnings are append-only and compound across iterations (never cleared)", () => {
    let s = startNext(initLoop("competitor.inc", roadmap));
    s = advance(s, { objectiveId: "obj-1", evidence: [], learnings: [{ kind: "failure", note: "a" }] }, NOW);
    s = advance(s, { objectiveId: "obj-1", evidence: [], learnings: [{ kind: "insight", note: "b" }] }, NOW);
    expect(s.learnings.map((l) => l.note)).toEqual(["a", "b"]); // both retained, in order
    expect(s.learnings.every((l) => l.id && l.at === NOW)).toBe(true);
  });
});
