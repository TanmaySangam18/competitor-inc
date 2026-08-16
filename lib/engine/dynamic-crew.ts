/**
 * Dynamic Crew Generation
 * Generates a custom agent crew based on a user's startup idea and benchmark org structure.
 *
 * Example: user says "EV with software-first", we load Tesla's org, extract top functions,
 * and generate a custom crew with agents, sub-agents, spend caps, playbooks, etc.
 */

import { AGENTS, type AgentRole } from "@/lib/core/types";
import { parseJobs, type JobRole } from "./job-parser";
import { specialistsForRole } from "./specialists";

/* ── Benchmark Company Detection ────────────────────────────────── */

const IDEA_TO_BENCHMARK: Record<string, string> = {
  // EV / Automotive
  "ev ": "tesla",
  "electric vehicle": "tesla",
  "autonomous vehicle": "tesla",
  "self-driving": "tesla",
  "car ": "tesla",
  "automotive": "tesla",
  "battery": "tesla",

  // Productivity / SaaS
  "project management": "notion",
  "notes": "notion",
  "database": "notion",
  "collab": "notion",
  "team tool": "slack",
  "communication": "slack",
  "messaging": "slack",
  "integration": "zapier",
  "automation": "zapier",

  // AI / Tech
  "ai agent": "anthropic",
  "llm": "anthropic",
  "model": "anthropic",
  "ai copilot": "anthropic",
};

export function detectBenchmarkCompany(idea: string): string {
  const lowerIdea = idea.toLowerCase();
  for (const [keyword, company] of Object.entries(IDEA_TO_BENCHMARK)) {
    if (lowerIdea.includes(keyword)) {
      return company;
    }
  }
  // Default: Tesla (most comprehensive org structure)
  return "tesla";
}

// Strict variant: a benchmark only counts when a keyword matched AND we actually hold org data for
// it. Callers use this to choose dynamic crew vs. the default five — we never guess a crew for an
// idea we can't back with data (honesty invariant applies to crews too).
const SUPPORTED_BENCHMARKS = new Set(["tesla", "notion"]);

export function matchBenchmarkCompany(idea: string): string | null {
  const lowerIdea = idea.toLowerCase();
  for (const [keyword, company] of Object.entries(IDEA_TO_BENCHMARK)) {
    if (lowerIdea.includes(keyword) && SUPPORTED_BENCHMARKS.has(company)) return company;
  }
  return null;
}

// The roles a shift should prompt with: the default five, or the dynamic crew's roles when the idea
// matches a supported benchmark (e.g. EV ideas add the manufacturing agent).
// The default crew = every function that applies to ANY company (2026-07-05: finance/legal/ops are
// now first-class, not benchmark-gated). Manufacturing is the one deliberately-excluded role — it runs
// a physical supply chain, so it only makes sense for a physical-product idea and is added by the
// benchmark matcher below, never by default (it would generate nonsense "source suppliers" work on a
// pure-software company). Governance keeps a fuller crew safe: finance/legal/ops are locked to NEVER on
// every consequential act (see policy.ts), so more roles = more drafting/coverage, not more risk.
const DEFAULT_ROLES: AgentRole[] = ["ceo", "engineering", "marketing", "support", "growth", "finance", "legal", "ops"];

export function rolesForIdea(idea: string): AgentRole[] {
  if (!matchBenchmarkCompany(idea)) return DEFAULT_ROLES;
  try {
    const roles = generateCrewFromIdea(idea).agents.map((a) => a.role);
    return roles.length > 0 ? roles : DEFAULT_ROLES;
  } catch {
    return DEFAULT_ROLES;
  }
}

/* ── Spend Cap Allocation ────────────────────────────────────────── */

const SPEND_CAP_BY_ROLE: Record<AgentRole, number> = {
  ceo: 500000, // CEO can spend the most (strategy, capital allocation)
  engineering: 300000, // Engineering is expensive (salaries, infrastructure)
  manufacturing: 200000, // Manufacturing (ops, tooling, suppliers)
  marketing: 100000, // Marketing (campaigns, content, brand)
  growth: 100000, // Growth (ads, marketing, partnerships)
  support: 50000, // Support (customer service, training)
  ops: 100000, // Operations (vendors, logistics, process)
  finance: 50000, // Finance PREPARES money acts; the human moves money — small operating cap
  legal: 50000, // Legal drafts + prepares; never signs — small operating cap
};

/* ── Agent Profile Generation ────────────────────────────────────── */

export interface AgentProfile {
  name: string;
  role: AgentRole;
  responsibilities: string[];
  decisionRights: string[];
  keyMetrics: string[];
  playbook: string;
  spendCap: number;
  directReports: number;
  subAgents?: Array<{ name: string; focus: string; spendCap: number }>;
}

