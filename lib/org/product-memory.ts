// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT MEMORY (P1 — the core compounding unlock).
//
// The wall between one-shot builds and Copilot-class engineering is MEMORY: a product must be a long-lived
// thing whose architecture + decisions persist across build sessions, so the 5th change reads the first
// four. This is the pure composition layer — an architecture doc + an append-only ADR log + a recall brief
// that is injected into every SUBSEQUENT task on the same product (so the agent CONTINUES it instead of
// rebuilding it). Storage is lib/engine/product-memory-db.ts (migration 0028); this file has no I/O.
//
// Deterministic: `now` is injected. Same inputs ⇒ same docs (so a build is reproducible + testable).
// ─────────────────────────────────────────────────────────────────────────────

import { architectKnowledge } from "@/lib/engine/architect-knowledge";

export type ProductDocKind = "architecture" | "adr" | "roadmap";

export interface ProductDoc {
  kind: ProductDocKind;
  seq: number; // architecture/roadmap = 0; ADRs increment from 1 (chronological decision log)
  title: string;
  body: string;
  createdAt: number;
}

export interface ProductMemory {
  product: string; // the product/repo slug (a customer may own several products)
  docs: ProductDoc[];
}

export function emptyMemory(product: string): ProductMemory {
  return { product, docs: [] };
}

/** The founding architecture doc, written when a product is first built. seq 0, one per product. */
export function architectureDoc(product: string, goal: string, now: number): ProductDoc {
  const body = [
    `# Architecture — ${product}`,
    ``,
    `## What this product is`,
    goal.trim(),
    ``,
    `## Stack`,
    `- Next.js (App Router) + TypeScript + Tailwind; a real API route with persistence (Supabase when`,
    `  configured, else an in-memory store). Deployed on Vercel.`,
    ``,
    `## Standing invariants (every future change MUST uphold these)`,
    architectKnowledge(),
    ``,
    `## Decision log`,
    `See the ADRs recorded against this product (kind=adr), most recent last.`,
  ].join("\n");
  return { kind: "architecture", seq: 0, title: `Architecture — ${product}`, body, createdAt: now };
}

/** An Architecture Decision Record — the standard Context / Decision / Consequences shape. */
export function adrDoc(
  seq: number,
  title: string,
  parts: { context: string; decision: string; consequences: string },
  now: number,
): ProductDoc {
  const body = [
    `# ADR-${seq}: ${title}`,
    ``,
    `## Context`,
    parts.context.trim(),
    ``,
    `## Decision`,
    parts.decision.trim(),
    ``,
    `## Consequences`,
    parts.consequences.trim(),
  ].join("\n");
  return { kind: "adr", seq, title, body, createdAt: now };
}

/** The next ADR ordinal for a product (ADRs are 1-indexed and never renumbered). */
export function nextAdrSeq(memory: ProductMemory): number {
  const maxSeq = memory.docs.filter((d) => d.kind === "adr").reduce((m, d) => Math.max(m, d.seq), 0);
  return maxSeq + 1;
}

// The one-line decision summary for the recall list (first non-empty line under "## Decision").
function decisionLine(body: string): string {
  const lines = body.split("\n");
  const i = lines.findIndex((l) => l.trim().toLowerCase() === "## decision");
  if (i < 0) return "";
  for (let j = i + 1; j < lines.length; j++) {
    const t = lines[j].trim();
    if (t && !t.startsWith("#")) return t;
  }
  return "";
}

const RECALL_CAP = 2600; // keep the recall from blowing the build brief (a wall of text degrades one-shots)

/**
 * The recall brief — injected into every SUBSEQUENT task on this product. It is what makes building
 * compound: the agent is told it is CONTINUING a known product, handed its architecture summary and its
 * decisions on record, so it extends rather than rebuilds. Empty string when there's nothing to recall yet.
 */
export function recallBrief(memory: ProductMemory, opts: { maxAdrs?: number } = {}): string {
  const arch = memory.docs.find((d) => d.kind === "architecture");
  const adrs = memory.docs
    .filter((d) => d.kind === "adr")
    .sort((a, b) => b.seq - a.seq)
    .slice(0, opts.maxAdrs ?? 8);
  if (!arch && adrs.length === 0) return "";

  const out: string[] = [
    `PRODUCT MEMORY — you are CONTINUING an existing product ("${memory.product}"), NOT starting fresh.`,
    `Honor every decision on record unless this task explicitly changes it; keep the architecture coherent.`,
    ``,
  ];
  if (arch) {
    // The architecture "What this product is" + "Stack" sections are the highest-signal recall; skip the
    // invariants block (already injected separately via architectKnowledge) to save budget.
    const summary = arch.body.split("\n## Standing invariants")[0].trim();
    out.push(summary, ``);
  }
  if (adrs.length) {
    out.push(`DECISIONS ON RECORD (most recent first):`);
    for (const d of adrs) {
      const line = decisionLine(d.body);
      out.push(`- ADR-${d.seq}: ${d.title}${line ? ` — ${line}` : ""}`);
    }
  }
  const text = out.join("\n").trimEnd();
  return text.length > RECALL_CAP ? text.slice(0, RECALL_CAP - 1).trimEnd() + "…" : text;
}
