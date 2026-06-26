// The public Playbooks library. competitor.inc runs every decision on a playbook — so we publish them.
// A curated registry (no markdown dependency): the FREE intro is public (SEO + the hook); the `body`
// is the paid depth and is NOT rendered until the $3 unlock ships (Phase 3) — kept here, withheld there.
// Methodology only — no prompts, agent internals, or customer data. Restated in our own words.

export interface PlaybookSection {
  heading: string;
  paragraphs: string[];
}
export interface Playbook {
  slug: string;
  title: string;
  summary: string;
  readMins: number;
  freeIntro: string[]; // public
  body: PlaybookSection[]; // gated (Phase 3)
}

export const PLAYBOOKS: Playbook[] = [
  {
    slug: "validate-before-you-build",
    title: "Validate before you build",
    summary: "How to know if anyone wants your idea — before you spend a month and your savings building it.",
    readMins: 6,
    freeIntro: [
      "Most first-time founders do it backwards: they fall in love with an idea, disappear for three months to build it, launch to silence, and only then ask whether anyone wanted it. By then the money and the months are gone. The single highest-leverage thing you can do is invert that order — find out if there's real demand first, while it's still cheap to be wrong.",
      "Validation isn't a survey of your friends (they'll lie to be nice) and it isn't \"I just feel like this should exist.\" It's a small, real test that produces an honest signal: would a stranger give you their email, their click, or their money for this — today, before it fully exists? This playbook is the exact sequence we use to get that answer in days, not months.",
    ],
    body: [
      {
        heading: "The three signals that actually count",
        paragraphs: [
          "Not all interest is equal. Rank it by cost-to-the-user: a like is free (weak), an email is a small commitment (better), a pre-order or a click on a real price is money-adjacent (strongest). Design your test to capture the strongest signal you can.",
          "Set the threshold before you run it, in writing. \"If fewer than X people sign up from Y visitors, I hold.\" Deciding the bar after you see the data is how founders fool themselves.",
        ],
      },
      {
        heading: "The 48-hour demand test",
        paragraphs: [
          "Stand up a single honest landing page that states the promise and asks for one action. Drive a tiny, targeted slice of real traffic to it. Measure the conversion to your strongest signal. Read the verdict against your pre-set threshold.",
          "The point isn't a beautiful page — it's a true one. Overselling inflates your signal and poisons the result you're paying to learn.",
        ],
      },
      {
        heading: "Reading the verdict honestly",
        paragraphs: [
          "Strong signal: build the smallest real version next. Weak signal: change the idea or the audience and test again — you just saved yourself months. A weak signal is a win, not a failure: it's the cheapest 'no' you'll ever get.",
        ],
      },
    ],
  },
  {
    slug: "the-honesty-wedge",
    title: "The honesty wedge — and why 0%",
    summary: "Why being the trustworthy, transparent, 0%-cut option beats out-featuring a funded incumbent.",
    readMins: 5,
    freeIntro: [
      "When a category gets hot and funded, the obvious move is to compete on features — match them module for module. For a small team, that's a losing race. The winning move is the opposite: find the thing the funded incumbent can't copy without breaking their own model, and own it completely.",
      "In the \"AI that runs your company\" space, the incumbents spend your money behind a curtain, take a cut of your revenue, and act before they ask. Their own users say so. That's not a feature gap — it's a trust gap. And trust is a wedge you can drive straight through, because they literally can't follow you without dismantling how they make money.",
    ],
    body: [
      {
        heading: "Counter-positioning, plainly",
        paragraphs: [
          "Pick the axis where the leader is structurally stuck. If their economics depend on a revenue cut, your 0% isn't a discount — it's a position they can't match without hurting themselves. That asymmetry is the whole game.",
          "Make the invisible visible. If they hide what the AI does, you show every action, every dollar, with one-click undo. Transparency is cheap for you and expensive for them (it exposes their failures).",
        ],
      },
      {
        heading: "Why first-timers feel it most",
        paragraphs: [
          "Experienced operators tolerate opacity; first-time founders are terrified of being fleeced or losing control. The honesty wedge lands hardest exactly on the people who've never done this — which is why they're the beachhead.",
        ],
      },
    ],
  },
  {
    slug: "distribution-for-first-time-founders",
    title: "Distribution for first-time founders",
    summary: "The honest reach game — a credibility anchor, founder-led short-form, and one channel that works.",
    readMins: 7,
    freeIntro: [
      "Here's the uncomfortable truth nobody tells first-time founders: the product is rarely what kills you — distribution is. You can build something genuinely good and still hear crickets, because building and being-heard are two completely different skills, and you only practiced one.",
      "The good news: reach is learnable, and it's mostly mechanics, not magic. The funded players didn't win on a product millions use — they won on a credibility anchor, founder-led content with a shareable hook, and a relentless focus on the one channel that actually converts. You can run the same machine on a zero budget.",
    ],
    body: [
      {
        heading: "Do things that don't scale (first)",
        paragraphs: [
          "For the first stretch, you are the distribution engine. Hand-recruit your earliest users one conversation at a time, show up where they already gather, and learn the message from their reactions. No automation can do this part — and that's fine, it's temporary.",
        ],
      },
      {
        heading: "Find the one channel, then pour in",
        paragraphs: [
          "Test five cheap channels in parallel for a couple of weeks. Kill the three that don't convert. Pour everything into the one or two that do. One reliable channel beats five mediocre ones — the channel is the actual prize, more than any single launch spike.",
        ],
      },
    ],
  },
  {
    slug: "path-to-10k-mrr",
    title: "The path to $10K a month",
    summary: "Backsolving the funnel honestly — what it really takes, and the levers that move it.",
    readMins: 6,
    freeIntro: [
      "\"$10K a month\" sounds like a vibe until you do the arithmetic, and the arithmetic is clarifying. At a $39 plan, $10K MRR is ~257 paying customers. Now every vague growth wish becomes a concrete funnel: how many visitors, at what signup rate, at what conversion to paid, with what churn. Suddenly you're not hoping — you're engineering.",
      "And the honest headline: hitting $10K from a cold start in your first month or two is top-decile hard. This playbook won't pretend otherwise. What it will do is lay out the levers that actually move the number — and show you why conversion and retention beat raw traffic almost every time.",
    ],
    body: [
      {
        heading: "The levers that matter most",
        paragraphs: [
          "Signup→paid is the highest-leverage number on the page: nudging it from 10% to 15% can be the difference between $7K and $10K with the same traffic. Fix activation and conversion before you spend a dollar buying more visitors into a leaky funnel.",
          "Pricing is a lever too. A higher tier for power users or an annual prepay pulls revenue forward and reaches the goal with far fewer accounts — often the fastest honest path to the number.",
        ],
      },
      {
        heading: "The go/no-go",
        paragraphs: [
          "Decide your kill and keep criteria in advance. A near-miss with healthy retention says keep going; flat-and-low with no working channel says pivot. The discipline is in deciding before the emotions of launch arrive.",
        ],
      },
    ],
  },
  {
    slug: "build-it-on-zero-budget",
    title: "Build it on a zero budget",
    summary: "How to ship a real AI product with $0 — free-tier inference, student credits, and a smart compute mix.",
    readMins: 6,
    freeIntro: [
      "The myth that stops broke founders cold: \"I need money for the AI before I can even start.\" You don't. \"Open-source models are free\" is half the story — the weights are free, the GPU to run them isn't — but there's a real $0 path, and it's mostly about using compute that already exists at no cost to you.",
      "The trick is to stop asking \"how do I pay for AI?\" and start asking \"whose idle compute and unused credits am I allowed to use?\" Answer that, and you can deliver a real experience to your first users without spending a cent — funding the heavier moments with credits you're entitled to but haven't claimed.",
    ],
    body: [
      {
        heading: "The three free layers",
        paragraphs: [
          "Layer one: the user's own device — a small model can run client-side in the browser, so the visitor's hardware does the work and your server cost is zero. Layer two: free-tier hosted inference of strong open models, plenty for your first cohort. Layer three: non-dilutive startup and student credits for the trust-critical, strong-model moments.",
        ],
      },
      {
        heading: "Route by moment, never overpay",
        paragraphs: [
          "Use the cheapest option that's good enough for each moment: simulated/free for the demo, free-tier for the taste, a strong (credit-funded) model only where quality decides trust, and let paying users fund their own heavier usage. Compute becomes self-funding the moment someone pays.",
        ],
      },
    ],
  },
];

export function getPlaybook(slug: string): Playbook | undefined {
  return PLAYBOOKS.find((p) => p.slug === slug);
}
