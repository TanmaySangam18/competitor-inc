// Orchestrator — the convenience layer that turns a GOAL into a running agent org: decompose → run the
// supervisor. Default execution is the deterministic SIMULATED path (keyless, $0, matches the product's
// offline ethos); a model-backed/OpenHands `execute` is injected in Phase B. Pure + testable.

import type { AgentRole, Proof } from "./types";
import { type AgentTask, type TaskAction } from "./task-queue";
import { runSupervisor, type ExecuteFn, type SupervisorOutcome, type TaskResult } from "./supervisor";
import { type AgentInstance } from "./agent-lifecycle";
import { preparePacket, type SpineActKind } from "./accountability-spine";
import { buildOrgPlan, renderOrgChain } from "./org-plan";

// Every function that applies to any company. Manufacturing is intentionally omitted (physical-product
// only). finance/legal/ops run in the operate phase (drafts → your desk). Governance keeps them safe.
const DEFAULT_ROLES: AgentRole[] = ["ceo", "engineering", "support", "marketing", "growth", "finance", "legal", "ops"];

type Step = { id: string; role: AgentRole; verb: string; priority: number };

// Phase A/B core pipeline: plan → build → verify → launch. Phase D (operate=true) appends the ONGOING
// company functions — announce (GTM) / retain (growth) / care (support) — which run AFTER launch and
// produce drafts for the founder's desk. Tasks whose role isn't in the crew are skipped.
export function decomposeGoal(goal: string, roles: AgentRole[] = DEFAULT_ROLES, opts?: { operate?: boolean }): AgentTask[] {
  const core: Step[] = (
    [
      { id: "plan", role: "ceo", verb: "Plan", priority: 9 },
      { id: "build", role: "engineering", verb: "Build", priority: 8 },
      { id: "verify", role: "support", verb: "Verify", priority: 7 },
      { id: "launch", role: "marketing", verb: "Launch", priority: 6 },
    ] as Step[]
  ).filter((s) => roles.includes(s.role));

  const tasks: AgentTask[] = [];
  let prev: string | null = null;
  for (const s of core) {
    tasks.push({ id: s.id, goal: `${s.verb}: ${goal}`, role: s.role, blockingOn: prev ? [prev] : [], priority: s.priority });
    prev = s.id;
  }

  if (opts?.operate && prev) {
    const lastCore = prev;
    const ops: Step[] = (
      [
        { id: "announce", role: "marketing", verb: "Announce", priority: 5 },
        { id: "retain", role: "growth", verb: "Build a retention loop for", priority: 4 },
        { id: "care", role: "support", verb: "Prepare support for", priority: 3 },
        // Back-office functions — each DRAFTS its work and routes the irreducible act to your desk.
        { id: "budget", role: "finance", verb: "Prepare the budget + unit economics for", priority: 5 },
        { id: "comply", role: "legal", verb: "Draft the terms, privacy, and compliance for", priority: 4 },
        { id: "process", role: "ops", verb: "Set up operations and vendors for", priority: 3 },
      ] as Step[]
    ).filter((s) => roles.includes(s.role));
    for (const s of ops) {
      tasks.push({ id: s.id, goal: `${s.verb}: ${goal}`, role: s.role, blockingOn: [lastCore], priority: s.priority });
    }
  }
  return tasks;
}

// The independent verifier for a producer — never the producer itself (generator/evaluator separation).
function verifierFor(producer: AgentRole): AgentRole {
  return producer === "support" ? "ceo" : "support";
}

// Which tasks produce something for the human's desk (a spend to fund, or a draft to approve before it
// goes out). The org prepares everything; the human just says yes. Nothing outbound auto-fires.
const DESK: Record<string, { kind: SpineActKind; title: string; action: string }> = {
  launch: { kind: "move_money", title: "Fund launch budget", action: "Review and approve the launch spend on your own rail" },
  announce: { kind: "approve_publish", title: "Approve the launch post", action: "Review the drafted post, then approve to publish" },
  retain: { kind: "approve_outreach", title: "Approve the referral email", action: "Review the drafted email, then approve to send" },
  care: { kind: "approve_support", title: "Approve support replies", action: "Review the drafted macros, then approve to enable" },
  // Back-office desk items — irreducible human acts (finance/legal/ops prepare 100%, you execute the last step).
  budget: { kind: "move_money", title: "Approve the budget", action: "Review the prepared budget + unit economics, then approve the spend on your own rail" },
  comply: { kind: "sign_contract", title: "Review and sign the terms", action: "Review the drafted terms / privacy / compliance, then sign — only a human can" },
  process: { kind: "vendor_review", title: "Approve the vendor / process change", action: "Review the prepared vendor + process change, then approve" },
};

