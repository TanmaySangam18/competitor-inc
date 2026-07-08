"use client";

import { useState } from "react";
import { Lightbulb, FlaskConical, ShieldCheck, Rocket, Users, Eye, BadgeCheck } from "lucide-react";

// The 7-step journey as progressive disclosure: numbered selector + one story panel, instead of
// seven stacked cards (~60% shorter page, same words). Tablist semantics for keyboard/screen readers.
const STEPS = [
  {
    icon: Lightbulb,
    short: "Tell it your idea",
    title: "You tell it your idea — in one sentence",
    body: "No business plan, no slide deck, no forms. You just type what you wish existed, like “an app that turns my voice notes into polished blog posts.” That single line is enough to begin.",
    like: "Like describing an idea to a friend over coffee.",
  },
  {
    icon: FlaskConical,
    short: "It checks real demand",
    title: "It checks if people actually want it — before building anything",
    body: "Not by counting free email signups (nobody signs up for a thing that doesn't exist — you know you wouldn't). It runs the honest version: it preps you to talk to a handful of real potential users, digs up where people already pay to solve this, and helps you set up one costly ask — a pre-order, a deposit, a “hold my spot.” It measures commitment, because money and time are the only signals that don't lie.",
    like: "Like a chef who has you taste the sauce — and put money down for a bowl — before cooking the whole meal.",
  },
  {
    icon: ShieldCheck,
    short: "You get the honest verdict",
    title: "It gives you the honest truth — even when that's “don't build it”",
    body: "Most tools just cheer you on. This one will tell you to walk away if the interest isn't there — and exactly why. A clear verdict: go for it, tweak the idea, or stop now. That honesty is the whole point.",
    like: "A co-founder who'd rather lose the project than waste your savings.",
  },
  {
    icon: Rocket,
    short: "It builds the winner",
    title: "If the answer is yes, it builds the winner",
    body: "Once demand is proven, it ships a first real, working version with a live link you can open — not a drawing or a mockup. You go from idea to a thing that exists, fast.",
    like: "Like getting a real storefront, not an architect's sketch.",
  },
  {
    icon: Users,
    short: "Your AI team runs it",
    title: "Your AI team runs it, night after night",
    body: "Five specialists keep the business moving while you sleep: a CEO who watches the money, an engineer who ships, a marketer who finds customers, support who helps users, and a growth lead who spots opportunities. A little progress, every single night.",
    like: "Like a small startup team that never clocks out.",
  },
  {
    icon: Eye,
    short: "You see everything",
    title: "You see everything it does — the Glass Box",
    body: "Every action is written down with what it cost and proof it really happened. Nothing is hidden behind the curtain. Anything still reversible, you can undo in one click — and nothing risky happens without your yes in the first place.",
    like: "Like a glass-walled kitchen where you watch every dish being made.",
  },
  {
    icon: BadgeCheck,
    short: "It asks before anything risky",
    title: "It asks first before doing anything risky — the Approval Inbox",
    body: "Spending real money, emailing real people, or putting something live always waits for your “yes.” You're the boss. It proposes; you decide. It never goes rogue.",
    like: "Like an assistant who checks with you before signing any cheque.",
  },
];

export default function JourneyExplorer() {
  const [active, setActive] = useState(0);
  const s = STEPS[active];
  return (
    <div className="grid gap-4 lg:grid-cols-[17rem_1fr]">
      <div role="tablist" aria-label="The journey" aria-orientation="vertical" className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {STEPS.map((st, i) => (
          <button
            key={st.short}
            role="tab"
            aria-selected={i === active}
            id={`journey-tab-${i}`}
            aria-controls="journey-panel"
            onClick={() => setActive(i)}
            className={`flex shrink-0 items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-sm font-medium transition ${
              i === active ? "border-text/30 bg-surface-2 text-text" : "border-border text-muted hover:text-text"
            }`}
          >
            <span className="font-mono text-[10px] text-muted-2">{String(i + 1).padStart(2, "0")}</span>
            <span className="whitespace-nowrap">{st.short}</span>
          </button>
        ))}
      </div>
      <div id="journey-panel" role="tabpanel" aria-labelledby={`journey-tab-${active}`} className="glass-panel min-h-[16rem] rounded-3xl p-6 md:p-8">
        <div className="flex items-start gap-5">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-text text-bg">
            <s.icon size={22} />
          </span>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold md:text-2xl">{s.title}</h2>
            <p className="mt-3 text-muted">{s.body}</p>
            <p className="mt-4 border-l-2 border-black/20 pl-3 text-sm italic text-muted-2">{s.like}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
