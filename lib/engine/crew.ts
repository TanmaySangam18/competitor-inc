// The dynamic per-company crew engine.
//
// The five core agents (Apex/Forge/Pitch/Guard/Surge — see types.ts AGENTS) are the constant backbone.
// On top of them, every company gets a BESPOKE set of specialists chosen for its domain — so a fintech
// idea gets a Compliance Lead, a marketplace gets a Supply Scout, etc. This is the "run ANY company"
// capability living inside the sharp first-time-founder niche.
//
// v1 is a deterministic template-fill (idea → domain → specialists): reliable, free, and testable, with
// no hallucination. It derives purely from the idea text, so it needs no persistence — regenerate it
// anywhere from company.idea. When a model key is set (Block 0), server.ts can upgrade this with a
// richer, model-reasoned crew and cache the result; the shape below is the contract it fills.

export interface Specialist {
  name: string;
  focus: string;
}

export interface CrewSpec {
  domain: string; // human label, e.g. "Marketplace"
  summary: string; // one line: how the crew is tuned
  specialists: Specialist[]; // 2 bespoke roles that join the core five
}

interface DomainTemplate {
  label: string;
  keywords: string[];
  specialists: Specialist[];
}

// Ordered by specificity-ish; scoring is by keyword hit count, so order only breaks exact ties.
const DOMAINS: DomainTemplate[] = [
  {
    label: "Fintech",
    keywords: ["fintech", "payment", "payments", "banking", "lending", "loan", "invoice", "finance", "financial", "crypto", "wallet", "money", "accounting", "tax", "insurance"],
    specialists: [
      { name: "Ledger", focus: "Compliance Lead — keeps you on the right side of money rules from day one" },
      { name: "Sentry", focus: "Risk Analyst — watches fraud and the unit economics that make or break fintech" },
    ],
  },
  {
    label: "Marketplace",
    keywords: ["marketplace", "two-sided", "two sided", "buyers and sellers", "gig", "peer-to-peer", "peer to peer", "connect", "rent", "rental", "freelancer", "freelancers", "booking platform"],
    specialists: [
      { name: "Scout", focus: "Supply Scout — recruits your first sellers (the hard side of any marketplace)" },
      { name: "Warden", focus: "Trust & Safety Lead — keeps both sides honest so the market doesn't unravel" },
    ],
  },
  {
    label: "E-commerce / DTC",
    keywords: ["shop", "store", "ecommerce", "e-commerce", "dtc", "d2c", "retail", "merch", "apparel", "cosmetics", "skincare", "fashion", "sell products", "physical product"],
    specialists: [
      { name: "Curate", focus: "Merchandiser — curates the small set of things that actually sell" },
      { name: "Dispatch", focus: "Fulfillment Lead — ships it on time, without the surprises that kill DTC" },
    ],
  },
  {
    label: "AI / Data",
    keywords: ["ai ", " ai", "a.i.", "ml", "machine learning", "llm", "model", "agent", "gpt", "neural", "data platform", "computer vision", "nlp"],
    specialists: [
      { name: "Synapse", focus: "ML Lead — ships the one model capability that actually matters" },
      { name: "Proof", focus: "Eval Lead — proves the AI is genuinely good, not just demo-good" },
    ],
  },
  {
    label: "Health / Wellness",
    keywords: ["health", "wellness", "fitness", "medical", "mental", "therapy", "nutrition", "patient", "clinic", "care", "doctor", "telehealth", "diet"],
    specialists: [
      { name: "Vita", focus: "Care Advisor — keeps it safe, credible, and on the right side of health claims" },
      { name: "Outcome", focus: "Outcomes Lead — proves it actually improves people's lives" },
    ],
  },
  {
    label: "Education / EdTech",
    keywords: ["education", "edtech", "learn", "learning", "course", "courses", "school", "student", "students", "teach", "teaching", "tutor", "training", "curriculum", "exam"],
    specialists: [
      { name: "Mentor", focus: "Curriculum Lead — designs learning that actually sticks" },
      { name: "Finish", focus: "Learner Success — gets students to complete, not just start" },
    ],
  },
  {
    label: "Creator / Content / Media",
    keywords: ["newsletter", "blog", "content", "media", "creator", "podcast", "video", "audience", "publish", "writing", "substack", "youtube", "influencer"],
    specialists: [
      { name: "Reach", focus: "Audience Builder — grows the list and the watch-time" },
      { name: "Quill", focus: "Editorial Lead — holds the quality bar that keeps an audience" },
    ],
  },
  {
    label: "Local / Services",
    keywords: ["local", "restaurant", "salon", "service", "services", "appointment", "home services", "plumber", "cleaning", "barber", "repair", "neighborhood", "on-demand"],
    specialists: [
      { name: "Flow", focus: "Ops Coordinator — keeps bookings and jobs flowing smoothly" },
      { name: "Block", focus: "Local Growth — owns one neighborhood completely before going wide" },
    ],
  },
  {
    label: "Consumer App / Community",
    keywords: ["app", "social", "community", "dating", "mobile", "consumer", "chat", "network", "friends", "forum", "group", "messaging"],
    specialists: [
      { name: "Spark", focus: "Community Manager — sparks the first real conversations" },
      { name: "Loop", focus: "Retention Lead — builds the reason people come back tomorrow" },
    ],
  },
  {
    label: "Hardware / Physical",
    keywords: ["hardware", "device", "iot", "robot", "sensor", "manufacturing", "gadget", "wearable", "3d print", "prototype"],
    specialists: [
      { name: "Bolt", focus: "Hardware Lead — turns the prototype into a product you can ship" },
      { name: "Chain", focus: "Supply Chain — sources and ships at a cost that leaves margin" },
    ],
  },
  {
    label: "B2B SaaS",
    keywords: ["saas", "b2b", "dashboard", "workflow", "crm", "analytics", "api", "platform", "automation", "integration", "software for", "tool for teams", "productivity"],
    specialists: [
      { name: "Onboard", focus: "Onboarding Architect — gets a new user to their first win in minutes" },
      { name: "Echo", focus: "DevRel Lead — turns early users into vocal advocates" },
    ],
  },
];

// Fallback when nothing matches: the universal first-company crew.
const DEFAULT_CREW: { label: string; specialists: Specialist[] } = {
  label: "Software",
  specialists: [
    { name: "Wedge", focus: "Wedge Finder — picks the single feature to win on first" },
    { name: "First10", focus: "First-Users Lead — hand-recruits your first ten true fans" },
  ],
};

// Pure + deterministic: same idea always yields the same crew; different ideas diverge by domain.
export function generateCrew(idea: string): CrewSpec {
  const text = ` ${(idea || "").toLowerCase()} `;
  let best: DomainTemplate | null = null;
  let bestScore = 0;
  for (const d of DOMAINS) {
    if (d.specialists.length === 0) continue; // skip placeholder rows
    let score = 0;
    for (const kw of d.keywords) if (text.includes(kw)) score++;
    if (score > bestScore) {
      bestScore = score;
      best = d;
    }
  }
  if (!best || bestScore === 0) {
    return {
      domain: DEFAULT_CREW.label,
      summary: `Tuned for a first software company: ${DEFAULT_CREW.specialists.length} specialists join Apex, Forge, Pitch, Guard & Surge.`,
      specialists: DEFAULT_CREW.specialists,
    };
  }
  return {
    domain: best.label,
    summary: `Tuned for ${best.label}: ${best.specialists.length} specialists join Apex, Forge, Pitch, Guard & Surge.`,
    specialists: best.specialists,
  };
}
