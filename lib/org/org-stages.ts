// ─────────────────────────────────────────────────────────────────────────────
// STAGED ENTERPRISE — the company GROWS as the customer's project earns it (Phase 7, Living Org C.1).
//
// Founder vision (2026-07-09): a customer doesn't get a static crew — they get a COMPANY that matures
// like a real one (the "mature enterprise blueprint" report): a garage team first, then go-to-market,
// then monetization, then full corporate depth. The honesty rule that makes this real and not theater:
// STAGES ADVANCE ONLY ON MEASURED SIGNALS (a verified live build, real signups, real revenue events) —
// the org never inflates itself to look impressive. Cash before infrastructure.
//
// Pure module: no I/O, no model calls. The Living Org surface (C.2) renders it; org-plan consumes it.
// ─────────────────────────────────────────────────────────────────────────────

import { DEPARTMENTS, ROLES, type Department, type OrgRole } from "./organization";

export type CompanyStage = "garage" | "seed" | "growth" | "enterprise";

export const STAGE_ORDER: CompanyStage[] = ["garage", "seed", "growth", "enterprise"];

// The real, measurable signals a company's maturity is derived from. All default false/0 — a brand-new
// company is a garage company. The caller feeds these from REAL data (verified build URL, signups table,
// revenue_events) — never from narration.
export interface StageSignals {
  hasVerifiedLiveBuild?: boolean; // a deploy that passed verify-before-done (the product EXISTS)
  signups?: number; // real captured signups/users for the built product
  revenueEventCents?: number; // real collected revenue events (settled, not projected)
  repeatCustomers?: number; // customers with a second paid period (repeatability)
}

// Which departments are ACTIVE at each stage — the org "hires" a department only when the project
// genuinely needs it. Executive/engineering/product/design/quality build the thing; revenue/customer/data
// come online to sell + support a live product; licensing/finance to collect money; legal for the
// full-depth company running real contracts.
const STAGE_DEPARTMENTS: Record<CompanyStage, string[]> = {
  garage: ["executive", "engineering", "product", "design", "quality"],
  seed: ["executive", "engineering", "product", "design", "quality", "revenue", "customer", "data"],
  growth: ["executive", "engineering", "product", "design", "quality", "revenue", "customer", "data", "licensing", "finance"],
  enterprise: DEPARTMENTS.map((d) => d.id), // all 11 — the full company
};

// Human-readable story per stage — the Living Org narrates growth honestly ("Revenue came online when
// your product went live"), so the customer FEELS the company maturing around their project.
export const STAGE_STORY: Record<CompanyStage, { label: string; unlockedBy: string; story: string }> = {
  garage: {
    label: "Garage",
    unlockedBy: "Day one",
    story: "A lean build team — strategy, engineering, product, design, and quality — focused on shipping your product for real.",
  },
  seed: {
    label: "Seed",
    unlockedBy: "Your product went live (verified)",
    story: "Your product is live, so the company grew: Revenue, Customer Success, and Data came online to find users and learn from them.",
  },
  growth: {
    label: "Growth",
    unlockedBy: "Real users arrived",
    story: "People are using it, so Licensing and Finance came online — pricing, billing, and unit economics, collected cleanly.",
  },
  enterprise: {
    label: "Enterprise",
    unlockedBy: "Real, repeating revenue",
    story: "The company runs at full depth — Legal & Compliance joined, and every department operates with its complete team.",
  },
};

// Derive the stage from REAL signals only. Thresholds are deliberately honest-small (this is a company
// being born, not a vanity dashboard): live build ⇒ seed; any real signups ⇒ growth; settled revenue with
// a repeat customer ⇒ enterprise.
export function stageForSignals(s: StageSignals): CompanyStage {
  const live = s.hasVerifiedLiveBuild === true;
  const users = (s.signups ?? 0) > 0;
  const paidRepeat = (s.revenueEventCents ?? 0) > 0 && (s.repeatCustomers ?? 0) > 0;
  if (live && users && paidRepeat) return "enterprise";
  if (live && users) return "growth";
  if (live) return "seed";
  return "garage";
}

export function stageIndex(stage: CompanyStage): number {
  return STAGE_ORDER.indexOf(stage);
}

// The departments active at a stage (ordered as the canonical DEPARTMENTS list).
export function activeDepartments(stage: CompanyStage): Department[] {
  const ids = new Set(STAGE_DEPARTMENTS[stage]);
  return DEPARTMENTS.filter((d) => ids.has(d.id));
}

// The roles active at a stage — every role of every active department (the department is the honest
// hiring unit; within a department the existing org-plan picks who does what).
export function activeRoles(stage: CompanyStage): OrgRole[] {
  const ids = new Set(STAGE_DEPARTMENTS[stage]);
  return ROLES.filter((r) => ids.has(r.department));
}

// What changed between two stages — powers the Living Org's "your company grew" moment (C.2 renders it).
export function stageDiff(from: CompanyStage, to: CompanyStage): { departments: Department[]; roles: OrgRole[] } {
  const before = new Set(STAGE_DEPARTMENTS[from]);
  const gained = STAGE_DEPARTMENTS[to].filter((id) => !before.has(id));
  const gainedSet = new Set(gained);
  return {
    departments: DEPARTMENTS.filter((d) => gainedSet.has(d.id)),
    roles: ROLES.filter((r) => gainedSet.has(r.department)),
  };
}
