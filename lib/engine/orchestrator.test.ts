import { describe, it, expect } from "vitest";
import { decomposeGoal, runSupervisedGoal } from "./orchestrator";

let n = 0;
const opts = () => ({ modelForRole: (r: string) => `m-${r}`, makeId: () => `i${++n}`, now: () => 0 });

describe("orchestrator", () => {
  it("decomposes a goal into an ordered pipeline over the crew", () => {
    const t = decomposeGoal("a PM-tools aggregator", ["ceo", "engineering", "support", "marketing"]);
    expect(t.map((x) => x.id)).toEqual(["plan", "build", "verify", "launch"]);
    expect(t[1].blockingOn).toEqual(["plan"]);
    expect(t[0].goal).toContain("PM-tools aggregator");
  });

  it("skips steps whose role isn't in the crew and rewires deps", () => {
    const t = decomposeGoal("x", ["ceo", "support"]); // no engineering/marketing
    expect(t.map((x) => x.id)).toEqual(["plan", "verify"]);
    expect(t[1].blockingOn).toEqual(["plan"]); // verify now chains off plan
  });

  it("runs a goal end-to-end (simulated), completes all tasks, escalates the launch spend", async () => {
    const out = await runSupervisedGoal("a PM-tools aggregator", opts());
    expect(out.completed.sort()).toEqual(["build", "launch", "plan", "verify"]);
    expect(out.failed).toEqual([]);
    expect(out.instances.every((i) => i.status === "terminated")).toBe(true);
    expect(out.packets).toHaveLength(1);
    expect(out.packets[0].kind).toBe("move_money");
    expect(out.refundedCents).toBe(4 * (5000 - 25)); // 4 tasks, each 5000 budget minus 25 spent
  });
});
