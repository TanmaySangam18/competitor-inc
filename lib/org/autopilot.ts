// ─────────────────────────────────────────────────────────────────────────────
// BLOCK 1 — AUTOPILOT GOVERNANCE FLIP
//
// Founder mandate ([[autonomous-execution-mandate]]): kill "draft → you click approve → you send." The
// default becomes STANDING AUTHORIZATION — agents act unattended — and only a small set of
// high-consequence classes ever wait for the founder. This is NOT a loosening of safety: the forbidden
// floor, the kill switch, the per-agent NEVER cells, and the spend caps all still bind. It only flips the
// DEFAULT for the ordinary, reversible, observable work (outreach, posts, builds, in-cap spend) from
// "wait for a click" to "go."
//
// Additive by design: it reuses policy.ts (decide's building blocks) but does NOT change POLICY or the
// existing decide()/governApprovals behavior any current caller depends on. New surface, proven core.
// ─────────────────────────────────────────────────────────────────────────────

import { POLICY, withinCaps, type Policy, type ActionContext } from "@/lib/engine/policy";
import type { AgentRole } from "@/lib/engine/types";
import { getRole } from "./organization";

export type ActionMode = "auto" | "queue" | "block";

export interface AutopilotDecision {
  mode: ActionMode;
  reason: string;
}

// The standing-authorization boundary. Every action class NOT in this set runs unattended (under caps +
// the kill switch + the forbidden floor). These stay gated to the founder no matter which agent proposes
// them — they mirror the roles' `humanApprovalFor` and the Charter's irreducible-human floor:
//   money leaving the company · destructive/irreversible acts · binding signatures · price changes ·
//   shipping a customer's product to production.
export const FOUNDER_GATED_KINDS: ReadonlySet<string> = new Set([
  "payments", "payout", "refund", "money", "wire",
  "delete",
  "sign", "contract", "partnership",
  "pricing",
  "prod-deploy",
]);

const block = (reason: string): AutopilotDecision => ({ mode: "block", reason });
const queue = (reason: string): AutopilotDecision => ({ mode: "queue", reason });
const auto = (reason: string): AutopilotDecision => ({ mode: "auto", reason });

// The autopilot posture for a single proposed action. Order matters: the hard floors first, then the
// founder-gated classes, then caps, then — by default — GO.
export function autopilotMode(ctx: ActionContext, policy: Policy = POLICY): AutopilotDecision {
  // Hard floors — identical to decide(): the kill switch and the forbidden set are absolute.
  if (policy.spend.killSwitch) return block("kill switch engaged — all actions halted");
  if (policy.forbiddenActions.has(ctx.type)) return block("forbidden by policy");

  // Per-agent NEVER cell still blocks (a role acting outside its remit).
  const bucket = policy.matrix[ctx.agent]?.[ctx.type as keyof (typeof policy.matrix)[AgentRole]];
  if (bucket === "NEVER") return block(`not permitted for the ${ctx.agent} agent`);

  // High-consequence classes always wait for the founder — the whole point of the honesty floor.
  if (FOUNDER_GATED_KINDS.has(ctx.type)) return queue("high-consequence — founder sign-off required");

  // Spend runs unattended only inside every cap; over a cap it escalates rather than blocks.
  if (ctx.type === "spend" && !withinCaps(ctx, policy)) return queue("exceeds a spend cap — escalating");

  // Everything else: pre-authorized. This is the flip — the default is GO, not WAIT.
  return auto("pre-authorized — runs under standing authorization, caps, and the kill switch");
}

// Resolve the autopilot decision for a specific ORG ROLE proposing an action (uses the role's execFn as
// the policy agent). Unknown role → treat as its raw agent via ctx.agent.
export function roleAutopilotMode(
  roleId: string,
  action: Omit<ActionContext, "agent"> & { agent?: AgentRole },
  policy: Policy = POLICY,
): AutopilotDecision {
  const role = getRole(roleId);
  const agent = role?.execFn ?? action.agent ?? "ops";
  return autopilotMode({ ...action, agent }, policy);
}

// Partition a batch of proposed actions into what runs now vs what waits vs what's refused — the shape
// the shift + the Approval Inbox consume. `auto` executes under standing authorization; `queue` is the
// (now much smaller) founder inbox; `blocked` is dropped + logged.
export interface PartitionedActions<T> {
  auto: T[];
  queue: T[];
  blocked: T[];
}

export function partitionActions<T>(
  items: T[],
  toCtx: (item: T) => ActionContext,
  policy: Policy = POLICY,
): PartitionedActions<T> {
  const out: PartitionedActions<T> = { auto: [], queue: [], blocked: [] };
  for (const item of items) {
    const d = autopilotMode(toCtx(item), policy);
    (d.mode === "auto" ? out.auto : d.mode === "queue" ? out.queue : out.blocked).push(item);
  }
  return out;
}
