// ─────────────────────────────────────────────────────────────────────────────
// lib/org/postmortem.ts — BLAMELESS POSTMORTEMS for Sev-1 incidents (the org-rigor Ops function).
//
// Builds on lib/loop/incident.ts (IncidentPayload / IncidentSeverity): high and critical incidents
// require a postmortem document; this module drafts it, tracks its action items, and names its file.
//
// Rails:
//  - BLAMELESS BY POLICY — the doc examines systems and process, never individuals. The standing
//    line is rendered into every draft; contributing factors are the caller's words, but the
//    template frames them as systems language ("factors", not "who").
//  - HONESTY FLOOR — empty inputs render honest "none recorded yet" lines, never invented content.
//  - Founder-facing strings contain NO em-dashes (periods, commas, colons instead).
//  - Pure functions, injected clock (opts.now) — fully deterministic, unit-tested offline.
// ─────────────────────────────────────────────────────────────────────────────

import type { IncidentPayload, IncidentSeverity } from "@/lib/loop/incident";

export interface TimelineEntry {
  at: number; // epoch ms
  entry: string;
}

export interface ActionItem {
  id: string;
  owner: string; // org role id, e.g. "engineering" — a role, never a person's name (blameless)
  description: string;
  dueBy?: number; // epoch ms
  doneAt?: number; // epoch ms; set when completed — powers openActionItems()
}

export interface PostmortemInput {
  incident: IncidentPayload;
  detectedAt: number; // epoch ms
  resolvedAt: number; // epoch ms
  timeline: TimelineEntry[];
  contributingFactors: string[]; // systems language, never names
  whatWorked: string[];
  actionItems: ActionItem[];
}

/** The standing policy line rendered into every postmortem draft. */
export const BLAMELESS_LINE =
  "This postmortem is blameless by policy: it examines systems and process, never individuals. No names, no blame.";

/** Postmortems are mandatory for high and critical (the T2/T3 human-lane severities). */
export function requiresPostmortem(severity: IncidentSeverity): boolean {
  return severity === "high" || severity === "critical";
}

/** Milliseconds → "Xh Ym". Negative spans clamp to "0h 0m" (never a fabricated negative duration). */
export function formatDuration(ms: number): string {
  const mins = Math.max(0, Math.round(ms / 60_000));
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

/** Epoch ms → "YYYY-MM-DD HH:MM" (UTC). Deterministic regardless of host timezone. */
function stamp(t: number): string {
  return new Date(t).toISOString().slice(0, 16).replace("T", " ");
}

/** Epoch ms → "YYYY-MM-DD" (UTC). */
function day(t: number): string {
  return new Date(t).toISOString().slice(0, 10);
}

/**
 * Stable filename slug: "2026-08-06-payment-webhook-outage". Date from `at` (UTC), title lowercased,
 * non-alphanumerics collapsed to single hyphens, capped at 60 chars of title.
 */
export function postmortemSlug(incident: IncidentPayload, at: number | Date): string {
  const d = day(at instanceof Date ? at.getTime() : at);
  const title = incident.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
  return `${d}-${title || "incident"}`;
}

/**
 * Draft the complete blameless postmortem markdown doc. Pure string, no I/O. Every section renders:
 * empty inputs get honest "none recorded yet" lines (the honesty floor), never filler.
 */
export function draftPostmortem(input: PostmortemInput): string {
  const { incident, detectedAt, resolvedAt } = input;
  const duration = formatDuration(resolvedAt - detectedAt);

  const timelineRows =
    input.timeline.length === 0
      ? "No timeline entries recorded yet."
      : [
          "| Time (UTC) | Entry |",
          "| --- | --- |",
          ...[...input.timeline].sort((a, b) => a.at - b.at).map((t) => `| ${stamp(t.at)} | ${t.entry} |`),
        ].join("\n");

  const factors =
    input.contributingFactors.length === 0
      ? "No contributing factors recorded yet."
      : input.contributingFactors.map((f) => `- ${f}`).join("\n");

  const worked =
    input.whatWorked.length === 0
      ? "Nothing recorded yet."
      : input.whatWorked.map((w) => `- ${w}`).join("\n");

  const items =
    input.actionItems.length === 0
      ? "No action items recorded yet."
      : [
          "| ID | Owner (role) | Description | Due | Status |",
          "| --- | --- | --- | --- | --- |",
          ...input.actionItems.map(
            (a) =>
              `| ${a.id} | ${a.owner} | ${a.description} | ${a.dueBy !== undefined ? day(a.dueBy) : "none set"} | ${a.doneAt !== undefined ? "done" : "open"} |`,
          ),
        ].join("\n");

  return [
    `# Postmortem: ${incident.title}`,
    "",
    BLAMELESS_LINE,
    "",
    "## Summary",
    `Severity: ${incident.severity} (source: ${incident.source})`,
    `Detected: ${stamp(detectedAt)} UTC`,
    `Resolved: ${stamp(resolvedAt)} UTC`,
    `Duration: ${duration}`,
    "",
    "## Impact",
    incident.detail ? incident.detail : "No impact detail recorded yet.",
    "",
    "## Timeline",
    timelineRows,
    "",
    "## Contributing factors (systems, not people)",
    factors,
    "",
    "## What worked",
    worked,
    "",
    "## Action items",
    items,
    "",
    "Action items are tracked to completion. Owners are org roles, not individuals.",
  ].join("\n");
}

export interface OpenActionItem {
  item: ActionItem;
  overdue: boolean; // dueBy is set and already past opts.now
}

/**
 * The action-item tracker: everything not marked done, with overdue flagged. Accepts either raw
 * items or whole PostmortemInput docs (flattened), so the cron tick can sweep every open doc at once.
 */
export function openActionItems(
  source: ReadonlyArray<ActionItem | PostmortemInput>,
  opts: { now: number },
): OpenActionItem[] {
  const items: ActionItem[] = source.flatMap((s) => ("actionItems" in s ? s.actionItems : [s]));
  return items
    .filter((i) => i.doneAt === undefined)
    .map((item) => ({ item, overdue: item.dueBy !== undefined && item.dueBy < opts.now }));
}
