// ─────────────────────────────────────────────────────────────────────────────
// ORG PLAN (Phase 2) — turn a customer's goal into a task DAG that mirrors the REAL org chart.
//
// The founder's dream: a customer describes a project → work is spanned to DEPARTMENT agents → it flows UP
// a hierarchy (IC → lead → PM/exec → founder). This module produces exactly that shape as an `AgentTask[]`
// the existing supervisor already knows how to run: each stage's IC does the work, its manager
// (reportsTo) independently reviews it, the build — the product itself — rolls the full IC→lead→exec chain,
// and any act on a role's `humanApprovalFor` list escalates to the founder's desk (never auto-fires).
//
// It is a CURATED critical path, not all 56 roles: a real company doesn't put every employee on every
// project either. The positions, reporting lines, and human-approval gates are all read from the single
// source of truth (lib/org/organization.ts), so the org chart and the execution can never drift.
//
// Pure + deterministic + dependency-injection-free → unit-testable with zero model calls.
// ─────────────────────────────────────────────────────────────────────────────

import type { AgentTask } from "./task-queue";
import type { AgentRole } from "./types";
import type { SpineActKind } from "./accountability-spine";
import { getRole, type OrgRole } from "@/lib/org/organization";

export interface OrgPlanOptions {
  operate?: boolean; // append the ongoing company functions (launch / support / monetize / comply)
}

type DeskAct = { kind: SpineActKind; title: string; action: string };

// One step of the critical path. `deepChain` emits the explicit IC→lead→exec nodes (used for the build —
// the product being shipped is where the hierarchy matters most). `verifierRoleId` overrides the default
// independent reviewer (a role's manager) — e.g. the build review is checked by Quality, cross-department.
interface Stage {
  id: string;
  icRoleId: string; // the position that does the work
  verb: string; // "Build the working software for", …
  priority: number;
  operate?: boolean;
  deepChain?: boolean;
  verifierRoleId?: string;
  desk?: DeskAct; // a founder-gated act this stage prepares
}

// The path that ships a software product (core) and then runs it as a business (operate). Every id here is
// a real OrgRole id in organization.ts — a typo fails loudly in `mustRole` (and in the tests) rather than
// silently skipping work.
const STAGES: Stage[] = [
  { id: "plan", icRoleId: "chief-executive-officer", verb: "Set the brief, scope, and success metric for", priority: 10, verifierRoleId: "head-of-analytics" },
  { id: "spec", icRoleId: "product-manager", verb: "Write the product spec + acceptance criteria for", priority: 9 },
  { id: "build", icRoleId: "fullstack-engineer", verb: "Build the working software for", priority: 8, deepChain: true, verifierRoleId: "head-of-quality" },
  { id: "quality", icRoleId: "manual-qa-analyst", verb: "Run the verify-before-done gate on", priority: 6, verifierRoleId: "head-of-quality" },
  // ── operate: run the shipped product as a business ──
  {
    id: "launch", icRoleId: "content-marketer", verb: "Draft the launch announcement for", priority: 5, operate: true,
    desk: { kind: "approve_publish", title: "Approve the launch post", action: "Review the drafted announcement, then approve to publish" },
  },
  { id: "care", icRoleId: "support-engineer-tier-1", verb: "Prepare customer support + onboarding for", priority: 4, operate: true },
  {
    id: "monetize", icRoleId: "billing-operations-specialist", verb: "Set up billing + licensing for", priority: 4, operate: true,
    desk: { kind: "move_money", title: "Approve billing go-live", action: "Connect the payout account (KYC), then approve billing to go live — only a human can" },
  },
  {
    id: "comply", icRoleId: "compliance-officer", verb: "Draft the terms, privacy, and compliance for", priority: 3, operate: true,
    desk: { kind: "sign_contract", title: "Review and sign the terms", action: "Review the drafted terms / privacy, then sign — only a human can" },
  },
];

function mustRole(id: string): OrgRole {
  const r = getRole(id);
  if (!r) throw new Error(`org-plan references unknown org role '${id}' — fix STAGES or organization.ts`);
  return r;
}

