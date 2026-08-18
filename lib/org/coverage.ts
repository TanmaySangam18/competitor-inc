// lib/org/coverage.ts — HOW MUCH OF A COMPANY'S WORK DOES THIS MACHINE ACTUALLY DO?
//
// WHY THIS EXISTS. The founder asked whether competitor.inc could replace every employee at Cursor or
// LinkedIn, leaving a founder and five family members overlooking it. The honest answer is no, and the
// evidence is measured rather than felt: METR puts the frontier time-horizon at 2h42m at 50% success while
// running a company is quarters of work; our build pipeline tops out around ten files per run against the
// hundred-plus a LinkedIn shape needs; and our own shard measurement says the MEDIAN feed read already
// touches half the cluster at fifty thousand synthetic members.
//
// But "can it replace everyone" is the wrong shape of question, because it has no answer that can be
// checked. This module replaces it with one that can: OF THE WORK A SOFTWARE COMPANY ACTUALLY DOES, HOW
// MUCH RUNS WITHOUT A HUMAN TODAY? That is a number, it moves, and it cannot be inflated by a green test
// suite.
//
// THE DISTINCTION THAT MAKES IT HONEST, and the reason a naive percentage lies: there are two completely
// different kinds of "a human does this."
//
//   HUMAN_ONLY  — a human does it BY DESIGN. Signing a contract, accepting terms, moving money, answering
//                 a regulator. This is not a gap and closing it would destroy the product. A company that
//                 automated these would not be more advanced, it would be unaccountable.
//   UNCOVERED   — a human does it because WE HAVE NOT BUILT IT. This is the real backlog.
//
// Collapsing those two into one "not automated" bucket is how a roadmap ends up chasing the wrong half.
// Every entry below therefore carries evidence: a module that really exists, or a stated reason.
//
// Pure and deterministic. No I/O. Auditable by reading it.

export type Coverage =
  | "automated"   // runs unattended, and a named module does it
  | "assisted"    // the machine produces the work, a human approves or completes it
  | "human_only"  // a human does it by design, and that is correct
  | "uncovered";  // nobody has built it. The honest backlog

export type Department =
  | "executive" | "product" | "engineering" | "quality"
  | "operations" | "finance" | "growth" | "knowledge";

export interface WorkFunction {
  id: string;
  department: Department;
  /** What the work is, in the words a person at a real company would use. */
  work: string;
  coverage: Coverage;
  /**
   * For automated and assisted: the module that really does it, so the claim is checkable.
   * For human_only: WHY a human must do it.
   * For uncovered: what is missing.
   * Never empty. A coverage claim without evidence is a guess.
   */
  evidence: string;
}

/**
 * The ledger. Grounded in the eight real departments of lib/org/organization.ts and in modules that exist
 * on disk. Anything claimed "automated" here names a file that can be opened.
 */
