// lib/core/slack-invite.ts — THE "JOIN THE SLACK" CTA, honestly (ADR-0008).
//
// Competitor Live happens in Slack (the office — ADR-0005): agents deliberate in channels 24/7 and the
// human is @-mentioned only on real decisions. The website is the showcase; this module is the single
// source of truth for every "Join the Slack" button on it.
//
// HONESTY RULE: we never render an invite link that doesn't exist. When the founder hasn't published
// NEXT_PUBLIC_SLACK_INVITE_URL yet, every CTA falls back to /join — the waitlist collects people until
// the workspace opens — and says so plainly ("Get your Slack invite"), never pretending the door is open.

export interface LiveCta {
  href: string;
  label: string;
  live: boolean; // true only when a real invite URL is configured
}

/** The configured Slack invite URL, or null when it isn't set (or is blank). */
export function slackInviteUrl(env: Record<string, string | undefined> = process.env): string | null {
  const url = env.NEXT_PUBLIC_SLACK_INVITE_URL?.trim();
  return url ? url : null;
}

/**
 * Every "Join the Slack" CTA on the site renders from this — one honest switch:
 *  - invite configured → the real Slack invite, labeled "Join the Slack".
 *  - not configured    → /join (the waitlist), labeled "Get your Slack invite" — we collect people
 *                        honestly until the workspace opens; no dead links, no fake doors.
 */
export function liveCta(env: Record<string, string | undefined> = process.env): LiveCta {
  const url = slackInviteUrl(env);
  if (url) return { href: url, label: "Join the Slack", live: true };
  return { href: "/join", label: "Get your Slack invite", live: false };
}
