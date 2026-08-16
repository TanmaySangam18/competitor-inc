// ─────────────────────────────────────────────────────────────────────────────
// THE INCIDENT LOOP (Connect-First Reset §4) — Sentry/monitor event → eng agents triage in #eng →
// within tier: enqueue a root-cause-and-fix org-run (the inner loop owns the actual fix → regression
// wall → deploy, each step governed on its own). Above tier: one @-mention, nothing auto-runs.
//
// Severity IS the tier (deterministic, no judgment call at 3am):
//   low / medium  → T1  auto-triage   — post to #eng + enqueue "root-cause and fix" (inner loop takes over)
//   high          → T2  queue         — post to #eng + mirror to #decisions with the @-mention; NO auto-run
//   critical      → T3  halt          — post + page (mirror w/ mention); the human decides, nothing auto-runs
//
// Pure classification + injectable side effects (office post, org-run enqueue, kill switch) — unit-tested
// fully offline. The enqueue path reuses the EXISTING inner loop (createOrgRun via the caller-injected
// deps.enqueueRun, exactly like lib/loop/loop-driver.ts createRun) — never a second task system.
// ─────────────────────────────────────────────────────────────────────────────

import { killSwitch as defaultSwitch } from "@/lib/core/killswitch";
import type { Tier } from "@/lib/core/policy";
import { mirrorDecision, postToDept, type OfficeDelivery, type OfficeDeps } from "./office";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";
export type IncidentAction = "auto-triage" | "queue" | "halt";

export interface IncidentPayload {
  source: string; // "sentry", "ping-monitor", "manual", …
  title: string;
  detail?: string;
  severity: IncidentSeverity;
}

/** severity → tier → action. Deterministic; the whole triage policy in one visible table. */
export function classifyIncident(severity: IncidentSeverity): { action: IncidentAction; tier: Tier } {
  switch (severity) {
    case "low":
    case "medium":
      return { action: "auto-triage", tier: "T1" };
    case "high":
      return { action: "queue", tier: "T2" };
    case "critical":
      return { action: "halt", tier: "T3" };
  }
}

