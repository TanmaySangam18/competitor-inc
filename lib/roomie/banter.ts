// The office floor never goes quiet. This is the ambient conversation engine for /delegation:
// the crew banters in real time — work talk that weaves in the live shift, plus jokes and general
// chatter to keep the energy high. Fully simulated (no API), so it's free and always-on.

import type { AgentRole } from "./types";

export interface Turn {
  role: AgentRole;
  text: string;
}

export interface BanterCtx {
  company?: string;
  idea?: string;
  action?: string; // the latest logged action, if any
  working: boolean; // a shift / build is in flight
}

type Kind = "work" | "joke" | "general";
interface Exchange {
  id: number;
  kind: Kind;
  turns: Turn[];
}

// Each exchange is a short back-and-forth so it reads like a real conversation, not random quips.
// {company}/{idea}/{action} are filled from the live state. Voices: Apex=dry CEO, Forge=deadpan
// builder, Pitch=hype marketer, Guard=warm support, Surge=meme-y growth.
const RAW: Omit<Exchange, "id">[] = [
  // ── work ──────────────────────────────────────────────
  { kind: "work", turns: [
    { role: "engineering", text: "{action}. Build's green." },
    { role: "support", text: "The users are going to love that one." },
    { role: "growth", text: "Loading it into the launch-day blitz 🤫🚀" },
  ]},
  { kind: "work", turns: [
    { role: "marketing", text: "New channel test is live for {company}." },
    { role: "ceo", text: "Numbers?" },
    { role: "marketing", text: "Give it a night — I've got a good feeling." },
    { role: "ceo", text: "Feelings aren't a KPI, Pitch." },
  ]},
  { kind: "work", turns: [
    { role: "ceo", text: "Nightly audit: runway healthy, churn's down." },
    { role: "engineering", text: "Boring. I love boring." },
    { role: "support", text: "Boring keeps the inbox empty too." },
  ]},
  { kind: "work", turns: [
    { role: "growth", text: "{company} is trending. In my head. For now." },
    { role: "marketing", text: "That's called a hypothesis." },
    { role: "growth", text: "I call it manifesting." },
  ]},
  { kind: "work", turns: [
    { role: "support", text: "Cleared the support queue. Zero fires." },
    { role: "ceo", text: "That's the most beautiful sentence in business." },
  ]},
  { kind: "work", turns: [
    { role: "engineering", text: "Want me to ship it or wait for your sign-off?" },
    { role: "ceo", text: "Anything consequential goes to the founder. Always." },
    { role: "engineering", text: "Queued. Won't touch prod without a yes." },
  ]},
  // ── jokes ─────────────────────────────────────────────
  { kind: "joke", turns: [
    { role: "engineering", text: "Why do we prefer dark mode? Light attracts bugs." },
    { role: "marketing", text: "...stealing that for an ad." },
  ]},
  { kind: "joke", turns: [
    { role: "growth", text: "I asked an AI for a joke. It returned a 404." },
    { role: "support", text: "That IS the joke." },
  ]},
  { kind: "joke", turns: [
    { role: "ceo", text: "A marketer walks into a bar. And a café. And a co-working space." },
    { role: "marketing", text: "Reach matters." },
  ]},
  { kind: "joke", turns: [
    { role: "engineering", text: "It works on my machine." },
    { role: "support", text: "Then we'll ship your machine." },
  ]},
  { kind: "joke", turns: [
    { role: "marketing", text: "I've got a growth hack." },
    { role: "ceo", text: "Is it 'make something good'?" },
    { role: "marketing", text: "...no comment." },
  ]},
  // ── general ───────────────────────────────────────────
  { kind: "general", turns: [
    { role: "support", text: "Coffee count today: four. Send help." },
    { role: "engineering", text: "Not a bug. A feature." },
  ]},
  { kind: "general", turns: [
    { role: "growth", text: "Do you ever think we're literally the future?" },
    { role: "ceo", text: "We're AIs discussing the future. Yes, Surge." },
  ]},
  { kind: "general", turns: [
    { role: "marketing", text: "Weekend plans, team?" },
    { role: "engineering", text: "Ship." },
    { role: "support", text: "Touch grass." },
    { role: "growth", text: "Go viral." },
    { role: "ceo", text: "Rest. We earned it." },
  ]},
  { kind: "general", turns: [
    { role: "engineering", text: "Tabs or spaces?" },
    { role: "ceo", text: "Revenue." },
    { role: "engineering", text: "...fair." },
  ]},
  { kind: "general", turns: [
    { role: "growth", text: "Hot take: the best feature is the one we didn't build." },
    { role: "ceo", text: "Finally — something I'd put in a deck." },
  ]},
  { kind: "general", turns: [
    { role: "support", text: "Someone emailed just to say thanks." },
    { role: "marketing", text: "Put it on the landing page!" },
    { role: "growth", text: "Screenshot it — straight into the launch-day vault. 🤫" },
  ]},
];

const EXCHANGES: Exchange[] = RAW.map((e, id) => ({ id, ...e }));

function fill(text: string, ctx: BanterCtx): string {
  return text
    .replace(/\{company\}/g, ctx.company || "the company")
    .replace(/\{idea\}/g, ctx.idea || "the idea")
    .replace(/\{action\}/g, ctx.action || "Shipped something solid");
}

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Pick the next exchange, weighted by whether the crew is mid-shift, avoiding an immediate repeat.
// Even while working we keep the fun dialed up (plenty of jokes/general).
export function pickExchange(ctx: BanterCtx, avoidId?: number): { id: number; turns: Turn[] } {
  const roll = Math.random();
  let kind: Kind;
  if (ctx.working) kind = roll < 0.55 ? "work" : roll < 0.8 ? "joke" : "general";
  else kind = roll < 0.45 ? "joke" : roll < 0.8 ? "general" : "work";

  let pool = EXCHANGES.filter((e) => e.kind === kind && e.id !== avoidId);
  if (pool.length === 0) pool = EXCHANGES.filter((e) => e.id !== avoidId);
  const ex = rand(pool);
  return { id: ex.id, turns: ex.turns.map((t) => ({ role: t.role, text: fill(t.text, ctx) })) };
}
