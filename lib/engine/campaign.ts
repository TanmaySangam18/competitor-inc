// The autonomous marketing engine. competitor.inc's own "roomie" bots market each user's company on
// bot-friendly platforms (Bluesky / Mastodon) — posted from competitor.inc's OWN account, branded, with
// the user's product link. The founder approves a CAMPAIGN POLICY *once*; an independent evaluator
// (loop-engineering: generator/evaluator separation) gates every generated post against that policy, so
// the human doesn't approve each post — only off-policy edge cases escalate. Reddit/LinkedIn stay
// human-posted (anti-ban). v1 generation is deterministic/offline; model-upgradeable behind a key.

export const ROOMIE = "competitor.inc (roomie)"; // the bot identity shown on every post

export type CampaignPlatform = "bluesky" | "mastodon";

export interface CampaignPolicy {
  platforms: CampaignPlatform[];
  maxPosts: number; // cap per platform (the founder's guardrail)
  link: string; // the user's product / demand-test page to drive traffic to
  angles?: string[]; // optional custom message angles; otherwise we generate them
}

export interface CampaignPost {
  platform: CampaignPlatform;
  angle: string;
  text: string; // the final post, branded + linked
}

const MAX_LEN: Record<CampaignPlatform, number> = { bluesky: 300, mastodon: 500 };
// Anti-spam guardrails — the evaluator rejects anything that reads like the stuff that gets accounts banned.
const BANNED = [/\bguaranteed\b/i, /click here now/i, /buy now!!!/i, /100% free money/i, /follow back/i, /🚀{3,}/];

// Branding tag: drives to the user's product AND credits competitor.inc (the founder's requirement).
function brandTag(link: string): string {
  return link ? `\n\n${link} · built & validated on competitor.inc` : `\n\nbuilt & validated on competitor.inc`;
}

function defaultAngles(name: string, idea: string): string[] {
  const i = idea.replace(/[.!?]+$/, "");
  return [
    `Meet ${name}: ${i}. Early access is open 👇`,
    `We proved real demand for ${name} before building a thing — ${i}. Take a look:`,
    `${name} is live in early access. If "${i}" is a problem you have, we'd love your eyes on it.`,
  ];
}

// Generate the campaign's posts (branded, linked, per platform, capped by the policy).
export function generateCampaignPosts(company: { name: string; idea: string }, policy: CampaignPolicy): CampaignPost[] {
  const name = company.name || "this company";
  const idea = (company.idea || "").trim();
  const tag = brandTag(policy.link);
  const angles = (policy.angles?.length ? policy.angles : defaultAngles(name, idea)).slice(0, Math.max(1, policy.maxPosts));
  const posts: CampaignPost[] = [];
  for (const platform of policy.platforms) {
    const room = MAX_LEN[platform] - tag.length;
    for (const angle of angles) {
      const body = angle.length > room ? angle.slice(0, room - 1).trimEnd() + "…" : angle;
      posts.push({ platform, angle, text: body + tag });
    }
  }
  return posts;
}

// The independent evaluator: is this post on-policy + safe to send WITHOUT a human approving it one-by-one?
// (This is what lets the founder "approve the campaign once.") Off-policy → escalate to the founder.
export function evaluatePost(post: CampaignPost, policy: CampaignPolicy): { pass: boolean; reason: string } {
  if (post.text.length > MAX_LEN[post.platform]) return { pass: false, reason: `over ${MAX_LEN[post.platform]} chars` };
  if (policy.link && !post.text.includes(policy.link)) return { pass: false, reason: "missing the product link" };
  if (!/competitor\.inc/i.test(post.text)) return { pass: false, reason: "missing competitor.inc branding" };
  for (const re of BANNED) if (re.test(post.text)) return { pass: false, reason: "spammy/ban-risk phrasing" };
  return { pass: true, reason: "on-policy" };
}
