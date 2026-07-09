import { describe, it, expect } from "vitest";
import { runSupervisor, type ExecuteFn, type TaskResult } from "./supervisor";
import { type AgentTask } from "./task-queue";
import { preparePacket, startReview, completePacket, pendingPackets } from "./accountability-spine";

let n = 0;
const opts = () => ({ modelForRole: (r: string) => `model-${r}`, makeId: () => `i${++n}`, budgetCentsPerTask: 1000, now: () => 0 });

// A goal decomposed into: spec (ceo) → build (engineering, hands off) → verify+ship (support).
const goal: AgentTask[] = [
  { id: "spec", goal: "write the spec", role: "ceo", blockingOn: [], priority: 5 },
  { id: "build", goal: "build it", role: "engineering", blockingOn: ["spec"], priority: 3 },
  { id: "ship", goal: "ship it", role: "support", blockingOn: ["build"], priority: 1 },
];

describe("supervisor — end to end", () => {
  it("spawns per task, verifies, hands off with context, escalates gated acts, terminates with refund", async () => {
    const seen: Record<string, string | undefined> = {};
    const execute: ExecuteFn = (inst, task, inbound) => {
      seen[task.id] = inbound;
      const r: TaskResult = { ok: true, spentCents: 100, proof: { kind: "metric", value: "ok" }, verifierRole: "growth" };
      if (task.id === "build") {
        r.handoffTo = "ship";
        r.handoffContext = "artifact://build-42";
        r.proof = { kind: "url", value: "https://x.dev/build-42" };
        r.gatedActs = [
          preparePacket({ id: "p1", kind: "move_money", title: "Pay hosting", summary: "$", preparedBy: "engineering", actionRequired: "approve invoice", now: 0 }),
        ];
      }
      return r;
    };

    const out = await runSupervisor(goal, execute, opts());

    expect(out.completed.sort()).toEqual(["build", "ship", "spec"]);
    expect(out.failed).toEqual([]);
    expect(out.instances).toHaveLength(3);
    expect(out.instances.every((i) => i.status === "terminated")).toBe(true);
    // handoff context reached the successor
    expect(seen["ship"]).toBe("artifact://build-42");
    // gated act escalated to the human spine, not auto-run
    expect(out.packets).toHaveLength(1);
    expect(out.packets[0].kind).toBe("move_money");
    // the build task's live URL is captured as a verified artifact
    expect(out.artifacts.map((a) => a.url)).toContain("https://x.dev/build-42");
    // refund = 3 tasks * (1000 - 100 spent)
    expect(out.refundedCents).toBe(2700);
  });

  it("fails a task with no proof (verify-before-done)", async () => {
    const execute: ExecuteFn = () => ({ ok: true, spentCents: 0, verifierRole: "support" }); // no proof
    const out = await runSupervisor([{ id: "a", goal: "", role: "ceo", blockingOn: [], priority: 1 }], execute, opts());
    expect(out.failed).toEqual(["a"]);
    expect(out.completed).toEqual([]);
  });

  it("fails a self-graded task (generator/evaluator must be separate)", async () => {
    const execute: ExecuteFn = () => ({ ok: true, spentCents: 0, proof: { kind: "metric", value: "x" }, verifierRole: "ceo" });
    const out = await runSupervisor([{ id: "a", goal: "", role: "ceo", blockingOn: [], priority: 1 }], execute, opts());
    expect(out.failed).toEqual(["a"]);
  });

  it("self-repairs: retries with diagnostic feedback on a verification failure (opt-in via maxTaskRetries)", async () => {
    const contexts: (string | undefined)[] = [];
    let calls = 0;
    const execute: ExecuteFn = (_i, _task, inbound) => {
      contexts.push(inbound);
      calls++;
      // attempt 1: no proof (rejected). attempt 2: valid + independently verified.
      return calls === 1
        ? { ok: true, spentCents: 100 }
        : { ok: true, spentCents: 100, proof: { kind: "metric", value: "ok" }, verifierRole: "growth" };
    };
    const out = await runSupervisor(
      [{ id: "a", goal: "do it", role: "ceo", blockingOn: [], priority: 1 }],
      execute,
      { ...opts(), maxTaskRetries: 2 },
    );
    expect(calls).toBe(2); // retried once, then succeeded
    expect(out.completed).toEqual(["a"]);
    expect(out.failed).toEqual([]);
    expect(contexts[1]).toMatch(/self-repair 1\/2/); // diagnostic feedback carried into the retry
    expect(contexts[1]).toMatch(/no well-formed proof/);
  });

  it("stays single-shot when maxTaskRetries is unset (default 0 — behavior unchanged)", async () => {
    let calls = 0;
    const execute: ExecuteFn = () => {
      calls++;
      return { ok: true, spentCents: 0 };
    }; // no proof
    const out = await runSupervisor([{ id: "a", goal: "", role: "ceo", blockingOn: [], priority: 1 }], execute, opts());
    expect(calls).toBe(1); // no retry by default
    expect(out.failed).toEqual(["a"]);
  });

  it("exhausts bounded retries then fails honestly (no infinite loop; verifier stays independent)", async () => {
    let calls = 0;
    const execute: ExecuteFn = () => {
      calls++;
      return { ok: true, spentCents: 100 };
    }; // always no proof → never verifiable
    const out = await runSupervisor(
      [{ id: "a", goal: "", role: "ceo", blockingOn: [], priority: 1 }],
      execute,
      { ...opts(), maxTaskRetries: 2 },
    );
    expect(calls).toBe(3); // initial + 2 bounded retries, then stop
    expect(out.failed).toEqual(["a"]);
  });

  it("skips a task whose dependency failed (no fake work on a broken chain)", async () => {
    const execute: ExecuteFn = (_i, task) =>
      task.id === "a"
        ? { ok: false, spentCents: 0 } // a fails
        : { ok: true, spentCents: 0, proof: { kind: "metric", value: "x" }, verifierRole: "growth" };
    const out = await runSupervisor(
      [
        { id: "a", goal: "", role: "ceo", blockingOn: [], priority: 2 },
        { id: "b", goal: "", role: "engineering", blockingOn: ["a"], priority: 1 },
      ],
      execute,
      opts(),
    );
    expect(out.failed.sort()).toEqual(["a", "b"]);
  });
});

