// Specialist catalog + agent personas — DERIVED from `agency-agents` (MIT, © msitarzewski,
// https://github.com/msitarzewski/agency-agents; see THIRD_PARTY_NOTICES.md). Their 230-role / 17-division
// roster is mapped onto competitor.inc's 9 GOVERNED top-level roles (AgentRole). We keep the compact roster
// (model routing, governance/policy, tone/desk are all keyed to the 9 roles) and borrow their roster two ways:
//   1) SPECIALISTS — an idea-aware sub-agent catalog that gives each role credible DEPTH (surfaced in the
//      crew roster), instead of re-architecting everything around 230 top-level roles.
//   2) PERSONA — a one-line communication style per role (distilled from their per-role "vibe"/communication
//      sections, reworded) that makes agents feel distinct in chat/banter rather than generic.
// Selection is deterministic (no model call): specialists whose keywords match the idea rank first.

import type { AgentRole } from "./types";

export interface Specialist {
  name: string; // agency-agents role name (kept verbatim for attribution fidelity)
  focus: string; // one-line scope
  keywords?: string[]; // idea terms that make this specialist especially relevant (idea-aware ranking)
}

// ~3–5 specialists per governed role, drawn from the matching agency-agents division(s). Ordering is the
// default (idea-agnostic) priority; keyword hits promote a specialist above the defaults for a given idea.
export const SPECIALISTS: Record<AgentRole, Specialist[]> = {
  ceo: [
    { name: "Product Manager", focus: "Roadmap, specs, and acceptance criteria" },
    { name: "Sprint Prioritizer", focus: "What ships this cycle vs. what's cut" },
    { name: "Trend Researcher", focus: "Market + competitor signal into strategy" },
  ],
  engineering: [
    { name: "Frontend Developer", focus: "Responsive, accessible UI", keywords: ["app", "web", "dashboard", "ui", "site", "saas", "mobile"] },
    { name: "Backend Architect", focus: "APIs, data model, reliability", keywords: ["api", "backend", "platform", "saas", "data", "marketplace", "payments"] },
    { name: "AI Engineer", focus: "Models, prompts, inference", keywords: ["ai", "ml", "model", "gpt", "llm", "chatbot", "agent", "vision"] },
    { name: "DevOps Automator", focus: "CI/CD, infra, monitoring", keywords: ["infra", "scale", "devops", "cloud", "deploy"] },
    { name: "Firmware Engineer", focus: "Embedded / device code", keywords: ["hardware", "device", "iot", "ev", "car", "robot", "sensor", "firmware"] },
    { name: "Mobile App Builder", focus: "Native iOS/Android", keywords: ["mobile", "ios", "android", "app"] },
  ],
  marketing: [
    { name: "Content Creator", focus: "Blog, landing copy, narrative" },
    { name: "SEO Specialist", focus: "Search discoverability", keywords: ["seo", "content", "blog", "search"] },
    { name: "Email Marketing Strategist", focus: "Lifecycle + nurture", keywords: ["email", "newsletter", "crm"] },
    { name: "Brand Guardian", focus: "Voice + visual consistency", keywords: ["brand", "design"] },
  ],
  growth: [
    { name: "Growth Hacker", focus: "Acquisition experiments + funnel" },
    { name: "Reddit Community Builder", focus: "Community-led growth", keywords: ["community", "reddit", "forum", "social"] },
    { name: "Twitter Engager", focus: "Social distribution", keywords: ["social", "twitter", "x", "viral"] },
    { name: "Paid Media Buyer", focus: "Ads + ROAS", keywords: ["ads", "paid", "acquisition", "roas"] },
  ],
  support: [
    { name: "Support Responder", focus: "Fast, low-effort answers" },
    { name: "Analytics Reporter", focus: "Usage + retention signal", keywords: ["analytics", "retention", "metrics"] },
    { name: "Documentation Writer", focus: "Help docs + onboarding", keywords: ["docs", "onboarding", "help"] },
  ],
  finance: [
    { name: "Financial Analyst", focus: "Unit economics + runway" },
    { name: "Bookkeeper", focus: "Ledger + reconciliation (prepared, human posts)" },
  ],
  legal: [
    { name: "Compliance Analyst", focus: "Jurisdiction rules + honest claims" },
    { name: "Privacy Specialist", focus: "Data handling + consent", keywords: ["data", "privacy", "health", "kids", "finance"] },
    { name: "Contracts Drafter", focus: "TOS/DPA drafts (never signs)" },
  ],
  ops: [
    { name: "Project Coordinator", focus: "Sequencing + dependencies" },
    { name: "Operations Analyst", focus: "Find + remove the binding constraint" },
    { name: "Vendor Manager", focus: "Tools + suppliers (prepared for approval)", keywords: ["vendor", "supplier", "logistics"] },
  ],
  manufacturing: [
    // kept verbatim so benchmark (physical-product) crews are unchanged
    { name: "Supply Chain Agent", focus: "Sourcing, suppliers, logistics" },
    { name: "Quality Agent", focus: "Testing, QA, process improvement" },
    { name: "Logistics Planner", focus: "Fulfillment + inventory", keywords: ["logistics", "shipping", "inventory"] },
  ],
};

// One-line communication style per role — distilled + reworded from agency-agents' per-role "vibe" /
// communication sections. Injected into chat/banter prompts so each agent sounds distinct, not generic.
export const PERSONA: Record<AgentRole, string> = {
  ceo: "Numbers-first and decisive — frames everything as the one binding constraint and the ROI of moving it.",
  engineering: "Precise and pragmatic — talks in shippable scope, trade-offs, and whether it actually works.",
  marketing: "Sharp positioning voice — one buyer, one job, one clear message; no vague hype.",
  growth: "High-energy experimenter — one channel, one test, measured; never spray-and-pray.",
  support: "Warm and low-effort — reduces customer friction and speaks in the customer's own words.",
  finance: "Calm and runway-aware — unit economics first; prepares the money act, the human moves the money.",
  legal: "Careful and least-privilege — consent-first; drafts and flags risk, never signs.",
  ops: "Constraint-hunting operator — find the bottleneck, remove it, keep it reversible.",
  manufacturing: "Systems-and-flow mindset — sourcing, throughput, and quality gates.",
};

// Deterministic, idea-aware pick: specialists whose keywords appear in the idea rank first (by hit count),
// ties break by the catalog's default order. Returns up to `n`. Pure — safe in tests + on the server.
export function specialistsForRole(role: AgentRole, idea = "", n = 3): Specialist[] {
  const list = SPECIALISTS[role] ?? [];
  const lower = idea.toLowerCase();
  const scored = list.map((s, i) => {
    const hits = (s.keywords ?? []).reduce((acc, k) => (lower.includes(k) ? acc + 1 : acc), 0);
    return { s, i, hits };
  });
  scored.sort((a, b) => (b.hits - a.hits) || (a.i - b.i));
  return scored.slice(0, Math.max(0, n)).map((x) => x.s);
}
