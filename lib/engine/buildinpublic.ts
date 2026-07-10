// Build-in-public — the platform's own marketing loop. When a company opts in (Company.shareInPublic),
// the crew posts its REAL shipped milestones to competitor.inc's OWN social accounts. That public
// stream — real companies being validated and built, in the open — is itself the marketing (Polsia
// does this; the difference is ours only ever posts VERIFIED work, never fabricated progress).
//
// Pure + deterministic: picks a shareable milestone from real activities and drafts an honest post.
// Returns null when there's nothing verified to share — we never invent progress (the honesty invariant).

import type { Activity, Company } from "./types";
import { getRole } from "@/lib/org/organization";
import { personaFor } from "@/lib/org/personas";

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

// ── Receipts Campaign (slice 2): the persona-authored variant ────────────────────────────────────────
// The post is signed by the POSITION that did the work (Vera·CTO for shipped builds, Kenji·Analytics for
// verified metrics, Marcus·CEO otherwise) — the Living Org speaking in public. Same honesty invariant:
// null without a real milestone; the "while the founder slept" line only when it's TRUE (the overnight cron).

const AUTHOR_BY_PROOF: Record<string, string> = {
  url: "chief-technology-officer",
  metric: "head-of-analytics",
};

/** The receipt-card image URL for a live-URL milestone (slice 1 route re-verifies liveness itself). */
export function receiptCardUrl(siteUrl: string, title: string, liveUrl: string, review?: string): string {
  const q = new URLSearchParams({ title: title.slice(0, 80), url: liveUrl });
  if (review) q.set("review", review.slice(0, 120));
  return `${siteUrl.replace(/\/$/, "")}/api/receipt-card?${q.toString()}`;
}

/** Persona-authored build-in-public post. Null when nothing verified (never invent progress). */
export function draftPersonaPost(
  company: Pick<Company, "name" | "idea">,
  activities: Activity[],
  opts: { overnight?: boolean; siteUrl?: string } = {},
): string | null {
  const m = pickMilestone(activities);
  if (!m) return null;
  const role = getRole(AUTHOR_BY_PROOF[m.proof?.kind ?? ""] ?? "chief-executive-officer");
  if (!role) return null;
  const p = personaFor(role);
  const proofNote = m.proof
    ? m.proof.kind === "url"
      ? `\nLive: ${m.proof.value}`
      : `\nVerified: ${m.proof.value}`
    : "";
  const overnight = opts.overnight ? " — while the founder slept" : "";
  // The sig carries the attribution link (slice 3): clicks land with ?ref=receipts → first-touch marker →
  // a completed signup fires under the "receipts" slug. Success = attributed signups, never followers.
  const sig = opts.siteUrl ? `${opts.siteUrl.replace(/\/$/, "")}/?ref=receipts` : "competitor.inc";
  const body = `${p.name} · ${role.title} here. For ${company.name}: ${m.action}${overnight}.${proofNote}\n\nI'm an AI employee — every claim above is verifiable. ${sig}`;
  return body.length > 300 ? body.slice(0, 297) + "…" : body;
}

// ── Receipts Campaign (slice 3): the cadence gate ────────────────────────────────────────────────────
// The steady drumbeat is calendar-deterministic: platform "receipt rerun" posts fire only on Mon/Wed/Fri
// (UTC) — a hard ≤3/week cap with zero storage, testable to the day. Fresh verified milestones still post
// event-driven on any day; this gates only the scheduled reruns from the receipts well.
export function isCadenceDay(now: Date = new Date()): boolean {
  const d = now.getUTCDay();
  return d === 1 || d === 3 || d === 5;
}

// ── Receipts Campaign (slice 3b): the ledger rerun ───────────────────────────────────────────────────
// The Mon/Wed/Fri drumbeat re-shares an EXISTING receipt on days with no fresh milestone. Honesty rules:
// only URL-proof milestones qualify (a rerun must be a clickable receipt), and the framing says it is a
// look-back ("From the ledger") with a "still live" link — an old win must never read as fresh news.
export function draftLedgerRerun(
  company: Pick<Company, "name" | "idea">,
  history: Activity[],
  opts: { siteUrl?: string } = {},
): string | null {
  const withUrl = history.filter((a) => !a.undone && a.status === "done" && a.proof?.kind === "url");
  if (withUrl.length === 0) return null;
  const m = withUrl.reduce((best, a) => (a.cost > best.cost ? a : best), withUrl[0]);
  const role = getRole("chief-technology-officer");
  if (!role) return null;
  const p = personaFor(role);
  const sig = opts.siteUrl ? `${opts.siteUrl.replace(/\/$/, "")}/?ref=receipts` : "competitor.inc";
  const body = `From the ledger — ${p.name} · ${role.title}: for ${company.name}, ${m.action}.\nStill live: ${m.proof!.value}\n\nI'm an AI employee — every receipt is real and clickable. ${sig}`;
  return body.length > 300 ? body.slice(0, 297) + "…" : body;
}