export const WORK: readonly WorkFunction[] = [
  // ── executive ────────────────────────────────────────────────────────────
  { id: "strategy", department: "executive", work: "Set direction and decide what the company does next", coverage: "assisted", evidence: "lib/core/plan.ts turns a goal into an ordered plan; a human still chooses the goal" },
  { id: "board-reporting", department: "executive", work: "Report to a board or investors", coverage: "human_only", evidence: "someone must be personally accountable for the numbers stated, and that cannot be delegated to software" },
  { id: "hire-fire", department: "executive", work: "Hire and fire people", coverage: "human_only", evidence: "employment decisions about humans belong to humans, legally and morally" },
  { id: "sign-contract", department: "executive", work: "Sign a contract", coverage: "human_only", evidence: "hard-stop: accept-terms. A signature is the act of becoming liable" },
  { id: "regulator", department: "executive", work: "Answer a regulator, auditor or subpoena", coverage: "human_only", evidence: "a named person must appear and be examined" },
  { id: "kill-switch", department: "executive", work: "Stop the company mid-flight when something is wrong", coverage: "automated", evidence: "lib/core/killswitch.ts, out-of-band, global and per-agent" },

  // ── product ──────────────────────────────────────────────────────────────
  { id: "discovery", department: "product", work: "Talk to users and find out what they need", coverage: "uncovered", evidence: "the ux-researcher SOP exists but there are ZERO external users to research. This is the real gap and no module fixes it" },
  { id: "spec", department: "product", work: "Turn a need into a buildable specification", coverage: "assisted", evidence: "lib/engine/org-plan.ts produces the spec task; a human signs the scope" },
  { id: "prioritise", department: "product", work: "Decide what gets built first", coverage: "assisted", evidence: "lib/engine/task-queue.ts orders work; the goal that ranks it is the human's" },
  { id: "product-memory", department: "product", work: "Remember why past decisions were made", coverage: "automated", evidence: "lib/org/product-memory.ts plus lib/core/beliefs.ts with provenance and validity windows" },

  // ── engineering ──────────────────────────────────────────────────────────
  { id: "write-code", department: "engineering", work: "Write the software", coverage: "automated", evidence: "lib/engine/fullstack-build.ts, proven live on two consecutive builds" },
  { id: "review-code", department: "engineering", work: "Review a change before it lands", coverage: "automated", evidence: "lib/org/parallel.ts merge queue and reviewer gates, plus the separation rule in lib/core/separation.ts that forbids self-grading" },
  { id: "ci", department: "engineering", work: "Run the tests on every change", coverage: "automated", evidence: ".github workflows plus the npm run qa gate" },
  { id: "deploy", department: "engineering", work: "Ship it to production", coverage: "automated", evidence: "lib/engine/execution.ts deploy path, verified live before a URL is shown" },
  { id: "provision", department: "engineering", work: "Create the infrastructure a new project needs", coverage: "automated", evidence: "lib/engine/provision.ts, repo plus hosting plus schema from delegated tokens" },
  { id: "migrations", department: "engineering", work: "Change a live database's schema without losing data", coverage: "uncovered", evidence: "supabase/migrations are written by hand and applied by a human. Cofounder tests migrations on DB forks; we do not" },
  { id: "oncall", department: "engineering", work: "Be woken at 3am when production breaks", coverage: "uncovered", evidence: "the incident-commander SOP exists but NO paging is wired: no PagerDuty, no Opsgenie, no live production monitor. Verified absent" },
  { id: "security-patching", department: "engineering", work: "Patch a dependency before it is exploited", coverage: "assisted", evidence: "renovate.json opens the PR with automerge deliberately false, so a human still merges" },
  { id: "architecture", department: "engineering", work: "Decide how the system should be structured", coverage: "assisted", evidence: "docs/adr records the decisions; lib/core/architecture.test.ts ENFORCES the layering rule in CI" },

  // ── quality ──────────────────────────────────────────────────────────────
  { id: "write-tests", department: "quality", work: "Write the tests", coverage: "automated", evidence: "every build ships tests, and the regression wall in the verification empire compounds them" },
  { id: "release-gate", department: "quality", work: "Refuse to ship something broken", coverage: "automated", evidence: "npm run qa is the gate: env-guard, tsc, vitest, build, smoke" },
  { id: "accessibility", department: "quality", work: "Audit that a person with a disability can use it", coverage: "uncovered", evidence: "no axe or Lighthouse-a11y pass in the gate. A university WILL ask for this" },

  // ── operations ───────────────────────────────────────────────────────────
  { id: "vendor-mgmt", department: "operations", work: "Choose and manage suppliers", coverage: "assisted", evidence: "the procurement-agent SOP drafts; commitments are human" },
  { id: "cost-control", department: "operations", work: "Keep spend inside budget", coverage: "automated", evidence: "lib/engine/treasury-db.ts envelope gate, over-cap escalates and never auto-approves" },
  { id: "capacity", department: "operations", work: "Plan for the load before it arrives", coverage: "assisted", evidence: "lib/sim/sharding.ts measures fan-out and right-sizing; acting on it is manual" },
  { id: "licence-shield", department: "operations", work: "Keep a copyleft dependency out of the product", coverage: "automated", evidence: "lib/core/licenses.ts allowlist, blocking in CI" },

  // ── finance ──────────────────────────────────────────────────────────────
  { id: "close", department: "finance", work: "Close the books each month", coverage: "automated", evidence: "lib/org/monthly-close.ts, and it NAMES the legs it cannot reconcile rather than pretending" },
  { id: "forecast", department: "finance", work: "Forecast cash", coverage: "automated", evidence: "lib/org/forecast.ts, which refuses to print a runway without real cash-on-hand" },
  { id: "invoicing", department: "finance", work: "Bill a customer", coverage: "uncovered", evidence: "Stripe Connect hooks exist unfinished (task #78). A student cannot take money, so goal step 6 is blocked here" },
  { id: "funds-out", department: "finance", work: "Move money out", coverage: "human_only", evidence: "hard-stop: pay. Standing rule, funds-out is never automated" },
  { id: "payroll-tax", department: "finance", work: "Run payroll and file taxes", coverage: "human_only", evidence: "a filing is signed under penalty of perjury by a person" },

  // ── growth ───────────────────────────────────────────────────────────────
  { id: "content", department: "growth", work: "Write the content and rank for it", coverage: "automated", evidence: "lib/core/seo-factory.ts, honesty-gated" },
  { id: "social-publish", department: "growth", work: "Publish to social platforms", coverage: "assisted", evidence: "lib/core/publish-gate.ts mints a permit only after five rails; publishers cannot send without one" },
  { id: "outbound-email", department: "growth", work: "Send outbound email", coverage: "assisted", evidence: "lib/core/outreach-send.ts drafts, the mandate gates, a human clears the audience" },
  { id: "sales-calls", department: "growth", work: "Phone a prospect and talk to them", coverage: "uncovered", evidence: "no voice capability at all. Twilio is founder-notification SMS only, and outbound needs A2P 10DLC plus a consent ledger first" },
  { id: "negotiate", department: "growth", work: "Negotiate a deal", coverage: "human_only", evidence: "the AE prepares; the signature is always the human's" },
  { id: "renewals", department: "growth", work: "Notice a customer is about to churn and act", coverage: "automated", evidence: "lib/org/retention-desk.ts, checkpoints at 90/60/30/14 days, silent at zero customers rather than reporting a healthy zero" },
  { id: "winloss", department: "growth", work: "Learn why deals are won and lost", coverage: "automated", evidence: "lib/org/winloss.ts and nps.ts, both of which refuse to compute a rate below five data points" },
  { id: "ads", department: "growth", work: "Run paid acquisition", coverage: "uncovered", evidence: "an ADS_WEBHOOK_URL exists and nothing operates a real campaign. The auction in lib/sim is simulated only" },

  // ── knowledge ────────────────────────────────────────────────────────────
  { id: "docs", department: "knowledge", work: "Keep the documentation true", coverage: "assisted", evidence: "lib/org/evidence.ts assembles it with a mandatory not-certified header; a human still reads it" },
  { id: "postmortems", department: "knowledge", work: "Write up what went wrong and why", coverage: "automated", evidence: "lib/org/postmortem.ts, written from the real activity record rather than from memory of the incident" },
  { id: "precedent", department: "knowledge", work: "Not make the same mistake twice", coverage: "automated", evidence: "lib/core/precedent.ts plus the belief store's supersession chain" },
  { id: "drills", department: "knowledge", work: "Practise for failure before it happens", coverage: "automated", evidence: "lib/org/drills.ts and lib/sim/failure-drills.ts, the ship gate" },
  { id: "agent-review", department: "knowledge", work: "Judge whether a worker is still worth keeping", coverage: "automated", evidence: "lib/org/agent-review.ts, quarterly, with retire and cheaper-tier thresholds" },
  { id: "audit-trail", department: "knowledge", work: "Prove after the fact what was done and why", coverage: "automated", evidence: "lib/core/audit.ts, append-only and hash-chained, integrity checkable" },
] as const;

