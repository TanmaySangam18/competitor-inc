// Operating Policy & Enforcement Engine — the deterministic rule every real action passes through.
//
// The Autonomy Audit found WHERE the line is. This makes the machine HOLD it: "is this risky?" stops
// being a judgment call and becomes a rule. Every proposed action runs through decide() and gets one of
// three verdicts — AUTO (run unattended), QUEUE (park in the Approval Inbox for a human), or BLOCK
// (refuse and log). AUTO requires passing ALL FIVE gates; forbidden actions never run even if every
// gate is green.
//
// Pure + deterministic on purpose (no I/O, no secrets) so it's unit-tested and reused everywhere — the
// engine can classify proposals with it, and /api/execute enforces it before any executor fires.

import type { AgentRole, ApprovalItem } from "./types";

// Real-world executor actions the system can actually dispatch (see lib/engine/execution.ts runAction).
export type ExecAction = "build" | "deploy" | "outreach" | "spend" | "payments" | "bluesky" | "mastodon" | "delete" | "mcp_read";

export type Bucket = "AUTO" | "APPROVE" | "NEVER"; // a cell in the per-agent matrix
export type Verdict = "AUTO" | "QUEUE" | "BLOCK"; // decide()'s output

// The risk tier every action is scored into (REQUIREMENTS §1). T0 cheap+reversible → auto · T1 moderate →
// auto+log · T2 significant → async human approval · T3 irreversible → hard block until a human signs off.
export type Tier = "T0" | "T1" | "T2" | "T3";

// The events the Glass Box reacts to in real time (not just logs) — see lib/engine/alerts.ts.
export type AlertEvent = "cap_breach" | "failure" | "forbidden_attempt";

export interface PolicyDecision {
  verdict: Verdict;
  reason: string;
}

export interface Policy {
  version: number;
  defaultDecision: Bucket; // (agent, action) not in the matrix → this. APPROVE = "ask a human", never auto.
  spend: {
    perTransactionCapUsd: number;
    dailyCapUsd: number;
    monthlyCapUsd: number;
    killSwitch: boolean; // one switch halts ALL real actions instantly
  };
  // The hard floor — these never run, even with approval and every gate green.
  forbiddenActions: ReadonlySet<string>;
  gates: {
    requireCredential: boolean;
    requireCompliance: boolean;
    requireWithinCaps: boolean;
    requireObservable: boolean;
    requireReversible: boolean;
  };
  // Per-agent powers over executor actions. AUTO is "think, draft, test in safe sandboxes" (handled in
  // the engine, never here) — so every real executor action is APPROVE (touches real money/people/
  // production) or NEVER (out of the agent's lane). Tune to taste; start strict.
  matrix: Record<AgentRole, Partial<Record<ExecAction, Bucket>>>;
  // Per-channel rules (compliance + whether the channel may ever fire without a human).
  channels: {
    email: { allowed: "opted_in_only" | "any"; compliance: string[]; autoSend: boolean };
    ads: { allowedAccounts: "connected_only" | "any"; autoLaunch: boolean };
    social: { massDm: "forbidden" | "allowed"; autoPost: boolean };
    // The PLATFORM's own marketing accounts (build-in-public). Distinct from customer channels: posting
    // verified milestones on competitor.inc's own Bluesky/Mastodon is a standing, policy-visible yes —
    // not a bypass. Still honesty-gated upstream (only verified milestones) + halted by the kill switch.
    platformMarketing: { autoPost: boolean };
  };
  // What the system does on its own when something breaks while you're asleep. NOTE: for side-effecting
  // POSTs (email/spend/deploy) we deliberately do NOT blind-retry (double-send risk) — apiDown is handled
  // as alert+pause. agentLoop applies once an agentic step-loop exists (today shifts are a single call).
  failurePolicy: {
    apiDown: { retries: number; backoff: "exponential" | "linear"; then: "alert_and_pause" };
    agentLoop: { maxSteps: number; onExceed: "halt_and_alert" };
    badOutput: { requireValidation: boolean; onFail: "rollback_and_queue" };
  };
  // The Glass Box made ACTIVE — log everything, and alert in real time on the events that matter.
  observability: {
    logEveryAction: boolean;
    alertChannel: "required" | "optional";
    realTimeAlertsOn: AlertEvent[];
  };
  // Promote-on-evidence: an APPROVE action earns AUTO only after running clean for this many nights.
  rollout: { promoteAfterCleanNights: number };
  // The tier rubric (REQUIREMENTS §1). Owned by the Risk Scoring Officer role; every change is Tier 3.
  tiers: {
    t3SpendUsd: number; // spend at/above this is ALWAYS T3 (human sign-off), regardless of caps
    alwaysT3: ReadonlySet<string>; // action classes that are always irreversible/high-consequence
  };
}