/** The #eng brief — what happened, how bad, what the org is doing about it. Pure string. */
function incidentBrief(p: IncidentPayload, cls: { action: IncidentAction; tier: Tier }): string {
  const doing =
    cls.action === "auto-triage"
      ? "auto-triage: root-cause-and-fix run enqueued"
      : cls.action === "queue"
        ? "above auto tier — queued for the human (see #decisions)"
        : "CRITICAL — halted; paging the human, nothing auto-runs";
  return [
    `Incident [${p.severity} → ${cls.tier}] ${p.title}`,
    `source: ${p.source}`,
    p.detail ? `detail: ${p.detail.slice(0, 400)}` : "",
    `action: ${doing}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export interface IncidentDeps {
  office?: OfficeDeps;
  /** The inner-loop enqueue seam (createOrgRun + insertOrgRun, wired by the caller — see the hook route). */
  enqueueRun?: (goal: string) => Promise<string>;
}

export interface IncidentResult {
  action: IncidentAction;
  tier: Tier;
  brief: string;
  posted: OfficeDelivery; // the #eng post (honest "not connected" when Slack isn't wired)
  mirrored?: OfficeDelivery; // the #decisions mirror, for queue/halt
  runId?: string; // the enqueued root-cause org-run, on auto-triage
  runNote?: string; // why no run was enqueued, when it wasn't (honesty over silence)
}

/**
 * Ingest one incident. Classify (pure) → post the brief to #eng (governed) → then:
 *  auto-triage → enqueue the root-cause org-run (unless the kill switch is thrown or no driver is wired);
 *  queue/halt  → mirror to #decisions where the @-mention fires (T2+ = the human's, by construction).
 */
export async function ingestIncident(p: IncidentPayload, deps: IncidentDeps = {}): Promise<IncidentResult> {
  const cls = classifyIncident(p.severity);
  const brief = incidentBrief(p, cls);

  // The governed post — governAction runs inside postToDept BEFORE any network.
  const posted = await postToDept("engineering", brief, deps.office);

  const result: IncidentResult = { action: cls.action, tier: cls.tier, brief, posted };

  if (cls.action === "auto-triage") {
    // Same kill switch the governed post consulted (injectable in tests): thrown ⇒ NOTHING auto-runs,
    // not even an internal enqueue — the stop button stops the loop, not just the network.
    const ks = deps.office?.govern?.switch ?? defaultSwitch;
    const halt = ks.haltReason({ agent: "engineering" });
    if (halt) {
      result.runNote = `not enqueued — ${halt}`;
    } else if (!deps.enqueueRun) {
      result.runNote = "not enqueued — no org-run driver connected (honest degraded mode)";
    } else {
      result.runId = await deps.enqueueRun(
        `root-cause and fix: ${p.title}${p.detail ? ` — ${p.detail.slice(0, 300)}` : ""} (source: ${p.source}, severity: ${p.severity})`,
      );
    }
    return result;
  }

  // queue / halt — the human's lane. One mirror post carries the @-mention (T2+/queued ⇒ mention fires).
  result.mirrored = await mirrorDecision(
    {
      id: `incident-${Date.now().toString(36)}`,
      title: `Incident: ${p.title}`,
      summary: brief,
      tier: cls.tier,
      verdict: cls.action === "halt" ? "BLOCK" : "QUEUE",
    },
    deps.office,
  );
  return result;
}

// ── Payload adapters (pure) ───────────────────────────────────────────────────

/** Sentry level → our severity. Monotone, conservative: unknown levels read as low, never invented up. */
export function severityFromSentryLevel(level: string | undefined): IncidentSeverity {
  switch ((level ?? "").toLowerCase()) {
    case "fatal":
      return "critical";
    case "error":
      return "high";
    case "warning":
      return "medium";
    default:
      return "low"; // info, debug, unknown
  }
}

const SEVERITIES: ReadonlySet<string> = new Set(["low", "medium", "high", "critical"]);

/**
 * Normalize an inbound webhook body into an IncidentPayload. Accepts our native shape, Sentry's legacy
 * webhook ({ level, message }), and Sentry's issue-alert shape ({ data: { event|issue: { title, level } } }).
 * Returns null when nothing recognizable is present — the route answers 400, never guesses an incident.
 */
export function adaptIncidentPayload(body: unknown): IncidentPayload | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;

  // Native shape — passed through as-is (severity must be one of ours).
  if (typeof b.title === "string" && b.title.trim() && typeof b.severity === "string" && SEVERITIES.has(b.severity)) {
    return {
      source: typeof b.source === "string" && b.source.trim() ? b.source : "webhook",
      title: b.title.trim(),
      detail: typeof b.detail === "string" ? b.detail : undefined,
      severity: b.severity as IncidentSeverity,
    };
  }

  // Sentry legacy webhook: { level, message, ... }.
  if (typeof b.message === "string" && b.message.trim()) {
    return {
      source: "sentry",
      title: b.message.trim().slice(0, 200),
      detail: typeof b.culprit === "string" ? b.culprit : undefined,
      severity: severityFromSentryLevel(typeof b.level === "string" ? b.level : undefined),
    };
  }

  // Sentry issue-alert / event-alert: { data: { event: {...} } } or { data: { issue: {...} } }.
  const data = b.data as Record<string, unknown> | undefined;
  const item = (data?.event ?? data?.issue) as Record<string, unknown> | undefined;
  if (item && typeof item.title === "string" && item.title.trim()) {
    return {
      source: "sentry",
      title: item.title.trim().slice(0, 200),
      detail: typeof item.culprit === "string" ? item.culprit : undefined,
      severity: severityFromSentryLevel(typeof item.level === "string" ? item.level : undefined),
    };
  }

  return null;
}