const PLAYBOOK_BY_ROLE: Record<AgentRole, string> = {
  ceo: "Playing to Win (Lafley & Martin) — strategy clarity, constraint diagnosis, resource allocation",
  engineering:
    "Shape Up (Basecamp) — appetite-driven, bet-driven, fixed scope; ship or kill",
  manufacturing: "Toyota Production System — lean ops, continuous improvement, just-in-time supply",
  marketing:
    "Obviously Awesome (April Dunford) — positioning clarity: ONE buyer, ONE job, one costly demand signal",
  growth:
    "Bullseye/Traction (Weinberg & Mares) — focus on one channel, test, scale; demand-first",
  support:
    "The Effortless Experience (CEB) — minimize customer effort, empower agents, measure effort score",
  finance:
    "Financial Intelligence (Berman & Knight) — runway, unit economics; prepare the money act, human moves money",
  legal:
    "Compliance-by-design — least-privilege, consent-first; draft + prepare, never auto-sign",
  ops:
    "The Goal / Theory of Constraints (Goldratt) — find the binding constraint, remove it, keep flow reversible",
};

function generateAgentProfile(jobRole: JobRole, role: AgentRole, idea: string): AgentProfile {
  const spendCap = SPEND_CAP_BY_ROLE[role];
  // Specialists come from the agency-agents-derived catalog (idea-aware): each role fields the specialists
  // most relevant to THIS idea, splitting the parent's cap evenly. The CEO fields fewer (it coordinates).
  const picks = specialistsForRole(role, idea, role === "ceo" ? 2 : 3);
  const subAgents = picks.map((s) => ({
    name: s.name,
    focus: s.focus,
    spendCap: Math.round(spendCap / Math.max(1, picks.length)),
  }));

  const cleanedName = jobRole.title
    .replace(/\b(chief executive officer|vice president|vp|director|senior|manager|head|chief|officer)\b/gi, "")
    .replace(/,/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    name: cleanedName || AGENTS[role].name,
    role,
    responsibilities: jobRole.responsibilities,
    decisionRights: jobRole.decisionRights,
    keyMetrics: jobRole.keyMetrics,
    playbook: PLAYBOOK_BY_ROLE[role],
    spendCap,
    directReports: jobRole.directReports || 0,
    subAgents: subAgents.length > 0 ? subAgents : undefined,
  };
}

/* ── Main Crew Generation ────────────────────────────────────────── */

export interface DynamicCrewOutput {
  idea: string;
  benchmarkCompany: string;
  agents: AgentProfile[];
  totalMonthlyCap: number;
  description: string;
}

/**
 * Generate a custom agent crew for a startup idea using a benchmark company's org structure.
 *
 * Example:
 * const crew = generateCrewFromIdea("EV with software-first architecture");
 * // Returns crew with CEO, Manufacturing Lead, Software Lead, Growth Lead, etc.
 */
export function generateCrewFromIdea(
  idea: string,
  benchmarkCompany?: string
): DynamicCrewOutput {
  // 1. Detect benchmark company
  const benchmark = benchmarkCompany || detectBenchmarkCompany(idea);

  // 2. Load raw jobs for benchmark company. Deterministic + synchronous (hardcoded org data), so
  // the same idea always yields the same crew — UI can compute it on the fly, no persistence needed.
  const rawJobs = loadBenchmarkJobs(benchmark);

  // 3. Parse jobs and group by role
  const parsedJobs = parseJobs(rawJobs);
  const jobsByRole = groupJobsByRole(parsedJobs);

  // 4. Select one "exemplary" job per role
  const selectedJobs = selectRepresentativeJobs(jobsByRole);

  // 5. Generate agent profiles
  const agentProfiles = selectedJobs.map(({ role, job }) =>
    generateAgentProfile(job, role, idea)
  );

  // 6. Ensure CEO is always first
  const ceoProfile = agentProfiles.find((a) => a.role === "ceo");
  const otherProfiles = agentProfiles.filter((a) => a.role !== "ceo");
  const agents = ceoProfile ? [ceoProfile, ...otherProfiles] : agentProfiles;

  // 7. Calculate total monthly spend cap
  const totalMonthlyCap = agents.reduce((sum, a) => sum + a.spendCap, 0);

  return {
    idea,
    benchmarkCompany: benchmark,
    agents,
    totalMonthlyCap,
    description: `Custom crew for: "${idea}". Generated from ${benchmark}'s org structure. ${agents.length} agents with ${agents.reduce((sum, a) => sum + (a.subAgents?.length || 0), 0)} sub-agents. Total monthly spend cap: $${(totalMonthlyCap / 1000).toFixed(0)}K.`,
  };
}

