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

export const core = { org, agents, governance };

export type { OrgRole, Department, ActionContext, PolicyDecision, Verdict, ExecAction, AgentRole };
export default core;
