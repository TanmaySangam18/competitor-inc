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
  {
    slug: "the-autonomy-ladder",
    title: "The autonomy ladder — how much should you let AI run?",
    summary: "Where to place AI on the spectrum from 'suggests' to 'fully autonomous' — and why the winning rung keeps a human on the calls that matter.",
    readMins: 5,
    freeIntro: [
      "It's tempting to want an AI that runs your whole company while you sleep — zero involvement, pure magic. But the people who get burned are the ones who hand over the keys completely, then watch an opaque system spend their money or email the wrong person. The real question isn't \"autonomous or not\" — it's which rung of the ladder you stand on.",
      "The autonomy ladder runs from \"the AI suggests, you do everything\" up to \"the AI does everything and doesn't even tell you.\" For anything that spends money or talks to the public, there's one rung that wins on both speed and trust — and most founders stand on the wrong one. This is how to find the right rung.",
    ],
    body: [
      {
        heading: "The five rungs",
        paragraphs: [
          "1) Suggests — you do all the doing. 2) Does each step, but waits for your yes every time. 3) Does it, then tells you after. 4) Does it unless you stop it in time. 5) Fully autonomous — you're not in the loop at all. Speed rises as you climb; control falls.",
        ],
      },
      {
        heading: "The winning rung: high work-autonomy, human-approved consequences",
        paragraphs: [
          "Let the AI run at near-full autonomy on the work (research, drafts, builds, analysis) but require a human yes on the consequential, hard-to-reverse moves — spending, public messages, deletions. You get ~99% of the leverage and keep both trust and a kill switch. People don't fear an AI that does the work; they fear one that acts irreversibly without asking.",
        ],
      },
      {
        heading: "Set guardrails before you climb",
        paragraphs: [
          "Decide in advance what's pre-authorized (small, reversible) versus what's gated (spend caps, anything public), and keep a plain-language log of every action so you can undo it. Autonomy without an audit trail isn't leverage — it's risk.",
        ],
      },
    ],
  },
  {
    slug: "win-a-niche-first",
    title: "Win a niche before you go wide",
    summary: "Why the fastest path to a big market is owning one small, specific group first — and how to pick it.",
    readMins: 5,
    freeIntro: [
      "Every ambitious founder wants the huge market — \"anyone could use this.\" But \"everyone\" is the hardest first customer to win, because no single message lands for all of them at once. The counter-intuitive truth: the fastest path to a big market is to utterly own a small one first.",
      "A beachhead is a tight group who share one urgent problem and talk to each other. Be the obvious choice for that person, and word-of-mouth plus credibility carry you into the next segment. This is how to pick that beachhead — and avoid the \"boil the ocean\" trap that quietly kills most launches.",
    ],
    body: [
      {
        heading: "What makes a good beachhead",
        paragraphs: [
          "A homogeneous group with one urgent, shared pain; a word-of-mouth network so wins spread; and a place you can reach them cheaply. If a segment has all three, it's a launchpad — not a limitation.",
        ],
      },
      {
        heading: "Pick the WHO, not the vertical",
        paragraphs: [
          "Define your niche by the person and their shared problem, not the industry. That lets you stay broad in what you build while being laser-focused on who you serve first — the same product, aimed at one person who feels truly understood.",
        ],
      },
      {
        heading: "Dominate, then expand",
        paragraphs: [
          "Be 10× better for that one group than any generalist. Their referrals and your proof open the next door — and the next. Trying to be pretty-good for everyone loses to being unmissable for someone.",
        ],
      },
    ],
  },
  {
    slug: "how-people-decide",
    title: "How people actually decide",
    summary: "The honest version of persuasion — the mental shortcuts behind real decisions, and how to earn a yes without ever manipulating one.",
    readMins: 6,
    freeIntro: [
      "People like to believe they decide with cold logic. They mostly don't. Real decisions run on fast mental shortcuts — what feels safe, what others are doing, what they'd lose by waiting — and only get dressed up as reasons afterward. If you want someone to say yes to your product, understand the shortcuts; don't argue with the after-the-fact logic.",
      "There's a fork here that matters: the same shortcuts can manipulate or clarify. Manipulation buys a yes today and a refund (and a bad review) tomorrow. Clarity helps someone make a choice they'll still be glad they made next month. This playbook is the honest side — using how people decide to remove confusion and fear, never to trick.",
    ],
    body: [
      {
        heading: "The shortcuts that move a decision",
        paragraphs: [
          "A handful of forces do most of the work: social proof (what people like me are doing), authority (does a credible source vouch for this), scarcity and loss (what do I lose if I wait), reciprocity (they gave first, so I lean in), commitment (small yeses lead to bigger ones), and liking (I trust people who feel like me). Name the one or two that genuinely apply to you and lead with them.",
          "The honesty test: every one must be true. Real scarcity, not a fake countdown. Real proof, not invented reviews. The moment a shortcut is a lie, you've traded a long-term customer for a short-term click — a terrible trade, especially for a trust-based product.",
        ],
      },
      {
        heading: "Fast brain, slow brain",
        paragraphs: [
          "People judge with a fast, emotional system first and a slow, rational one second. Your headline and first screen are read by the fast brain — it decides whether the slow brain even bothers. So make the first impression feel safe and clear before you pile on features and detail.",
        ],
      },
      {
        heading: "Reduce fear, don't just add desire",
        paragraphs: [
          "Most founders crank up desire. Often the bigger lever is removing fear: 'what if it's a scam,' 'what if I'm locked in,' 'what if I lose my money.' Answer the scariest objection out loud, early, and plainly. A yes is frequently just what's left once the fear is gone.",
        ],
      },
    ],
  },
  {
    slug: "design-for-action",
    title: "Design for action — why people do (or don't) act",
    summary: "A simple model for why someone takes an action — and the one lever that beats motivation almost every time: make it easier.",
    readMins: 5,
    freeIntro: [
      "You've seen it: people say they want the thing, then don't do it. They didn't lie — an action only happens when three things line up in the same moment: enough motivation, enough ability (it's easy enough), and a clear prompt to do it now. Miss any one and nothing happens, no matter how good the product is.",
      "The trap is to obsess over motivation — louder copy, bigger promises — when the cheapest, most reliable win is usually ability: just make the action easier. This playbook breaks down the three ingredients and shows why 'remove a step' beats 'shout louder' nearly every time.",
    ],
    body: [
      {
        heading: "Motivation × Ability × Prompt",
        paragraphs: [
          "Picture three dials. Motivation is how much they want it. Ability is how easy it is to do. Prompt is the nudge that says 'now.' An action fires only when all three are high enough together. A highly motivated person will do a hard thing; a barely motivated one will only do a trivially easy thing — so the cooler your visitor, the easier the step must be.",
        ],
      },
      {
        heading: "Make it easier before you make it louder",
        paragraphs: [
          "Cutting friction is almost always cheaper and more effective than boosting desire. Every extra field, click, decision, or moment of confusion bleeds people out of your funnel. Count the steps to the action and delete half. One email field beats a ten-field form; one clear button beats three competing ones.",
        ],
      },
      {
        heading: "Prompt at the moment of peak motivation",
        paragraphs: [
          "A prompt works only when motivation and ability are already high. Ask for the bigger commitment right after a win — the moment they felt the value — not before. The right ask at the wrong time reads as pushy; the same ask seconds after an 'aha' feels obvious.",
        ],
      },
    ],
  },
];

export function getPlaybook(slug: string): Playbook | undefined {
  return PLAYBOOKS.find((p) => p.slug === slug);
}
