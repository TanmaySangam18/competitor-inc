/**
 * Office vs House Two-Layer Agent Architecture
 *
 * Layer 1: OFFICE (System Meta-Agents)
 *   - Chief Audit Officer: Reviews House work, catches failures early
 *   - Policy Enforcer: Ensures House never violates governance rules
 *   - Resource Allocator: Distributes capital + compute + time across House
 *   Purpose: Systemic oversight, governance, risk management
 *
 * Layer 2: HOUSE (Founder's Team Agents)
 *   - CEO: Strategy + constraint diagnosis
 *   - Engineering, Manufacturing, Marketing, Support, Growth: Domain execution
 *   Purpose: Real work on the startup (validation, build, go-to-market)
 *
 * Office SUPERVISES House: Office agents review, veto, reallocate House work.
 * House EXECUTES: Proposes work, handles operations, takes feedback.
 *
 * This separation keeps systemic concerns (governance, risk) separate from
 * execution concerns (product, growth), enabling each layer to specialize.
 */

import type { Activity, AgentRole, ApprovalItem, Company } from "./types";

/* ── Layer Definitions ──────────────────────────────────────────────────── */

export type LayerName = "office" | "house";

export interface LayerAgent {
  name: string;
  role: string;
  layer: LayerName;
  parentAgent?: string; // Office agent supervising this House agent (if any)
}

/**
 * Office Agent Roles (System Governance)
 */
export type OfficeAgentRole = "auditor" | "policy-enforcer" | "allocator";

/**
 * House Agent Roles (Founder's Team)
 */
export type HouseAgentRole = AgentRole; // ceo, engineering, manufacturing, growth, support

/**
 * Two-layer system state
 */
export interface OfficeHouseState {
  office: {
    agents: Map<OfficeAgentRole, LayerAgent>;
    policies: PolicyConfig[];
    auditLog: AuditEvent[];
    allocations: ResourceAllocation;
  };
  house: {
    agents: Map<HouseAgentRole, LayerAgent>;
    activities: Activity[];
    approvals: ApprovalItem[];
    performance: Map<HouseAgentRole, PerformanceMetrics>;
  };
}

/**
 * Policy Configuration (Office enforces these on House)
 */
export interface PolicyConfig {
  id: string;
  name: string;
  rule: string; // e.g., "spend > $10K must have approval"
  severity: "soft" | "hard"; // soft = warning, hard = veto
  enforcedBy: OfficeAgentRole; // which office agent enforces this
}

/**
 * Audit Event (Office logs all House actions)
 */
export interface AuditEvent {
  id: string;
  timestamp: number;
  action: string;
  actor: HouseAgentRole | OfficeAgentRole;
  impact: "success" | "failure" | "warning";
  details: string;
}

/**
 * Resource Allocation (Office distributes capital/compute/time)
 */
export interface ResourceAllocation {
  capital: {
    total: number;
    allocated: Map<HouseAgentRole, number>;
  };
  compute: {
    total: number; // model calls per month
    allocated: Map<HouseAgentRole, number>;
  };
  time: {
    total: number; // days per quarter
    allocated: Map<HouseAgentRole, number>;
  };
}

/**
 * House Performance Metrics (Office uses to manage)
 */
export interface PerformanceMetrics {
  agent: HouseAgentRole;
  roi: number; // return on capital invested ($spend → $impact)
  efficiency: number; // work done / resources used
  successRate: number; // % of proposed actions that succeeded
  violationCount: number; // times Office had to veto
}

/* ── Office Agent Responsibilities ─────────────────────────────────────── */

/**
 * Chief Audit Officer (Office)
 *   - Reviews every House activity AFTER execution
 *   - Catches failures, fraud, hallucinations
 *   - Logs to audit trail for founder review
 *   - Can flag for investigation
 */