// ── The policy config — the knobs you'll actually argue about (and that's the point) ──────────────
// These values make "how autonomous are we?" a number you set, not a vibe. Start strict; widen on
// evidence (see the rollout note at the bottom of this file).
export const POLICY: Policy = {
  version: 1,
  defaultDecision: "APPROVE",
  spend: {
    perTransactionCapUsd: 50,
    dailyCapUsd: 200,
    monthlyCapUsd: 2000,
    killSwitch: false,
  },
  forbiddenActions: new Set([
    "move_funds_out",
    "sign_contract",
    "delete_production_data",
    "disable_security_control",
    "email_unconsented_list",
    "mass_automated_dm",
  ]),
  gates: {
    requireCredential: true,
    requireCompliance: true,
    requireWithinCaps: true,
    requireObservable: true,
    requireReversible: true,
  },
  matrix: {
    // CEO — watches the money. May set up payments + approve ad budget; never ships or posts.
    ceo: { spend: "APPROVE", payments: "APPROVE", build: "NEVER", deploy: "NEVER", outreach: "NEVER", bluesky: "NEVER", mastodon: "NEVER", delete: "NEVER" },
    // Engineer — ships. May build + deploy (with sign-off); never touches money or public channels.
    engineering: { build: "APPROVE", deploy: "APPROVE", mcp_read: "AUTO", spend: "NEVER", payments: "NEVER", outreach: "NEVER", bluesky: "NEVER", mastodon: "NEVER", delete: "NEVER" },
    // Marketer — finds customers. Owns outreach, ad spend, and social; never ships or moves money out.
    marketing: { outreach: "APPROVE", spend: "APPROVE", bluesky: "APPROVE", mastodon: "APPROVE", build: "NEVER", deploy: "NEVER", payments: "NEVER", delete: "NEVER" },
    // Support — helps users. May send approved replies; never spends, ships, or posts publicly.
    support: { outreach: "APPROVE", build: "NEVER", deploy: "NEVER", spend: "NEVER", payments: "NEVER", bluesky: "NEVER", mastodon: "NEVER", delete: "NEVER" },
    // Growth — spots opportunities. May run experiments (spend/social/payments) with sign-off; never ships.
    growth: { spend: "APPROVE", payments: "APPROVE", bluesky: "APPROVE", mastodon: "APPROVE", mcp_read: "AUTO", build: "NEVER", deploy: "NEVER", outreach: "NEVER", delete: "NEVER" },
    // Manufacturing (dynamic-crew role) — runs ops & supply. May propose spend with sign-off; never ships code or posts.
    manufacturing: { spend: "APPROVE", build: "NEVER", deploy: "NEVER", payments: "NEVER", outreach: "NEVER", bluesky: "NEVER", mastodon: "NEVER", delete: "NEVER" },
    // Finance — prepares the money act; the HUMAN moves money. May propose spend for sign-off; never touches payment rails.
    finance: { spend: "APPROVE", payments: "NEVER", build: "NEVER", deploy: "NEVER", outreach: "NEVER", bluesky: "NEVER", mastodon: "NEVER", delete: "NEVER" },
    // Legal — drafts + prepares only. Nothing legal auto-fires; every act routes to the human spine.
    legal: { spend: "NEVER", payments: "NEVER", build: "NEVER", deploy: "NEVER", outreach: "NEVER", bluesky: "NEVER", mastodon: "NEVER", delete: "NEVER" },
    // Ops — runs internal process & vendors. May propose spend/vendor commitments with sign-off; never ships or posts.
    ops: { spend: "APPROVE", mcp_read: "AUTO", payments: "NEVER", build: "NEVER", deploy: "NEVER", outreach: "NEVER", bluesky: "NEVER", mastodon: "NEVER", delete: "NEVER" },
  },
  channels: {
    email: { allowed: "opted_in_only", compliance: ["unsubscribe_link", "sender_identity", "consent_basis"], autoSend: false },
    ads: { allowedAccounts: "connected_only", autoLaunch: false },
    social: { massDm: "forbidden", autoPost: false },
    platformMarketing: { autoPost: true },
  },
  failurePolicy: {
    apiDown: { retries: 3, backoff: "exponential", then: "alert_and_pause" },
    agentLoop: { maxSteps: 25, onExceed: "halt_and_alert" },
    badOutput: { requireValidation: true, onFail: "rollback_and_queue" },
  },
  observability: {
    logEveryAction: true,
    alertChannel: "required",
    realTimeAlertsOn: ["cap_breach", "failure", "forbidden_attempt"],
  },
  rollout: { promoteAfterCleanNights: 14 },
  tiers: {
    t3SpendUsd: 500,
    // Always Tier 3 (REQUIREMENTS §1): production deploys to paying customers, data deletion, money
    // movement, contract/ToS acceptance, disabling a security control, and any PUBLIC statement.
    alwaysT3: new Set<string>([
      "deploy", "delete", "payments", "move_funds_out", "sign_contract", "sign_tos",
      "disable_security_control", "bluesky", "mastodon", "publish_public", "legal_statement",
    ]),
  },
};