describe("supervisor — org-role independence (Phase 2)", () => {
  it("accepts a lead verifying an IC in the SAME execFn (would be 'self-graded' by engine-role alone)", async () => {
    const task: AgentTask = { id: "build-ic", goal: "build it", role: "engineering", blockingOn: [], priority: 1, orgRoleId: "fullstack-engineer" };
    const execute: ExecuteFn = () => ({
      ok: true, spentCents: 0, proof: { kind: "url", value: "https://x.dev/1" },
      verifierRole: "engineering", verifierOrgRoleId: "fullstack-team-lead", // same execFn, different POSITION
    });
    const out = await runSupervisor([task], execute, opts());
    expect(out.completed).toEqual(["build-ic"]);
    expect(out.failed).toEqual([]);
  });

  it("rejects the SAME org position grading its own work (even when the engine-role differs)", async () => {
    const task: AgentTask = { id: "x", goal: "", role: "engineering", blockingOn: [], priority: 1, orgRoleId: "fullstack-engineer" };
    const execute: ExecuteFn = () => ({
      ok: true, spentCents: 0, proof: { kind: "metric", value: "x" },
      verifierRole: "support", verifierOrgRoleId: "fullstack-engineer", // different execFn, but SAME position
    });
    const out = await runSupervisor([task], execute, opts());
    expect(out.failed).toEqual(["x"]);
  });

  it("an org task with no org-position verifier fails (verify-before-done at position level)", async () => {
    const task: AgentTask = { id: "x", goal: "", role: "engineering", blockingOn: [], priority: 1, orgRoleId: "fullstack-engineer" };
    const execute: ExecuteFn = () => ({ ok: true, spentCents: 0, proof: { kind: "metric", value: "x" }, verifierRole: "support" });
    const out = await runSupervisor([task], execute, opts());
    expect(out.failed).toEqual(["x"]);
  });
});

describe("accountability spine — packet lifecycle", () => {
  const pkt = () => preparePacket({ id: "p", kind: "file_tax", title: "Q3", summary: "s", preparedBy: "ceo", actionRequired: "file it", now: 0 });

  it("prepared → in_review → completed, and only in that order", () => {
    const p = pkt();
    expect(p.status).toBe("prepared");
    const r = startReview(p);
    expect(r.status).toBe("in_review");
    expect(completePacket(r).status).toBe("completed");
    expect(() => completePacket(p)).toThrow(/in review/); // can't complete a prepared packet
    expect(() => startReview(completePacket(r))).toThrow(/prepared/);
  });

  it("pendingPackets excludes completed", () => {
    const a = pkt();
    const b = completePacket(startReview(pkt()));
    expect(pendingPackets([a, b]).map((p) => p.status)).toEqual(["prepared"]);
  });
});
