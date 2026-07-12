// lib/core/coordinate.ts — PHASE 2: the coordination loop, closed.
//
// One operation that ties the nervous system together: a GOAL → plan() breaks it into the org's
// IC→lead→sign-off chain → deliberate() convenes + governs EACH task → out comes a coordinated set of
// governed decisions (what proceeds under standing authorization vs. what escalates to the founder).
// Headless + keyless. Real model-reasoned stances arrive when a reasoner/key is wired (the connect phase);
// the whole run is honestly flagged `simulated` until then.

import { plan, type Plan } from "./plan";
import { deliberate, type DecisionRecord, type Reasoner } from "./deliberate";

export interface Coordination {
  goal: string;
  plan: Plan;
  decisions: DecisionRecord[]; // one governed decision per planned task
  summary: { tasks: number; proceed: number; escalate: number; simulated: boolean };
}

export async function coordinate(
  goal: string,
  opts: { operate?: boolean; reasoner?: Reasoner } = {},
): Promise<Coordination> {
  const g = (goal || "").trim();
  const p = plan(g, { operate: opts.operate });

  const decisions: DecisionRecord[] = [];
  for (const task of p.tasks) {
    decisions.push(await deliberate(task.goal, { reasoner: opts.reasoner }));
  }

  const escalate = decisions.filter((d) => d.decision === "escalate-to-founder").length;
  return {
    goal: g,
    plan: p,
    decisions,
    summary: {
      tasks: p.tasks.length,
      proceed: decisions.length - escalate,
      escalate,
      // real if every task's decision used real reasoning (injected reasoner or a live model key)
      simulated: decisions.length > 0 ? decisions.every((d) => d.simulated) : !opts.reasoner,
    },
  };
}
