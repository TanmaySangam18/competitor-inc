import { describe, it, expect } from "vitest";
import { tickLoop, evidenceFromRun, learningsFromRun, type DriverDeps } from "./loop-driver";
import { initLoop, type LoopState } from "./loop-engine";
import type { OrgRun } from "@/lib/engine/org-run";

const NOW = Date.UTC(2026, 6, 15);

const roadmap = [{ goal: "Ship the Stream", successCriteria: ["deploy url serves 200"], maxIterations: 2 }];

function runWith(status: OrgRun["status"], tasks: OrgRun["tasks"]): OrgRun {
  return { id: "run-1", goal: "g", status, tasks, createdAt: NOW, updatedAt: NOW };
}

// An in-memory deps harness: the loop state lives in `db.state`, runs in `db.runs`.
function harness(initial: LoopState | null) {
  const db: { state: LoopState | null; runs: Record<string, OrgRun>; created: string[]; notes: string[] } = {
    state: initial,
    runs: {},
    created: [],
    notes: [],
  };
  const deps: DriverDeps = {
    load: async () => (db.state ? { state: structuredClone(db.state), userId: "u1" } : null),
    save: async (s) => {
      db.state = structuredClone(s);
    },
    createRun: async (_u, goal) => {
      db.created.push(goal);
      return "run-1";
    },
    loadRun: async (id) => db.runs[id] ?? null,
    notify: async (t) => {
      db.notes.push(t);
    },
    now: () => NOW,
  };
  return { db, deps };
}