export interface CoverageReport {
  total: number;
  automated: number;
  assisted: number;
  humanOnly: number;
  uncovered: number;
  /** Share running unattended. The number the ambition should be measured by. */
  automatedShare: number;
  /** Automated plus assisted: work the machine genuinely does, even if a human signs it off. */
  machineTouchedShare: number;
  /**
   * The honest denominator. Human-only work is excluded because automating it would BREAK the product,
   * so counting it as a shortfall would make the metric argue for its own destruction.
   */
  coverageOfAutomatableWork: number;
  /** The real backlog, in priority order by department. */
  gaps: WorkFunction[];
  headline: string;
}

export function coverageReport(work: readonly WorkFunction[] = WORK): CoverageReport {
  const n = (c: Coverage): number => work.filter((w) => w.coverage === c).length;
  const automated = n("automated"), assisted = n("assisted");
  const humanOnly = n("human_only"), uncovered = n("uncovered");
  const total = work.length;
  const automatable = total - humanOnly;
  const pc = (x: number, d: number): number => (d ? Math.round((x / d) * 1000) / 10 : 0);

  return {
    total, automated, assisted, humanOnly, uncovered,
    automatedShare: pc(automated, total),
    machineTouchedShare: pc(automated + assisted, total),
    coverageOfAutomatableWork: pc(automated + assisted, automatable),
    gaps: work.filter((w) => w.coverage === "uncovered"),
    headline:
      `${automated} of ${total} company functions run unattended, ${assisted} more run with a human signing off, ` +
      `${humanOnly} are human by design, and ${uncovered} are simply not built yet. ` +
      `Excluding the work that must stay human, the machine covers ${pc(automated + assisted, automatable)}% of what is automatable.`,
  };
}

/** Per-department view, so a gap is attached to a function rather than floating. */
export function byDepartment(work: readonly WorkFunction[] = WORK): Array<{ department: Department; total: number; automated: number; uncovered: number }> {
  const depts = [...new Set(work.map((w) => w.department))];
  return depts.map((department) => {
    const rows = work.filter((w) => w.department === department);
    return {
      department,
      total: rows.length,
      automated: rows.filter((w) => w.coverage === "automated").length,
      uncovered: rows.filter((w) => w.coverage === "uncovered").length,
    };
  }).sort((a, b) => b.uncovered - a.uncovered || a.department.localeCompare(b.department));
}

/**
 * The answer to "could this run a company with only a family watching?", stated so it cannot be misread.
 * Deliberately blunt: the founder asked a yes-or-no question and deserves a yes-or-no answer.
 */
export function canRunACompanyAlone(work: readonly WorkFunction[] = WORK): { answer: false; because: string[] } {
  const r = coverageReport(work);
  return {
    answer: false,
    because: [
      `${r.uncovered} functions are not built at all, and they include the ones that hurt: no paging when production breaks, no live database migrations, no phone calls, no invoicing, and no users to do discovery with.`,
      `${r.humanOnly} functions must stay human. A company where software signs the contracts, moves the money and answers the regulator is not more advanced, it is unaccountable.`,
      "The measured frontier is short. METR puts the best model's 50% time horizon at 2h42m, and running a company is quarters of work, not hours.",
      "Our own ceiling is measured, not guessed: roughly ten files per build run, and at forty shards the median feed read already touches twenty of them on fifty thousand synthetic members.",
      "There are zero external users, and nobody outside the founder can currently sign in.",
    ],
  };
}
