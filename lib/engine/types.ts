// Core domain types for the competitor.inc autonomous company OS.

export type AgentRole = "ceo" | "engineering" | "marketing" | "manufacturing" | "support" | "growth";

export type CompanyStatus =
  | "validating" // the Validation Gate is running
  | "validated" // validation done, awaiting the human's build decision
  | "rejected" // you (or the engine) decided to hold
  | "operating"; // build approved, agents running nightly shifts

export interface ValidationStep {
  label: string;
  done: boolean;
}

export interface Experiment {
  key: string;
  label: string;
  detail: string;
  metric: string;
  signal: "positive" | "weak" | "negative";
}

export interface ValidationResult {
  steps: ValidationStep[];
  waitlist: number;
  ctr: number; // percent, e.g. 4.6
  costPerSignup: number; // dollars
  spend: number; // total spent running the test
  experiments: Experiment[]; // the evidence behind the verdict
  confidence: number; // 0-100
  verdict: "strong" | "weak" | "mixed";
  recommendation: string; // the engine's honest take
}

export type ActivityStatus = "done" | "failed-credited" | "pending-approval";

export interface Proof {
  kind: "url" | "build" | "metric";
  value: string;
}

export interface Activity {
  id: string;
  night: number;
  agent: AgentRole;
  action: string;
  meta?: string;
  cost: number;
  status: ActivityStatus;
  proof?: Proof;
  undone?: boolean;
  // Parent activity ID for sub-agent work (hierarchical execution)
  parentActivityId?: string;
  // Sub-activities spawned by this agent (for Manufacturing → Supply Chain + QA, etc.)
  subActivities?: Activity[];
  // The Rationale Stream (PDR §6): the "why" behind an action. Optional + usually DERIVED for display
  // (see lib/engine/rationale.ts) so it works for every action without storage; a real engine may attach
  // a richer one. The Glass Box, the founder/customer views, and the proof board all read this.
  rationale?: { why: string; principle: string };
}

export type ApprovalKind = "spend" | "outreach" | "deploy" | "delete" | "bluesky" | "mastodon" | "twitter" | "linkedin" | "reddit" | "video";

export interface ApprovalItem {
  id: string;
  night: number;
  agent: AgentRole;
  kind: ApprovalKind;
  title: string;
  detail: string;
  amount?: number;
  resolved?: "approved" | "rejected";
}

/* ── Sub-Agent Orchestration (Paperclip-style hierarchical agents) ────────────────── */

export type SubAgentStatus = "idle" | "running" | "waiting_approval" | "blocked" | "done" | "failed";

export interface SubAgent {
  id: string;
  name: string;
  parentAgentId: string;
  scope: string[]; // areas of responsibility
  blockingOn: string[]; // other sub-agents or activities this one depends on
  status: SubAgentStatus;
  spendCap: number;
  allocated: number; // amount allocated from parent's cap
  spent: number; // amount actually spent
}

// Hierarchical agent execution tracking
export interface AgentHierarchy {
  topLevelAgents: AgentRole[];
  subAgentsByParent: Map<string, SubAgent[]>;
}

export interface Ledger {
  spent: number;
  // Work credited back to your plan's allowance when a task fails — NOT a cash refund. You're simply
  // never charged for work that didn't land; competitor.inc absorbs its own compute cost.
  credited: number;
  tasksDone: number;
  tasksFailed: number;
}

// The Revenue Loop's scoreboard (Block R): ONE founder-chosen outcome metric every shift is judged
// against. Not vanity metrics — the three north stars map to the funnel's real stages.
export interface GrowthGoal {
  northStar: "revenue" | "paying_customers" | "signups";
  target: number; // revenue in whole dollars; others in people
  setAt: number;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  idea: string;
  createdAt: number;
  status: CompanyStatus;
  night: number; // number of shifts run
  validation?: ValidationResult;
  ledger: Ledger;
  product?: { url: string; status: "live" | "building" }; // the built winner (proof-of-work)
  growthGoal?: GrowthGoal;
}

export interface EngineState {
  company: Company | null;
  activities: Activity[];
  approvals: ApprovalItem[];
}

// Operate layer (EOS): quarterly Rocks + an Issues list, per company. Gated behind a flag.
export interface Rock {
  id: string;
  title: string;
  done: boolean;
}
export interface Issue {
  id: string;
  title: string;
  resolved: boolean;
}
export interface OperateData {
  rocks: Rock[];
  issues: Issue[];
}

// Bring-your-own-key config. Stored client-side, sent per-request, never persisted server-side.
// "openai-compatible" covers OpenAI, Groq, OpenRouter, Together, local servers, etc.
export interface ByokConfig {
  provider: "" | "anthropic" | "openai-compatible";
  apiKey: string;
  baseUrl: string;
  model: string;
}

