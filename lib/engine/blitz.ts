// Surge's "surprise-launch blitz" — drafts launch posts for the active CUSTOMER company, about THAT
// company's product (name + idea) — never competitor.inc's own pitch. These are DRAFTS only: the caller
// queues each as an outreach approval, so nothing posts without the founder's sign-off. Fully simulated
// (offline), personalized to the company.

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
        `Introducing ${name} — ${p}.\n\n` +
        `We validated that people actually want this before building it. It's now live in early access — here's the story 🧵`,
    },
    {
      channel: "Show HN",
      title: "Submit to Show HN",
      body:
        `Show HN: ${name} – ${p}\n\n` +
        `${name} tackles ${p}. We ran real demand tests before building, and it's now live in early access. Brutal feedback welcome — what would make this a must-have for you?`,
    },
    {
      channel: "Indie Hackers",
      title: "Post to Indie Hackers / r/SaaS",
      body:
        `Just launched ${name} — ${p}. Early access is open and I'd love your honest read: would you use this, and what's missing?`,
    },
  ];
}
