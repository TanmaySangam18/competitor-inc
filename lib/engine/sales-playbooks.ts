// THE SALES FLOOR — the invention. Rivals' agents BUILD a product (specs, mockups, PRs, posts). Ours also
// carry a trained sales force: agents grounded in the canon of human sales + marketing science, whose job is
// to create demand and SELL a product nobody was going to buy. This file is that training — the named
// frameworks encoded as original, applicable guidance (we APPLY the frameworks, never reproduce copyrighted
// text — the charter forbids plagiarism). It powers the free "Sell This" tool + the paid "run the sales" crew.
//
// Pure + dependency-free so it's fully testable and usable both client- and server-side.

export interface Playbook {
  key: string;
  name: string;
  author: string; // credit the real source (application, not reproduction)
  principle: string; // the one-line idea, in our words
  applyTo: (p: string) => string; // how a sales agent applies it to THIS product (prompt-ready guidance)
}

// The canon. Each is applied, not quoted. `p` = the product/idea in one line.
export const PLAYBOOKS: Playbook[] = [
  {
    key: "jtbd",
    name: "Jobs To Be Done",
    author: "Clayton Christensen",
    principle: "People don't buy products; they hire them to make progress in a situation.",
    applyTo: (p) => `Name the real JOB a customer hires "${p}" to do — the situation, the struggling moment, and the progress they want. Sell the progress, not the features.`,
  },
  {
    key: "positioning",
    name: "Obviously Awesome (positioning)",
    author: "April Dunford",
    principle: "Position against the alternative the customer would otherwise pick, then own one attribute that matters.",
    applyTo: (p) => `For "${p}": list the competitive alternatives (incl. "do nothing"), the one attribute we win on, the value that attribute unlocks, and the customer who cares about it most. Frame the market so that attribute is the thing that matters.`,
  },
  {
    key: "storybrand",
    name: "StoryBrand",
    author: "Donald Miller",
    principle: "The customer is the hero; the brand is the guide. Clarify problem → plan → call to action → stakes.",
    applyTo: (p) => `Write the one-liner for "${p}": [customer] wants [desire] but [problem]; we guide them with [plan] so they [success] and avoid [stakes]. Customer is the hero, not us.`,
  },
  {
    key: "challenger",
    name: "The Challenger Sale",
    author: "Dixon & Adamson",
    principle: "The best reps teach the customer something new about their own problem, tailor it, and take control of the sale.",
    applyTo: (p) => `Find the "commercial insight" for "${p}" — a surprising truth about the buyer's problem that reframes it and leads to us. Teach it, don't pitch.`,
  },
  {
    key: "spin",
    name: "SPIN Selling",
    author: "Neil Rackham",
    principle: "In complex sales, questions beat pitches: Situation → Problem → Implication → Need-payoff.",
    applyTo: (p) => `Draft the 4 questions for "${p}": current situation, the problem, its implications (the cost of inaction), and the payoff of solving it. Let the buyer talk themselves into it.`,
  },
  {
    key: "sandler",
    name: "Sandler pain funnel",
    author: "David Sandler",
    principle: "Disqualify fast, find the real pain, and let the buyer own the decision. No convincing.",
    applyTo: (p) => `For "${p}": the disqualifying question (who is this NOT for), the pain-funnel questions to reach the real hurt, and how to let them decide without pressure.`,
  },
  {
    key: "cialdini",
    name: "Influence (ethical persuasion)",
    author: "Robert Cialdini",
    principle: "Reciprocity, commitment, social proof, authority, liking, scarcity, unity — used honestly, never as tricks.",
    applyTo: (p) => `For "${p}": one honest use each of social proof (real users only), reciprocity (give value first), and authentic scarcity (real limits, never fake urgency). If a lever needs a lie, drop it.`,
  },
  {
    key: "pas",
    name: "PAS / AIDA copy",
    author: "classic direct response",
    principle: "Problem → Agitate → Solve; or Attention → Interest → Desire → Action.",
    applyTo: (p) => `Write the landing/DM copy for "${p}" as Problem → Agitate (make the cost vivid, truthfully) → Solve (us) → one clear action.`,
  },
  {
    key: "bullseye",
    name: "Bullseye (traction channels)",
    author: "Weinberg & Mares",
    principle: "There are ~19 acquisition channels; systematically pick the 1–3 most promising and test cheaply.",
    applyTo: (p) => `For "${p}": rank the 3 likeliest of the 19 channels (SEO, content, community, cold outreach, PH/HN, referrals, partnerships, etc.), and the cheapest test for each. Kill a channel at 14 days silent.`,
  },
  {
    key: "chasm",
    name: "Crossing the Chasm",
    author: "Geoffrey Moore",
    principle: "Win a tiny beachhead of early adopters completely before going broad.",
    applyTo: (p) => `Name the single narrowest beachhead for "${p}" — one specific group with acute pain we can dominate first — and why them.`,
  },
];

