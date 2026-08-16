// lib/core/playbooks.ts — THE PLAYBOOK LIBRARY (ADR-0022, the PloyBooks pattern on our loop engine).
//
// Ploy.ai packages growth strategies as named "PloyBooks" run by agents on schedules/triggers. We had
// the ENGINE for that all along (SOPs → org-runs → the outer loop) but never the packaging: a customer
// could hire a department, not pick a strategy. A Playbook is exactly that packaging — a named, bounded
// strategy that compiles to a loop OBJECTIVE (goal + evidence criteria + iteration cap) and runs through
// the same governed machinery as everything else. No new execution path, no new power.
//
// HONESTY RULES: every playbook names its rails IN the goal text (the run carries its own compliance);
// `needs` lists the connection-map ids required to act live — the UI shows requirements, it never claims
// live-ness this module can't know. Nothing here is listed unless the machinery behind it exists today.

import type { AgentRole } from "@/lib/core/types";

export interface PlaybookGoal {
  goal: string;
  successCriteria: string[]; // evidence phrases — the loop's matcher is honest; unmatched stays unmet
  maxIterations: number;
}

export interface Playbook {
  id: string;
  name: string;
  summary: string;
  department: AgentRole; // the lead department (others assist inside the run)
  cadence: "weekly" | "monthly" | "on-demand";
  trigger: string; // honest, human-readable description of when it fires
  needs: string[]; // CONNECTION_MAP ids required to run LIVE (absent ⇒ drafts queue, degraded-but-honest)
  rails: string[]; // the compliance rails baked into the goal text
  goal(company: { name: string; idea: string }): PlaybookGoal;
}

export const PLAYBOOKS: Playbook[] = [
  {
    id: "launch-week",
    name: "Launch week",
    summary: "Announce from real receipts: refresh the landing page, draft the announcement, publish disclosed posts on a capped cadence.",
    department: "marketing",
    cadence: "on-demand",
    trigger: "you say go — typically the week something real shipped",
    needs: ["ai-model"],
    rails: ["real receipts only", "AI authorship disclosed", "own opted-in audience", "≤6 posts/day/channel", "over-tier queues for a human"],
    goal: (c) => ({
      goal:
        `Launch week for ${c.name}: announce ${c.idea} from REAL shipped receipts only. Draft the announcement, ` +
        `refresh the landing page through the change desk, and publish disclosed AI-authored posts through the ` +
        `governed pipeline (publishing-mandate rails: own opted-in audience, capped cadence, honesty floor). ` +
        `Anything over-tier queues for the human — never posted silently.`,
      successCriteria: ["post", "receipt"],
      maxIterations: 5,
    }),
  },
  {
    id: "receipts-campaign",
    name: "Receipts campaign",
    summary: "Turn verified receipts into receipt-card posts on a steady cadence — never a number without a receipt.",
    department: "marketing",
    cadence: "weekly",
    trigger: "a new verified receipt lands (ship, deploy, milestone)",
    needs: ["ai-model"],
    rails: ["honesty-gated receipt cards", "AI authorship disclosed", "own opted-in audience", "no fabricated numbers, ever"],
    goal: (c) => ({
      goal:
        `Receipts campaign for ${c.name}: mint receipt-card posts from VERIFIED receipts and publish them through ` +
        `the governed pipeline on the mandated cadence. The honesty gate is absolute — a number without a receipt ` +
        `does not render, and simulation is labeled simulation.`,
      successCriteria: ["receipt card", "post"],
      maxIterations: 4,
    }),
  },
  {
    id: "seo-sprint",
    name: "SEO sprint",
    summary: "A pillar + 15 supporting articles, planned by the SEO factory, drafted against the honesty gate, shipped through the standard pipeline.",
    department: "growth",
    cadence: "monthly",
    trigger: "you pick the topic; the sprint runs to completion",
    needs: ["ai-model", "github", "hosting"],
    rails: ["honesty gate blocks receipt-less claims", "AI byline on every piece", "no superlatives or guarantees", "ships via build → review → deploy → receipt"],
    goal: (c) => ({
      goal:
        `SEO sprint for ${c.name}: plan one pillar + 15 supporting articles with the SEO factory (planCluster), ` +
        `draft each against the honesty gate (no unverified stats, money claims, or testimonials — receipts inline, ` +
        `AI byline appended), and ship them through the standard pipeline (build → review → deploy → receipt). ` +
        `A draft the gate blocks is fixed or dropped, never published.`,
      successCriteria: ["pillar", "deploy", "receipt"],
      maxIterations: 8,
    }),
  },
  {
    // In per ADR-0024 — the market-watch machinery is real now (scan/diff/battlecard, tested).
    id: "competitor-watch",
    name: "Competitor watch",
    summary: "Scan named rivals' public pages weekly, diff pricing/features/positioning, keep the sell-against battlecard current.",
    department: "growth",
    cadence: "weekly",
    trigger: "the weekly heartbeat — or on demand before a sales call",
    needs: ["ai-model"],
    rails: ["public marketing pages only", "robots.txt honored — a no is a no", "disclosed user-agent, never a disguise", "their words quoted and dated; our counters labeled ours"],
    goal: (c) => ({
      goal:
        `Competitor watch for ${c.name}: scan the named competitors' PUBLIC marketing pages (robots.txt honored, ` +
        `disclosed user-agent), diff what changed since the last scan — pricing, features, positioning — and refresh ` +
        `the sell-against battlecard. Quote their public words dated; label our counters as ours; never scrape ` +
        `login-walled or personal data. Deltas worth acting on go to the sales desk with honest sourcing.`,
      successCriteria: ["scan", "battlecard"],
      maxIterations: 4,
    }),
  },
  {
    id: "hackathon-win",
    name: "Hackathon win",
    summary: "Find a live cash-prize hackathon, pass the rules check, build the entry, package the submission — you press Submit.",
    department: "growth",
    cadence: "on-demand",
    trigger: "the radar finds a live, compliant, cash-prize event",
    needs: ["ai-model", "github", "hosting"],
    rails: ["compliance rules check FIRST (AI banned ⇒ abort, never hide)", "event-window originality respected", "AI authorship disclosed in the submission", "accounts, terms, and the Submit click stay human"],
    goal: (c) => ({
      goal:
        `Hackathon win for ${c.name}: scan the public listings for live cash-prize hackathons, run the compliance ` +
        `rules check FIRST (abort out loud at any event that bans AI tools — we never hide usage), build the entry ` +
        `through the standard pipeline as a durable org-run, and draft the paste-ready submission package with AI ` +
        `authorship disclosed. Registration and the Submit click stay human — that is the floor, not a gap.`,
      successCriteria: ["rules check", "submission package"],
      maxIterations: 4,
    }),
  },
];

export function listPlaybooks(): Playbook[] {
  return PLAYBOOKS;
}

export function getPlaybook(id: string): Playbook | undefined {
  return PLAYBOOKS.find((p) => p.id === id);
}
