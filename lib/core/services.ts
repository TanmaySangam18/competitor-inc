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
      "Organic: content, SEO, social posts, referrals (no ad spend)",
      "Paid: read which ad is performing and where to shift spend",
      "Everything on-brand, verified milestones only, clearly AI",
    ],
    agents: ["Marketing Manager", "Growth Lead"],
    status: "partial",
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
      "Scan named competitor sites on a schedule",
      "Diff what changed (pricing, features, positioning)",
      "Keep a live sell-against battlecard current",
    ],
    agents: ["Growth Lead", "Data and Intelligence"],
    status: "planned",
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
    summary: "Point the company at a live hackathon and it finds it, checks the rules, picks the strongest compliant idea, and builds the submission — you enter and submit. No guarantee of a win; it maximizes the odds, honestly.",
    does: [
      "Find open online hackathons with cash prizes (live scan)",
      "Read the rules first — skip any that ban AI tools, never hide it",
      "Propose the strongest idea for the judging criteria, then build + deploy it",
      "Disclose AI authorship per the rules; the founder registers and submits",
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
