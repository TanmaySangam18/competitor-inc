// The Mom Test kit (Rob Fitzpatrick) — validation pillar #1: real conversations, done right.
// Pure + deterministic: generates a founder-ready interview kit from the idea. The cardinal rule is
// enforced structurally — no generated question ever asks "would you ...?" (hypotheticals invite
// polite lies); everything asks about PAST behavior, SPECIFICS, and MONEY. Pillar #3 rides along:
// the costly-ask ladder, ordered by how much the ask costs the prospect (commitment > compliments).

export interface InterviewQuestion {
  q: string;
  why: string; // the Mom-Test principle behind it — shown as a hint, teaches while it works
}

export interface CostlyAsk {
  label: string;
  cost: string; // what it costs the prospect (the point)
  script: string; // copy-paste ask
}

export interface MomTestKit {
  whoToAsk: string[];
  openers: string[];
  questions: InterviewQuestion[];
  sins: string[]; // what NOT to ask/do
  costlyAsks: CostlyAsk[]; // ordered weakest → strongest commitment
  debrief: string[]; // how to score what you heard
}

// A short problem phrase from the idea (same normalization family as blitz.ts).
function problem(idea: string): string {
  const t = idea.trim().replace(/^(an?|the)\s+/i, "").replace(/[.!?]+$/, "");
  return t.length > 80 ? t.slice(0, 80).trim() + "…" : t || "this problem";
}

export function buildMomTestKit(company: { name: string; idea: string }): MomTestKit {
  const p = problem(company.idea);
  return {
    whoToAsk: [
      `5 people who plausibly live with ${p} today (not friends being nice — people with the problem)`,
      "2 people who already PAY for something adjacent (they've proven they spend money here)",
      "1 person who tried to solve it and gave up (the objection goldmine)",
    ],
    openers: [
      `I'm researching how people deal with ${p} — can I ask about the last time it came up? (Don't pitch. Don't mention ${company.name}.)`,
      "This isn't a sales thing — I'm trying to learn where this actually hurts, if it does.",
    ],
    questions: [
      { q: `Tell me about the last time you dealt with ${p}.`, why: "Past behavior — specifics can't be polite lies." },
      { q: "What did you do about it? Walk me through it.", why: "Their WORKFLOW is the truth; their opinion is noise." },
      { q: "What have you already tried or bought to fix this?", why: "Money spent = demand proven. Nothing tried = maybe not a real problem." },
      { q: "What does it cost you when it goes wrong — time, money, standing?", why: "Sizes the pain in THEIR units, not yours." },
      { q: "Who else has this worse than you?", why: "Referrals into the concentric next circle — and a read on where the pain concentrates." },
      { q: "What would have to be true for you to switch from what you do now?", why: "Surfaces the real objection while it's cheap to hear." },
    ],
    sins: [
      "Never ask “would you use/buy this?” — hypotheticals collect compliments, not truth.",
      "Never pitch first. The moment you pitch, every answer becomes politeness.",
      "Compliments are data about your charm, not your idea. Log commitments only.",
      "“I'd definitely pay for that” with no follow-through is a NO wearing a smile.",
    ],
    costlyAsks: [
      { label: "Time", cost: "30 minutes of their calendar", script: "Can I get 30 minutes next week to watch how you handle this today?" },
      { label: "Reputation", cost: "an intro to a peer", script: "Who's one person with this problem worse than you? Would you intro me today?" },
      { label: "Commitment", cost: "a written yes", script: `If ${company.name} solves this the way we discussed, will you reply YES to a one-line email saying you'll pilot it?` },
      { label: "Money", cost: "a deposit or pre-order", script: "Early access is a refundable pre-order — want me to send the link now while we're talking?" },
    ],
    debrief: [
      "Count COMMITMENTS (time given, intros made, deposits) — not kind words.",
      "3+ commitments out of 5 conversations → strong signal, run the live demand test next.",
      "All compliments, zero commitments → the honest verdict is tweak or kill. That's a win too: it cost a week, not a semester.",
    ],
  };
}