/* ── Helper Functions ────────────────────────────────────────────── */

function groupJobsByRole(jobs: ReturnType<typeof parseJobs>): Map<AgentRole, typeof jobs> {
  const grouped = new Map<AgentRole, typeof jobs>();

  for (const job of jobs) {
    const role = job.agentRole;
    if (!grouped.has(role)) {
      grouped.set(role, []);
    }
    grouped.get(role)!.push(job);
  }

  return grouped;
}

function selectRepresentativeJobs(
  jobsByRole: Map<AgentRole, ReturnType<typeof parseJobs>>
): Array<{ role: AgentRole; job: ReturnType<typeof parseJobs>[0] }> {
  const selected: Array<{ role: AgentRole; job: ReturnType<typeof parseJobs>[0] }> = [];

  for (const [role, jobs] of jobsByRole) {
    // Select the job with the highest level (more responsibilities = more representative)
    const sorted = jobs.sort((a, b) => {
      const levelOrder: Record<string, number> = {
        "CEO": 100,
        "Director+": 90,
        "L7": 80,
        "L6": 70,
        "L5": 60,
        "L4": 50,
      };
      return (levelOrder[b.level] || 50) - (levelOrder[a.level] || 50);
    });

    if (sorted.length > 0) {
      selected.push({ role, job: sorted[0] });
    }
  }

  return selected;
}

function loadBenchmarkJobs(
  company: string
): Array<{ title: string; description: string; level: string; compensation?: { base: number; stock: number; bonus: number } }> {
  // In production, fetch from API or database. For MVP, use hardcoded Tesla data.
  const benchmark = company.toLowerCase();

  if (benchmark === "tesla") {
    // Return hardcoded Tesla org data
    return TESLA_JOBS;
  }
  if (benchmark === "notion") {
    return NOTION_JOBS;
  }

  // For other benchmarks, use a fallback or fetch from Levels.fyi
  throw new Error(`Benchmark company '${company}' not yet supported. Supported: tesla, notion`);
}

// Notion-style org (SaaS/productivity benchmark) — no manufacturing; product-led growth shape.
const NOTION_JOBS = [
  {
    title: "Chief Executive Officer",
    level: "CEO",
    compensation: { base: 0, stock: 0, bonus: 0 },
    description:
      "Set product strategy and company direction. Make final decisions on roadmap, pricing, and capital allocation. Own the quality bar for the core product. Drive the product-led growth motion. Key metrics: weekly active users, net revenue retention, free-to-paid conversion.",
  },
  {
    title: "VP Engineering",
    level: "Director+",
    compensation: { base: 240000, stock: 500000, bonus: 60000 },
    description:
      "Own the platform: editor core, sync infrastructure, API, integrations. Lead reliability and performance work (real-time collaboration at scale). Direct reports: 60+ (product engineers, infra, QA). Key metrics: uptime, sync latency, API adoption, defect escape rate.",
  },
  {
    title: "Head of Marketing",
    level: "L7",
    compensation: { base: 190000, stock: 350000, bonus: 50000 },
    description:
      "Own the product-led growth engine: templates gallery, community, creator ecosystem, SEO. Drive self-serve signups without paid spend. Manage brand and launches. Direct reports: 15+. Key metrics: organic signups, activation rate, template installs, CAC.",
  },
  {
    title: "Head of Support",
    level: "L6",
    compensation: { base: 150000, stock: 220000, bonus: 30000 },
    description:
      "Own customer experience for self-serve and enterprise. Manage support quality, help docs, community moderation. Turn recurring issues into product signals. Direct reports: 20+. Key metrics: first-response time, CSAT, ticket deflection rate, churn saves.",
  },
  {
    title: "Growth Manager",
    level: "L5",
    compensation: { base: 140000, stock: 180000, bonus: 25000 },
    description:
      "Own the free-to-paid funnel: onboarding experiments, pricing-page tests, team-invite loops. Run A/B experiments end to end. Key metrics: free-to-paid conversion, invite rate, expansion revenue, experiment velocity.",
  },
];

