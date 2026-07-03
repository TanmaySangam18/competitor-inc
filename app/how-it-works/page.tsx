import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Mic,
  KeyRound,
  Download,
  Radio,
} from "lucide-react";
import { LogoMark } from "@/components/Logo";
import JourneyExplorer from "@/components/JourneyExplorer";
import ScrollProgress from "@/components/ScrollProgress";

export const metadata: Metadata = {
  title: "How it works — competitor.inc",
  description:
    "From a one-sentence idea to a real, validated business — the whole journey, in plain English. No jargon.",
};

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
      <ScrollProgress />
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

      {/* The story — 7 steps, one panel at a time (progressive disclosure) */}
      <div className="mx-auto max-w-4xl px-6 pb-8">
        <JourneyExplorer />
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