describe("Loop Driver — the outer loop actually turns", () => {
  it("no loop registered → honest no-op", async () => {
    const { deps } = harness(null);
    expect((await tickLoop("competitor.inc", deps)).acted).toBe("no-loop");
  });

  it("tick 1: idle → promotes the first objective and posts the digest", async () => {
    const { db, deps } = harness(initLoop("competitor.inc", roadmap));
    const r = await tickLoop("competitor.inc", deps);
    expect(r.acted).toBe("started-objective");
    expect(db.state!.status).toBe("running");
    expect(db.notes[0]).toContain("0/1 objectives met");
  });

  it("tick 2: running with no run in flight → spins an org-run with the CONTINUE goal", async () => {
    const { db, deps } = harness(initLoop("competitor.inc", roadmap));
    await tickLoop("competitor.inc", deps); // start
    const r = await tickLoop("competitor.inc", deps); // spin
    expect(r.acted).toBe("spun-iteration");
    expect(db.state!.currentRunId).toBe("run-1");
    expect(db.created[0]).toContain("CONTINUE (do not restart)");
    expect(db.created[0]).toContain("deploy url serves 200"); // unmet criteria ride into the goal
  });

  it("tick 3: run still running → waits (the inner loop owns its own progress)", async () => {
    const { db, deps } = harness(initLoop("competitor.inc", roadmap));
    await tickLoop("competitor.inc", deps);
    await tickLoop("competitor.inc", deps);
    db.runs["run-1"] = runWith("running", []);
    const r = await tickLoop("competitor.inc", deps);
    expect(r.acted).toBe("waiting");
    expect(db.state!.currentRunId).toBe("run-1"); // pointer intact
  });

  it("tick 4: run done with a matching proof → objective MET via real evidence, loop finishes", async () => {
    const { db, deps } = harness(initLoop("competitor.inc", roadmap));
    await tickLoop("competitor.inc", deps);
    await tickLoop("competitor.inc", deps);
    db.runs["run-1"] = runWith("done", [
      { id: "t1", role: "engineering", goal: "verify the deploy url serves 200", blockingOn: [], priority: 1, state: "done", proof: { kind: "url", value: "https://x.vercel.app" } },
    ] as OrgRun["tasks"]);
    const r = await tickLoop("competitor.inc", deps);
    expect(r.acted).toBe("advanced");
    expect(db.state!.objectives[0].status).toBe("met");
    expect(db.state!.status).toBe("all-met");
    expect(db.state!.currentRunId).toBeUndefined();
    expect(db.state!.learnings.at(-1)!.kind).toBe("win");
  });

  it("a run with NO matching proof does not fake success — iterates, then blocks at the cap", async () => {
    const { db, deps } = harness(initLoop("competitor.inc", roadmap)); // maxIterations 2
    await tickLoop("competitor.inc", deps);
    for (let i = 0; i < 2; i++) {
      await tickLoop("competitor.inc", deps); // spin
      db.runs["run-1"] = runWith("done", [
        { id: "t1", role: "engineering", goal: "did something unrelated", blockingOn: [], priority: 1, state: "done", proof: { kind: "build", value: "green" } },
      ] as OrgRun["tasks"]);
      await tickLoop("competitor.inc", deps); // advance (evidence won't match the criterion)
    }
    expect(db.state!.objectives[0].status).toBe("blocked");
    expect(db.state!.status).toBe("needs-human");
    // and once paused, nothing auto-runs:
    expect((await tickLoop("competitor.inc", deps)).acted).toBe("paused");
  });

  it("a FAILED run records failure learnings that feed the next iteration's goal", async () => {
    const { db, deps } = harness(initLoop("competitor.inc", roadmap));
    await tickLoop("competitor.inc", deps);
    await tickLoop("competitor.inc", deps);
    db.runs["run-1"] = runWith("failed", [
      { id: "t1", role: "engineering", goal: "build the stream", blockingOn: [], priority: 1, state: "failed" },
    ] as OrgRun["tasks"]);
    await tickLoop("competitor.inc", deps); // advance: iteration 1 failed
    expect(db.state!.learnings[0].kind).toBe("failure");
    const r = await tickLoop("competitor.inc", deps); // spin iteration 2
    expect(r.acted).toBe("spun-iteration");
    expect(db.created[1]).toContain('task "build the stream" failed'); // the learning fed forward
  });

  it("a vanished run clears the pointer instead of wedging the loop", async () => {
    const { db, deps } = harness(initLoop("competitor.inc", roadmap));
    await tickLoop("competitor.inc", deps);
    await tickLoop("competitor.inc", deps); // currentRunId=run-1, but db.runs is empty
    const r = await tickLoop("competitor.inc", deps);
    expect(r.acted).toBe("waiting");
    expect(db.state!.currentRunId).toBeUndefined(); // re-spins next tick
  });
});

describe("evidence + learnings extraction (the honesty seam)", () => {
  it("evidenceFromRun matches criteria only against DONE tasks' goals/proofs", () => {
    const run = runWith("done", [
      { id: "a", role: "engineering", goal: "verify deploy url serves 200", blockingOn: [], priority: 1, state: "done", proof: { kind: "url", value: "https://x.app" } },
      { id: "b", role: "engineering", goal: "regression wall green", blockingOn: [], priority: 1, state: "failed" }, // failed ⇒ never evidence
    ] as OrgRun["tasks"]);
    const ev = evidenceFromRun(run, ["deploy url serves 200", "regression wall green"]);
    expect(ev[0]).toMatchObject({ passed: true, proof: "url:https://x.app" });
    expect(ev[1]).toMatchObject({ passed: false });
  });

  it("learningsFromRun: failures dominate; a clean run is one win note", () => {
    const failed = runWith("failed", [{ id: "a", role: "engineering", goal: "x", blockingOn: [], priority: 1, state: "failed" }] as OrgRun["tasks"]);
    expect(learningsFromRun(failed)[0].kind).toBe("failure");
    const clean = runWith("done", [{ id: "a", role: "engineering", goal: "x", blockingOn: [], priority: 1, state: "done" }] as OrgRun["tasks"]);
    expect(learningsFromRun(clean)).toEqual([{ kind: "win", note: "iteration completed: 1/1 tasks done" }]);
  });
});
