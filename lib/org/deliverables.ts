// lib/org/deliverables.ts — THE SOFTWARE AND DOCUMENTS A COMPANY RUNS ON, AND WHICH AGENT PRODUCES EACH.
//
// WHY THIS EXISTS. The founder asked for a list of the software categories and documents real companies use
// (Salesforce, a CRM, and so on), and for every agent to be able to produce those respectively. This is
// that list, grounded in the eight real departments of organization.ts, with an honest grade on each.
//
// THE THREE VERBS, kept separate on purpose, because collapsing them is how "our agents produce a CRM"
// becomes a lie:
//
//   BUILD      the machine can create THAT KIND of software as a real, deployed product. Bounded by the
//              build ceiling (about ten files a run), so a bug tracker is buildable and a full Salesforce
//              is not, and the catalog says which is which rather than pretending.
//   DRAFT      the machine produces the DOCUMENTS that live in that system: the contract, the invoice, the
//              board deck, the roadmap. This is where the model is genuinely strong today.
//   INTEGRATE  the machine connects to the customer's EXISTING system through a real API or MCP, reads and
//              writes it, but does not replace it. This is how you sit next to Salesforce, not rebuild it.
//
// A grade of "none" is not a failure to hide. It is the honest backlog, and every "none" names what is
// missing. A catalog that graded everything "build" would be the exact overclaim the whole product exists
// to refuse ([[overclaim-legal-floor]]).
//
// Pure and deterministic, no I/O. Grounded in modules that exist on disk, asserted by the test.

import type { Department } from "./coverage";

/** What the machine can actually do with a given software category or document type. */
export type Produce = "build" | "draft" | "integrate" | "none";

export interface Deliverable {
  id: string;
  department: Department;
  /** The real-world category, named the way a buyer would name it. */
  category: string;
  /** Concrete examples, so a reader recognises it. */
  examples: string;
  /** What "produce" honestly means here. */
  produce: Produce;
  /**
   * For build/draft/integrate: the module or mechanism that does it, so the claim is checkable.
   * For none: what is missing. Never empty.
   */
  evidence: string;
}

/**
 * The catalog. Every category a software company actually runs on, mapped to the department that owns it
 * and graded by what our agents can produce today. Ordered by department.
 */
