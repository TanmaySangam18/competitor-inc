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
  decide, withinCaps, executionRefusal, scoreTier, tierToVerdict, governedDecision, POLICY,
  type ActionContext, type PolicyDecision, type Verdict, type ExecAction, type Tier, type TierScore, type GovernedDecision,
} from "@/lib/engine/policy";
import { AGENTS, type AgentRole } from "@/lib/engine/types";
import { deliberate, type DecisionRecord, type Position, type Reasoner } from "./deliberate";
import { plan, type Plan } from "./plan";
import { coordinate, type Coordination } from "./coordinate";
import { checkHealth, type Health, type HealthCheck } from "./health";
import { paymentsConfigured, connectProduct, checkoutUrl, type Onboarding } from "./payments";
import { outreachFor, AGENCY_ICP, qualifyLead, outreachGate, type OutreachPlan, type Lead, type ICP } from "./outreach";
import { outreachConfigured, compliantMessage, sendFirstTouch, type SendResult } from "./outreach-send";
import { triageTicket, ticketToSignal, improve, type Signal, type Ticket, type TicketTriage, type OperateCycle } from "./operate";
import { listServices, getService, SERVICES, type Service, type ServiceStatus } from "./services";
import { conversation, conversationFrom, conversationSlackText, initialsOf, type Conversation, type Turn } from "./conversation";
import { auditLog, AuditLog, MemoryAuditSink, type AuditEntry, type AuditInput, type AuditSink, type IntegrityResult } from "./audit";
import { killSwitch, type KillSwitchState } from "./killswitch";
import { governAction, type GovernResult, type GovernOptions } from "./govern";
import { screenIntake, classifyActivity, enforceFreeze, type IntakeResult, type IntakeDecision, type ActivitySignals, type ActivityAssessment, type FreezeOutcome, type Risk } from "./abuse";
import { runFailureDrills, type DrillReport, type DrillResult } from "@/lib/sim/failure-drills";
import { rollupCosts, marginFor, spendAnomaly, type CostRollup, type Margin, type SpendAnomaly } from "./economics";
import { precedents, PrecedentStore, normalizeQuestion, type Precedent, type ConsultResult } from "./precedent";
import { canVerify, assignReviewer, sharesLineage, requiresRegression, type ChangeKind } from "./separation";
import { vault, EnvVault, NullVault, type VaultClient } from "./vault";
import { providerStatus, selectProvider, failoverChain, hasFailover, DEFAULT_ORDER, PROVIDER_ENV, type Provider, type ProviderStatus } from "./providers";
import { prompts, PromptRegistry, type PromptVersion } from "./prompts";
import { pairedMetric, reportKpi, suspectGaming, assertNoKpiTargets, COUNTER_METRIC, type KpiReport } from "./kpi";
import { exportData, planDeletion, type ExportBundle, type DeletionPlan } from "./dsr";
import { readiness, type Readiness, type DoDCheck } from "./readiness";

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
  scoreTier,       // the T0–T3 risk scorer (REQUIREMENTS §1)
  tierToVerdict,
  governedDecision, // decide() ∧ scoreTier, reconciled to the stricter verdict
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

// ── ECONOMICS (Tier B1 · REQUIREMENTS §2): per-customer unit economics rolled up from the A1 audit ledger's
// costUsd — cost per customer/agent/action, per-customer margin with an alarm, and a spend-spike detector.
export { rollupCosts, marginFor, spendAnomaly };

// ── OUTREACH (Phase 4): the reach rail — qualify a lead against the ICP, run the no-spam gate, draft an
// honest named-AI first-touch. Keyless; sending (Gmail) + sourcing (Explee) light up with their keys.
export { outreachFor };

// ── OPERATE (Phase 5): the autonomous improvement loop — end-user tickets + product signals → governed
// fixes (auto vs the owner's approval vs blocked) → verify → report. The operator layer, not just a builder.
export { triageTicket, improve };

// ── SERVICES: the catalog a customer hires from — the flagship build-run-sell plus growth, support, sales,
// market-watch, and data-copilot. Each maps to real roles and carries an HONEST status (ready/partial/
// planned). This is the offering surface; the capabilities themselves live in the modules above.
export { listServices, getService };

// ── CONVERSATION: the team room made watchable — a governed deliberation rendered as a chair-led
// conversation the customer can watch (on the website + posted to Slack). A presentation over the REAL
// Decision Record; carries the same `simulated` honesty flag. Live reasoning wakes with a model key.
export { conversation, conversationFrom, conversationSlackText };

