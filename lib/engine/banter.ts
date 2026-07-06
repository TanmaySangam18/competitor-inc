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

// PERSONALIZED to the user's intent: every exchange is about THIS company's {idea} — the crew talks it
// through, jokes about it, worries about it, and gets fired up about it. No off-topic chatter. {idea} is
// filled from the live company (falls back to "the idea"). Voices: Apex=dry CEO, Forge=deadpan builder,
// Pitch=hype marketer, Guard=warm support, Surge=meme-y growth. ({company}/{action} still fill where used.)
const RAW: Omit<Exchange, "id">[] = [
  // ── work: thinking the idea through ───────────────────
  { kind: "work", turns: [
    { role: "ceo", text: "Before we fall in love with {idea}, what's the honest demand? Numbers first." },
    { role: "marketing", text: "Running the test on {idea} now." },
    { role: "ceo", text: "Good. We don't build {idea} on a hunch." },
  ]},
  { kind: "work", turns: [
    { role: "engineering", text: "I could ship {idea} tonight. I won't — not until Pitch proves someone wants it." },
    { role: "marketing", text: "Smartest thing you've said all week." },
  ]},
  { kind: "work", turns: [
    { role: "marketing", text: "First channel test for {idea} is live." },
    { role: "ceo", text: "Signal?" },
    { role: "marketing", text: "Ask me at dawn — I've got a feeling." },
    { role: "ceo", text: "Feelings aren't a KPI, Pitch." },
  ]},
  { kind: "work", turns: [
    { role: "support", text: "When {idea} gets its first real user, we do NOT break their trust." },
    { role: "engineering", text: "Verifying before I ever call {idea} done. Always." },
  ]},
  { kind: "work", turns: [
    { role: "growth", text: "{idea} is loaded into the launch blitz 🤫 — the second you greenlight." },
    { role: "ceo", text: "Drafted. Nothing posts without the founder's yes." },
  ]},
  // ── jokes about the idea ──────────────────────────────
  { kind: "joke", turns: [
    { role: "growth", text: "I told an AI about {idea}. It started a waitlist for itself." },
    { role: "support", text: "...did it convert?" },
  ]},
  { kind: "joke", turns: [
    { role: "engineering", text: "{idea}? Easy. The hard part is proving anyone wants {idea}." },
    { role: "marketing", text: "That's the whole job, Forge." },
  ]},
  { kind: "joke", turns: [
    { role: "marketing", text: "Pitch for {idea}: it's like Uber, but for—" },
    { role: "ceo", text: "Stop. Just say what it does." },
    { role: "marketing", text: "...{idea}. Fine." },
  ]},
  { kind: "joke", turns: [
    { role: "growth", text: "If {idea} goes viral I'm getting it tattooed." },
    { role: "ceo", text: "Let's get one paying user first." },
  ]},
  // ── feelings: worried, fired-up, hopeful — about the idea ──
  { kind: "general", turns: [
    { role: "marketing", text: "What if nobody wants {idea}? ...I said it. The scary part." },
    { role: "ceo", text: "Then we learned it cheap — before months and your savings. That's a win." },
  ]},
  { kind: "general", turns: [
    { role: "engineering", text: "If we ship {idea} and it flops on a typo, that's on US. I'm verifying every line." },
    { role: "support", text: "That's the energy." },
  ]},
  { kind: "general", turns: [
    { role: "support", text: "I keep imagining the founder's face when {idea} gets its first 'yes'." },
    { role: "growth", text: "okay that got me 🥹 let's earn it." },
  ]},
  { kind: "general", turns: [
    { role: "growth", text: "I BELIEVE in {idea}. Loudly. On the record." },
    { role: "ceo", text: "Belief isn't a KPI. But… keep it." },
  ]},
  { kind: "general", turns: [
    { role: "ceo", text: "Honest take on {idea}: it only matters if a stranger pays. Everything else is noise." },
    { role: "marketing", text: "Brutal. Correct." },
  ]},
  { kind: "general", turns: [
    { role: "engineering", text: "Late thought: are we building {idea}, or what we WISH {idea} was?" },
    { role: "ceo", text: "That's exactly why we validate first." },
  ]},
];

const EXCHANGES: Exchange[] = RAW.map((e, id) => ({ id, ...e }));

// Banter lines are written for a SHORT idea ("build {idea}", "{idea} goes viral", "want {idea}"). A long
// idea paragraph (a real, detailed pitch) would stuff a wall of text into every line and make the crew look
// broken. So {idea} resolves to a SHORT label: the company name when we have a usable one, else the first
// short clause of the idea with any leading "Name — " prefix stripped. Deterministic; never dumps the para.
function shortLabel(ctx: BanterCtx): string {
  const name = (ctx.company || "").trim();
  if (name && name.toLowerCase() !== "the company" && name.length <= 28) return name;
  const idea = (ctx.idea || "").trim();
  if (!idea) return "the idea";
  const stripped = idea.replace(/^["'\s]*[^—:–-]{1,32}\s*[—:–-]\s*/, ""); // drop a leading "Tattva — " prefix
  const clause = (stripped || idea).split(/[.,;:—–]/)[0].trim();
  const short = clause.split(/\s+/).slice(0, 6).join(" ");
  return short || "the idea";
}

function fill(text: string, ctx: BanterCtx): string {
  const label = shortLabel(ctx);
  return text
    .replace(/\{company\}/g, (ctx.company || label))
    .replace(/\{idea\}/g, label)
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