// Per-user integration connections — same trust model as ByokConfig (stored client-side, sent
// per-request, never persisted server-side). Lets each founder run real actions on THEIR OWN
// accounts — build in their GitHub, email from their Resend domain, route ad spend to their own
// pipeline — instead of a single shared operator key. Empty string = not connected; the operator's
// env key is the fallback. The ads webhook is treated as untrusted (SSRF-guarded) since it's user URL.
export interface Connections {
  githubToken: string;
  resendApiKey: string;
  resendFrom: string;
  adsWebhookUrl: string;
}

// The competitive crew. Each agent runs a proven real-world playbook for its function.
// Names are deliberately not human/machine — they're "plays" in the competitive game.
// `responsibilities` is the agent's "job description" (what it owns); `icp`/`objections` give the
// customer-facing agents the context to sell + reassure. The GTM responsibilities restate established
// public methods (Traction, Hacking Growth) in our own words. Apex/Guard carry an independent-verifier
// duty — the loop-engineering rule that an agent must never grade its own work.
export interface AgentSpec {
  name: string;
  label: string;
  blurb: string;
  playbook: string;
  responsibilities: string[];
  icp?: string;
  objections?: string[];
}
export const AGENTS: Record<AgentRole, AgentSpec> = {
  ceo: {
    name: "Apex",
    label: "Strategy",
    blurb: "Calls the strategy & unit economics — what to double down on, what to cut",
    playbook: "Playing to Win (Lafley & Martin)",
    responsibilities: [
      "Set strategy + unit economics — decide what to double down on and what to cut",
      "Define what 'good' and 'done' mean for each goal in measurable terms (the bar work is judged against)",
      "Independently review other agents' work — never let an agent grade its own (generator/evaluator separation)",
    ],
  },
  engineering: {
    name: "Forge",
    label: "Engineering",
    blurb: "Ships the product — deploys only after it verifies",
    playbook: "Shape Up (Basecamp)",
    responsibilities: [
      "Ship the smallest real version of the validated winner",
      "Verify work before marking it done (verify-before-done); deploy only after the check passes",
    ],
  },
  marketing: {
    name: "Pitch",
    label: "Marketing",
    blurb: "Runs pre-launch demand — finds the one channel that converts and gets you to launch",
    playbook: "Bullseye / Traction (Weinberg & Mares)",
    responsibilities: [
      "Generate DEMAND first — demand is the usual bottleneck, not mid-funnel conversion",
      "Run real demand tests; find the one channel that converts, then pour into it",
      "Be prescriptive about how to buy — show the happy path from the first touch",
      "Obsess over implementation/activation — the first 'aha' is where users are kept",
    ],
    icp: "First-time / student founders building their first company",
    objections: ["Is this a scam?", "Will it spend my money without asking?", "Am I locked in?", "What if it tells me not to build?"],
  },
  manufacturing: {
    name: "Rig",
    label: "Manufacturing",
    blurb: "Runs ops & supply — sourcing, quality, cost-down (dynamic-crew ideas that ship physical product)",
    playbook: "Toyota Production System (lean ops)",
    responsibilities: [
      "Own the supply chain — sourcing, supplier relationships, lead times",
      "Own quality — test protocols, defect analysis, verify-before-ship",
      "Drive cost per unit down without cutting the quality bar",
    ],
  },
  support: {
    name: "Guard",
    label: "Support",
    blurb: "Handles users — can refund, can't touch payments",
    playbook: "The Effortless Experience (CEB)",
    responsibilities: [
      "Handle users — can issue refunds, cannot touch payment rails",
      "Act as an independent, read-only verifier of shipped work + outgoing messages before they reach a user",
      "Turn friction into trust; log recurring issues as signals for the rest of the crew",
    ],
    objections: ["Will a human help me?", "Can I get a refund?", "Can I export my data and leave?"],
  },
  growth: {
    name: "Surge",
    label: "Growth",
    blurb: "Runs post-launch growth loops — referrals, retention, the compounding flywheel (drafts posts for your sign-off)",
    playbook: "Hacking Growth (Sean Ellis)",
    responsibilities: [
      "Treat distribution as importantly as the product — a launch is the start of the work, not the finish",
      "Turn happy users into new ones (referrals / word-of-mouth) — the compounding growth loop",
      "Draft demand-capture posts for the founder's sign-off — never auto-post",
      "Spot trends and load the surprise-launch blitz",
    ],
    icp: "First-time / student founders building their first company",
    objections: ["I have no audience", "I'm not a marketer", "Will this come across as spammy?"],
  },
};