// Deterministic simulated execution: honest self-describing (metric) proof, a small real spend, an
// independent verifier, and — for spend/outbound steps — a prepared item escalated to the human's desk.
export const simulatedExecute: ExecuteFn = (inst: AgentInstance, task: AgentTask): TaskResult => {
  const proof: Proof = { kind: "metric", value: `simulated — ${task.goal}` };
  const res: TaskResult = { ok: true, spentCents: 25, proof, verifierRole: verifierFor(task.role), verifierOrgRoleId: task.verifierOrgRoleId };
  // Carry the hierarchy's context down the chain (org plan sets handoffTo) so even the keyless demo shows
  // the real IC→lead→exec flow, not a flat list.
  if (task.handoffTo) {
    res.handoffTo = task.handoffTo;
    res.handoffContext = `simulated handoff · ${task.id}`;
  }
  // Org tasks carry their own gate explicitly; only the LEGACY flat plan uses the id→desk map (an org task
  // must never inherit a legacy gate just because its id happens to collide, e.g. "care").
  const desk = task.deskAct ?? (task.orgRoleId ? undefined : DESK[task.id]);
  if (desk) {
    res.gatedActs = [
      preparePacket({
        id: `${inst.id}-${task.id}`,
        kind: desk.kind,
        title: desk.title,
        summary: task.goal,
        preparedBy: task.role,
        actionRequired: desk.action,
        now: inst.createdAt,
      }),
    ];
  }
  return res;
};

// ── REAL executor (Phase 2: flip simulated → real) ───────────────────────────
// Deps are INJECTED (the real model caller, the full-stack build, the URL verifier) so this stays pure +
// unit-testable and free of an execution.ts/server.ts import cycle; the API route wires the live deps.
// Per task it does actual work: the CEO plans, Engineering BUILDS a real app, Support VERIFIES it resolves
// (verify-before-done), and every other role DRAFTS its artifact + escalates the irreducible act to the
// founder's desk (never auto-fires). Handoffs pass real context down the DAG (plan→build→verify).
export interface RealExecutorDeps {
  plan: (goal: string) => Promise<string>; // CEO writes the spec
  build: (goal: string, plan?: string) => Promise<{ url?: string; repo?: string; note: string } | null>; // real full-stack build
  verify: (url: string) => Promise<boolean>; // HEAD-verify the built artifact resolves
  draft: (role: AgentRole, goal: string) => Promise<string>; // a role drafts its deliverable
}

// Legacy flat-plan id → action + successor, so the pre-org callers behave EXACTLY as before (org tasks
// carry these explicitly on the task instead).
const LEGACY_ACTION: Record<string, TaskAction> = { plan: "plan", build: "build", verify: "verify" };
const LEGACY_HANDOFF: Record<string, string> = { plan: "build", build: "verify" };