export const DELIVERABLES: readonly Deliverable[] = [
  // ── executive & governance ────────────────────────────────────────────────
  { id: "board-deck", department: "executive", category: "Board and investor reporting", examples: "board decks, investor updates, KPI one-pagers", produce: "draft", evidence: "lib/loop/finance-report.ts and the metric surfaces compose the numbers; a human owns and presents them" },
  { id: "governance-policy", department: "executive", category: "Governance and policy", examples: "acceptable-use policy, risk register, decision log", produce: "draft", evidence: "lib/org/publishing-mandate.ts and docs/adr; the lawyer-signed AUP is a HUMAN_TODO" },
  { id: "audit-system", department: "executive", category: "Audit and compliance system (GRC)", examples: "Vanta, Drata, an audit trail", produce: "build", evidence: "lib/core/audit.ts is an append-only hash-chained ledger, integrity-checkable; this IS a GRC primitive we ship" },

  // ── product & design ──────────────────────────────────────────────────────
  { id: "prd", department: "product", category: "Product docs and specs", examples: "PRDs, one-pagers, acceptance criteria", produce: "draft", evidence: "lib/engine/org-plan.ts emits the spec task; the ux-researcher and product-manager SOPs shape it" },
  { id: "roadmap", department: "product", category: "Roadmap and issue tracking", examples: "Jira, Linear, Asana", produce: "build", evidence: "lib/engine/task-queue.ts is a working dependency-ordered task system; a Linear-shaped tool is squarely inside the build ceiling" },
  { id: "design-system", department: "product", category: "Design and prototyping", examples: "Figma files, a design system", produce: "draft", evidence: "the design-lead review pass commits real UI fixes; it does not author in Figma, it authors in code" },

  // ── engineering ───────────────────────────────────────────────────────────
  { id: "webapp", department: "engineering", category: "Web and SaaS applications", examples: "a CRUD SaaS, an internal tool, a landing site", produce: "build", evidence: "lib/engine/fullstack-build.ts, proven live twice; the honest ceiling is ~10 files a run" },
  { id: "api", department: "engineering", category: "APIs and backends", examples: "a REST API, auth, a database schema", produce: "build", evidence: "the build pipeline ships app/api routes, auth pages and RLS-isolated data" },
  { id: "repo-cicd", department: "engineering", category: "Source control and CI/CD", examples: "GitHub repos, Actions pipelines", produce: "build", evidence: "lib/engine/provision.ts creates the repo; the build commits a CI workflow" },
  { id: "big-platform", department: "engineering", category: "Billion-user platforms", examples: "LinkedIn, Cursor, Salesforce itself", produce: "none", evidence: "NOT buildable. METR frontier is 2h42m at 50%; our own shard measurement shows the median feed read touching half the cluster at 50k members. This is the honest ceiling, stated" },

  // ── quality & security ────────────────────────────────────────────────────
  { id: "test-suite", department: "quality", category: "Test suites and regression walls", examples: "unit, integration, e2e, a coverage gate", produce: "build", evidence: "every build ships tests; the verification empire compounds a per-product regression wall" },
  { id: "a11y-audit", department: "quality", category: "Accessibility and security audit", examples: "an axe/Lighthouse a11y report, a pen-test summary", produce: "none", evidence: "NOT built. No a11y pass in the QA gate. A university will ask for this, so it is a named gap" },

  // ── production & operations ───────────────────────────────────────────────
  { id: "runbook", department: "operations", category: "Runbooks and incident docs", examples: "runbooks, incident timelines, postmortems", produce: "draft", evidence: "lib/org/postmortem.ts and the incident-commander SOP" },
  { id: "monitoring", department: "operations", category: "Monitoring and on-call", examples: "Datadog, Sentry, PagerDuty", produce: "integrate", evidence: "error-uptime is a registered connection read via MCP; there is NO live paging yet, so this is integrate-only, not build" },
  { id: "spend-control", department: "operations", category: "Cost and spend control", examples: "a budget system, an envelope gate", produce: "build", evidence: "lib/engine/treasury-db.ts is a working per-department envelope gate that escalates over cap" },

  // ── business & finance ────────────────────────────────────────────────────
  { id: "invoice", department: "finance", category: "Invoicing and billing", examples: "invoices, receipts, dunning", produce: "draft", evidence: "the finance agents compose them; ACTUALLY CHARGING is unbuilt (Stripe Connect, task #78), so this is draft not build until step 6 lands" },
  { id: "accounting", department: "finance", category: "Accounting and close (ERP)", examples: "QuickBooks, NetSuite, SAP, a monthly close", produce: "build", evidence: "lib/org/monthly-close.ts closes the books and names unreconciled legs; forecast.ts models cash. A close tool is buildable; full SAP is not" },
  { id: "financial-statements", department: "finance", category: "Financial statements", examples: "P&L, balance sheet, cash forecast", produce: "draft", evidence: "lib/org/forecast.ts, which refuses to print a runway without real cash-on-hand" },
  { id: "entity-tax", department: "finance", category: "Entity formation and tax filing", examples: "LLC/EIN formation, tax returns", produce: "none", evidence: "DELIBERATELY not built. Regulated, adjacent to unauthorised practice of law, and a filing is signed under penalty of perjury. Naive does this; we refuse it" },

  // ── growth — marketing & sales ────────────────────────────────────────────
  { id: "crm", department: "growth", category: "CRM", examples: "Salesforce, HubSpot", produce: "integrate", evidence: "crm is a registered MCP connection; the sales-ops SOP operates it. We SIT NEXT TO Salesforce, we do not rebuild it. A lightweight pipeline tracker is separately buildable" },
  { id: "marketing-content", department: "growth", category: "Marketing content and SEO", examples: "blog posts, landing pages, SEO pillars", produce: "build", evidence: "lib/core/seo-factory.ts, honesty-gated; the content ships as real pages" },
  { id: "outbound", department: "growth", category: "Outbound sequences", examples: "email sequences, social posts", produce: "draft", evidence: "drafted by the agents, gated by lib/core/publish-gate.ts before any send; three platforms send for real, LinkedIn and X are written but unproven" },
  { id: "sales-collateral", department: "growth", category: "Sales collateral and proposals", examples: "one-pagers, proposals, SOWs, pitch decks", produce: "draft", evidence: "the account-executive SOP prepares them; the signature is always the human's (hard-stop: accept-terms)" },
  { id: "ad-campaign", department: "growth", category: "Paid acquisition", examples: "Google Ads, Meta campaigns", produce: "none", evidence: "NOT built. A webhook exists; nothing operates a real campaign. The auction in lib/sim is simulated only" },

  // ── knowledge & memory ────────────────────────────────────────────────────
  { id: "wiki", department: "knowledge", category: "Docs and wiki", examples: "Notion, Confluence, a knowledge base", produce: "build", evidence: "lib/org/evidence.ts assembles docs with a not-certified header; a docs site is inside the build ceiling" },
  { id: "bi-dashboard", department: "knowledge", category: "BI and analytics", examples: "Looker, Tableau, a metrics dashboard", produce: "build", evidence: "the cockpit renders real metric surfaces; a scoped dashboard product is buildable" },
  { id: "data-warehouse", department: "knowledge", category: "Data warehouse and pipelines", examples: "Snowflake, dbt", produce: "integrate", evidence: "the substrate (lib/org/substrate.ts) is a shared data layer products ground on; it is not a warehouse and does not claim to be" },
  { id: "memory-brain", department: "knowledge", category: "Institutional memory", examples: "a decision log, a belief store", produce: "build", evidence: "lib/core/beliefs.ts, provenance-graded beliefs with validity windows; this is a primitive we ship and most competitors lack" },

  // ── people (the function every company has and we deliberately do NOT run) ──
  { id: "ats-hris", department: "executive", category: "Hiring and HR systems (ATS, HRIS)", examples: "Greenhouse, Workday, offer letters, payroll", produce: "none", evidence: "DELIBERATELY not built. Hiring, firing and payroll are decisions about humans, made by humans (hard-stop reasoning). We can DRAFT a job description; we never run the hire" },
] as const;

