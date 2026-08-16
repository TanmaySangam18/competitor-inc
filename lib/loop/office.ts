// ─────────────────────────────────────────────────────────────────────────────
// THE SLACK OFFICE (Connect-First Reset §3) — channel-per-department, GOVERNED.
//
// "Slack is the office": agents deliberate in per-department channels 24/7; the human is @-mentioned ONLY
// on tier-gated decisions. This module is the one ROUTING + GOVERNANCE layer every loop posts through:
// dept → channel id from env (SLACK_CH_* with SLACK_LOOP_CHANNEL as the shared fallback), and EVERY post
// passes governAction (kill switch → decide()/tier floor → audit ledger) BEFORE any network I/O.
//
// Division of labor with the existing shelf capability (ADR-0002 — wire, don't duplicate):
//   · lib/org/slack-org.ts   = IDENTITY + COMPOSITION (agent titles, standups, org-chart channels). Kept.
//   · lib/engine/slack.ts    = the raw transport (postToSlack) — reused here as the default `post` dep.
//   · lib/loop/office.ts     = THIS: env-configured routing + the governance gate + the #decisions mirror.
//
// Keyless-safe: not connected (no channel env / no bot token) ⇒ honest "not connected" result, no
// governance theater, no network — the same posture as lib/core/mcp-connect.ts. Injectable deps (env,
// post fn, audit log, kill switch) ⇒ unit-tested fully offline.
// ─────────────────────────────────────────────────────────────────────────────

import { governAction, type GovernOptions } from "@/lib/core/govern";
import { postToSlack } from "@/lib/engine/slack";
import { rankOfTier, type Tier, type Verdict } from "@/lib/core/policy";
import type { AgentRole } from "@/lib/core/types";

export type Dept = "engineering" | "growth" | "sales" | "support" | "finance" | "decisions";

export interface DeptChannelSpec {
  dept: Dept;
  env: string; // the env var holding this department's Slack channel id
  agent: AgentRole; // the acting agent in the policy matrix — who "speaks" for this channel
  label: string; // human-readable channel name (docs + honest error messages)
}

// The office floor plan. Channel ids come from env (the customer's own workspace — BYOK holds); any
// department without its own channel falls back to SLACK_LOOP_CHANNEL (the loop digest channel the cron
// already uses), so a one-channel workspace still gets the whole story.
export const DEPT_CHANNELS: Record<Dept, DeptChannelSpec> = {
  engineering: { dept: "engineering", env: "SLACK_CH_ENG", agent: "engineering", label: "#eng" },
  growth: { dept: "growth", env: "SLACK_CH_GROWTH", agent: "growth", label: "#growth" },
  // No "sales" AgentRole exists — sales work executes under the marketing execFn (owns outreach in the
  // policy matrix; see EXECFN_DEPT in lib/org/slack-org.ts for the same convention).
  sales: { dept: "sales", env: "SLACK_CH_SALES", agent: "marketing", label: "#sales" },
  support: { dept: "support", env: "SLACK_CH_SUPPORT", agent: "support", label: "#support" },
  finance: { dept: "finance", env: "SLACK_CH_FINANCE", agent: "finance", label: "#finance" },
  // #decisions mirrors the queue — ops is the internal-process function, so it signs the mirror posts.
  decisions: { dept: "decisions", env: "SLACK_CH_DECISIONS", agent: "ops", label: "#decisions" },
};

export type Env = Record<string, string | undefined>;

/** The channel id a department posts to: its own env var, else the shared loop channel, else undefined. */
export function channelFor(dept: Dept, env: Env = process.env): string | undefined {
  return env[DEPT_CHANNELS[dept].env] || env.SLACK_LOOP_CHANNEL || undefined;
}

export interface OfficeDeps {
  env?: Env;
  post?: (channel: string, text: string) => Promise<void>; // transport — defaults to the real postToSlack
  govern?: GovernOptions; // injectable audit log + kill switch (tests run offline against fakes)
}

export type OfficeDelivery =
  | { delivered: true; channel: string; verdict: "AUTO" }
  | { delivered: false; reason: string; verdict?: Verdict }; // no verdict ⇒ not connected (governance never ran)

/**
 * Post to a department channel — the governed path every loop uses.
 * Order is the spine: (0) connected? honest no-op if not · (1) governAction BEFORE any network
 * (kill switch → policy floor → tier → audit) · (2) only an AUTO verdict reaches the transport.
 */
export async function postToDept(dept: Dept, text: string, deps: OfficeDeps = {}): Promise<OfficeDelivery> {
  const env = deps.env ?? process.env;
  const spec = DEPT_CHANNELS[dept];
  const channel = channelFor(dept, env);

  // (0) Keyless-safe: no channel or no bot token ⇒ nothing to govern, nothing fires. Honest reason.
  if (!channel || !env.SLACK_BOT_TOKEN) {
    return { delivered: false, reason: `slack not connected for ${spec.label} — set ${spec.env} (or SLACK_LOOP_CHANNEL) + SLACK_BOT_TOKEN` };
  }

  // (1) The spine: kill switch → decide() floor → tier scorer → audit ledger. Before ANY network.
  // reversible: the bot can chat.delete its own message ("reversible-ish" — the tier is T1, auto+log).
  const g = governAction(
    { type: "slack_post", agent: spec.agent, hasCredential: true, compliancePass: true, observable: true, reversible: true },
    { ...deps.govern, input: `${spec.label}: ${text.slice(0, 200)}` },
  );
  if (g.decision.verdict !== "AUTO") {
    return { delivered: false, reason: g.decision.reason, verdict: g.decision.verdict };
  }

  // (2) Transport — governed and audited, now (and only now) the network fires.
  const post = deps.post ?? postToSlack;
  await post(channel, text);
  return { delivered: true, channel, verdict: "AUTO" };
}

/**
 * How the office addresses the human. With SLACK_FOUNDER_MEMBER_ID set it's a real Slack ping (<@U…>);
 * without it, a plain "@founder" — visible but honest about not actually pinging anyone.
 */
export function founderMention(env: Env = process.env): string {
  const id = env.SLACK_FOUNDER_MEMBER_ID;
  return id ? `<@${id}>` : "@founder";
}

// A decision worth mirroring into #decisions: what it is, what tier the scorer gave it, what verdict the
// policy returned. Shaped to be fed straight from a GovernResult or a queued PreparedDecision.
export interface DecisionMirror {
  id: string;
  title: string;
  summary?: string;
  tier: Tier;
  verdict: Verdict;
}

/** The human is @-mentioned ONLY for T2+/queued items (Connect-First §3) — routine T0/T1 AUTO just logs. */
export function mentionNeeded(d: DecisionMirror): boolean {
  return d.verdict !== "AUTO" || rankOfTier(d.tier) >= rankOfTier("T2");
}

/** Pure renderer (tested without I/O): the one-glance #decisions line, mention appended only when owed. */
export function renderDecisionMirror(d: DecisionMirror, mention: string): string {
  const lines = [
    `[${d.tier} · ${d.verdict}] ${d.title} (decision ${d.id})`,
    d.summary ? d.summary : "",
    mentionNeeded(d) ? `${mention} — this one waits for you.` : "",
  ];
  return lines.filter(Boolean).join("\n");
}

/** Mirror a decision to #decisions. Same governed path; the @-mention rides only on T2+/queued items. */
export async function mirrorDecision(d: DecisionMirror, deps: OfficeDeps = {}): Promise<OfficeDelivery> {
  const env = deps.env ?? process.env;
  return postToDept("decisions", renderDecisionMirror(d, founderMention(env)), deps);
}
