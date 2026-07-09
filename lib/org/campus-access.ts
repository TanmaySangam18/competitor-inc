// ─────────────────────────────────────────────────────────────────────────────
// THE NORTHEASTERN DOGFOOD — campus access + consent gate.
//
// The founder's proof play: competitor.inc's own AI crew builds & runs a real product, free for anyone
// with a verified @northeastern.edu email. This is the access + anti-spam spine, spec-independent (works
// no matter what the platform turns out to be).
//
// HARD LINE (protects the founder — F1 student — + the brand): we NEVER cold-blast the NU directory
// (we'd have to scrape it; CAN-SPAM + NU acceptable-use + visa risk). Growth is OPT-IN. Follow-ups go
// only to VERIFIED members who CONSENTED, always with an unsubscribe — permission-based lifecycle, never
// spam. This mirrors Block 3's outreachGate for the campus context.
// ─────────────────────────────────────────────────────────────────────────────

export const CAMPUS_DOMAIN = "northeastern.edu";

// The campus gate is OFF by default (the general product + the founder's own access are unaffected). Flip
// NEXT_PUBLIC_CAMPUS_GATE="1" for the NU dogfood launch → then only verified @northeastern.edu members
// (and the founder allow-list) may sign in. Read server-side in the auth callback (the real chokepoint).
export function campusGateEnabled(): boolean {
  return process.env.NEXT_PUBLIC_CAMPUS_GATE === "1";
}

// Is this a real Northeastern address? Accepts the root domain + any subdomain (e.g. mail.northeastern.edu,
// husky.northeastern.edu) but rejects look-alikes (northeastern.edu.evil.com, notnortheastern.edu).
export function isCampusEmail(email: string | undefined | null, domain: string = CAMPUS_DOMAIN): boolean {
  if (!email) return false;
  const at = email.trim().toLowerCase();
  const m = /^[^\s@]+@([^\s@]+)$/.exec(at);
  if (!m) return false;
  const host = m[1];
  return host === domain || host.endsWith("." + domain);
}

export interface CampusMember {
  email: string;
  verifiedAt?: number; // set once they've confirmed the address (we never trust an unverified claim)
  consentedFollowups?: boolean; // explicit opt-in to lifecycle messages
  unsubscribedAt?: number; // honored forever once set
}

export interface AccessResult { allowed: boolean; reason: string }

// Sign-up / access gate: only verified NU addresses get in. An unverified NU claim is "pending", not
// "allowed" — verification is the anti-abuse floor.
export function campusAccessGate(member: Pick<CampusMember, "email" | "verifiedAt">): AccessResult {
  if (!isCampusEmail(member.email)) return { allowed: false, reason: `not a @${CAMPUS_DOMAIN} address` };
  if (!member.verifiedAt) return { allowed: false, reason: "email not verified yet (verification link pending)" };
  return { allowed: true, reason: "verified Northeastern member" };
}

// May an agent send this member a follow-up? Only if they're a verified member, explicitly opted in, and
// have NOT unsubscribed. This is the anti-spam rail for the campus lifecycle — the agents literally cannot
// message someone who didn't opt in.
export function mayFollowUp(member: CampusMember): AccessResult {
  if (member.unsubscribedAt) return { allowed: false, reason: "member unsubscribed — never contact again" };
  if (!member.verifiedAt) return { allowed: false, reason: "unverified — no messaging" };
  if (!member.consentedFollowups) return { allowed: false, reason: "no follow-up consent on file (opt-in required)" };
  return { allowed: true, reason: "verified + opted-in — lifecycle message allowed (include unsubscribe)" };
}

// Every campus message must carry a working opt-out — CAN-SPAM + our own rail. This appends the footer
// (idempotent) so a drafted message can't ship without it.
export function withUnsubscribe(body: string, unsubscribeUrl: string): string {
  if (/unsubscribe/i.test(body)) return body;
  return `${body}\n\n—\nYou're getting this because you signed up with your Northeastern email. Unsubscribe anytime: ${unsubscribeUrl}`;
}
