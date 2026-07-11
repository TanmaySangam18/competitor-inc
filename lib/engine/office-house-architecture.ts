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
function auditActivity(
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
 * Chief Audit Officer — shift-level sweep (the version wired into the nightly cron).
 * Unlike auditActivity(), this needs no external "actual" proof oracle: it runs the checks the
 * Office CAN make at shift time — suspicious/hallucination patterns and high-cost-without-proof —
 * over every activity a shift produced, and returns the flagged ones for the founder's alert feed.
 */
export function auditShiftActivities(
  activities: Activity[]
): { flagged: Array<{ activity: Activity; issues: string[] }>; clean: number } {
  const flagged: Array<{ activity: Activity; issues: string[] }> = [];
  for (const a of activities) {
    const issues: string[] = [];
    if (a.cost > 100000 && !a.proof) {
      issues.push(`High-cost action ($${a.cost}) with no proof of completion`);
    }
    if (isSuspiciousPattern(a)) {
      issues.push("Suspicious pattern (possible hallucination / overclaim)");
    }
    if (issues.length > 0) flagged.push({ activity: a, issues });
  }
  return { flagged, clean: activities.length - flagged.length };
}

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

