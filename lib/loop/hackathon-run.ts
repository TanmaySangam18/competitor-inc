import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createOrgRun } from "@/lib/engine/org-run";
import { insertOrgRun } from "@/lib/engine/org-runs-db";
import { scanHackathons, winPlan, type RadarHit } from "./hackathon-radar";

// ─────────────────────────────────────────────────────────────────────────────
// HACKATHON RUN (ADR-0021) — find → BUILD → PACKAGE, one call.
//
// The radar (ADR-0014) finds and plans. This module closes the loop: it turns the win plan into a
// REAL durable org-run (the same crash-safe DAG the cron advances every tick, laptop-off) and drafts
// the complete submission package so the human's remaining work is one paste-and-click.
//
// THE HONEST FLOOR (unchanged, load-bearing): creating the Devpost account, accepting the event's
// rules/ToS, and pressing Submit are account/consent acts — the same six-reason human hard-stop
// floor as onboarding (ADR-0017). We automate everything up to that button, never past it.
// ─────────────────────────────────────────────────────────────────────────────

export interface SubmissionPackage {
  eventTitle: string;
  eventUrl: string;
  title: string;
  tagline: string;
  description: string[]; // paste-ready paragraphs, AI authorship disclosed
  demoScript: string[]; // the 2-minute walkthrough, step by step
  links: string[]; // repo + live URL — the verifiable receipts
  humanSteps: string[]; // the irreducible human acts, in order — never automated
}

/** Pure: draft the paste-ready submission from the hit + the build's REAL receipts. No receipts, no
 *  invented claims — absent links are simply absent, and the description says what actually exists. */
export function submissionPackage(
  hit: RadarHit,
  proof: { projectName: string; repoUrl?: string; liveUrl?: string; buildSummary: string },
): SubmissionPackage {
  const links = [proof.repoUrl, proof.liveUrl].filter((u): u is string => Boolean(u));
  return {
    eventTitle: hit.title,
    eventUrl: hit.url,
    title: proof.projectName,
    tagline: proof.buildSummary.slice(0, 120),
    description: [
      proof.buildSummary,
      "How it was built: by competitor.inc — an AI software company governed by one human. AI agents planned, wrote, reviewed, and deployed this project; AI use is disclosed here per the event rules, and every claim below links to a verifiable artifact.",
      links.length
        ? `Verify it yourself: ${links.join(" · ")}`
        : "Build receipts pending — links land here when the deploy verifies (nothing is claimed before it's real).",
    ],
    demoScript: [
      `Open ${proof.liveUrl ?? "the live URL (from the deploy receipt)"} — show the working product first, talk second.`,
      "Walk the core flow end to end once, slowly (the judges' criteria decide which flow — see the win plan).",
      `Show the repo (${proof.repoUrl ?? "link from the build receipt"}) — real commits, real CI, disclosed AI authorship.`,
      "Close on the honest line: built by a governed AI company, human-signed where it matters.",
    ],
    links,
    humanSteps: [
      `Read the compliance check results FIRST — if the event bans AI tools, we abort, we never hide.`,
      `Sign in / register on Devpost yourself — account creation and rules acceptance are yours alone (the org never does these).`,
      `Register for "${hit.title}" at ${hit.url} and accept the event rules.`,
      "Paste the package fields, attach the demo, press Submit — the one click that must be human.",
    ],
  };
}

/** Turn one hit's win plan into a REAL durable org-run (compliance gate first — it's the plan's Step 0). */
export async function startHackathonRun(
  sb: SupabaseClient,
  userId: string,
  hit: RadarHit,
): Promise<{ runId: string; goal: string; rulesCheck: string[] }> {
  const plan = winPlan(hit);
  const run = createOrgRun(`hk-${Date.now().toString(36)}`, plan.goal, { orgPlan: true });
  await insertOrgRun(sb, userId, null, run);
  return { runId: run.id, goal: plan.goal, rulesCheck: plan.rulesCheck };
}

/** The one-call service: scan → pick the strongest open online cash-prize hit → start the build run.
 *  Honest empties and honest failures — never an invented hackathon. */
export async function autoHackathon(
  sb: SupabaseClient,
  userId: string,
  opts: { minPrizeUsd?: number; fetchImpl?: typeof fetch } = {},
): Promise<
  | { ok: true; hit: RadarHit; runId: string; goal: string; rulesCheck: string[] }
  | { ok: false; error: string }
> {
  const scanned = await scanHackathons({ minPrizeUsd: opts.minPrizeUsd ?? 1000, fetchImpl: opts.fetchImpl });
  if (!scanned.ok) return { ok: false, error: scanned.error };
  const hit = scanned.hits.find((h) => h.openState === "open") ?? scanned.hits[0];
  if (!hit) return { ok: false, error: "no open online cash-prize hackathons found right now — the radar reports weather, it doesn't invent it" };
  const started = await startHackathonRun(sb, userId, hit);
  return { ok: true, hit, ...started };
}
