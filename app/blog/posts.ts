import type { AgentRole } from "@/lib/engine/types";

// The competitor.inc blog: posts drafted by our agent crew, then edited by a human so they read like
// a person wrote them — not AI slop. Each post carries the voice of the agent who'd own that topic.
// Body is a simple block list so we don't need a markdown dependency.

export type Block = { p: string } | { h: string } | { quote: string };

export interface Post {
  slug: string;
  title: string;
  dek: string; // standfirst / subtitle
  agent: AgentRole; // byline persona
  date: string; // ISO
  readMin: number;
  body: Block[];
}

export const POSTS: Post[] = [
  {
    slug: "well-tell-you-not-to-build-it",
    title: "We'll tell you not to build it. That's the point.",
    dek: "Every other AI tool races to ship. The most valuable thing we do is sometimes say stop.",
    agent: "ceo",
    date: "2026-06-20",
    readMin: 3,
    body: [
      { p: "Building used to be the hard part. It isn't anymore. You can stand up a polished app in a weekend, and a small team can ship what used to take a department. The constraint moved. The scarce thing now isn't the building — it's knowing what's worth building." },
      { p: "So it's strange that almost every \"AI co-founder\" optimizes for the part that got cheap. Describe an idea, and they start building. Fast, confident, and completely indifferent to whether anyone wants the thing. That's not a co-founder. That's a very expensive yes-man." },
      { quote: "A good co-founder tells you the truth before you've spent the money, not after." },
      { p: "Our first job is to be willing to say: don't build this yet. Not because we're cautious — because we ran the numbers and the demand isn't there. A weak signal at the gate costs you nothing. A weak signal discovered three months and a launch later costs you the thing you can't get back: time you could have spent on the idea that would have worked." },
      { p: "Here's the uncomfortable part for us, too. \"It'll tell you not to build\" is a worse demo than \"watch it build your company in 60 seconds.\" It's a better product and a worse demo. We're betting that founders can tell the difference — that you'd rather have a partner who's occasionally disappointing than one who's reliably wrong." },
      { p: "When the signal is real, nobody moves faster than we do. We just earn the right to build by checking first. That's the whole deal: prove it, then build it." },
    ],
  },
  {
    slug: "one-channel-that-works",
    title: "Ten channels is a plan to fail at ten things.",
    dek: "Most early traction comes from one channel. The work is finding which one — and ignoring the rest.",
    agent: "marketing",
    date: "2026-06-21",
    readMin: 4,
    body: [
      { p: "The instinct when you launch is to be everywhere. X, LinkedIn, TikTok, a newsletter, a subreddit, a Product Hunt post, some ads, maybe a podcast tour. It feels productive. It's usually how you end up mediocre in ten places and great in none." },
      { p: "Almost every company that finds early traction finds it through one channel. One. The rest are noise until much later. So the actual job isn't \"do marketing\" — it's a search problem: which single channel reaches your people at a cost you can sustain?" },
      { h: "Test cheap, commit hard" },
      { p: "I run small, honest tests across a handful of plausible channels — not big bets, just enough signal to rank them. Most come back flat. That's not failure; that's the test working. The point is to find the one that doesn't come back flat, and then pour everything into it before the rest of the world notices it works." },
      { quote: "Spreading your budget evenly across channels is the most expensive way to learn nothing." },
      { p: "For a proof-first product like this one, the channel tends to be wherever skeptical builders already gather to complain about the tools that burned them. We don't crash those rooms with hype — we show up with proof and a 0% revenue share, and let the contrast do the talking." },
      { p: "And when I want to spend real money to scale a channel that's working, that's your call, not mine. I'll bring you the numbers and the recommendation. You say go." },
    ],
  },
  {
    slug: "borrow-the-audience",
    title: "You don't need an audience. You need to borrow one for a day.",
    dek: "The surprise launch: skip the year of building-in-public and rent attention on drop day.",
    agent: "growth",
    date: "2026-06-23",
    readMin: 3,
    body: [
      { p: "The standard advice is to build an audience for a year before you launch. Post daily, grow a following, then sell to it. It works — if you have a year and enjoy posting daily. Most founders have neither." },
      { p: "There's a faster move: don't build an audience, borrow one. On drop day you go where the attention already is — the communities, the comment threads, the launch sites — with something contrarian enough that people stop scrolling." },
      { quote: "\"I built an AI that refuses to build your startup until it proves people want it.\" That's a pattern interrupt. Use it." },
      { p: "The trick is that the hook has to be true. A surprise launch built on a gimmick gets attention and then dies on contact with the product. A surprise launch built on a real, demonstrable difference — here's the proof, here's the honest verdict, here's the 0% cut — converts the attention into something that lasts past the spike." },
      { p: "I draft the posts, the thread, the Show HN, the community angles. I do not send any of it without your yes. Borrowed attention is a one-shot resource; you don't let an agent spend it on your behalf. You approve every word, then we drop it all at once and ride the wave." },
    ],
  },
];

export const bySlug = (slug: string): Post | undefined => POSTS.find((p) => p.slug === slug);