export function makeRealExecutor(deps: RealExecutorDeps): ExecuteFn {
  return async (inst: AgentInstance, task: AgentTask, inbound?: string): Promise<TaskResult> => {
    // Attribution: the independent verifier is the task's org verifier when present (org-role granularity;
    // the supervisor's honesty check uses it), else the engine-role separation.
    const base = { verifierRole: verifierFor(task.role), verifierOrgRoleId: task.verifierOrgRoleId };
    // Org tasks carry their own gate explicitly; only the LEGACY flat plan uses the id→desk map.
    const desk = task.deskAct ?? (task.orgRoleId ? undefined : DESK[task.id]);
    const gatedActs = desk
      ? [preparePacket({ id: `${inst.id}-${task.id}`, kind: desk.kind, title: desk.title, summary: task.goal, preparedBy: task.role, actionRequired: desk.action, now: inst.createdAt })]
      : undefined;
    const action: TaskAction = task.action ?? LEGACY_ACTION[task.id] ?? "draft";
    const handoffTo = task.handoffTo ?? LEGACY_HANDOFF[task.id];
    const handoff = (context: string): Partial<TaskResult> => (handoffTo ? { handoffTo, handoffContext: context } : {});

    // PLAN / SPEC — produce a real spec, hand it down the chain (CEO brief → PM spec → the builder).
    if (action === "plan") {
      const spec = await deps.plan(task.goal).catch(() => "");
      return { ok: true, spentCents: 40, proof: { kind: "metric", value: spec ? "spec written" : "planning" }, ...base, ...handoff(spec.slice(0, 2000)) };
    }
    // BUILD — the task that ships real code (full-stack repo + deploy). Hands the artifact up the chain.
    if (action === "build") {
      const b = await deps.build(task.goal, inbound).catch(() => null);
      if (!b) return { ok: false, spentCents: 0, ...base };
      const proof: Proof = b.url ? { kind: "url", value: b.url } : { kind: "metric", value: b.note };
      // Carry the created repo out so the run can surface it and the client can poll the async live URL.
      return { ok: true, spentCents: 300, proof, ...base, ...(b.repo ? { repo: b.repo } : {}), ...handoff(b.url || b.repo || "") };
    }
    // VERIFY / REVIEW / SIGN-OFF — HEAD-check the built artifact resolves; pass it further up the chain so
    // the reviewer above checks the same real thing. Never a fabricated URL when there's nothing live yet.
    if (action === "verify") {
      const url = (inbound || "").trim();
      const live = /^https:\/\//.test(url) ? await deps.verify(url).catch(() => false) : false;
      return {
        ok: true,
        spentCents: 20,
        proof: live ? { kind: "url", value: url } : { kind: "metric", value: url ? "artifact deploying — not live yet" : "nothing to verify yet" },
        ...base,
        ...handoff(url),
      };
    }
    // DRAFT — the role prepares its deliverable; consequential ones escalate to the founder's desk.
    const drafted = await deps.draft(task.role, task.goal).catch(() => "");
    const res: TaskResult = { ok: true, spentCents: 30, proof: { kind: "metric", value: drafted ? `${task.role} draft ready` : `${task.role} prepared` }, ...base, ...handoff(drafted.slice(0, 500)) };
    if (gatedActs) res.gatedActs = gatedActs;
    return res;
  };
}

export interface RunGoalOptions {
  roles?: AgentRole[];
  modelForRole: (role: AgentRole) => string;
  makeId: () => string;
  execute?: ExecuteFn; // Phase B injects a model-backed / OpenHands executor
  operate?: boolean; // Phase D: also run the ongoing GTM/support functions (drafts → your desk)
  orgPlan?: boolean; // Phase 2: decompose via the real org chart (IC→lead→exec) instead of the flat crew
  budgetCentsPerTask?: number;
  maxTaskRetries?: number; // per-task self-repair; the autonomous path defaults to 2 (still budget-bounded)
  now?: () => number;
}

export async function runSupervisedGoal(goal: string, opts: RunGoalOptions): Promise<SupervisorOutcome> {
  const tasks = opts.orgPlan
    ? buildOrgPlan(goal, { operate: opts.operate })
    : decomposeGoal(goal, opts.roles ?? DEFAULT_ROLES, { operate: opts.operate });
  const out = await runSupervisor(tasks, opts.execute ?? simulatedExecute, {
    modelForRole: opts.modelForRole,
    makeId: opts.makeId,
    budgetCentsPerTask: opts.budgetCentsPerTask ?? 5000,
    maxTaskRetries: opts.maxTaskRetries ?? 2,
    now: opts.now,
  });
  // Prepend the visible org chain to the Glass-Box log so the hierarchy — who did what, who it rolls up to,
  // what escalates to the founder — is legible, not just the spawn/verify trace.
  return opts.orgPlan ? { ...out, log: [...renderOrgChain(tasks).map((l) => `org · ${l}`), ...out.log] } : out;
}
