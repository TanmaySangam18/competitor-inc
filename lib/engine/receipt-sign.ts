import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// Signed metric receipts (the honest closure of Block 6b). A LIVE-URL card can re-verify itself at
// mint time (HEAD 200); a METRIC card can't — so an open route minting "VERIFIED · METRIC" from bare
// params would let anyone fabricate stamped numbers. The fix: only OUR server can mint one. The mint
// link carries an HMAC over the payload, computed with a server secret; the card route re-verifies it
// before stamping. No secret configured ⇒ no metric cards at all (fail-closed — a stamp we can't
// verify is a stamp that doesn't exist).

function secret(): string | null {
  return process.env.RECEIPT_SIGNING_SECRET?.trim() || process.env.TRACK_SALT?.trim() || null;
}

export function signMetricCard(title: string, value: string): string | null {
  const s = secret();
  if (!s) return null;
  return createHmac("sha256", s).update(`metric|${title}|${value}`).digest("hex");
}

export function verifyMetricSig(title: string, value: string, sig: string): boolean {
  const want = signMetricCard(title, value);
  if (!want || !sig || sig.length !== want.length) return false;
  try {
    return timingSafeEqual(Buffer.from(want, "hex"), Buffer.from(sig, "hex"));
  } catch {
    return false;
  }
}

/** The full signed mint URL — only callable server-side (the secret never leaves the server). */
export function signedMetricCardUrl(siteUrl: string, title: string, value: string): string | null {
  const sig = signMetricCard(title.slice(0, 80), value.slice(0, 120));
  if (!sig) return null;
  const q = new URLSearchParams({ kind: "metric", title: title.slice(0, 80), value: value.slice(0, 120), sig });
  return `${siteUrl.replace(/\/$/, "")}/api/receipt-card?${q.toString()}`;
}
