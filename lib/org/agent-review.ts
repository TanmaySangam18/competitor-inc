// ─────────────────────────────────────────────────────────────────────────────
// lib/org/agent-review.ts — THE QUARTERLY AGENT REVIEW CYCLE (the People function for a
// software workforce of 56 governed agents).
//
// Data source: the real activity log via lib/engine/agent-performance.ts (successRateByAgent).
// Output: deterministic per-agent verdicts, a quarterly review artifact, and EnqueueInput
// escalations for lib/org/decision-queue.ts. Speaks the loop-engine vocabulary for objectives
// (evidence, never assertion; unknown is never met).
//
// Rails:
//  - HUMANS DECIDE PERSONNEL ACTIONS, even synthetic personnel: retire and retune verdicts are
//    RECOMMENDATIONS returned to the caller as decision-queue EnqueueInput values. Nothing here
//    applies anything automatically.
//  - Model-tier suggestions are strings only. modelForAgent (lib/engine/server.ts) keeps routing
//    exactly as configured until the founder approves and engineering applies a change.
//  - High-stakes roles are NEVER auto-downgraded to a cheaper tier, whatever the numbers say.
//  - HONESTY FLOOR: below minActivity the verdict is "insufficient-data", never a judgment on
//    thin evidence; unscored objectives read as unknown, never as met; empty inputs render
//    honest "none yet" lines. Founder-facing strings contain NO em-dashes.
//  - Pure functions, no I/O, deterministic. The rulebook is the RULES table below.
// ─────────────────────────────────────────────────────────────────────────────

import type { EnqueueInput } from "./decision-queue";

export type ModelTier = "haiku" | "sonnet" | "opus";
export type ReviewVerdictKind = "keep" | "retune" | "retire-recommend" | "insufficient-data";

export interface ReviewInput {
  agentId: string;
  role: string; // org role id, e.g. "finance-controller"
  successRate: number | null; // measured 0..1 over the quarter; null when no activity produced a rate
  activityCount: number;
  spendUsd: number;
  escalationsCaught?: number; // times the agent correctly escalated instead of acting
  notes?: string;
}

export interface ReviewVerdict {
  agentId: string;
  role: string;
  verdict: ReviewVerdictKind;
  rationale: string; // plain sentences citing the numbers; no em-dashes
  suggestedModelTier?: ModelTier; // a suggestion string only; routing never changes here
}

export interface ReviewOpts {
  minActivity?: number; // default 5: below this, insufficient-data (no judgment on thin evidence)
  highStakesRoles?: string[]; // roles that never get a cheaper-tier suggestion
  lowSpendUsd?: number; // default 5: at or under this, "low spend" for the cheaper-tier rule
}

// THE RULES (deterministic, in evaluation order — this table IS the policy):
//   1. activityCount < minActivity, or no measured successRate → insufficient-data
//   2. successRate < RETIRE_BELOW (with real volume, guaranteed by rule 1) → retire-recommend
//   3. RETIRE_BELOW ≤ successRate < KEEP_AT_OR_ABOVE → retune (suggest the opus tier: try a
//      stronger model before recommending retirement; an upgrade is allowed for every role)
//   4. successRate ≥ KEEP_AT_OR_ABOVE → keep; and when successRate ≥ CHEAPER_TIER_AT with
//      spendUsd ≤ lowSpendUsd, suggest the haiku tier UNLESS the role is high-stakes
const RETIRE_BELOW = 0.3;
const KEEP_AT_OR_ABOVE = 0.7;
const CHEAPER_TIER_AT = 0.9;

const pct = (r: number) => r.toFixed(2);

