// Operationalize the Organic Growth Engine as a repeatable nightly move.
// Each cycle the growth crew runs organicGrowthPlan(funnel, channels) and turns the constraint-matched
// content plan into (1) a Glass-Box activity that shows what the plan IS this night, and (2) ready-to-post
// content DRAFTS that land on the founder's desk — draft → approve → post. Nothing auto-posts; the human
// owns the publish. Pure + deterministic (no model call → $0, fully testable). This is the "crew runs it
// each cycle" promised in docs/PLAYBOOK-organic-growth.md, made real.

import type { ApprovalItem, ApprovalKind, Activity, Company } from "./types";
import type { FunnelSnapshot } from "./growth";
import { organicGrowthPlan, type ChannelInput, type OrganicPlan, type ContentTheme, type Constraint } from "./organic-growth";
import type { Channel } from "./attribution";

const uid = () => crypto.randomUUID();

// Where a theme's first organic channel maps in our approval/executor vocabulary. Social themes default to
// a "twitter" draft (the founder adapts the copy to IG/LinkedIn/etc. when they post); community → reddit.
function kindForChannel(ch: Channel | undefined): ApprovalKind {
  switch (ch) {
    case "organic-social": return "twitter";
    case "community": return "reddit";
    case "referral":
    case "email":
    default: return "outreach";
  }
}

// A ready-to-post skeleton for one theme, grounded in the brand + matched to the constraint. Honest: it's
// a DRAFT (bracketed blanks for the real specifics), never a fabricated claim or a fake number.
function draftBody(theme: ContentTheme, constraint: Constraint, company: Company): string {
  const name = company.name || "the brand";
  const idea = company.idea || "what we do";
  const url = company.product?.url ? `\n\n${company.product.url}` : "";
  const head = `THEME: ${theme.theme}\nFORMAT: ${theme.format}\nWHY THIS NOW: ${theme.why}\nSUGGESTED CHANNEL(S): ${theme.channels.join(", ")}\n\n--- draft (edit the [brackets], then post) ---\n\n`;

  switch (constraint) {
    case "traffic":
      return head +
        `Hook: [one sharp line about the problem your buyer of "${idea}" actually Googles].\n\n` +
        `Body: Here's the thing most people get wrong about [that problem] — [your genuine POV / the one tip].\n\n` +
        `Show, don't tell: [quick demo / example / before-state].\n\n` +
        `Soft CTA: Follow for more on [your niche]. ${name}.${url}`;
    case "conversion":
      return head +
        `Open with proof: [a real before/after, a real customer quote, or a real result — no invented numbers].\n\n` +
        `Make it concrete: "[Customer/you] had [specific problem]. After [using ${name}], [specific real change]."\n\n` +
        `Kill the objection: The #1 reason people hesitate is [X] — here's why that's handled: [honest answer].\n\n` +
        `CTA: If [specific problem] is you, ${name} is built for exactly that.${url}`;
    case "monetization":
      return head +
        `Make the offer plain: [what they get] for [price/first-order incentive]. No fluff.\n\n` +
        `Real reason to act now: [genuine launch / limited run / seasonal — nothing fabricated].\n\n` +
        `Reduce risk: [guarantee / easy start / what happens after they buy].\n\n` +
        `CTA: [clear next step].${url}`;
    default:
      return head +
        `Before you post at scale: install the pixel + tag this link with utm_source=[platform] so we can see ` +
        `what actually converts. Starter post: [one helpful thing about ${idea}] for [your buyer].${url}`;
  }
}

// One-line, human-readable readout of the channel verdicts for the Glass Box (real data only).
function channelSummary(plan: OrganicPlan): string {
  const judged = plan.channels.filter((c) => c.verdict !== "needs-data");
  if (judged.length === 0) return "channels: not enough tagged traffic yet — instrument links to unlock the readout.";
  return "channels: " + judged.map((c) => `${c.channel}→${c.verdict}`).join(", ");
}

export interface OrganicShift {
  plan: OrganicPlan;
  activities: Activity[];
  approvals: ApprovalItem[];
}

// Compose the nightly organic move: the plan (for context/persistence), a Glass-Box activity, and up to
// two ready-to-post drafts for the desk. `maxDrafts` keeps the desk from flooding (default 2).
export function organicShift(
  company: Company,
  funnel: FunnelSnapshot,
  channels: ChannelInput[],
  night: number,
  maxDrafts = 2,
): OrganicShift {
  const plan = organicGrowthPlan({ funnel, channels });

  const activities: Activity[] = [
    {
      id: uid(),
      night,
      agent: "growth",
      action: `Organic plan — ${plan.contentPlan.focus} (constraint: ${plan.constraint})`,
      meta: `${plan.diagnosis} · ${channelSummary(plan)}`,
      cost: 0,
      status: "done",
      proof: { kind: "metric", value: `${plan.contentPlan.themes.length} themes, ${plan.experiments.length} experiments queued` },
    },
  ];

  // Turn the top themes into ready-to-post drafts on the desk. Alternate agent voice (growth/marketing)
  // so the crew reads as a team, matching the rest of the shift.
  const approvals: ApprovalItem[] = plan.contentPlan.themes.slice(0, maxDrafts).map((theme, i) => ({
    id: uid(),
    night,
    agent: i % 2 === 0 ? "growth" : "marketing",
    kind: kindForChannel(theme.channels[0]),
    title: `Organic content draft — ${theme.theme}`,
    detail: draftBody(theme, plan.constraint, company),
  }));

  return { plan, activities, approvals };
}

// Map the attribution rollup (ChannelStat[]) into the engine's ChannelInput[]. Kept here so callers don't
// need to know the readFunnel/attributeChannels internals. Decoupled: only the fields the engine reads.
export function toChannelInputs(
  stats: { channel: Channel; views: number; signups: number; revenueCents: number | null }[],
): ChannelInput[] {
  return stats.map((s) => ({ channel: s.channel, views: s.views, signups: s.signups, revenueCents: s.revenueCents ?? null }));
}
