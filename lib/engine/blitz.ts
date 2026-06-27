// Surge's "surprise-launch blitz" — drafts demand-capture posts for the active company, echoing the
// contrarian hook ("the AI that refuses to build until it proves demand"). These are DRAFTS only:
// the caller queues each as an outreach approval, so nothing posts without the founder's sign-off.
// Fully simulated (offline), personalized to the company; mirrors the launch/ kit copy.

export interface BlitzDraft {
  channel: string;
  title: string; // approval title
  body: string; // the drafted post
}

// A short, lowercased problem phrase from the idea for natural copy ("an app for X" → "x").
function problem(idea: string): string {
  const t = idea.trim().replace(/^(an?|the)\s+/i, "").replace(/[.!?]+$/, "");
  return t.length > 90 ? t.slice(0, 90).trim() + "…" : t || "your idea";
}

export function draftBlitz(company: { name: string; idea: string }): BlitzDraft[] {
  const name = company.name;
  const p = problem(company.idea);
  return [
    {
      channel: "Bluesky thread",
      title: "Post the launch thread on Bluesky",
      body:
        `Every AI tool wants to build your startup. ${name} is the one that tells you NOT to — until it proves people want it.\n\n` +
        `We pressure-tested "${p}" with a real demand test before writing a line of product code. Here's what came back 🧵`,
    },
    {
      channel: "Show HN",
      title: "Submit to Show HN",
      body:
        `Show HN: ${name} – an AI co-founder that validates demand before it builds\n\n` +
        `I kept watching "AI builds your company" tools burn weeks (and money) on things nobody wanted. So ${name} runs a real demand test first — landing page, fake-door, a small ad smoke-test, search demand — and will tell you "don't build this." Only after you approve does it build, in a Glass Box with approvals on anything consequential. Built around "${p}". Brutal feedback welcome.`,
    },
    {
      channel: "Indie Hackers",
      title: "Post to Indie Hackers / r/SaaS",
      body:
        `Burned by an autonomous AI builder that marked work "done" without shipping? ${name} is the proof-first alternative: it validates "${p}" before building, shows every action with proof, asks before it spends, and takes 0% of your revenue. Would love your read on whether the validation signal feels real.`,
    },
  ];
}
