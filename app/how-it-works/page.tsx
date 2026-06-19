import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowLeft,
  ArrowRight,
  Lightbulb,
  FlaskConical,
  ShieldCheck,
  Rocket,
  Users,
  Eye,
  BadgeCheck,
  RotateCcw,
  Mic,
  KeyRound,
  Download,
  Radio,
} from "lucide-react";
import { LogoMark } from "@/components/Logo";

export const metadata: Metadata = {
  title: "How it works — competitor.inc",
  description:
    "From a one-sentence idea to a real, validated business — the whole journey, in plain English. No jargon.",
};

// The story, told in plain language. Each step explains one thing competitor.inc does,
// the way you'd explain it to someone who has never used software like this.
const steps = [
  {
    icon: Lightbulb,
    title: "You tell it your idea — in one sentence",
    body: "No business plan, no slide deck, no forms. You just type what you wish existed, like “an app that turns my voice notes into polished blog posts.” That single line is enough to begin.",
    like: "Like describing an idea to a friend over coffee.",
  },
  {
    icon: FlaskConical,
    title: "It checks if people actually want it — before building anything",
    body: "Instead of building first and hoping, it runs small, real demand tests: a live page people can react to, a “sign me up” button, a tiny ad, and a look at how many people are already searching for this. It measures genuine interest with real signals.",
    like: "Like a chef who has you taste the sauce before cooking the whole meal.",
  },
  {
    icon: ShieldCheck,
    title: "It gives you the honest truth — even when that's “don't build it”",
    body: "Most tools just cheer you on. This one will tell you to walk away if the interest isn't there — and exactly why. A clear verdict: go for it, tweak the idea, or stop now. That honesty is the whole point.",
    like: "A co-founder who'd rather lose the project than waste your savings.",
  },
  {
    icon: Rocket,
    title: "If the answer is yes, it builds the winner",
    body: "Once demand is proven, it ships a first real, working version with a live link you can open — not a drawing or a mockup. You go from idea to a thing that exists, fast.",
    like: "Like getting a real storefront, not an architect's sketch.",
  },
  {
    icon: Users,
    title: "Your AI team runs it, night after night",
    body: "Five specialists keep the business moving while you sleep: a CEO who watches the money, an engineer who ships, a marketer who finds customers, support who helps users, and a growth lead who spots opportunities. A little progress, every single night.",
    like: "Like a small startup team that never clocks out.",
  },
  {
    icon: Eye,
    title: "You see everything it does — the Glass Box",
    body: "Every action is written down with what it cost and proof it really happened. Nothing is hidden behind the curtain. Don't like something it did? Undo it with one click.",
    like: "Like a glass-walled kitchen where you watch every dish being made.",
  },
  {
    icon: BadgeCheck,
    title: "It asks first before doing anything risky — the Approval Inbox",
    body: "Spending real money, emailing real people, or putting something live always waits for your “yes.” You're the boss. It proposes; you decide. It never goes rogue.",
    like: "Like an assistant who checks with you before signing any cheque.",
  },
];

// The promises that hold underneath the whole thing — what keeps you in control.
const controls = [
  { icon: RotateCcw, title: "You're never charged for failed work", body: "Your plan includes a monthly allowance of agent-work. If a task doesn't land, its cost is credited straight back to that allowance — it's not money returned to your card, it's simply never charged. (Real ad spend runs on your own connected accounts — and an ad that didn't convert isn't a failure, it's a result you paid for.)" },
  { icon: Mic, title: "It speaks in your voice", body: "Set your tone and values once, and every agent follows them — so everything sounds like you, not a robot." },
  { icon: KeyRound, title: "Your own brain, if you want it", body: "Most people use the default. If you'd rather, plug in your own AI key for full privacy and cost control — it's optional." },
  { icon: Download, title: "Your data is yours", body: "Export everything anytime, in one click. No lock-in, no hostage-taking, ever." },
  { icon: Radio, title: "Real results, in the open", body: "A public live board shows real companies being validated and built — proof, not promises." },
];

export default function HowItWorks() {
  return (
    <div id="main" className="min-h-screen">
      <header className="glass-nav sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 font-mono text-lg font-bold tracking-tight">
            <LogoMark size={32} /> competitor.inc
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-text">
            <ArrowLeft size={15} /> Home
          </Link>
        </div>
      </header>

      <div className="mesh">
        <div className="mx-auto max-w-4xl px-6 pb-10 pt-20 text-center">
          <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-muted">
            The whole journey · in plain English
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight md:text-6xl">
            How it works
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">
            From a one-sentence idea to a real, validated business. No jargon — here's exactly what
            happens, start to finish, and what it does for you at every step.
          </p>
        </div>
      </div>

      {/* The story */}
      <div className="mx-auto max-w-3xl px-6 pb-8">
        <ol className="space-y-5">
          {steps.map((s, i) => (
            <li key={s.title} className="glass-panel rounded-3xl p-6 md:p-8">
              <div className="flex items-start gap-5">
                <div className="flex shrink-0 flex-col items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-text text-bg">
                    <s.icon size={22} />
                  </span>
                  <span className="font-mono text-xs text-muted-2">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold md:text-2xl">{s.title}</h2>
                  <p className="mt-3 text-muted">{s.body}</p>
                  <p className="mt-4 border-l-2 border-white/20 pl-3 text-sm italic text-muted-2">{s.like}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* The control promises */}
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold md:text-4xl">And you stay in control — always</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            Power is nothing without trust. These hold true the entire time.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {controls.map((c) => (
            <div key={c.title} className="glass-panel rounded-2xl p-6">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-surface-2 text-text">
                <c.icon size={18} />
              </span>
              <h3 className="mt-4 font-semibold">{c.title}</h3>
              <p className="mt-2 text-sm text-muted">{c.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Closing */}
      <div className="mx-auto max-w-3xl px-6 pb-28">
        <div className="card p-10 text-center md:p-14">
          <h2 className="text-3xl font-bold md:text-4xl">Prove it before you build it.</h2>
          <p className="mx-auto mt-4 max-w-lg text-muted">
            Start with a free validation — no card, no risk. Get an honest answer in minutes.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2 rounded-xl bg-text px-7 py-4 font-semibold text-bg transition hover:opacity-90"
            >
              Start free <ArrowRight size={17} className="transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/live"
              className="inline-flex items-center gap-2 rounded-xl glass px-7 py-4 font-semibold transition hover:border-white/25"
            >
              See it live
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