/** Review one quarter of agents. Pure, deterministic, rules documented above. */
export function reviewAgents(inputs: ReviewInput[], opts: ReviewOpts = {}): ReviewVerdict[] {
  const minActivity = opts.minActivity ?? 5;
  const lowSpend = opts.lowSpendUsd ?? 5;
  const highStakes = new Set(opts.highStakesRoles ?? []);

  return inputs.map((a): ReviewVerdict => {
    const base = { agentId: a.agentId, role: a.role };

    // Rule 1: no judgment on thin evidence.
    if (a.activityCount < minActivity || a.successRate === null) {
      const why =
        a.successRate === null
          ? `No measured success rate this quarter (${a.activityCount} activities recorded).`
          : `Only ${a.activityCount} activities this quarter, below the ${minActivity} needed to judge.`;
      return { ...base, verdict: "insufficient-data", rationale: `${why} No verdict on thin evidence.` };
    }

    const rate = a.successRate;

    // Rule 2: sustained failure at real volume.
    if (rate < RETIRE_BELOW) {
      return {
        ...base,
        verdict: "retire-recommend",
        rationale: `Success rate ${pct(rate)} across ${a.activityCount} activities is below the ${RETIRE_BELOW} retirement threshold, with $${a.spendUsd.toFixed(2)} spent. Sustained failure at real volume. Recommending retirement, pending founder approval.`,
      };
    }

    // Rule 3: mid-band → retune, suggest a stronger tier first (upgrade, allowed for every role).
    if (rate < KEEP_AT_OR_ABOVE) {
      return {
        ...base,
        verdict: "retune",
        rationale: `Success rate ${pct(rate)} across ${a.activityCount} activities sits in the retune band (${RETIRE_BELOW} to ${KEEP_AT_OR_ABOVE}). Suggest retuning the role prompt and trying the opus tier before any stronger action, pending founder approval.`,
        suggestedModelTier: "opus",
      };
    }

    // Rule 4: keep; cheap-and-excellent may suggest a cheaper tier, high-stakes roles never downgrade.
    if (rate >= CHEAPER_TIER_AT && a.spendUsd <= lowSpend) {
      if (highStakes.has(a.role)) {
        return {
          ...base,
          verdict: "keep",
          rationale: `Success rate ${pct(rate)} across ${a.activityCount} activities with $${a.spendUsd.toFixed(2)} spent. Keep. ${a.role} is a high-stakes role, so no cheaper tier is suggested despite the strong, low-cost record.`,
        };
      }
      return {
        ...base,
        verdict: "keep",
        rationale: `Success rate ${pct(rate)} across ${a.activityCount} activities with only $${a.spendUsd.toFixed(2)} spent. The work succeeds cheaply, so the haiku tier may suffice. Keep, with a tier suggestion for the founder.`,
        suggestedModelTier: "haiku",
      };
    }
    return {
      ...base,
      verdict: "keep",
      rationale: `Success rate ${pct(rate)} across ${a.activityCount} activities with $${a.spendUsd.toFixed(2)} spent. Keep.`,
    };
  });
}

/** The quarterly review doc (markdown): distribution, per-agent table, personnel actions PENDING FOUNDER APPROVAL. */
export function reviewCycleArtifact(verdicts: ReviewVerdict[], quarterLabel: string): string {
  const head = [`# Agent Review Cycle: ${quarterLabel}`, ""];

  if (verdicts.length === 0) {
    return [...head, "No agents reviewed yet. No activity data was available for this quarter."].join("\n");
  }

  const count = (k: ReviewVerdictKind) => verdicts.filter((v) => v.verdict === k).length;
  const summary = `Reviewed ${verdicts.length} agents: ${count("keep")} keep, ${count("retune")} retune, ${count("retire-recommend")} retire-recommend, ${count("insufficient-data")} insufficient-data.`;

  const table = [
    "| Agent | Role | Verdict | Suggested tier | Rationale |",
    "| --- | --- | --- | --- | --- |",
    ...verdicts.map(
      (v) => `| ${v.agentId} | ${v.role} | ${v.verdict} | ${v.suggestedModelTier ?? "none"} | ${v.rationale} |`,
    ),
  ];

  const actions = verdicts.filter((v) => v.verdict === "retire-recommend" || v.verdict === "retune");
  const actionLines =
    actions.length === 0
      ? ["No personnel actions proposed this quarter."]
      : [
          "Every item below is a recommendation only. Nothing changes until the founder approves.",
          "",
          ...actions.map(
            (v) =>
              `- ${v.verdict === "retire-recommend" ? "RETIRE" : "RETUNE"} ${v.agentId} (${v.role}): ${v.rationale} PENDING FOUNDER APPROVAL.`,
          ),
        ];

  return [
    ...head,
    summary,
    "",
    "## Per-agent verdicts",
    ...table,
    "",
    "## Personnel actions",
    ...actionLines,
  ].join("\n");
}

