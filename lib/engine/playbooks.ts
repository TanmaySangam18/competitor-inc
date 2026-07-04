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
    slug: "attention-first-landing",
    title: "The attention-first landing page",
    summary: "Visitors decide in five seconds. How to replace reading with proof — and stop losing people before they understand you.",
    readMins: 4,
    freeIntro: [
      "Most startup landing pages are explanation funnels: read the hero, scroll the features, click through three more pages, and then — maybe — believe. Attention doesn't survive that. A visitor's real question was never \"how does this work?\" It's \"will this work for me, and can I see it right now?\" Every paragraph between them and that answer is a place to lose them.",
      "The fix isn't cramming everything into smaller boxes — denser reading is still reading. The fix is substitution: replace reading with watching, and watching with doing. If a stranger can't tell what your product does, who it's for, and what to do next within five seconds of landing — without scrolling — the page is working against you.",
    ],
    body: [
      {
        heading: "The 5-second test",
        paragraphs: [
          "Show your page to someone for five seconds, then take it away and ask: what does it do, who is it for, what would you click? If they can't answer all three, cut until they can. The hero earns one sentence, one input or call to action, and one piece of proof — nothing else lives above the fold.",
          "Boxes can work below the fold — but only as glanceable proof, a dozen words each, not compressed paragraphs. A wall of boxes is still a wall.",
        ],
      },
      {
        heading: "Make the product the pitch",
        paragraphs: [
          "The strongest landing page runs the product on the visitor's own input before asking for anything — an interactive demo, a live calculation, a real sample output. Value lands before the signup ask, which flips the psychology: they're no longer evaluating claims, they're reacting to a result. If your product can't demo itself cheaply, show a real artifact it produced — never a staged one.",
        ],
      },
      {
        heading: "Tone: receipts over adjectives",
        paragraphs: [
          "Cut exclamation marks, superlatives, and filler like 'seamless' — every claim either carries a verifiable receipt (a number, a link, an artifact) or gets deleted. Serious reads as trustworthy; trustworthy converts. Measure the change: time-to-first-interaction under ten seconds, share of visitors who start the demo, and demo-to-signup rate — not bounce rate alone.",
        ],
      },
    ],
  },
  {
    slug: "the-commitment-ladder",
    title: "The commitment ladder",
    summary: "Likes lie, emails hedge, money tells the truth. How to design validation asks that produce signals you can bet on.",
    readMins: 4,
    freeIntro: [
      "Every validation signal has a price the other person paid to send it. A like costs nothing, so it means nothing. An email costs a little — mild interest. Thirty minutes of someone's time costs real attention. A deposit costs money. The ladder is simple: the more a signal costs the sender, the more it's worth to you — and most founders spend months collecting the free kind.",
      "This playbook is about deliberately climbing that ladder: starting with cheap asks to find the right people, then raising the price of the ask until you learn whether anyone will actually pay. The goal isn't to maximize signups; it's to find the smallest group of people willing to make the most expensive commitment.",
    ],
    body: [
      {
        heading: "The rungs, in order",
        paragraphs: [
          "1) Attention: they read or click — noise unless it repeats. 2) Identity: they give an email — mild interest, easily faked by politeness. 3) Time: they take a 30-minute call about their problem (not your idea) — real. 4) Reputation: they introduce you to a colleague or say it publicly — strong. 5) Money: a pre-order, deposit, or signed order — the only rung that predicts revenue.",
          "Design every test to capture the highest rung you can credibly ask for at that stage. A waitlist launch that could have been a $20-deposit launch wasted the traffic it got.",
        ],
      },
      {
        heading: "Raising the ask without losing the person",
        paragraphs: [
          "Each rung earns the right to ask for the next. Someone who gave an email gets the honest conversation ask; someone who gave a great conversation gets the founding-member offer. Skipping rungs reads as desperate; climbing them reads as momentum. And when someone declines a rung, that's data, not failure — ask what would have made it worth it, then close the loop.",
        ],
      },
      {
        heading: "Reading the ladder honestly",
        paragraphs: [
          "Count only the rung actually reached, never the one implied. 'They said they'd definitely pay' is rung 2 wearing a rung 5 costume — talk is a compliment, commitment is evidence. Write down, before the test, how many people at which rung equals a green light. Then believe your own threshold.",
        ],
      },
    ],
  },
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
        heading: "Run the cheapest real test (no audience needed)",
        paragraphs: [
          "You don't need traffic or an ad budget to validate — those are the hardest things to get and the weakest signals anyway (nobody hands their email to a thing that doesn't exist). Start with conversations: talk to 5–10 real potential users about what they do today and what it costs them — their last real experience, never \"would you use my idea?\". Then look for evidence demand already exists: what people pay for now, the workarounds they hack together, the complaints in their communities.",
          "Only then make a costly ask — a pre-order, a deposit, a \"reserve your spot\" with a card, a signed letter of intent. Someone giving you $5 or 30 minutes is worth a hundred free signups. A landing page is just one place to host that ask; the ask is the test, not the page. Read every result against the threshold you wrote down first.",
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
    title: "Out-position a funded rival — don't out-feature them",
    summary: "How a smaller, more trustworthy player beats a bigger, funded competitor by counter-positioning — not by matching features.",
    readMins: 5,
    freeIntro: [
      "When a category gets hot and funded, the obvious move is to compete on features — match them module for module. For a small team, that's a losing race. The winning move is the opposite: find the thing the funded incumbent can't copy without breaking their own model, and own it completely.",
      "Look for the trust gap. Big, funded incumbents often grow in ways their own users quietly resent — hidden fees, opacity, taking a cut, acting before they ask. Each of those is a position you can counter, because they can't follow you without dismantling how they make money. Whatever your category, the move is the same: find where the leader is structurally stuck, and plant your flag there.",
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
  {
    slug: "build-a-habit-loop",
    title: "Make it a habit, not a one-time visit",
    summary: "Why most products get tried once and forgotten — and the four-step loop that turns a first visit into a returning one.",
    readMins: 5,
    freeIntro: [
      "Getting someone to try your product is the easy part. Getting them to come back — without paying to re-acquire them every time — is what actually builds a business. Most products die not because nobody tried them, but because nobody returned. Retention, not acquisition, is the real test.",
      "Habits form through a repeatable loop: a trigger brings someone back, they take a simple action, they get a reward that's a little unpredictable (so it stays interesting), and they invest a little of themselves — which makes the next loop more likely. Run that loop enough times and your product becomes a default, not a decision. Here's how to design it honestly.",
    ],
    body: [
      {
        heading: "Trigger → action → reward → investment",
        paragraphs: [
          "A trigger is what brings them back — at first external (an email, a notification), later internal (an itch they now associate with you). The action must be dead simple. The reward should vary a little — a perfectly predictable reward gets boring fast. The investment is the small thing they leave behind (data, a setup, a streak) that makes returning easier than starting over.",
        ],
      },
      {
        heading: "Find your internal trigger",
        paragraphs: [
          "External triggers wear out; the durable habit is built on an internal one — an emotion or moment your product reliably answers ('I'm bored', 'I need to know how we're doing'). Name the exact moment you want to own, and design every loop to attach to it.",
        ],
      },
      {
        heading: "The honesty line",
        paragraphs: [
          "These loops can manipulate or serve. The honest version builds a habit around a real benefit and lets people leave anytime; the dishonest version engineers compulsion they'll resent. Build the kind of habit people would thank you for — anything else churns harder in the end.",
        ],
      },
    ],
  },
  {
    slug: "tell-a-story-that-sells",
    title: "Tell a story that sells (make the customer the hero)",
    summary: "Why your messaging falls flat when you're the hero — and the simple story shape that makes a stranger feel understood.",
    readMins: 5,
    freeIntro: [
      "Most founders talk about themselves: our features, our technology, our journey. But people don't buy the hero's story — they buy a guide who helps THEM win their own. The fastest way to make a stranger care is to make them the hero and cast yourself as the guide who takes them from stuck to sorted.",
      "A story that sells has a clear shape: a hero (your customer) has a problem, meets a guide (you) who offers a plan, gets called to act, and sees what success and failure look like. Get that order right and your message stops being noise and starts feeling like it was written for one specific person.",
    ],
    body: [
      {
        heading: "The shape of a story that sells",
        paragraphs: [
          "Name the hero's problem in their own words (so they think 'that's me'). Position yourself as the guide with empathy and a little authority — not another hero competing for the spotlight. Give them a simple plan (three steps, not ten). Make one clear call to action. And make the stakes real: what they gain by acting, what they keep losing by not.",
        ],
      },
      {
        heading: "Lead with the problem, not the product",
        paragraphs: [
          "The opening line should be about their pain, not your feature list. People decide whether to keep reading based on whether you understand their problem — features only matter once they believe you get it. Win the 'they understand me' moment first; everything else waits its turn.",
        ],
      },
    ],
  },
  {
    slug: "talk-to-users-without-fooling-yourself",
    title: "Talk to users without fooling yourself",
    summary: "How to run interviews that change a decision — the questions that get the truth, how many people you actually need, and the trap that ruins most research.",
    readMins: 6,
    freeIntro: [
      "Most founder 'research' is theatre: you describe your idea, your friends say 'cool, I'd use that,' and you walk away with false confidence. Then you build it and nobody shows up. The problem isn't that you asked — it's that you asked in a way that could only flatter you. Good research is designed to be able to tell you you're wrong.",
      "The fix is mostly discipline, not skill. Anchor every study to a real decision, ask about the past instead of the hypothetical future, and stop interviewing once you stop hearing new things. Do that and a handful of honest conversations will out-predict any number of polite thumbs-up. Here's the method.",
    ],
    body: [
      {
        heading: "Anchor to a decision, or don't bother",
        paragraphs: [
          "Before you talk to anyone, write down the specific decision the answers will change — a feature to add, a message to lead with, a price to set. If no decision rides on it, the research is a sideshow. And frame the goal with a finite verb — identify, compare, describe — not 'understand' or 'explore,' so you know when you're done.",
        ],
      },
      {
        heading: "Ask about the past, not the hypothetical",
        paragraphs: [
          "'Would you use this?' invites a lie. 'Tell me about the last time you faced this problem — what did you actually do?' surfaces the truth, because behavior already happened. Open with an experience-near prompt and let them narrate; never feed them the answer with leading 'wouldn't it be great if…' questions.",
        ],
      },
      {
        heading: "How many people — and when to stop",
        paragraphs: [
          "For usability problems, ~5 people per segment surface roughly 80% of the issues. For generative interviews, 8–12 usually reach saturation — the point where new conversations stop producing new themes; past ~15, returns drop fast. Five relevant people beat a thousand irrelevant ones — representativeness matters far more than raw count.",
        ],
      },
      {
        heading: "The one number that tells you if you have something",
        paragraphs: [
          "Once people have actually used it, ask: 'How would you feel if you could no longer use this?' If at least ~40% say 'very disappointed,' you likely have product-market fit worth pushing on. Below that, change the product or the audience before you pour fuel on growth.",
        ],
      },
    ],
  },
  {
    slug: "sell-to-the-irrational-mind",
    title: "Sell to the irrational mind (psycho-logic)",
    summary: "People decide on feeling and context, then justify it with logic. How to persuade by changing perception — often cheaper and more powerful than changing the product.",
    readMins: 6,
    freeIntro: [
      "We like to think buyers weigh features and pick the rational best. They don't. Most decisions run on 'psycho-logic' — fast, emotional, context-driven rules — and the reasons come afterward, to justify a feeling. So the highest-leverage move often isn't a better product; it's a better frame. The best ideas frequently don't make narrow rational sense — they make people feel something.",
      "This is the marketer's edge a spreadsheet misses: change the context and you change the meaning, with zero change to the thing itself. A famous example — a store fielding complaints that a potato peeler scratched potatoes simply renamed it a carrot peeler; complaints stopped. Nothing about the product changed; the expectation did. This playbook is how to use perception, emotion, and the unexpected to win attention and trust honestly.",
    ],
    body: [
      {
        heading: "Psycho-logic beats logic",
        paragraphs: [
          "People judge with the fast, emotional system first; the slow, rational one mostly rationalizes afterward. So lead with how it feels and what it signals, not a feature matrix. Appeal to the gut (is this safe, is this for someone like me, what do I lose by waiting) before you argue with the head.",
        ],
      },
      {
        heading: "Reframe, don't always rebuild",
        paragraphs: [
          "Before you spend months adding a feature, ask whether a reframe solves it cheaper. Change the words, the context, the comparison, or the default, and you change the perceived value without touching the product. A small psychological tweak routinely beats an expensive functional one — and it ships today.",
        ],
      },
      {
        heading: "Solve for the emotion, not just the function",
        paragraphs: [
          "Often the real problem isn't functional — it's a feeling (the fear, the wait, the uncertainty). Fixing the feeling can matter more than fixing the function: make the wait feel shorter, the risk feel smaller, the choice feel safer. Name the emotion your customer actually has and design straight at it.",
        ],
      },
      {
        heading: "Be remarkably, counter-intuitively honest",
        paragraphs: [
          "The opposite of a good idea can be another good idea. When everyone in your category shouts the same promise, doing the unexpected — openly admitting a limitation, or telling a customer the truth that costs you a sale — is both more memorable and more trusted. Honesty isn't just ethics; it's a signal too costly to fake, which is exactly why it persuades.",
        ],
      },
    ],
  },
  {
    slug: "demand-is-the-bottleneck",
    title: "Demand is the bottleneck — win your first customers yourself",
    summary: "Most early startups don't have a conversion problem, they have a demand problem. Why generating demand and selling the first customers yourself beat hiring reps and tweaking funnels.",
    readMins: 6,
    freeIntro: [
      "When sales are slow, the instinct is to tweak the funnel — change the button, the subject line, the demo flow. But for most early startups the shortfall isn't conversion, it's demand: not enough of the right people are showing up at all. Optimizing the middle of a funnel nobody's entering is motion without progress. Generate demand first; the funnel math only matters once there's flow through it.",
      "And the uncomfortable truth: at the start, you are the sales team. Hiring reps before you've personally sold the thing just spreads thin demand across more people and hides what's actually broken. Close your first customers yourself, learn exactly why they buy, and only then hand a proven motion to someone else. This is the demand-first, founder-led path.",
    ],
    body: [
      {
        heading: "Demand first, funnel second",
        paragraphs: [
          "For most early teams the binding constraint is demand, not conversion rate. Don't add more sellers into a demand-poor environment — it lowers everyone's productivity and masks the real problem. The honest signal that it's time to scale is the opposite: you can't keep up with the demand you already have.",
        ],
      },
      {
        heading: "Win the first 10–20 customers yourself",
        paragraphs: [
          "Founder-led selling isn't a stopgap — it's where you learn the message from real reactions, hear objections live, and find out within days whether a buyer is a true fit. No one can outsource this part early, and that's fine: it's temporary, and it's the most valuable learning you'll get. Even after you hire help, don't disappear from selling.",
        ],
      },
      {
        heading: "Distribution is as important as the thing you made",
        paragraphs: [
          "A launch is the start of the work, not the finish. Pick the one channel that actually reaches your people and pour into it rather than spraying five. And do something that stands out — generic gets ignored, and being ignored is the real failure mode, not being criticized.",
        ],
      },
      {
        heading: "Be prescriptive, then obsess over getting them live",
        paragraphs: [
          "Tell the buyer the happy path to buy — don't make them assemble it. Then treat onboarding and first-value as sacred: the sale isn't real until they've actually succeeded once. Turn each genuinely happy customer into the next one; word-of-mouth from a delighted user out-converts any ad.",
        ],
      },
    ],
  },
  {
    slug: "cold-outreach-that-isnt-spam",
    title: "Cold outreach that books meetings (not spam)",
    summary: "Why blasting thousands of emails fails — and the targeted, personalized way to do cold outreach that actually gets replies and doesn't torch your domain.",
    readMins: 6,
    freeIntro: [
      "Cold outreach has a terrible reputation, and most of it is earned: people buy a list of 10,000 addresses, blast a generic pitch, get a 0.1% reply rate, and watch their domain land on a blocklist. But done the other way — targeted, personal, and small — cold outreach is still one of the most reliable ways for a B2B company to find its first customers. The difference isn't the channel; it's the discipline.",
      "The rule of thumb: every email should look like you wrote it to one specific person, because you did. That means a tight list of the *right* companies, a real reason you're reaching out, one clear ask, and an easy way to say no. Volume is the enemy of replies and the enemy of deliverability. Here's how to do it without becoming the thing everyone hates.",
    ],
    body: [
      {
        heading: "Target tight, personalize for real",
        paragraphs: [
          "Pick a narrow ideal-customer profile and a small list — dozens, not thousands. Open with a specific, true reason you're contacting *this* person (something they did, shipped, or said). Generic 'I hope this finds you well' is invisible; 'I saw you just launched X' gets read. One email that's clearly for them beats a thousand that could be for anyone.",
        ],
      },
      {
        heading: "Protect your deliverability like it's the business",
        paragraphs: [
          "Send from a separate domain (never your main one), authenticate it (SPF, DKIM, DMARC), warm it up slowly, and keep daily volume low per inbox. The moment you spike volume from your real domain, you risk every email you send — including the ones to customers. Treat your sending reputation as a non-renewable resource.",
        ],
      },
      {
        heading: "One ask, easy out, and stop means stop",
        paragraphs: [
          "Keep it short and plain — one clear ask, no walls of text or attachments. Always include a real way to opt out and honor it instantly; in the US that's the law (CAN-SPAM), and everywhere it's just decent. If someone says no, you're done. The goal is a conversation with the right person, not a transaction with a stranger — and that mindset is exactly what keeps you off the blocklists.",
        ],
      },
    ],
  },
  {
    slug: "run-a-discovery-call",
    title: "Run a discovery call that closes itself",
    summary: "Stop pitching on the first call. The questions that surface real pain, real budget, and real urgency — so the sale makes itself.",
    readMins: 6,
    freeIntro: [
      "First-time founders treat the first call like a demo: they talk for 30 minutes, show every feature, and end with 'so… what do you think?' — and then wonder why the deal stalls. A good discovery call is the opposite. You talk maybe 30% of the time. Your job isn't to convince; it's to diagnose. A prospect who articulates their own pain out loud is a prospect halfway to buying.",
      "The frame to hold: you're a doctor, not a salesperson. A doctor who prescribes before diagnosing is committing malpractice — and a founder who pitches before understanding is doing the same. This playbook is the question sequence we use to find out, fast, whether there's a real problem worth real money — and whether this is even the right person to be talking to.",
    ],
    body: [
      {
        heading: "Find the pain, the cost of the pain, and the deadline",
        paragraphs: [
          "Three things turn interest into a deal: a problem they feel, a number attached to it, and a reason it matters now. Ask 'what made you take this call today?' then 'how are you handling it currently?' then 'what's that costing you — in time, money, or stress?' If they can't quantify the pain, there's no budget; if there's no deadline, there's no urgency. You're not selling yet — you're checking whether a sale is even possible.",
          "Listen for the words they use and write them down verbatim. You'll sell it back to them in their language later, and 'you said X is eating 10 hours a week' lands far harder than your feature list.",
        ],
      },
      {
        heading: "Qualify out fast — a fast no is a gift",
        paragraphs: [
          "The amateur tries to win every call. The pro tries to disqualify quickly, because their time is the scarce resource. If they have no budget, no authority to buy, or no real urgency, name it kindly and move on. Chasing a dead deal for three weeks costs more than ten clean nos. 'It sounds like this isn't a priority this quarter — should we reconnect when it is?' protects your pipeline and your sanity.",
        ],
      },
      {
        heading: "End with a next step, never with 'let me know'",
        paragraphs: [
          "Every call closes with a specific, scheduled next action — a follow-up booked on the calendar, a trial start date, a doc you'll send by Friday. 'Let me know your thoughts' is where deals go to die. Summarize the pain they described, confirm you can help with it, and propose the concrete next step. Silence after a call is almost always a process failure, not a 'no.'",
        ],
      },
    ],
  },
  {
    slug: "answer-the-real-objection",
    title: "Answer the objection behind the objection",
    summary: "'It's too expensive' almost never means the price. How to hear the real hesitation and resolve it without discounting your way to a bad deal.",
    readMins: 5,
    freeIntro: [
      "Objections feel like rejection, so founders panic and do the worst thing: they discount, over-explain, or argue. But an objection is usually a *question in disguise* — and the words on the surface rarely name the real worry. 'It's too expensive' often means 'I'm not yet convinced it's worth it.' 'I need to think about it' often means 'I have a concern I haven't said out loud.' Your job is to find the real one.",
      "The move is almost always the same: slow down, get curious, and ask one more question instead of launching a rebuttal. The prospect isn't your opponent — the unspoken worry is. This playbook covers the handful of objections you'll hear over and over and how to get underneath each one.",
    ],
    body: [
      {
        heading: "Acknowledge, then ask — don't rebut",
        paragraphs: [
          "When you hear an objection, your reflex will be to defend. Resist it. Acknowledge ('that's fair') and ask one calm question to surface the real issue: 'When you say expensive — is it more than you expected, or are you not yet sure it'll pay off?' Those are two completely different problems with two different answers. You can't solve the objection until you know which one it is.",
        ],
      },
      {
        heading: "Price objections are usually value objections",
        paragraphs: [
          "If it's genuinely about budget, a payment plan or smaller starting scope can work. But far more often, 'too expensive' means the value isn't obvious yet — so the fix is to re-anchor on the cost of their problem (the number you got in discovery), not to slash your price. Discounting to win a deal trains the customer that your price is fake and starts the relationship on a loss. Defend the price by making the value undeniable.",
        ],
      },
      {
        heading: "'I need to think about it' = a hidden concern or a missing person",
        paragraphs: [
          "This usually means one of two things: there's a worry they didn't voice, or there's a decision-maker who isn't in the room. Flush it out gently: 'Totally — what's the main thing you'd want to be sure of before deciding?' or 'Who else would weigh in on this?' Then resolve the actual blocker. Vague stalls are almost always specific, unspoken concerns wearing a polite mask.",
        ],
      },
    ],
  },
  {
    slug: "close-without-being-pushy",
    title: "Close without being pushy",
    summary: "The close isn't a high-pressure moment — it's the natural last step of a well-run process. How to ask for the decision cleanly and make 'yes' easy.",
    readMins: 5,
    freeIntro: [
      "First-time founders dread the close because they picture the sleazy hard sell. But if discovery was honest and the value is real, closing is just… asking. The discomfort usually comes from not having earned the right yet — pitching too early, or never surfacing real pain — so the ask feels like a leap. Fix the process and the close stops being scary.",
      "Two failure modes to avoid: never asking (the deal drifts until it dies), and asking with pressure (which poisons trust — exactly the thing we sell against). The goal is a clean, confident, low-pressure ask that makes saying yes the easy and obvious next step. Here's how.",
    ],
    body: [
      {
        heading: "Earn the right, then actually ask",
        paragraphs: [
          "You've earned the right to close when the prospect has named a real pain, a cost, and a deadline, and agreed you can help. Then ask plainly: 'Based on what you've told me, this solves X — do you want to move forward?' Most stalled deals aren't lost on price; they're lost because nobody ever directly asked for the decision. Silence is not a strategy.",
        ],
      },
      {
        heading: "Make yes the path of least resistance",
        paragraphs: [
          "Reduce the friction and the risk of saying yes. A clear next step, a short starting scope, a guarantee or an easy exit ('cancel anytime, export your data') all lower the perceived cost of committing. The easier and safer you make the first yes, the more first yeses you get — and a small yes that delivers becomes a bigger one later.",
        ],
      },
      {
        heading: "Handle 'no' and 'not now' like a professional",
        paragraphs: [
          "A 'no' with a reason is data — thank them and ask what would have to be true for it to be a yes. A 'not now' gets a specific follow-up date, not a vague 'I'll check back.' Pushiness is trying to overturn a real no; professionalism is making the decision easy and then respecting it. You want customers who chose you, not ones you cornered — those are the ones who renew and refer.",
        ],
      },
    ],
  },
  {
    slug: "follow-up-that-closes",
    title: "Follow-up that closes — without being annoying",
    summary: "Most deals die in the follow-up, not the pitch. The cadence that stays persistent without turning into a pest.",
    readMins: 5,
    freeIntro: [
      "Founders obsess over the pitch and neglect the follow-up — which is backwards, because most deals are won or lost in the silence after the first conversation. A prospect who said \"interesting, let me think\" isn't a no; they're busy, and the person who stays helpfully present is the one who gets the yes. Disappearing after one email is the most common way first-time founders leave money on the table.",
      "The trick is that good follow-up doesn't feel like chasing — it feels like being useful. Every \"just checking in\" is a withdrawal from the relationship; every touch that adds something (a relevant example, an answer to their real objection, a small win) is a deposit. This is the cadence to stay in front of someone for weeks without becoming the founder they start ignoring.",
    ],
    body: [
      {
        heading: "Add value on every touch",
        paragraphs: [
          "Replace \"just following up\" with a reason to be in their inbox: a case that maps to their situation, a one-line answer to the objection they raised, a teardown of their current setup. If you can't think of a value-add, you don't have a reason to send yet — so create one. Each message should leave them slightly better off for having opened it, whether or not they buy today.",
        ],
      },
      {
        heading: "A cadence, not a guess",
        paragraphs: [
          "Space touches so you stay present without crowding: a day after the conversation, then ~3 days, then a week, then taper to a monthly value-only check. Vary the channel and the angle — never just resend the same ask louder. Track who's at which step so nobody falls through and nobody gets hit twice; a written cadence beats a busy founder's memory every time.",
        ],
      },
    ],
  },
  {
    slug: "referrals-that-compound",
    title: "Turn happy customers into a referral engine",
    summary: "Referrals are the cheapest, highest-trust growth there is — but only if you engineer the ask instead of hoping for it.",
    readMins: 5,
    freeIntro: [
      "Every founder knows referrals are gold — a warm intro converts many times better than a cold lead and costs nothing — yet almost no one asks for them systematically. They wait for referrals to happen and a few trickle in by luck. The founders who grow on word of mouth aren't luckier; they've made the referral a deliberate, repeatable step instead of an accident.",
      "Most asks fall flat for two reasons: timing and effort. Founders ask too early (before the customer has felt the value) or make it work (\"know anyone who…?\" forces the customer to do your thinking). Engineer both and referrals stop being random — landing at the moment of delight and costing the customer almost nothing.",
    ],
    body: [
      {
        heading: "Ask at the moment of delight",
        paragraphs: [
          "The right time is right after a win — they hit a result, they praise you, they renew. That peak is when they'll put their name on the line. Build a trigger around those moments instead of a calendar reminder: the ask should ride the wave of a real success, not interrupt a random Tuesday.",
        ],
      },
      {
        heading: "Make it effortless",
        paragraphs: [
          "Don't ask \"know anyone who'd like this?\" — that makes them search their memory. Ask for a specific, easy action: \"could you forward this to the one person on your team who deals with X?\" and hand them a ready-to-send blurb. The lower the effort, the higher the conversion — you trade a little of your time writing the intro for a much better chance they make it.",
        ],
      },
      {
        heading: "On incentives — careful",
        paragraphs: [
          "A reward can boost referrals, but the wrong one cheapens the trust that makes them work. Reward the friend (a discount for the new user) more than the referrer, so the intro still feels generous rather than bought. And never incentivize before the customer has real value to vouch for — paying for endorsements you haven't earned poisons the well.",
        ],
      },
    ],
  },
  {
    slug: "keep-them-then-grow-them",
    title: "Keep customers, then grow them — renewals & expansion",
    summary: "New logos are the expensive way to grow. The cheapest revenue you'll ever earn is the customer you already have — if you keep them and expand them.",
    readMins: 5,
    freeIntro: [
      "First-time founders fixate on getting new customers and quietly let the ones they have leak away. It's backwards: acquiring a new customer costs many times more than keeping an existing one, and a customer who's already paying has already cleared the hardest bar — trust. The fastest-growing small companies aren't the ones adding the most logos; they're the ones losing the fewest and growing the accounts they keep.",
      "The number that captures this is net revenue retention: of the money your customers paid you last period, how much did that same group pay you this period — after churn, downgrades, and any upgrades? If it's above 100%, your existing base grows on its own even before you add a single new customer. That's the quiet engine behind most durable businesses, and it's almost entirely within your control.",
    ],
    body: [
      {
        heading: "Earn the renewal long before it's due",
        paragraphs: [
          "A renewal isn't a moment at the end of the term — it's the sum of every week before it. The customers who leave usually went quiet first: they never got to the 'aha', stopped logging in, or hit a problem you never saw. Track a simple health signal (are they actually using the thing? did they hit their first real outcome?) and reach out when it dips, not when the invoice is overdue. The renewal conversation should be a formality because the value was obvious all along.",
          "When churn does happen, treat it as data, not defeat. Ask one honest question — 'what would've had to be true for you to stay?' — and log the answer. A handful of those exit reasons will name the same gap, and fixing it saves the next ten customers.",
        ],
      },
      {
        heading: "Expand on a real outcome, never just to upsell",
        paragraphs: [
          "Expansion revenue — a customer paying you more over time — only sticks when it follows value they've already felt. Land with the thing they need today, then grow the account when they hit a ceiling worth paying past: more seats because the team adopted it, a higher tier because they outgrew the limits, an add-on that solves the next problem they told you about. The trigger is their success, not your quota.",
          "Price expansion to a metric that grows with their value, not yours: seats they actually use, volume they actually process, outcomes they actually get. When the customer wins more and naturally pays a little more, expansion feels fair and renews itself. When you raise the bill faster than they grow, you've just scheduled a churn.",
        ],
      },
    ],
  },
  {
    slug: "price-without-leaving-money",
    title: "Price on value — and hold the line in the negotiation",
    summary: "Most first-time founders price on cost or gut, charge far too little, and then discount under the first push. Price to the value you create, and defend it.",
    readMins: 6,
    freeIntro: [
      "Pricing is the highest-leverage number in your business and the one founders think about last. The instinct is to price off your costs ('it costs me $4, I'll charge $10') or off a nervous gut-check ('$9 feels safe'). Both ignore the only thing that actually sets price: the value the customer gets. A tool that saves a business $2,000 a month is cheap at $200 and expensive at nothing — because if it's free, they assume it's worth nothing.",
      "The discipline is to figure out willingness-to-pay before you build the price page, not after — by asking customers about value and money early, the same way you validated the idea. Get this roughly right and everything downstream gets easier: you can afford to acquire customers, support them well, and survive a few mistakes. Get it wrong on the low side — the default error — and you grind through twice the customers for half the runway.",
    ],
    body: [
      {
        heading: "Anchor to value, then to a number",
        paragraphs: [
          "Before you name a price, name the value in the customer's terms: time saved, money made, risk avoided, headcount they don't have to hire. That figure is your anchor — the price should be a comfortable fraction of it, so the math is obviously in their favor. Tiers help here: a good/better/best structure lets the customer self-select by how much value they need, and a higher tier makes the middle one look reasonable (most people pick the middle on purpose).",
          "Charge for the value metric, not for your effort. The best pricing scales with what the customer gets — per outcome, per seat that's actually used, per unit of the thing they care about — so your revenue grows as their success does. Flat 'all you can eat' pricing leaves money on the table with your biggest customers and overcharges your smallest.",
        ],
      },
      {
        heading: "Hold the line when they push",
        paragraphs: [
          "A prospect saying 'it's too expensive' is rarely about the number — it's about value they haven't seen yet. Don't reflexively discount; that teaches them the real price is lower and quietly insults the customers who paid full. Instead, ask what they're comparing it to and re-anchor on the outcome: 'compared to what it costs you to keep doing this by hand, what would make it worth it?' Often the objection dissolves once the value is back in frame.",
          "If you do flex on price, never give the discount for free — trade it. A lower price in exchange for an annual commitment, a case study, a referral, or a narrower scope keeps the value exchange honest and protects your anchor. And set a walk-away in advance: the floor below which the deal costs you more than it's worth. Being willing to lose a bad deal is what lets you win the good ones at a price you can survive.",
        ],
      },
    ],
  },
];

export function getPlaybook(slug: string): Playbook | undefined {
  return PLAYBOOKS.find((p) => p.slug === slug);
}
