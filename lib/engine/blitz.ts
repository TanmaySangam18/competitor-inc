// Surge's "surprise-launch blitz" — drafts launch posts for the active CUSTOMER company, about THAT
// company's product (name + idea) — never competitor.inc's own pitch. These are DRAFTS only: the caller
// queues each as an approval, so nothing posts without the founder's sign-off. Fully simulated
// (offline), personalized to the company.

import type { ApprovalKind } from "./types";

export interface BlitzDraft {
  channel: string;
  title: string; // approval title
  body: string; // the drafted post (or, for kind "video", the full creative brief)
  kind?: ApprovalKind; // default "outreach"; "video" = a generate-it-yourself creative brief
}

// A short, lowercased problem phrase from the idea for natural copy ("an app for X" → "x").
function problem(idea: string): string {
  const t = idea.trim().replace(/^(an?|the)\s+/i, "").replace(/[.!?]+$/, "");
  return t.length > 90 ? t.slice(0, 90).trim() + "…" : t || "your idea";
}

export function draftBlitz(company: { name: string; idea: string }): BlitzDraft[] {
  const name = company.name;
  const p = problem(company.idea);
  return [
    {
      channel: "Bluesky thread",
      title: "Post the launch thread on Bluesky",
      body:
        `Introducing ${name} — ${p}.\n\n` +
        `We validated that people actually want this before building it. It's now live in early access — here's the story 🧵`,
    },
    {
      channel: "Show HN",
      title: "Submit to Show HN",
      body:
        `Show HN: ${name} – ${p}\n\n` +
        `${name} tackles ${p}. We ran real demand tests before building, and it's now live in early access. Brutal feedback welcome — what would make this a must-have for you?`,
    },
    {
      channel: "Indie Hackers",
      title: "Post to Indie Hackers / r/SaaS",
      body:
        `Just launched ${name} — ${p}. Early access is open and I'd love your honest read: would you use this, and what's missing?`,
    },
    {
      // The claymation-launch-film brief. PRODUCING creative is free + legal today (style isn't
      // copyrightable); RUNNING it as a paid ad is spend and stays founder-approval-gated (Phase 2).
      // The founder pastes the shot prompts into any video model (Sora/Veo/Runway paid tiers grant
      // commercial-use rights) and posts the result organically — same copy-first pattern as the
      // social drafts above.
      channel: "Video ad (claymation launch film)",
      kind: "video",
      title: "Generate the launch film — script + shot prompts ready",
      body:
        `LAUNCH FILM — ${name} (15s, claymation style, 9:16 vertical)\n\n` +
        `SCRIPT (5 beats · ~3s each)\n` +
        `1. HOOK — text on screen: "${p} — solved overnight." Clay character stares at a messy desk.\n` +
        `2. PROBLEM — the character wrestles with the old way (papers fly, clock spins).\n` +
        `3. TURN — they open ${name}; the scene brightens, clay UI panels assemble themselves.\n` +
        `4. PAYOFF — the finished result pops into place; character grins at the camera.\n` +
        `5. CTA — text on screen: "${name} — try it free." Logo beat.\n\n` +
        `SHOT PROMPTS (paste one per generation)\n` +
        `• "Claymation stop-motion style: a hand-crafted clay character at a cluttered desk, warm workshop lighting, shallow depth of field, 9:16" \n` +
        `• "Claymation style: the same clay character overwhelmed, papers flying, exaggerated squash-and-stretch, cozy workshop set"\n` +
        `• "Claymation style: clay character's face lit by a warm screen glow, delight, tiny clay UI cards assembling in the air"\n` +
        `• "Claymation style: finished product reveal on a clay laptop, confetti made of clay dots, character thumbs-up"\n` +
        `• "Claymation style: clean end card, hand-molded clay logo on a workbench, soft spotlight"\n\n` +
        `AUDIO — use a commercial-safe library track or a generated one. NEVER trending commercial\n` +
        `audio in an ad (unlicensed music is the #1 takedown reason).\n\n` +
        `HONESTY CHECKLIST (non-negotiable before you generate or post)\n` +
        `☐ Every on-screen claim is literally true of ${name} today\n` +
        `☐ No invented numbers, testimonials, or "results"\n` +
        `☐ No real person's face/voice; no other brand's characters or logos — the STYLE is free, their assets are not\n` +
        `☐ Posting organically = free, do it now · running as a PAID ad = spend approval first, always`,
    },
  ];
}
