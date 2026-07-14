// lib/founder.ts — THE FOUNDER PROFILE (the human owner behind competitor.inc).
//
// A clean, brand-focused bio for the founder section — LinkedIn-grade substance, competitor.inc's voice.
// FOUNDER-PROVIDED, editable: the numbers below are the founder's own stated facts (from their portfolio),
// not invented. Deliberately drops the job-search framing ("OPT · no sponsorship · available now") — that
// belongs on a personal portfolio, not on the company's founder section. Links the founder fills in.

export interface FounderStat { value: string; label: string; }
export interface FounderLink { label: string; href: string; }

export interface FounderProfile {
  name: string;
  identity: string; // the one-line "what I am"
  location: string;
  tagline: string; // the signature line (rendered big)
  bio: string;
  stats: FounderStat[];
  links: FounderLink[];
}

export const FOUNDER: FounderProfile = {
  name: "Tanmay Sangam",
  identity: "Builder · Operator · Founder’s Associate",
  location: "Boston, MA",
  tagline: "I build the thing that doesn’t exist yet.",
  bio: "Founder and operator behind competitor.inc — the verifiable autonomous AI company. I care about shipping real things and making them prove themselves before anyone pays. competitor.inc is that belief in software: a governed AI organization that validates, builds, runs, and sells software under one human signature — with every claim backed by a receipt.",
  // Founder-provided figures (edit here). Kept factual and modest — no rounding up.
  stats: [
    { value: "9", label: "products shipped" },
    { value: "3,000+", label: "event attendees" },
  ],
  // Fill the real URLs (LinkedIn placeholder until provided).
  links: [
    { label: "Email", href: "mailto:sangam.d@northeastern.edu" },
    { label: "LinkedIn", href: "#" },
  ],
};
