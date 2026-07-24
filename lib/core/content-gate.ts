// lib/core/content-gate.ts — CONTENT GATE v2: the judgment screen (ADR-0025).
//
// The pre-mortem's one uncovered hole (S3): the honesty gate checks FACTS (receipts, labels), nothing
// checks JUDGMENT — an agent post can be receipt-clean and still be cruel, tragedy-adjacent, political,
// or bait. This module is the deterministic floor for taste: it screens every piece of public prose
// BEFORE the publishing mandate can clear it. A flag never auto-blocks creativity silently — flagged
// content QUEUES FOR A HUMAN with named reasons. Deterministic by design (testable, un-promptable);
// model-based nuance can layer on top inside org-runs, but the floor cannot be argued with.

export interface ContentScreen {
  verdict: "pass" | "flag";
  flags: string[]; // named reasons — empty on pass
}

// Hostile/dunking language aimed outward. Conservative on purpose: a false positive costs one human
// review; a false negative costs the brand. Word-boundary matched, case-insensitive.
const HOSTILE = /\b(pathetic|garbage|trash|dumpster|incompetent|clueless|laughable|embarrassing|scam|fraudster|grifter|snake ?oil|dying compan(y|ies)|failed compan(y|ies)|losers?|idiots?|morons?|stupid)\b/i;

// Tragedy adjacency — we never market near someone's bad day.
const TRAGEDY = /\b(layoffs?|laid off|bankruptcy|bankrupt|shut(ting)? down|deaths?|died|fatal|tragedy|disaster|shooting|war|invasion|earthquake|hurricane|wildfire|pandemic|victims?)\b/i;

// Lanes agents never opine in publicly: politics, medical, legal.
const POLITICS = /\b(election|vote for|ballot|republican|democrat|left[- ]wing|right[- ]wing|liberal agenda|conservative agenda|president(ial)? (race|candidate)|congress(man|woman)?|senator)\b/i;
const MEDICAL = /\b(cures?|vaccines?|diagnos(is|e|ed)|treatments? for|medical advice|mental illness|depression cure|weight[- ]loss)\b/i;
const LEGAL_CLAIMS = /\b(legal advice|we will sue|lawsuit threat|illegal(ly)? (?:act|conduct)|violates? the law|criminal)\b/i;

// Engagement bait + shouting — beneath the brand, and a runaway-agent tell.
const BAIT = /\b(rt if|retweet if|like if you agree|tag someone|you won'?t believe|shocking truth|wake up people)\b/i;
const SHOUTING = /(!{3,}|\?{3,}|\b[A-Z]{6,}\b(?:\s+\b[A-Z]{4,}\b){2,})/;

// Minimal profanity floor (extend before loosening — additions are cheap, apologies are not).
const PROFANITY = /\b(fuck\w*|shit\w*|bitch\w*|asshole\w*|bastard\w*|damn(ed)?)\b/i;

const RULES: { name: string; re: RegExp; why: string }[] = [
  { name: "hostile-language", re: HOSTILE, why: "dunking/hostile wording aimed outward" },
  { name: "tragedy-adjacent", re: TRAGEDY, why: "references someone's bad day (layoffs, disasters, deaths) — we never market near it" },
  { name: "politics", re: POLITICS, why: "political opinion territory — agents do not opine publicly" },
  { name: "medical-claims", re: MEDICAL, why: "medical claim territory" },
  { name: "legal-claims", re: LEGAL_CLAIMS, why: "legal claim/threat territory" },
  { name: "engagement-bait", re: BAIT, why: "engagement-bait pattern" },
  { name: "shouting", re: SHOUTING, why: "tone: shouting or excessive punctuation" },
  { name: "profanity", re: PROFANITY, why: "profanity" },
];

/** Screen one piece of public prose. Pure + deterministic; a flag routes to a human, never silently drops. */
export function screenContent(text: string): ContentScreen {
  const flags: string[] = [];
  for (const r of RULES) {
    const m = text.match(r.re);
    if (m) flags.push(`${r.name}: ${r.why} (“${m[0].trim().slice(0, 40)}”)`);
  }
  return flags.length ? { verdict: "flag", flags } : { verdict: "pass", flags: [] };
}
