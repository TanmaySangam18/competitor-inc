import { describe, it, expect } from "vitest";
import { decomposeGoal, runSupervisedGoal, makeRealExecutor, type RealExecutorDeps } from "./orchestrator";
import type { AgentInstance } from "./agent-lifecycle";
import type { AgentTask } from "./task-queue";

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

  it("operate=true adds the ongoing GTM/support functions as drafts on the desk", async () => {
    const t = decomposeGoal("x", ["ceo", "engineering", "support", "marketing", "growth"], { operate: true });
    expect(t.map((x) => x.id)).toEqual(["plan", "build", "verify", "launch", "announce", "retain", "care"]);
    expect(t.find((x) => x.id === "announce")!.blockingOn).toEqual(["launch"]);

    const out = await runSupervisedGoal("x", { ...opts(), operate: true });
    expect(out.completed).toContain("announce");
    expect(out.completed).toContain("retain");
    // Default crew is now 8 roles: launch(fund)+announce/retain/care PLUS the back-office desk items —
    // budget(move_money), comply(sign_contract), process(vendor_review). All land on the human's desk.
    expect(out.packets.map((p) => p.kind).sort()).toEqual([
      "approve_outreach", "approve_publish", "approve_support", "move_money", "move_money", "sign_contract", "vendor_review",
    ]);
  });
});

describe("makeRealExecutor (Phase 2 — real work, not narration)", () => {
  const deps: RealExecutorDeps = {
    plan: async (g) => `SPEC: ${g}`,
    build: async () => ({ url: "https://focus-app-x.vercel.app", repo: "o/focus-app-x", note: "building" }),
    verify: async (u) => u.startsWith("https://"),
    draft: async (role, g) => `${role} draft for ${g}`,
  };
  const inst = { id: "i1", createdAt: 0 } as unknown as AgentInstance;
  const task = (id: string, role: AgentTask["role"]): AgentTask => ({ id, goal: "a focus app", role, blockingOn: [], priority: 5 });

  it("BUILD ships a real URL proof and hands off to verify", async () => {
    const r = await makeRealExecutor(deps)(inst, task("build", "engineering"), "SPEC");
    expect(r.ok).toBe(true);
    expect(r.proof).toEqual({ kind: "url", value: "https://focus-app-x.vercel.app" });
    expect(r.handoffTo).toBe("verify");
    expect(r.handoffContext).toBe("https://focus-app-x.vercel.app");
  });

  it("VERIFY HEAD-checks the handed-off artifact (verify-before-done)", async () => {
    const live = await makeRealExecutor(deps)(inst, task("verify", "support"), "https://focus-app-x.vercel.app");
    expect(live.proof).toEqual({ kind: "url", value: "https://focus-app-x.vercel.app" });
    const nothing = await makeRealExecutor(deps)(inst, task("verify", "support"), "");
    expect(nothing.proof?.kind).toBe("metric"); // never a fake URL when there's nothing to verify
  });

  it("BUILD fails honestly (ok:false) when the builder returns null", async () => {
    const r = await makeRealExecutor({ ...deps, build: async () => null })(inst, task("build", "engineering"), "");
    expect(r.ok).toBe(false);
  });

  it("drives the FULL org DAG with real work: completes, and outbound acts still escalate to the desk", async () => {
    const out = await runSupervisedGoal("a focus app for students", { ...opts(), operate: true, execute: makeRealExecutor(deps) });
    expect(out.failed).toEqual([]);
    expect(out.completed).toContain("build");
    expect(out.completed).toContain("verify");
    // Nothing outbound auto-fired — launch/announce/etc. still land on the founder's desk as before.
    expect(out.packets.length).toBeGreaterThan(0);
    expect(out.packets.some((p) => p.kind === "approve_publish")).toBe(true);
  });
});