export interface SalesAttack {
  product: string;
  job: string; // JTBD
  positioning: string; // Dunford
  oneLiner: string; // StoryBrand
  beachhead: string; // Moore
  channels: string[]; // Bullseye (≤3)
  insight: string; // Challenger
  pitch: string; // PAS
  objections: { objection: string; response: string }[]; // Sandler/SPIN
  firstWeek: string[]; // concrete opening moves
  frameworks: string[]; // which playbooks were applied (credited)
}

// The system prompt that TRAINS the model to think like a great salesperson grounded in the canon. The
// model produces the tailored SalesAttack; this is the invention's "brain". Original guidance only.
export function buildSalesPrompt(product: string): string {
  const canon = PLAYBOOKS.map((b) => `- ${b.name} (${b.author}): ${b.principle}\n  Apply: ${b.applyTo(product)}`).join("\n");
  return [
    `You are the Sales Floor of competitor.inc — a crew of AI salespeople trained on the canon of sales and`,
    `marketing science. Your job: take a product nobody was going to buy and build the go-to-market that`,
    `actually sells it. Ground EVERY recommendation in a named framework below (apply it, never quote it).`,
    `Be specific and honest — no fabricated stats, no fake urgency, no channels the founder can't run.`,
    ``,
    `THE PRODUCT: ${product}`,
    ``,
    `THE CANON (apply these):`,
    canon,
    ``,
    `Return the go-to-market as: the JOB it's hired for, positioning vs alternatives, a one-line pitch, the`,
    `single beachhead, the top 3 channels + a cheap test each, the commercial insight, PAS landing copy, the`,
    `3 hardest objections + honest responses, and the exact first-week moves. Tag each with the framework used.`,
  ].join("\n");
}

// Deterministic fallback — always returns a real, framework-grounded skeleton even with no model configured
// (so the free tool never breaks). The model enriches it into tailored copy; this guarantees it's never empty.
export function salesAttackFallback(product: string): SalesAttack {
  const p = product.trim() || "your product";
  return {
    product: p,
    job: `The real job: what progress does someone hire "${p}" to make, in what struggling moment? Sell that progress. (Jobs To Be Done)`,
    positioning: `Against the alternative they'd otherwise pick (often "do nothing"), win on ONE attribute that matters and frame the market around it. (April Dunford)`,
    oneLiner: `[your customer] wants [outcome] but [problem] — ${p} guides them to it so they avoid [the cost of staying stuck]. (StoryBrand)`,
    beachhead: `Pick ONE narrow group with acute, weekly pain you can dominate first — not "everyone". (Crossing the Chasm)`,
    channels: [
      "Community where they already gather (help-first, not ads)",
      "Personalized direct outreach (value-first; 14 days silent = dead)",
      "A launch moment (Show HN / Product Hunt) with a free, shareable tool",
    ],
    insight: `Teach them a surprising truth about their own problem that reframes it and leads to ${p}. (Challenger Sale)`,
    pitch: `Problem → agitate the real cost (truthfully) → ${p} solves it → one clear next step. (PAS)`,
    objections: [
      { objection: "\"I can do this myself / with ChatGPT.\"", response: "Show the gap between a raw tool and a finished, governed outcome with receipts — and the hours it costs them. (Challenger)" },
      { objection: "\"Too expensive.\"", response: "Reframe against the cost of the unsolved problem and the alternative's true price, not our price in isolation. (SPIN implication)" },
      { objection: "\"Not sure it works.\"", response: "Offer a small, reversible first step (trial / one real deliverable) — let them decide, don't convince. (Sandler)" },
    ],
    firstWeek: [
      "Lock the beachhead + the one-liner.",
      "Give value first in 1 community (the free tool / a real audit).",
      "10 personalized outreaches to the beachhead; book 3 conversations.",
      "One honest scarcity offer (real limit) to the warmest lead.",
    ],
    frameworks: PLAYBOOKS.map((b) => b.name),
  };
}