// What we know about a proposed action at decision time. Optional gate inputs default to the safe value
// for the kind of action: executor actions are APPROVE in the matrix, so they QUEUE before the gates
// 3–5 even matter — those gates only ever gate an AUTO action.
export interface ActionContext {
  type: ExecAction | string;
  agent: AgentRole;
  amountUsd?: number; // for spend
  spentTodayUsd?: number; // running total, for the daily cap
  spentMonthUsd?: number; // running total, for the monthly cap
  hasCredential?: boolean; // Gate 1 — a scoped credential exists for this action
  compliancePass?: boolean; // Gate 2 — passes the channel's compliance checklist
  observable?: boolean; // Gate 4 — can be monitored in real time
  reversible?: boolean; // Gate 5 — can be undone in one step
}

// Gate 3 — bounded? Spend must sit under every cap (per-transaction, today, this month).
export function withinCaps(ctx: ActionContext, policy: Policy = POLICY): boolean {
  if (ctx.type !== "spend") return true; // only spend has dollar caps today
  const amt = ctx.amountUsd ?? 0;
  if (amt > policy.spend.perTransactionCapUsd) return false;
  if ((ctx.spentTodayUsd ?? 0) + amt > policy.spend.dailyCapUsd) return false;
  if ((ctx.spentMonthUsd ?? 0) + amt > policy.spend.monthlyCapUsd) return false;
  return true;
}

// The ABSOLUTE FLOOR — actions refused no matter what: the kill switch, the forbidden set, and a per-agent
// NEVER cell. Defined ONCE here and shared by decide() (below) and lib/org/autopilot.ts, so the safety
// floor can never drift between the two governance paths. (Uses the same `matrix ?? defaultDecision`
// fallback decide() has always used, so behavior is identical.)
export function absoluteBlock(ctx: ActionContext, policy: Policy = POLICY): string | null {
  if (policy.spend.killSwitch) return "kill switch engaged — all actions halted";
  if (policy.forbiddenActions.has(ctx.type)) return "forbidden by policy";
  const bucket = policy.matrix[ctx.agent]?.[ctx.type as ExecAction] ?? policy.defaultDecision;
  if (bucket === "NEVER") return `not permitted for the ${ctx.agent} agent`;
  return null;
}

// The enforcement engine. One function, one verdict — the whole governance model.
export function decide(ctx: ActionContext, policy: Policy = POLICY): PolicyDecision {
  const block = (reason: string): PolicyDecision => ({ verdict: "BLOCK", reason });
  const queue = (reason: string): PolicyDecision => ({ verdict: "QUEUE", reason });

  // Hard floor (kill switch · forbidden · per-agent NEVER) — the one shared definition.
  const floored = absoluteBlock(ctx, policy);
  if (floored) return block(floored);

  // Gate 1 — Can it act? (a scoped credential exists)
  if (policy.gates.requireCredential && ctx.hasCredential === false) return block("no credential or scope for this action");
  // Gate 2 — Is it lawful? (passes the compliance gate)
  if (policy.gates.requireCompliance && ctx.compliancePass === false) return block("failed compliance gate");

  // Per-agent permission (NEVER already handled by the floor above).
  const bucket = policy.matrix[ctx.agent]?.[ctx.type as ExecAction] ?? policy.defaultDecision;
  if (bucket === "APPROVE") return queue("requires human approval");

  // bucket === AUTO — must still clear the remaining gates to run unattended.
  // Gate 3 — Bounded?
  if (policy.gates.requireWithinCaps && !withinCaps(ctx, policy)) return queue("exceeds a spend or reach limit");
  // Gate 4 — Observable?
  if (policy.gates.requireObservable && ctx.observable === false) return queue("can't be monitored in real time");
  // Gate 5 — Reversible?
  if (policy.gates.requireReversible && ctx.reversible === false) return queue("can't be undone");

  return { verdict: "AUTO", reason: "safe to run unattended" };
}