export interface DeliverablesReport {
  total: number;
  build: number;
  draft: number;
  integrate: number;
  none: number;
  /** Categories the machine can produce in some real form (build, draft or integrate). */
  producibleShare: number;
  /** The honest backlog and the deliberate refusals, separated. */
  gaps: Deliverable[];
  refusals: Deliverable[];
  headline: string;
}

const REFUSED = new Set(["big-platform", "entity-tax", "ats-hris"]);

export function deliverablesReport(items: readonly Deliverable[] = DELIVERABLES): DeliverablesReport {
  const n = (p: Produce): number => items.filter((d) => d.produce === p).length;
  const build = n("build"), draft = n("draft"), integrate = n("integrate"), none = n("none");
  const total = items.length;
  const producible = build + draft + integrate;
  const noneItems = items.filter((d) => d.produce === "none");
  return {
    total, build, draft, integrate, none,
    producibleShare: total ? Math.round((producible / total) * 1000) / 10 : 0,
    gaps: noneItems.filter((d) => !REFUSED.has(d.id)),
    refusals: noneItems.filter((d) => REFUSED.has(d.id)),
    headline:
      `Of ${total} software and document categories a company runs on, agents can BUILD ${build}, ` +
      `DRAFT ${draft}, and INTEGRATE with ${integrate}. ${none} are not produced: ` +
      `${noneItems.filter((d) => REFUSED.has(d.id)).length} refused by design, ` +
      `${noneItems.filter((d) => !REFUSED.has(d.id)).length} simply not built yet.`,
  };
}

/** The per-department view a founder or a dean would read. */
export function deliverablesByDepartment(items: readonly Deliverable[] = DELIVERABLES): Array<{ department: Department; categories: Deliverable[] }> {
  const depts = [...new Set(items.map((d) => d.department))];
  return depts.map((department) => ({ department, categories: items.filter((d) => d.department === department) }));
}
