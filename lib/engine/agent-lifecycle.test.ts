import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  spawnInstance,
  transition,
  recordSpend,
  handoff,
  terminate,
  canTransition,
  isWellFormedProof,
} from "./agent-lifecycle";
import { orderTasks, readyTasks, type AgentTask } from "./task-queue";

const base = () =>
  spawnInstance({ id: "i1", taskId: "t1", role: "engineering", model: "m", budgetCents: 1000, now: 0 });

describe("agent-lifecycle state machine", () => {
  it("walks spawned → working → verifying → done → terminated", () => {
    let i = base();
    expect(i.status).toBe("spawned");
    i = transition(i, "working");
    i = transition(i, "verifying");
    i = transition(i, "done");
    const { instance } = terminate(i, 5);
    expect(instance.status).toBe("terminated");
    expect(instance.endedAt).toBe(5);
  });

  it("rejects illegal transitions", () => {
    expect(canTransition("spawned", "done")).toBe(false);
    expect(() => transition(base(), "done")).toThrow(/illegal/);
  });

  it("handoff carries context and marks handed_off", () => {
    const i = handoff(transition(transition(base(), "working"), "verifying"), "ctx-for-next");
    expect(i.status).toBe("handed_off");
    expect(i.handoffContext).toBe("ctx-for-next");
  });

  it("never spends past budget", () => {
    const i = transition(base(), "working");
    expect(recordSpend(i, 400).spentCents).toBe(400);
    expect(() => recordSpend(i, 1001)).toThrow(/exceed/);
    expect(() => recordSpend(i, -1)).toThrow(/≥ 0/);
  });

  it("terminate refunds exactly the unspent budget (property)", () => {
    fc.assert(
      fc.property(fc.nat(100000), fc.nat(100000), (budget, spend) => {
        let i = spawnInstance({ id: "x", taskId: "t", role: "growth", model: "m", budgetCents: budget, now: 0 });
        i = transition(i, "working");
        const use = Math.min(spend, budget);
        if (use > 0) i = recordSpend(i, use);
        i = transition(i, "failed");
        const { refundCents } = terminate(i, 1);
        return refundCents === budget - use;
      }),
    );
  });

  it("isWellFormedProof enforces verify-before-done shapes", () => {
    expect(isWellFormedProof({ kind: "url", value: "https://x.com/a" })).toBe(true);
    expect(isWellFormedProof({ kind: "url", value: "http://x.com" })).toBe(false);
    expect(isWellFormedProof({ kind: "build", value: "9f2c1a0" })).toBe(true);
    expect(isWellFormedProof({ kind: "metric", value: "42 signups" })).toBe(true);
    expect(isWellFormedProof(undefined)).toBe(false);
  });
});

describe("task-queue DAG", () => {
  const tasks: AgentTask[] = [
    { id: "c", goal: "ship", role: "engineering", blockingOn: ["a", "b"], priority: 1 },
    { id: "a", goal: "spec", role: "ceo", blockingOn: [], priority: 5 },
    { id: "b", goal: "design", role: "marketing", blockingOn: ["a"], priority: 3 },
  ];

  it("orders respecting dependencies", () => {
    const order = orderTasks(tasks).map((t) => t.id);
    expect(order.indexOf("a")).toBeLessThan(order.indexOf("b"));
    expect(order.indexOf("b")).toBeLessThan(order.indexOf("c"));
    expect(order[0]).toBe("a");
  });

  it("readyTasks returns unblocked, highest-priority first", () => {
    const ready = readyTasks(tasks, new Set(["a"])).map((t) => t.id);
    expect(ready[0]).toBe("b"); // b now unblocked; c still waits on b
    expect(ready).not.toContain("c");
    expect(ready).not.toContain("a");
  });

  it("throws on a cycle and on a dangling dependency", () => {
    expect(() =>
      orderTasks([
        { id: "x", goal: "", role: "ceo", blockingOn: ["y"], priority: 1 },
        { id: "y", goal: "", role: "ceo", blockingOn: ["x"], priority: 1 },
      ]),
    ).toThrow(/cycle/);
    expect(() =>
      orderTasks([{ id: "x", goal: "", role: "ceo", blockingOn: ["ghost"], priority: 1 }]),
    ).toThrow(/unknown task/);
  });
});