// ── THE RISK SCORER (REQUIREMENTS §1) ─────────────────────────────────────────
// Every action is scored into a tier by cost × reversibility × legal-exposure × blast-radius. Pure +
// deterministic, like decide(). Default-DENY: an unknown/novel action never scores below T2 (it escalates
// to a human by construction). The `alwaysT3` set forces the irreversible/high-consequence classes to T3
// no matter how cheap they look. Nothing may bypass this — govern() runs it on every action.
const TIER_RANK: Record<Tier, number> = { T0: 0, T1: 1, T2: 2, T3: 3 };
export function rankOfTier(t: Tier): number { return TIER_RANK[t]; }
const higher = (a: Tier, b: Tier): Tier => (TIER_RANK[a] >= TIER_RANK[b] ? a : b);

// Known action → its baseline tier before modifiers. Unknown → T2 (default-deny).
const BASE_TIER: Record<string, Tier> = {
  build: "T1",       // sandbox/staging engineering — reversible
  outreach: "T2",    // contacting a real person — significant
  spend: "T0",       // the dollar thresholds below drive spend's tier
  mcp_read: "T1",    // read-only pull from a CONNECTED external service (their own account) — reversible
  deploy: "T3", delete: "T3", payments: "T3", bluesky: "T3", mastodon: "T3",
  // NOTE: mcp writes ride as "mcp_call" — intentionally NOT here, so they land on the unknown→T2 QUEUE
  // path until a per-tool allowlist earns promotion (default-deny, promote-on-evidence).
};

export interface TierScore {
  tier: Tier;
  reason: string;
  factors: { cost: Tier; reversibility: Tier; class: Tier };
}

export function scoreTier(ctx: ActionContext, policy: Policy = POLICY): TierScore {
  // class factor — the action's inherent consequence.
  const known = ctx.type in BASE_TIER;
  const classTier: Tier = policy.tiers.alwaysT3.has(ctx.type) ? "T3" : (known ? BASE_TIER[ctx.type] : "T2");

  // cost factor — spend thresholds. At/above the T3 spend line it's a human sign-off regardless of caps.
  let costTier: Tier = "T0";
  if (ctx.type === "spend") {
    const amt = ctx.amountUsd ?? 0;
    costTier = amt >= policy.tiers.t3SpendUsd ? "T3" : amt > policy.spend.perTransactionCapUsd ? "T2" : amt > 0 ? "T1" : "T0";
  }

  // reversibility factor — anything that can't be undone is at least T2 (significant, needs a human).
  const reversibilityTier: Tier = ctx.reversible === false ? "T2" : "T0";

  const tier = [classTier, costTier, reversibilityTier].reduce(higher, "T0");
  const bits: string[] = [];
  if (policy.tiers.alwaysT3.has(ctx.type)) bits.push("irreversible/high-consequence class");
  if (!known && !policy.tiers.alwaysT3.has(ctx.type)) bits.push("novel action → default-deny to T2");
  if (ctx.type === "spend" && costTier === "T3") bits.push(`spend ≥ $${policy.tiers.t3SpendUsd}`);
  if (ctx.reversible === false) bits.push("not reversible");
  return { tier, reason: bits.length ? bits.join("; ") : `${ctx.type} baseline`, factors: { cost: costTier, reversibility: reversibilityTier, class: classTier } };
}

// Tier → the operating verdict. T0/T1 may run unattended; T2 queues for async approval; T3 hard-blocks
// until a synchronous human sign-off (surfaced as BLOCK — the execute path treats it as human-reserved).
export function tierToVerdict(tier: Tier): Verdict {
  return tier === "T3" ? "BLOCK" : tier === "T2" ? "QUEUE" : "AUTO";
}

