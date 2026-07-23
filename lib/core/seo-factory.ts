// lib/core/seo-factory.ts — THE SEO FACTORY (ADR-0023, the Ploy adoption done our way).
//
// Ploy.ai ($27M, First Round + YC) proved an agent-run SEO/landing factory sells. We adopt the FACTORY
// and refuse the dark half (visitor de-anonymization → outreach; see the teardown). Two pure pieces:
//
//   planCluster(topic)  — a pillar + 15 supporting articles, deterministic and $0 (planning is not
//                         cognition; DRAFTING happens inside an org-run where the model key lives).
//   honestyGate(article)— the wall every draft must pass BEFORE the pipeline ships it: the AI byline is
//                         appended (disclosure is not optional), and claims that need receipts but lack
//                         them are VIOLATIONS — the article is blocked, never quietly published.
//
// The gate is the whole point: an SEO factory without one is a fabrication factory with distribution.

export interface ClusterItem {
  slug: string;
  title: string;
  intent: "pillar" | "supporting";
  angle: string; // the editorial job this piece does (how-to, comparison, cost…)
}

export interface ClusterPlan {
  topic: string;
  pillar: ClusterItem;
  supporting: ClusterItem[]; // exactly 15 — the pillar's cluster
}

export const AI_BYLINE =
  "Written by the company's AI marketing team and reviewed against its receipts — AI authorship disclosed, as with everything we ship.";

const slugify = (s: string) =>
  s.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// 15 supporting angles: the standard editorial jobs around one pillar topic. Deterministic by design —
// a plan is structure, not cognition, so it costs $0 and tests offline.
const SUPPORTING_ANGLES: { angle: string; title: (t: string) => string }[] = [
  { angle: "what-is", title: (t) => `What is ${t}? A plain-language explanation` },
  { angle: "how-to", title: (t) => `How to get started with ${t}, step by step` },
  { angle: "cost", title: (t) => `What ${t} actually costs (and what drives the price)` },
  { angle: "alternatives", title: (t) => `${t} alternatives: an honest comparison` },
  { angle: "vs-status-quo", title: (t) => `${t} vs. doing it by hand: when each wins` },
  { angle: "checklist", title: (t) => `The ${t} readiness checklist` },
  { angle: "mistakes", title: (t) => `Common ${t} mistakes and how to avoid them` },
  { angle: "examples", title: (t) => `${t} in practice: worked examples` },
  { angle: "for-agencies", title: (t) => `${t} for agencies and consultancies` },
  { angle: "for-solo-founders", title: (t) => `${t} for solo founders` },
  { angle: "governance", title: (t) => `Governance and safety in ${t}: what to demand` },
  { angle: "roi", title: (t) => `Measuring the ROI of ${t} (without inventing numbers)` },
  { angle: "glossary", title: (t) => `A working glossary of ${t} terms` },
  { angle: "faq", title: (t) => `${t}: the questions everyone actually asks` },
  { angle: "integration", title: (t) => `Fitting ${t} into the tools you already use` },
];

/** Pillar + 15 supporting pieces for one topic. Pure, deterministic, $0. */
export function planCluster(topic: string): ClusterPlan {
  const t = topic.trim();
  const pillar: ClusterItem = {
    slug: slugify(`${t}-complete-guide`),
    title: `The complete guide to ${t}`,
    intent: "pillar",
    angle: "pillar",
  };
  const supporting = SUPPORTING_ANGLES.map(({ angle, title }): ClusterItem => ({
    slug: slugify(`${t}-${angle}`),
    title: title(t),
    intent: "supporting",
    angle,
  }));
  return { topic: t, pillar, supporting };
}

export type GateResult =
  | { ok: true; body: string } // byline guaranteed present; safe to hand to the pipeline
  | { ok: false; violations: string[] }; // blocked — the run must fix or drop the claim, never ship it

// A claim "carries a receipt" when its own paragraph cites one: [receipt: …]. The marker is the same
// honesty currency the rest of the platform uses — a number without one does not ship.
const RECEIPT_MARK = "[receipt:";

const SUPERLATIVES = /\b(guaranteed|risk[- ]free|world'?s best|#1|best[- ]in[- ]class)\b/i;
const AUDIENCE_STAT = /\b\d[\d,.]*\s*\+?\s*(users|customers|companies|teams|downloads|installs)\b/i;
const MONEY_CLAIM = /\$\s?\d[\d,.]*\s*(k|m|million)?\s*(in\s+)?(revenue|mrr|arr|saved|profit)/i;
const TESTIMONIAL = /["“][^"”]+["”]\s*[—–-]\s*(a\s|an\s|our\s)?(customer|client|user)/i;

/** The honesty wall. Appends the AI byline when absent; blocks receipt-less claims. Pure. */
export function honestyGate(article: { title: string; body: string }): GateResult {
  const violations: string[] = [];
  const paragraphs = article.body.split(/\n{2,}/);

  for (const p of paragraphs) {
    const receipted = p.includes(RECEIPT_MARK);
    const flag = (rule: string, m: RegExpMatchArray | null) => {
      if (m) violations.push(`${rule}: “${m[0].trim()}” — add ${RECEIPT_MARK} …] or cut it`);
    };
    if (SUPERLATIVES.test(p)) {
      violations.push(`superlative/guarantee: “${p.match(SUPERLATIVES)![0]}” — we don't make claims a receipt can't back`);
    }
    if (!receipted) {
      flag("unverified audience stat", p.match(AUDIENCE_STAT));
      flag("unverified money claim", p.match(MONEY_CLAIM));
      flag("unverified testimonial", p.match(TESTIMONIAL));
    }
  }

  if (violations.length > 0) return { ok: false, violations };
  const body = article.body.includes(AI_BYLINE) ? article.body : `${article.body.trimEnd()}\n\n${AI_BYLINE}`;
  return { ok: true, body };
}

/** The drafting brief an org-run hands its writer — the rails travel INSIDE the prompt, so even the
 *  drafting step knows the gate it must pass. Pure string, model-agnostic. */
export function draftBrief(item: ClusterItem, company: { name: string; idea: string }): string {
  return [
    `Write "${item.title}" (${item.intent}, angle: ${item.angle}) for ${company.name} — ${company.idea}.`,
    `Rails (the honesty gate WILL block violations): no invented statistics, customer counts, revenue figures, or testimonials —`,
    `any such claim must cite a real receipt inline as ${RECEIPT_MARK} …]. No guarantees or "#1" superlatives.`,
    `Useful, specific, plain language; the piece must earn its ranking honestly. AI authorship is disclosed by byline.`,
  ].join(" ");
}
