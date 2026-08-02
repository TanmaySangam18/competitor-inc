// lib/core/video-factory.ts — THE VIDEO FACTORY (ADR-0026).
//
// Marketing/sales video generation as a governed, $0-marginal capability: deterministic storyboards
// from named templates, public-domain footage only (allowlisted collections, provenance recorded per
// clip like a receipt), and every title card screened by the same truth + judgment gates as all
// public prose. Rendering runs OUT of band (the Actions render farm, like builds); this module is the
// pure brain: plan, gate, prove. No model call, no network, fully testable.
//
// Rails inherited, not reinvented: license shield (PD/CC0 only here — stricter than the code
// allowlist), honesty floor (no unreceipted metrics on cards), content gate v2 (judgment), publishing
// mandate ("video" is already a publish kind — a lead must sign the finished asset before it ships).

import { screenContent } from "./content-gate";

// ── sources ──────────────────────────────────────────────────────────────────
// Public-domain / CC0 collections only. Adding a collection is an ADR-level decision because the
// provenance receipt below claims, in public, that footage is licensed clean.
export const FOOTAGE_ALLOWLIST: readonly { collection: string; host: string; license: string }[] = [
  { collection: "prelinger", host: "archive.org", license: "Public Domain (Prelinger Archives)" },
  { collection: "classic_tv_commercials", host: "archive.org", license: "Public Domain (uploader-asserted; verify per item)" },
  { collection: "opensource_movies", host: "archive.org", license: "CC/PD mixed — allowed only when item license is CC0 or PD" },
];

export interface ClipProvenance {
  identifier: string; // archive.org item id
  collection: string;
  license: string;
  sourceUrl: string;
}

export function assertAllowedSource(collection: string): { ok: true; license: string } | { ok: false; reason: string } {
  const hit = FOOTAGE_ALLOWLIST.find((s) => s.collection === collection);
  if (!hit) return { ok: false, reason: `collection "${collection}" is not on the footage allowlist — PD/CC0 collections only, additions need an ADR` };
  return { ok: true, license: hit.license };
}

/** The ledger-ready provenance record: every clip in every rendered video, licensed and pointable. */
export function provenanceRecord(clips: ClipProvenance[]): { ok: boolean; record?: string; reason?: string } {
  if (clips.length === 0) return { ok: false, reason: "a video with no clips has no provenance — refuse" };
  for (const c of clips) {
    const src = assertAllowedSource(c.collection);
    if (!src.ok) return { ok: false, reason: src.reason };
    if (!c.identifier || !c.sourceUrl.includes(c.identifier)) {
      return { ok: false, reason: `clip provenance incomplete: identifier and a source URL containing it are required (got "${c.identifier}")` };
    }
  }
  const lines = clips.map((c) => `${c.identifier} · ${c.collection} · ${c.license} · ${c.sourceUrl}`);
  return { ok: true, record: `FOOTAGE PROVENANCE\n${lines.join("\n")}` };
}

// ── card gates ───────────────────────────────────────────────────────────────
// A title card is public prose at its most quotable. Two gates, both must pass:
// truth (no metric/money/customer claims without a [receipt: …] marker) and judgment (content gate).
const UNRECEIPTED_CLAIM = /(\$\s?\d|\d+\s?%|\b\d[\d,.]*\s*(customers?|users?|companies|teams|seats|downloads|installs)\b|\b(revenue|arr|mrr)\b)/i;
const RECEIPT_MARKER = /\[receipt:\s*[^\]]+\]/i;

export function gateCard(text: string): { ok: true } | { ok: false; reasons: string[] } {
  const reasons: string[] = [];
  if (UNRECEIPTED_CLAIM.test(text) && !RECEIPT_MARKER.test(text)) {
    reasons.push("metric/money/traction claim without a [receipt: …] marker — the honesty floor applies to video cards");
  }
  const judged = screenContent(text);
  if (judged.verdict === "flag") reasons.push(...judged.flags);
  return reasons.length ? { ok: false, reasons } : { ok: true };
}

// ── templates ────────────────────────────────────────────────────────────────
// v1 ships TEMPLATES, not open-ended direction: taste lives in the template, variables fill it.
export interface Shot {
  kind: "card" | "archival" | "teletype";
  seconds: number;
  text?: string; // cards + teletype lines
  footageQuery?: string; // archival: what to search the allowlisted collections for
}

export interface Storyboard {
  template: string;
  shots: Shot[];
  totalSeconds: number;
  aiDisclosure: string; // carried onto the end card, always
}

export interface TemplateInput {
  company: string;
  tagline: string; // gated
  honestLine: string; // the stated-plainly line, e.g. "pre-launch · zero customers today" — gated
  chatLines?: string[]; // teletype beats — gated each
}

const AI_DISCLOSURE = "made by AI agents · governed by a human";

export const VIDEO_TEMPLATES: readonly string[] = ["eras-trailer", "teletype-story", "receipt-reveal"] as const;

export function planStoryboard(template: string, input: TemplateInput): { ok: true; board: Storyboard } | { ok: false; reasons: string[] } {
  if (!VIDEO_TEMPLATES.includes(template)) {
    return { ok: false, reasons: [`unknown template "${template}" — v1 ships templates, not freeform direction`] };
  }
  const gatedTexts = [input.tagline, input.honestLine, ...(input.chatLines ?? [])];
  const failures: string[] = [];
  for (const t of gatedTexts) {
    const g = gateCard(t);
    if (!g.ok) failures.push(...g.reasons.map((r) => `"${t.slice(0, 40)}…": ${r}`));
  }
  if (failures.length) return { ok: false, reasons: failures };

  let shots: Shot[];
  if (template === "eras-trailer") {
    shots = [
      { kind: "card", seconds: 2, text: "How work got done." },
      { kind: "archival", seconds: 3.2, footageQuery: "office typing pool 1950s" },
      { kind: "archival", seconds: 3.2, footageQuery: "mainframe computer room 1970s" },
      { kind: "archival", seconds: 2.4, footageQuery: "paperwork files office" },
      { kind: "card", seconds: 4, text: "Every generation, the room got smaller." },
      ...(input.chatLines ?? []).map((t): Shot => ({ kind: "teletype", seconds: 1.4, text: t })),
      { kind: "card", seconds: 5, text: `${input.company} — ${input.tagline}\n${input.honestLine}\n${AI_DISCLOSURE}` },
    ];
  } else if (template === "teletype-story") {
    shots = [
      { kind: "card", seconds: 2, text: input.company },
      ...(input.chatLines ?? []).map((t): Shot => ({ kind: "teletype", seconds: 1.5, text: t })),
      { kind: "card", seconds: 4.5, text: `${input.tagline}\n${input.honestLine}\n${AI_DISCLOSURE}` },
    ];
  } else {
    shots = [
      { kind: "card", seconds: 2.5, text: input.tagline },
      { kind: "teletype", seconds: 3, text: "every claim below is signed. check any of them." },
      { kind: "card", seconds: 4.5, text: `${input.company}\n${input.honestLine}\n${AI_DISCLOSURE}` },
    ];
  }
  const totalSeconds = Math.round(shots.reduce((s, x) => s + x.seconds, 0) * 10) / 10;
  if (totalSeconds > 60) return { ok: false, reasons: [`storyboard runs ${totalSeconds}s — social video caps at 60s, trim the inputs`] };
  return { ok: true, board: { template, shots, totalSeconds, aiDisclosure: AI_DISCLOSURE } };
}