export function auditActivity(
  activity: Activity,
  proof: any
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check 1: Proof matches claim
  if (activity.proof && !validateProof(activity.proof, proof)) {
    issues.push(`Proof invalid: claimed "${activity.proof.value}" but proof shows different`);
  }

  // Check 2: Cost is reasonable
  if (activity.cost > 100000 && !activity.proof) {
    issues.push(`High-cost action ($${activity.cost}) without proof of completion`);
  }

  // Check 3: No suspicious patterns
  if (isSuspiciousPattern(activity)) {
    issues.push("Suspicious activity pattern detected (possible agent jailbreak)");
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Policy Enforcer (Office)
 *   - Vetoes House proposals that violate governance
 *   - Applies veto BEFORE action executes (not after)
 *   - Logs all vetos for founder
 */
export function enforcePolicy(
  proposal: any,
  policies: PolicyConfig[]
): { approved: boolean; violations: string[] } {
  const violations: string[] = [];

  for (const policy of policies) {
    if (violatesPolicy(proposal, policy)) {
      violations.push(`Violates: ${policy.name}`);
      if (policy.severity === "hard") {
        // Hard veto: block immediately
        return { approved: false, violations };
      }
    }
  }

  return {
    approved: violations.length === 0,
    violations,
  };
}

/**
 * Resource Allocator (Office)
 *   - Determines capital + compute + time per House agent each quarter
 *   - Rebalances based on performance (high ROI agents get more)
 *   - Caps spend to stay within founder's total budget
 */
export function allocateResources(
  company: Company,
  housePerformance: Map<HouseAgentRole, PerformanceMetrics>,
  totalBudget: number
): ResourceAllocation {
  // Calculate ROI-weighted allocation
  const roiWeights = calculateRoiWeights(housePerformance);

  const allocation: ResourceAllocation = {
    capital: {
      total: totalBudget,
      allocated: new Map(),
    },
    compute: {
      total: 1000000, // 1M model calls/month default
      allocated: new Map(),
    },
    time: {
      total: 90, // 90 days/quarter
      allocated: new Map(),
    },
  };

  // Allocate capital by ROI
  for (const [agent, weight] of roiWeights) {
    const capitalShare = Math.round(totalBudget * weight);
    allocation.capital.allocated.set(agent, capitalShare);
  }

  // Allocate compute by recent usage
  for (const [agent, weight] of roiWeights) {
    const computeShare = Math.round(1000000 * weight);
    allocation.compute.allocated.set(agent, computeShare);
  }

  return allocation;
}

/* ── Helper Functions ──────────────────────────────────────────────────── */

function validateProof(claimed: any, actual: any): boolean {
  // Verify proof matches claim (implementation depends on proof type)
  if (claimed.kind === "url") {
    return actual.statusCode === 200 && actual.url === claimed.value;
  }
  if (claimed.kind === "build") {
    return actual.commitSha && actual.deployedAt;
  }
  if (claimed.kind === "metric") {
    return actual.value != null && actual.timestamp;
  }
  return false;
}

function isSuspiciousPattern(activity: Activity): boolean {
  // Red flags for agent hallucinations or jailbreaks
  const suspiciousPhrases = ["definitely", "certainly", "100% sure", "guaranteed"];
  const actionLower = activity.action.toLowerCase();

  // Check 1: Overconfident language in uncertain contexts
  if (
    suspiciousPhrases.some((p) => actionLower.includes(p)) &&
    !activity.proof
  ) {
    return true;
  }

  // Check 2: Impossible activity (e.g., "shipped to 1M users" in one night)
  if (
    actionLower.includes("million") &&
    actionLower.includes("user") &&
    activity.cost < 10000
  ) {
    return true;
  }

  // Check 3: Cost doesn't match activity
  if (activity.action.includes("small fix") && activity.cost > 50000) {
    return true;
  }

  return false;
}

function violatesPolicy(proposal: any, policy: PolicyConfig): boolean {
  // Check if proposal violates policy rule
  // Implementation depends on policy type
  if (policy.name.includes("spend")) {
    return proposal.amount > parseFloat(policy.rule);
  }
  return false;
}

function calculateRoiWeights(
  performance: Map<HouseAgentRole, PerformanceMetrics>
): Map<HouseAgentRole, number> {
  const weights = new Map<HouseAgentRole, number>();

  // Calculate total ROI
  let totalRoi = 0;
  for (const metrics of performance.values()) {
    totalRoi += metrics.roi;
  }

  // Normalize to weights
  for (const [agent, metrics] of performance) {
    const weight = totalRoi > 0 ? metrics.roi / totalRoi : 1 / performance.size;
    weights.set(agent, weight);
  }

  return weights;
}

/* ── Office Dashboard (for Founder Review) ─────────────────────────────── */

/**
 * Office generates weekly governance report for founder
 */
export interface OfficeReport {
  week: number;
  housePerformance: Map<HouseAgentRole, PerformanceMetrics>;
  policyViolations: { agent: string; violation: string; count: number }[];
  auditIssues: AuditEvent[];
  recommendations: string[]; // e.g., "Reallocate 20% of capital from X to Y"
  riskScore: number; // 0-100 (0 = safe, 100 = critical)
}

export function generateOfficeReport(
  state: OfficeHouseState,
  week: number
): OfficeReport {
  const policyViolations = analyzeViolations(state.office.auditLog);
  const auditIssues = state.office.auditLog.filter((e) => e.impact !== "success");
  const riskScore = calculateRiskScore(auditIssues, policyViolations);
  const recommendations = proposeRebalancing(state.house.performance);

  return {
    week,
    housePerformance: state.house.performance,
    policyViolations,
    auditIssues,
    recommendations,
    riskScore,
  };
}

function analyzeViolations(
  auditLog: AuditEvent[]
): { agent: string; violation: string; count: number }[] {
  const violations: { agent: string; violation: string; count: number }[] = [];
  const grouped = new Map<string, number>();

  for (const event of auditLog) {
    if (event.impact === "warning" || event.impact === "failure") {
      const key = `${event.actor}:${event.details}`;
      grouped.set(key, (grouped.get(key) || 0) + 1);
    }
  }

  for (const [key, count] of grouped) {
    const [agent, violation] = key.split(":");
    violations.push({ agent, violation, count });
  }

  return violations.sort((a, b) => b.count - a.count);
}

function calculateRiskScore(
  auditIssues: AuditEvent[],
  violations: { agent: string; violation: string; count: number }[]
): number {
  // Simple risk model: more issues = higher risk
  let score = 0;
  score += Math.min(auditIssues.length * 5, 50); // Issues: up to 50 points
  score += Math.min(violations.length * 10, 50); // Violations: up to 50 points
  return Math.min(score, 100);
}

function proposeRebalancing(
  performance: Map<HouseAgentRole, PerformanceMetrics>
): string[] {
  const recommendations: string[] = [];

  // Find lowest ROI agent
  let lowestRoi = Infinity;
  let lowestAgent: HouseAgentRole | null = null;

  for (const [agent, metrics] of performance) {
    if (metrics.roi < lowestRoi) {
      lowestRoi = metrics.roi;
      lowestAgent = agent;
    }
  }

  if (lowestAgent) {
    recommendations.push(
      `${lowestAgent} has low ROI (${lowestRoi.toFixed(2)}). Consider reallocating capital to higher-ROI agents.`
    );
  }

  return recommendations;
}

/* ── Integration with House Execution ───────────────────────────────────── */

/**
 * Before House activity executes, Office approves
 */
export async function officeApproval(
  activity: Activity,
  office: OfficeHouseState["office"],
  house: OfficeHouseState["house"]
): Promise<{ approved: boolean; reason: string }> {
  // Policy Enforcer checks proposal
  const policyViolations = house.approvals.filter(
    (a) => a.resolved === "rejected"
  );
  if (policyViolations.length > 5) {
    return {
      approved: false,
      reason: "Office veto: too many recent policy violations",
    };
  }

  // Resource Allocator checks budget
  const agentSpent = calculateAgentSpent(activity.agent, house.activities);
  const allocation = office.allocations.capital.allocated.get(activity.agent as HouseAgentRole);
  if (allocation && agentSpent + activity.cost > allocation) {
    return {
      approved: false,
      reason: `Office veto: ${activity.agent} over budget (spent $${agentSpent}, allocation $${allocation})`,
    };
  }

  return { approved: true, reason: "Office approval granted" };
}

function calculateAgentSpent(agent: AgentRole, activities: Activity[]): number {
  return activities
    .filter((a) => a.agent === agent)
    .reduce((sum, a) => sum + a.cost, 0);
}
