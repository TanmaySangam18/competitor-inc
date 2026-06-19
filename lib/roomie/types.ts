// Core domain types for the competitor.inc autonomous company OS.

export type AgentRole = "ceo" | "engineering" | "marketing" | "support" | "growth";

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
}

export type ApprovalKind = "spend" | "outreach" | "deploy" | "delete";

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

export interface Ledger {
  spent: number;
  // Work credited back to your plan's allowance when a task fails — NOT a cash refund. You're simply
  // never charged for work that didn't land; competitor.inc absorbs its own compute cost.
  credited: number;
  tasksDone: number;
  tasksFailed: number;
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
}

export interface RoomieState {
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

// The competitive crew. Each agent runs a proven real-world playbook for its function.
// Names are deliberately not human/machine — they're "plays" in the competitive game.
export const AGENTS: Record<
  AgentRole,
  { name: string; label: string; blurb: string; playbook: string }
> = {
  ceo: { name: "Apex", label: "Strategy", blurb: "Calls the strategy & unit economics — what to double down on, what to cut", playbook: "Playing to Win (Lafley & Martin)" },
  engineering: { name: "Forge", label: "Engineering", blurb: "Ships the product — deploys only after it verifies", playbook: "Shape Up (Basecamp)" },
  marketing: { name: "Pitch", label: "Marketing", blurb: "Runs demand tests & campaigns — finds the one channel that works", playbook: "Bullseye / Traction (Weinberg & Mares)" },
  support: { name: "Guard", label: "Support", blurb: "Handles users — can refund, can't touch payments", playbook: "The Effortless Experience (CEB)" },
  growth: { name: "Surge", label: "Growth", blurb: "Spots trends & loads the surprise-launch blitz — drafts demand-capture posts for your sign-off", playbook: "Hacking Growth (Sean Ellis)" },
};
