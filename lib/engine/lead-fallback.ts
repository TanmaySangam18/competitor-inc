// ─────────────────────────────────────────────────────────────────────────────
// NEVER LOSE A LEAD SILENTLY.
//
// /api/waitlist had three paths that returned { persisted: false }: no database configured, the insert
// failed, and an unexpected throw. All three told the visitor "you're on the list" and stored the email
// nowhere but that visitor's own browser. On a launch day that is not a bug you find later, it is eight
// people who raised their hand and can never be contacted.
//
// So: when the database cannot take a lead, reach the founder through whatever channel IS working, and
// if nothing is working, SAY SO to the visitor rather than pretending. An honest error keeps the lead
// (they can email directly). A fake success loses them forever.
// ─────────────────────────────────────────────────────────────────────────────

import { postToSlack } from "@/lib/engine/slack";

export type LeadCapture =
  | { reached: true; via: "slack" }
  | { reached: false; why: string };

/** Where a human can still be reached when the machinery is down. Shown to the visitor on failure. */
export const DIRECT_CONTACT = "sangam.d@northeastern.edu";

/**
 * A lead the database refused. Returns whether it actually got somewhere a human will see it.
 *
 * Deliberately takes its dependencies as arguments so the whole thing is testable without network or
 * environment, and so a future email or SMS fallback slots in without touching the route.
 */
export async function captureLead(
  lead: { email: string; ref?: string | null; why: string },
  deps: {
    channel?: string;
    post?: (channel: string, text: string) => Promise<void>;
  } = {}
): Promise<LeadCapture> {
  const channel = deps.channel ?? process.env.SLACK_DIGEST_CHANNEL?.trim();
  const post = deps.post ?? postToSlack;

  if (!channel) {
    return { reached: false, why: "no SLACK_DIGEST_CHANNEL configured, and the database is unavailable" };
  }

  const text = [
    "⚠️ WAITLIST SIGNUP THE DATABASE COULD NOT STORE",
    "",
    `email: ${lead.email}`,
    lead.ref ? `referred by: ${lead.ref}` : null,
    `reason the database failed: ${lead.why}`,
    "",
    "This lead exists ONLY in this message. Save it somewhere before this channel scrolls.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await post(channel, text);
    return { reached: true, via: "slack" };
  } catch (e) {
    return { reached: false, why: `slack refused: ${e instanceof Error ? e.message : "unknown"}` };
  }
}