// Hardcoded Tesla jobs for MVP (from Levels.fyi)
const TESLA_JOBS = [
  {
    title: "Chief Executive Officer",
    level: "CEO",
    compensation: { base: 0, stock: 56000000000, bonus: 0 },
    description:
      "Set strategic direction for the company. Drive innovation in electric vehicles, energy storage, and AI. Make final decisions on product roadmap, capital allocation, and organizational structure. Owns quarterly OKRs and company-wide metrics.",
  },
  {
    title: "VP, Manufacturing",
    level: "Director+",
    compensation: { base: 250000, stock: 500000, bonus: 100000 },
    description:
      "Lead manufacturing operations across all Gigafactories. Own production targets (currently 10K+ units/week). Responsible for supply chain, quality assurance, cost optimization. Direct reports: 50+ (plant managers, supply chain leads, quality heads). Key metrics: units produced/week, defect rate, cost per unit, on-time delivery.",
  },
  {
    title: "Senior Manager, Supply Chain",
    level: "L6",
    compensation: { base: 180000, stock: 300000, bonus: 60000 },
    description:
      "Own supply chain strategy for vehicle production. Manage relationships with 100+ suppliers (battery, semiconductors, materials). Forecast demand, negotiate contracts, mitigate risks. Direct reports: 20+ (buyer managers, logistics leads). Key metrics: supplier on-time delivery, cost reduction %, lead time reduction.",
  },
  {
    title: "Director, Battery Engineering",
    level: "L7",
    compensation: { base: 220000, stock: 600000, bonus: 80000 },
    description:
      "Lead battery technology development. Own cell chemistry, pack design, thermal management. Responsible for cost reduction roadmap ($/kWh target). Direct reports: 40+ (cell engineers, pack engineers, testing leads). Key metrics: energy density, cost per kWh, cycle life, safety certifications.",
  },
  {
    title: "VP, Software & AI",
    level: "Director+",
    compensation: { base: 280000, stock: 700000, bonus: 120000 },
    description:
      "Own all software for vehicles (firmware, Autopilot, infotainment, diagnostics). Lead autonomous driving development. Manage cloud infrastructure for OTA updates, data telemetry, ML training. Direct reports: 150+ (embedded engineers, ML researchers, platform engineers). Key metrics: lines of code deployed/week, Autopilot safety metrics, OTA update adoption rate.",
  },
  {
    title: "Senior Engineer, Firmware",
    level: "L5",
    compensation: { base: 160000, stock: 250000, bonus: 50000 },
    description:
      "Develop vehicle firmware (motor control, BMS, thermal systems). Optimize code for embedded constraints. Own safety-critical systems. Work with C/C++, RTOS, CAN/FlexRay protocols. Key metrics: code coverage, safety certifications, performance optimizations, defect escape rate.",
  },
  {
    title: "VP, Sales & Distribution",
    level: "Director+",
    compensation: { base: 200000, stock: 400000, bonus: 150000 },
    description:
      "Own go-to-market strategy. Manage direct-to-consumer sales (web, showrooms). Set pricing & discounts. Drive demand through marketing campaigns. Direct reports: 100+ (regional managers, store managers, marketeers). Key metrics: units sold/month, average selling price, conversion rate (website → order), customer satisfaction.",
  },
  {
    title: "Senior Manager, Global Marketing",
    level: "L6",
    compensation: { base: 140000, stock: 200000, bonus: 70000 },
    description:
      "Lead global marketing strategy & brand. Own content creation, social media, PR, partnerships. Run paid campaigns (Facebook, YouTube). Coordinate with regional teams. Direct reports: 25+ (content, social, regional managers). Key metrics: brand awareness, lead generation, CAC, viral reach, media coverage.",
  },
  {
    title: "Director, Customer Experience",
    level: "L7",
    compensation: { base: 190000, stock: 350000, bonus: 70000 },
    description:
      "Own customer satisfaction & support. Manage Supercharger network operations. Handle warranty claims, recalls, customer service training. Direct reports: 80+ (regional support heads, service center managers). Key metrics: NPS, customer satisfaction score, warranty claims resolved/month, Supercharger uptime %.",
  },
  {
    title: "Manager, Quality Assurance",
    level: "L5",
    compensation: { base: 130000, stock: 180000, bonus: 40000 },
    description:
      "Own QA strategy for manufacturing. Design test protocols, automation. Manage test automation infrastructure, failure analysis. Direct reports: 15+ (QA engineers, test technicians). Key metrics: defect escape rate, test coverage %, automation ROI, time-to-market.",
  },
];


/* ── Export for dashboard integration ────────────────────────────── */

/**
 * Lightweight export interface for storage & rendering.
 * Used by useEngine hook and Supabase persistence.
 */
export interface CrewSnapshot {
  idea: string;
  benchmark: string;
  agents: AgentProfile[];
  createdAt: number;
}

export function crewToSnapshot(output: DynamicCrewOutput): CrewSnapshot {
  return {
    idea: output.idea,
    benchmark: output.benchmarkCompany,
    agents: output.agents,
    createdAt: Date.now(),
  };
}
