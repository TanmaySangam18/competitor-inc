// lib/core — THE company operating system, headless (no React, no Next, no env required to load). One
// import surface that assembles the salvaged crown-jewel pieces into a single API so the SAME core runs
// behind the web app, the CLI (bin/competitor.ts), and — next — the MCP transport. Competitor runs its own
// company on this; customers get the identical core. This is the "assemble the puzzle into one company"
// seed (docs/BACKEND-RESET-PLAN.md): it does not re-implement anything — it re-exports the proven pieces
// under one roof, and every future consolidation collapses a duplicate INTO here.
//
// Invariants (never weakened): honesty · verify-before-done · money & irreversible acts human-approved ·
// spend caps · kill switch · reversibility · tenant isolation. Governance below is their single home.

import {
  ROLES, DEPARTMENTS, getRole, directReports, reportingChain, orgSize, validateOrg,
  type OrgRole, type Department,
} from "@/lib/org/organization";
import { ROLE_TITLE, ROLE_DEPARTMENT, ROLE_INITIALS, titleFor } from "@/lib/org/role-titles";
import {
  decide, withinCaps, executionRefusal, POLICY,
  type ActionContext, type PolicyDecision, type Verdict, type ExecAction,
} from "@/lib/engine/policy";
import { AGENTS, type AgentRole } from "@/lib/engine/types";
import { deliberate, type DecisionRecord, type Position, type Reasoner } from "./deliberate";
import { plan, type Plan } from "./plan";
import { coordinate, type Coordination } from "./coordinate";
import { checkHealth, type Health, type HealthCheck } from "./health";
import { paymentsConfigured, connectProduct, checkoutUrl, type Onboarding } from "./payments";
import { outreachFor, AGENCY_ICP, qualifyLead, outreachGate, type OutreachPlan, type Lead, type ICP } from "./outreach";

// ── ORG: the one canonical org model — 66 positions across departments, each routing (via execFn) to one
// of the 9 governed execution functions. Salvaged from lib/org/organization.ts; this is now the entry point.
export const org = {
  roles: ROLES,
  departments: DEPARTMENTS,
  size: orgSize,
  getRole,
  reports: directReports,
  chain: reportingChain,
  validate: validateOrg,
};

// ── AGENTS: the governed roster — the 9 execution functions with real software-company titles (codenames
// retired). This is the single canonical naming; the ≥5 legacy rosters collapse into this over the reset.
export const agents = {
  roles: (Object.keys(AGENTS) as AgentRole[]).map((id) => ({
    id,
    title: ROLE_TITLE[id],
    department: ROLE_DEPARTMENT[id],
    initials: ROLE_INITIALS[id],
    blurb: AGENTS[id].blurb,
  })),
  titleFor,
};

// ── GOVERNANCE: the one decision spine. decide() → AUTO | QUEUE | BLOCK is the whole enforcement model.
// The kill switch, spend caps, forbidden floor, and human-reserved acts all live here. Never weakened.
export const governance = {
  decide,
  withinCaps,
  refusal: executionRefusal,
  policy: POLICY,
};

// ── DELIBERATE (Phase 2 seed): convene the right roles on a task → a governed Decision Record. The seam
// where real model-reasoned debate plugs in; today the stances are mandate-derived (flagged simulated).
export { deliberate };

// ── PLAN (Phase 2): a goal → a coordinated task plan mapped to the org's IC→lead→sign-off chain.
export { plan };

// ── COORDINATE (Phase 2): the loop closed — goal → plan → deliberate+govern every task → one result.
export { coordinate };

// ── HEALTH: the body's vitals — one self-check that the whole core is coherent + alive (keyless).
export { checkHealth };

// ── PAYMENTS (Phase 3): onboard a product's own Stripe + open checkout. Funds settle to the CUSTOMER;
// we orchestrate, never hold the money. Fail-soft (configured:false) until a key is connected.
export { paymentsConfigured, connectProduct, checkoutUrl };

// ── OUTREACH (Phase 4): the reach rail — qualify a lead against the ICP, run the no-spam gate, draft an
// honest named-AI first-touch. Keyless; sending (Gmail) + sourcing (Explee) light up with their keys.
export { outreachFor };

export const core = {
  org, agents, governance, deliberate, plan, coordinate, checkHealth,
  payments: { configured: paymentsConfigured, connectProduct, checkoutUrl },
  outreach: { icp: AGENCY_ICP, qualify: qualifyLead, gate: outreachGate, for: outreachFor },
};

export type { OrgRole, Department, ActionContext, PolicyDecision, Verdict, ExecAction, AgentRole, DecisionRecord, Position, Reasoner, Plan, Coordination, Health, HealthCheck, Onboarding, OutreachPlan, Lead, ICP };
export default core;
