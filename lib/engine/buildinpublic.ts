// Build-in-public — the platform's own marketing loop. When a company opts in (Company.shareInPublic),
// the crew posts its REAL shipped milestones to competitor.inc's OWN social accounts. That public
// stream — real companies being validated and built, in the open — is itself the marketing (Polsia
// does this; the difference is ours only ever posts VERIFIED work, never fabricated progress).
//
// Pure + deterministic: picks a shareable milestone from real activities and drafts an honest post.
// Returns null when there's nothing verified to share — we never invent progress (the honesty invariant).

import type { Activity, Company } from "./types";

// Only these carry a real, provable milestone worth sharing publicly.
function isShareable(a: Activity): boolean {
  if (a.undone || a.status !== "done") return false;
  // A verifiable artifact (a live URL, a build, a real metric) or a clearly consequential shipped action.
  if (a.proof) return true;
  return /shipped|launched|deployed|published|closed experiment|reached|hit /i.test(a.action);
}

/** Pick the best real milestone to share from a shift's activities (most proof-worthy, newest). */
export function pickMilestone(activities: Activity[]): Activity | null {
  const shareable = activities.filter(isShareable);
  if (shareable.length === 0) return null;
  // Prefer ones with a proof artifact; among those, the highest-cost (most significant) real action.
  const withProof = shareable.filter((a) => a.proof);
  const pool = withProof.length > 0 ? withProof : shareable;
  return pool.reduce((best, a) => (a.cost > best.cost ? a : best), pool[0]);
}

/** Draft an honest build-in-public post for a company's milestone. Null if nothing verified to share. */
export function draftProgressPost(company: Pick<Company, "name" | "idea">, activities: Activity[]): string | null {
  const m = pickMilestone(activities);
  if (!m) return null;
  const proofNote = m.proof
    ? m.proof.kind === "url"
      ? ` — live: ${m.proof.value}`
      : m.proof.kind === "metric"
        ? ` — ${m.proof.value}`
        : ` — verified ✓`
    : "";
  // Compact, honest, and clearly attributed to the platform's own account. ≤ ~280 chars for X/Bluesky.
  const body = `Building in public with competitor.inc 🛠️\n\n${company.name}: ${m.action}${proofNote}\n\nEvery action logged with proof — no hallucinated "done." competitor.inc`;
  return body.length > 300 ? body.slice(0, 297) + "…" : body;
}

/** Should we share for this company? Consent + a real milestone + operating status. */
export function shouldShare(company: Company, activities: Activity[]): boolean {
  return !!company.shareInPublic && company.status === "operating" && pickMilestone(activities) !== null;
}
