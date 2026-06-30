// Redaction for the proof board — strip PII/secrets from a receipt so it can be SHOWN without exposing
// anyone. Built in from day one (while the board is still private/Ring-0) so that flipping it public
// later is safe by default rather than a scramble. Pure + deterministic → unit-tested.
//
// "Real numbers, redacted identities" (positioning brief): we mask WHO, never the proof itself.

// Email → keep first char + domain so it's recognizably-real but not an identity: a***@acme.com
const EMAIL_RE = /\b([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]*(@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/g;
// Obvious secret/token shapes (Stripe sk_live_…/pk_…, LemonSqueezy whsec_…, Resend re_…) → never let one
// ride along on a card. Targeted prefixes so we don't false-positive on ordinary "key_value" words.
const SECRET_RE = /\b(?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9]{6,}\b|\b(?:whsec|re)_[A-Za-z0-9]{8,}\b/gi;
const BEARER_RE = /\bBearer\s+[A-Za-z0-9._-]{12,}\b/gi;

export function redactText(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(SECRET_RE, "[secret]")
    .replace(BEARER_RE, "[secret]")
    .replace(EMAIL_RE, (_m, first: string, domain: string) => `${first}***${domain}`);
}

// A receipt URL is the proof, so we keep it clickable — but scrub query/hash, where PII most often hides
// (?email=, ?token=, #user=). Path stays intact so the link still resolves to the real artifact.
export function redactUrl(value: string | null | undefined): string {
  if (!value) return "";
  try {
    const u = new URL(value);
    return `${u.origin}${u.pathname}`;
  } catch {
    return redactText(value);
  }
}