// ── CONTROL PLANE (Tier A1 · REQUIREMENTS §3, DoD #1/#2): the black-box recorder (append-only, tamper-
// evident audit ledger) + the out-of-band kill switch (global/per-agent/per-customer). governAction is the
// single governed entry point: kill switch → decide() → audit-record, in that order, every time.
export { auditLog, killSwitch, governAction };

// ── ABUSE CONTAINMENT (Tier A4 · REQUIREMENTS §14): screen customer intake against the prohibited-use list;
// classify a running customer's behavior; auto-freeze a bad customer's namespace (via the A1 kill switch)
// while preserving data. The classifier flags; a human + the lawyer's AUP adjudicate.
export { screenIntake, classifyActivity, enforceFreeze };

// ── SHIP GATE (Tier A3 · REQUIREMENTS §15): the six injected failure drills the whole company must survive
// before a real customer. Exercises the real control-plane modules; passing all six is a hard gate.
export { runFailureDrills };

// ── PRECEDENT (Tier C4 · §1): human rulings → machine-readable policy; agents consult before escalating so
// the same question never reaches the human twice. VERIFICATION SEPARATION (Tier C3 · §5): no agent verifies
// its own lineage; prompt/model changes force a regression run.
export { precedents, canVerify, assignReviewer, requiresRegression };

// ── TIER D (resilience + governance hooks): vault client (secrets never in prompts/logs — §2/§4) ·
// multi-provider failover (no single-API dependency — §9) · prompts-as-code (versioned, rollback — §7) ·
// anti-Goodhart KPIs (external, counter-metric-paired — §13) · GDPR export/delete (deletion = T3, human — §8).
export { vault, providerStatus, selectProvider, hasFailover, prompts, reportKpi, pairedMetric, suspectGaming, exportData, planDeletion };

// ── READINESS (the Definition-of-Done gate): runs the REQUIREMENTS 8-check scorecard against the real
// modules. `ready` only when the safety-critical checks pass and nothing is todo. The honest go/no-go for
// lifting maintenance to a real customer.
export { readiness };

export const core = {
  org, agents, governance, deliberate, plan, coordinate, checkHealth,
  payments: { configured: paymentsConfigured, connectProduct, checkoutUrl },
  outreach: { icp: AGENCY_ICP, qualify: qualifyLead, gate: outreachGate, for: outreachFor, configured: outreachConfigured, compliant: compliantMessage, send: sendFirstTouch },
  operate: { triageTicket, ticketToSignal, improve },
  listServices, getService, services: SERVICES,
  room: { conversation, from: conversationFrom, slackText: conversationSlackText, initials: initialsOf },
  govern: governAction,
  audit: auditLog,
  killSwitch,
  abuse: { screenIntake, classifyActivity, enforceFreeze },
  drills: runFailureDrills,
  economics: { rollup: rollupCosts, margin: marginFor, anomaly: spendAnomaly },
  precedent: { store: precedents, consult: (q: string, scope?: string) => precedents.consult(q, scope), record: (i: { question: string; ruling: string; scope?: string; setBy?: string }) => precedents.record(i) },
  separation: { canVerify, assignReviewer, sharesLineage, requiresRegression },
  vault,
  providers: { status: providerStatus, select: selectProvider, failoverChain, hasFailover },
  prompts,
  kpi: { paired: pairedMetric, report: reportKpi, suspectGaming, assertNoKpiTargets, counters: COUNTER_METRIC },
  dsr: { exportData, planDeletion },
  readiness,
};

export type { OrgRole, Department, ActionContext, PolicyDecision, Verdict, ExecAction, Tier, TierScore, GovernedDecision, AgentRole, DecisionRecord, Position, Reasoner, Plan, Coordination, Health, HealthCheck, Onboarding, OutreachPlan, Lead, ICP, Signal, Ticket, TicketTriage, OperateCycle, SendResult, Service, ServiceStatus, Conversation, Turn, AuditEntry, AuditInput, AuditSink, IntegrityResult, KillSwitchState, GovernResult, GovernOptions };
export { AuditLog, MemoryAuditSink };
export type { IntakeResult, IntakeDecision, ActivitySignals, ActivityAssessment, FreezeOutcome, Risk, DrillReport, DrillResult, CostRollup, Margin, SpendAnomaly, Precedent, ConsultResult, ChangeKind };
export { PrecedentStore, normalizeQuestion };
export type { VaultClient, Provider, ProviderStatus, PromptVersion, KpiReport, ExportBundle, DeletionPlan, Readiness, DoDCheck };
export default core;