// The independent reviewer for a position: an explicit override, else its manager (reportsTo). A manager
// reviewing their report is genuinely independent (different position, supervisory) — the supervisor's
// org-role-aware honesty check (Phase 2b) accepts it; only self-review by the SAME position is rejected.
function verifierIdFor(role: OrgRole, override?: string): string {
  if (override && override !== role.id) return override;
  if (role.reportsTo && role.reportsTo !== role.id) return role.reportsTo;
  return "head-of-analytics"; // the root (CEO) is checked against evidence, not by a subordinate
}

function taskFor(
  id: string,
  role: OrgRole,
  goalLine: string,
  priority: number,
  blockingOn: string[],
  opts: { verifierRoleId?: string; desk?: DeskAct } = {},
): AgentTask {
  const manager = role.reportsTo ? getRole(role.reportsTo) : undefined;
  return {
    id,
    goal: goalLine,
    role: role.execFn as AgentRole,
    blockingOn,
    priority,
    orgRoleId: role.id,
    orgTitle: role.title,
    orgLevel: role.level,
    reportsToTitle: manager?.title ?? null,
    verifierOrgRoleId: verifierIdFor(role, opts.verifierRoleId),
    ...(opts.desk ? { deskAct: opts.desk } : {}),
  };
}

// Build the hierarchical DAG. Core stages chain linearly (plan→spec→build→quality); operate stages each
// hang off the completed core (they run once there's a verified product to launch/support/monetize).
export function buildOrgPlan(goal: string, opts: OrgPlanOptions = {}): AgentTask[] {
  const tasks: AgentTask[] = [];
  let coreTail: string | null = null;

  for (const stage of STAGES.filter((s) => !s.operate)) {
    const ic = mustRole(stage.icRoleId);
    const blocking = coreTail ? [coreTail] : [];
    const goalLine = `${stage.verb}: ${goal}`;

    if (stage.deepChain) {
      // The product itself: IC builds → team lead reviews → the lead's manager signs off (the visible
      // IC→lead→manager chain — the deepest hierarchy, because the shipped software is where it matters).
      const lead = mustRole(ic.reportsTo ?? "");
      const signer = mustRole(lead.reportsTo ?? "");
      const icId = `${stage.id}-ic`;
      const reviewId = `${stage.id}-review`;
      const signoffId = `${stage.id}-signoff`;
      tasks.push(taskFor(icId, ic, `${stage.verb}: ${goal}`, stage.priority, blocking));
      tasks.push(taskFor(reviewId, lead, `Review + verify the build of: ${goal}`, stage.priority - 1, [icId], { verifierRoleId: stage.verifierRoleId }));
      tasks.push(taskFor(signoffId, signer, `Sign off production-readiness of: ${goal}`, stage.priority - 2, [reviewId]));
      coreTail = signoffId;
    } else {
      tasks.push(taskFor(stage.id, ic, goalLine, stage.priority, blocking, { verifierRoleId: stage.verifierRoleId }));
      coreTail = stage.id;
    }
  }

  if (opts.operate && coreTail) {
    for (const stage of STAGES.filter((s) => s.operate)) {
      const ic = mustRole(stage.icRoleId);
      tasks.push(taskFor(stage.id, ic, `${stage.verb}: ${goal}`, stage.priority, [coreTail], { verifierRoleId: stage.verifierRoleId, desk: stage.desk }));
    }
  }

  return tasks;
}

// Render the plan as the visible IC→…→founder chain for the Glass Box / Slack (used in Phase 2c).
export function renderOrgChain(tasks: AgentTask[]): string[] {
  return tasks.map((t) => {
    const who = t.orgTitle ? `${t.orgTitle}${t.orgLevel ? ` (${t.orgLevel})` : ""}` : t.role;
    const up = t.reportsToTitle ? ` → reports to ${t.reportsToTitle}` : "";
    const gate = t.deskAct ? `  ⟶ escalates to founder: ${t.deskAct.title}` : "";
    return `${who}: ${t.goal}${up}${gate}`;
  });
}
