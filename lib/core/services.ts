// lib/core/services.ts — THE SERVICE CATALOG. What a customer can hire the AI company to run for them.
// Each service is a bounded offering the org already knows how to do, mapped to real roles, with an HONEST
// status: ready = logic built + tested (keyless; needs a key to act live) · partial = some pieces built,
// more to build · planned = decided, not built yet. No fake capability — status is the truth.

export type ServiceStatus = "ready" | "partial" | "planned";

export interface Service {
  id: string;
  name: string;
  summary: string;
  does: string[];
  agents: string[]; // the roles that run it
  status: ServiceStatus;
  flagship?: boolean;
}

export const SERVICES: Service[] = [
  {
    id: "build-run-sell",
    name: "Build, run, and sell my software",
    summary: "Describe it in a sentence; a governed AI team builds it, ships it live, keeps it running, and can sell it.",
    does: [
      "Validate the idea honestly before building",
      "Build + deploy real software to a live URL (verified)",
      "Operate it: fix bugs, ship changes, handle tickets on its own",
      "Optionally market and sell it (revenue flows to you)",
    ],
    agents: ["Product Manager", "Software Engineer", "DevOps Engineer", "QA Engineer", "Growth Lead"],
    status: "ready",
    flagship: true,
  },
  {
    id: "growth",
    name: "Growth and marketing",
    summary: "Grow the brand without you writing a post — organic content plus honest read on which paid ads are working.",
    does: [
      "Organic: content, social posts, referrals — plus the SEO factory (pillar + 15, honesty-gated)",
      "Named playbooks: launch week, receipts campaign, SEO sprint — picked by you, run by the loop",
      "Paid: read which ad is performing and where to shift spend (capped, treasury-governed)",
      "Everything on-brand, verified milestones only, clearly AI",
    ],
    agents: ["Marketing Manager", "Growth Lead"],
    // "partial" until 2026-07-23: the SEO pipeline was the missing piece. ADR-0022/0023 shipped it
    // (playbooks + honesty-gated factory), tested — the ready bar (logic built + tested) is now met.
    status: "ready",
  },
  {
    id: "support",
    name: "Customer support",
    summary: "Your users' tickets, handled — answered from your real docs, bugs fixed, money and account escalated to a human.",
    does: [
      "Triage every ticket: question, bug, feature, or billing",
      "Answer questions from your docs (cite or abstain — no guessing)",
      "Route bugs into the fix loop; escalate money and scope to you",
    ],
    agents: ["Customer Support"],
    status: "ready",
  },
  {
    id: "sales",
    name: "Sales and outreach",
    summary: "Find good-fit companies, book the calls, and send honest first-touches — never scraped-list spam.",
    does: [
      "Find companies that match your target profile",
      "Qualify them, book demo calls",
      "Draft + send honest, named-AI outreach (no-spam gate enforced)",
    ],
    agents: ["Chief Revenue Officer", "Sales Development Rep", "Marketing Manager"],
    status: "ready",
  },
  {
    id: "market-watch",
    name: "Competitor and market watch",
    summary: "Keep an eye on rivals — weekly scans of their sites, what changed, and a battlecard to sell against them.",
    does: [
      "Scan named competitor sites on a schedule — public pages only, robots.txt honored, disclosed user-agent",
      "Diff what changed (pricing, features, positioning), scan over scan",
      "Keep a live sell-against battlecard current: their words dated, our counters labeled ours",
    ],
    agents: ["Growth Lead", "Data and Intelligence"],
    // "planned" until 2026-07-23: ADR-0024 shipped the machinery (scan/diff/battlecard + API + weekly
    // playbook), tested — the ready bar (logic built + tested; acts live per connection) is met.
    status: "ready",
  },
  {
    id: "data-copilot",
    name: "Copilot on my data",
    summary: "Ask your own business a question — answered only from your real records, with sources, or it says it doesn't know.",
    does: [
      "Answer from your own documents and records only",
      "Cite the source for every answer",
      "Abstain honestly when the answer isn't in your data",
    ],
    agents: ["Data and Intelligence"],
    status: "ready",
  },
  {
    id: "win-hackathon",
    name: "Win a hackathon",
    summary: "One call: it finds a live hackathon, checks the rules, builds the entry through the standard pipeline, and drafts the complete submission package. Your only act is the account + the Submit click — the human floor. No guarantee of a win; it maximizes the odds, honestly.",
    does: [
      "Find open online hackathons with cash prizes (live scan) and auto-pick the strongest",
      "Read the rules first — abort any that ban AI tools, never hide it",
      "Build + deploy the entry as a real durable org-run (advances laptop-off, every tick)",
      "Draft the paste-ready submission package with AI authorship disclosed; you register and press Submit",
    ],
    agents: ["Growth Lead", "Software Engineer", "Design Lead"],
    status: "ready",
  },
];

export function listServices(): Service[] {
  return SERVICES;
}

export function getService(id: string): Service | undefined {
  return SERVICES.find((s) => s.id === id);
}