/**
 * Every retire-recommend and retune becomes a decision-queue item for the human founder.
 * Returned to the caller, never applied: humans decide personnel actions, even synthetic personnel.
 */
export function escalations(verdicts: ReviewVerdict[]): EnqueueInput[] {
  return verdicts
    .filter((v) => v.verdict === "retire-recommend" || v.verdict === "retune")
    .map((v): EnqueueInput => {
      const retire = v.verdict === "retire-recommend";
      return {
        kind: retire ? "fire" : "policy_change",
        title: retire ? `Retire agent ${v.agentId} (${v.role})` : `Retune agent ${v.agentId} (${v.role})`,
        summary: `${v.rationale} This is a recommendation from the quarterly agent review. Personnel actions on agents require founder approval.`,
        artifact: [
          `${retire ? "RETIRE" : "RETUNE"} RECOMMENDATION: ${v.agentId} (${v.role})`,
          "",
          `Rationale: ${v.rationale}`,
          v.suggestedModelTier ? `Suggested model tier: ${v.suggestedModelTier} (a suggestion only; routing stays as configured until approved and applied).` : "",
          "",
          "Prepared by the quarterly agent review cycle. Nothing has been changed. Approving this item authorizes the change; it does not execute it.",
        ]
          .filter(Boolean)
          .join("\n"),
        preparedBy: "chief-of-staff",
      };
    });
}

/** True on the first Monday of Jan/Apr/Jul/Oct (UTC). The daily cron tick calls this with today. */
export function isReviewDay(d: Date): boolean {
  const m = d.getUTCMonth();
  if (m !== 0 && m !== 3 && m !== 6 && m !== 9) return false;
  return d.getUTCDay() === 1 && d.getUTCDate() <= 7;
}

export interface QuarterObjective {
  id: string;
  statement: string;
  evidence: string[]; // recorded evidence lines; the loop-engine vocabulary (evidence, never assertion)
  met: boolean | null; // null = unscored (unknown is never met)
}

/** The quarterly OKR-style retro artifact. Unscored objectives read as unknown, never as met. */
export function scoreObjectives(objectives: QuarterObjective[], quarterLabel: string): string {
  const head = [`# Quarterly objectives retro: ${quarterLabel}`, ""];

  if (objectives.length === 0) {
    return [...head, "No objectives were recorded for this quarter yet."].join("\n");
  }

  const met = objectives.filter((o) => o.met === true).length;
  const missed = objectives.filter((o) => o.met === false).length;
  const unscored = objectives.filter((o) => o.met === null).length;

  const lines = objectives.map((o) => {
    if (o.met === null) {
      return `- UNSCORED [${o.id}]: ${o.statement}. No evidence recorded, scored as unknown, not as met.`;
    }
    if (o.met === false) {
      return `- MISSED [${o.id}]: ${o.statement} (${o.evidence.length} evidence ${o.evidence.length === 1 ? "item" : "items"} recorded).`;
    }
    // met === true; a met claim with zero evidence is flagged, never quietly accepted (honesty floor).
    return o.evidence.length === 0
      ? `- MET (unverified) [${o.id}]: ${o.statement}. Marked met but no evidence was recorded. Treat as a claim, not a verified result.`
      : `- MET [${o.id}]: ${o.statement} (${o.evidence.length} evidence ${o.evidence.length === 1 ? "item" : "items"}).`;
  });

  return [
    ...head,
    `${objectives.length} objectives: ${met} met, ${missed} missed, ${unscored} unscored.`,
    "",
    ...lines,
  ].join("\n");
}