// The reconciled governed verdict: the STRICTER of the per-agent policy (decide) and the risk tier. This is
// what govern() enforces — the scorer can only tighten, never loosen, what the matrix/gates already allow.
export interface GovernedDecision extends PolicyDecision { tier: Tier; tierReason: string; }
export function governedDecision(ctx: ActionContext, policy: Policy = POLICY): GovernedDecision {
  const d = decide(ctx, policy);
  const score = scoreTier(ctx, policy);
  const tierVerdict = tierToVerdict(score.tier);
  const order: Record<Verdict, number> = { AUTO: 0, QUEUE: 1, BLOCK: 2 };
  const verdict = order[d.verdict] >= order[tierVerdict] ? d.verdict : tierVerdict;
  const reason = verdict === d.verdict ? d.reason : `risk ${score.tier}: ${score.reason}`;
  return { verdict, reason, tier: score.tier, tierReason: score.reason };
}

export interface Refusal {
  reason: string;
  event: AlertEvent; // so the caller can raise the right real-time alert
}

// Execution-time guard for /api/execute. Runs AFTER the human-approval keystone (auth + ownership +
// approved item), so a QUEUE verdict here is fine — a human already signed off. This catches what a
// human sign-off must NOT be able to wave through: a BLOCK verdict (kill switch, forbidden, wrong
// agent → forbidden_attempt), and a hard spend ceiling enforced even on approved spend (cap_breach;
// start strict — raise the cap in POLICY to allow more). Returns a Refusal, or null to allow. (At
// execute time hasCredential/compliancePass are passed true, so the only BLOCKs reachable here are the
// governance ones, which is why every BLOCK maps to forbidden_attempt.)
export function executionRefusal(ctx: ActionContext, policy: Policy = POLICY): Refusal | null {
  const d = decide(ctx, policy);
  if (d.verdict === "BLOCK") return { reason: d.reason, event: "forbidden_attempt" };
  if (ctx.type === "spend") {
    const amt = ctx.amountUsd ?? 0;
    if (amt > policy.spend.perTransactionCapUsd) {
      return { reason: `spend $${amt} exceeds the $${policy.spend.perTransactionCapUsd} per-transaction cap`, event: "cap_breach" };
    }
  }
  return null;
}

// Govern an autonomous shift's PROPOSED approvals through decide(): drop any the policy BLOCKs (a
// forbidden action, an action not permitted for that agent, or the kill switch). Keeps the QUEUE items
// (consequential → needs a human). This applies the five-gate filter to the Approval Inbox itself,
// deterministically, on every nightly shift — so the autonomous loop can't even PROPOSE something the
// policy forbids (Operating Policy §1; closes Autonomy Audit System 3).
export function governApprovals(approvals: ApprovalItem[], policy: Policy = POLICY): ApprovalItem[] {
  return approvals.filter((a) => {
    const ctx: ActionContext = { type: a.kind, agent: a.agent, amountUsd: a.amount, hasCredential: true, compliancePass: true };
    return decide(ctx, policy).verdict !== "BLOCK";
  });
}

// Should this event page the founder right now? (observability.realTimeAlertsOn is the knob.)
export function shouldAlert(event: AlertEvent, policy: Policy = POLICY): boolean {
  return policy.observability.realTimeAlertsOn.includes(event);
}

// Promote-on-evidence (§5 rollout): an APPROVE action type earns AUTO only after running clean — approved
// every time, zero incidents — for promoteAfterCleanNights. Any incident resets eligibility. The
// forbidden floor is never promotable. Pure + deterministic; the night-by-night counting that feeds
// `record` is the remaining wiring (needs a per-action-type log).
export interface PromotionRecord {
  action: ExecAction | string;
  cleanNights: number; // consecutive nights approved-unchanged with no incident
  incidents: number;
}
export function promotionEligible(record: PromotionRecord, policy: Policy = POLICY): boolean {
  if (policy.forbiddenActions.has(record.action)) return false; // never promote the floor
  return record.incidents === 0 && record.cleanNights >= policy.rollout.promoteAfterCleanNights;
}

// Rollout (encoded as policy, not hope): start with defaultDecision APPROVE and an AUTO bucket of only
// read-only/staging actions (Level 2). Watch the Approval Inbox; when an action type runs clean for N
// nights — approved every time, zero incidents — promote it APPROVE → AUTO (Level 3). Never promote the
// forbiddenActions floor. You're not chasing Level 4 on money/legal/irreversible actions — that's the
// liability, not the prize.

// Receipts Campaign: may the platform auto-post its own verified-milestone marketing right now?
// One switch kills it with everything else; the flag makes the standing yes policy-visible.
export function platformMarketingAllowed(policy: Policy = POLICY): boolean {
  return !policy.spend.killSwitch && policy.channels.platformMarketing.autoPost;
}
