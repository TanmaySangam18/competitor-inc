"use client";

import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Eye,
  CheckCircle2,
  Inbox,
  Lock,
  Wallet,
  FlaskConical,
  Check,
  ShieldCheck,
  Undo2,
  Send,
  Rocket,
  TrendingUp,
} from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { AgentWelcome } from "@/components/AgentWelcome";

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0 },
};

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-70px" }}
      variants={fadeUp}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Nav ─────────────────────────────────────────────────────── */
function Nav() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-border bg-bg/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href="#" className="flex items-center gap-2.5 font-mono text-lg font-bold tracking-tight">
          <LogoMark size={34} />
          competitor.inc
          <span className="ml-1 hidden rounded-full border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-2 sm:inline-block">
            beta
          </span>
        </a>
        <div className="hidden items-center gap-9 text-sm text-muted md:flex">
          <a href="/how-it-works" className="transition hover:text-text">How it works</a>
          <a href="#capabilities" className="transition hover:text-text">Capabilities</a>
          <a href="/delegation" className="transition hover:text-text">The Delegation</a>
          <a href="#trust" className="transition hover:text-text">Glass Box</a>
          <a href="#pricing" className="transition hover:text-text">Pricing</a>
        </div>
        <a
          href="/dashboard"
          className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-text px-4 py-2 text-sm font-semibold text-bg transition hover:opacity-90"
        >
          Meet your co-founder <ArrowRight size={15} />
        </a>
      </div>
    </nav>
  );
}

/* ── Roomie companion mockup (hero visual) ───────────────────── */
function RoomiePreview() {
  return (
    <div className="ring-soft relative rounded-3xl border border-border bg-surface/80 p-3 backdrop-blur-xl">
      {/* window chrome */}
      <div className="flex items-center justify-between rounded-2xl bg-bg/60 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <LogoMark size={32} />
          <div className="leading-tight">
            <div className="text-sm font-semibold">competitor.inc</div>
            <div className="flex items-center gap-1.5 text-[11px] text-mint">
              <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-mint" />
              online · working overnight
            </div>
          </div>
        </div>
        <span className="text-[11px] text-muted-2">2:14 AM</span>
      </div>

      {/* conversation */}
      <div className="space-y-3 p-4">
        <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-surface-2 px-4 py-2.5 text-sm">
          Build me an app for AI bedtime stories for kids.
        </div>

        <div className="max-w-[88%] rounded-2xl rounded-tl-sm border border-border bg-bg/50 px-4 py-2.5 text-sm text-muted">
          Love this one. Before I build anything, let&apos;s make sure parents actually want it — I&apos;ll
          put up a landing page and run a tiny demand test first.
        </div>

        {/* validation card */}
        <div className="rounded-2xl border border-mint/25 bg-mint/[0.06] p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-mint">
            <FlaskConical size={14} /> VALIDATION GATE · live for 36h
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="font-display text-lg font-bold text-text">41</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-2">waitlist</div>
            </div>
            <div>
              <div className="font-display text-lg font-bold text-text">4.6%</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-2">CTR</div>
            </div>
            <div>
              <div className="font-display text-lg font-bold text-text">$0.71</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-2">cost / signup</div>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted">
            Strong signal. Want me to start building the MVP?
          </p>
          <div className="mt-3 flex gap-2">
            <button className="flex-1 rounded-lg bg-coral py-2 text-xs font-semibold text-bg">
              Approve build
            </button>
            <button className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted">
              Hold
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Hero ────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative overflow-hidden mesh">
      <div className="absolute inset-0 grid-bg" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 pt-36 pb-24 lg:grid-cols-[1.05fr_0.95fr] lg:pt-40 lg:pb-28">
        {/* copy */}
        <div>
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3.5 py-1.5 text-xs text-muted backdrop-blur"
          >
            <Sparkles size={13} className="text-amber" />
            Validation-first · honest by design
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.6, delay: 0.06 }}
            className="display mt-6 text-[2.75rem] leading-[1.04] sm:text-6xl"
          >
            Prove it <span className="text-coral">before</span> you build it.
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.6, delay: 0.13 }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-muted"
          >
            competitor.inc is your AI co-founder that{" "}
            <span className="text-text">validates an idea before it builds it</span> — running real
            demand tests, telling you the honest truth, then shipping only the winner. It shows its
            work, and never spends a dollar or sends a message without your say-so.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <a
              href="/dashboard"
              className="group inline-flex items-center gap-2 rounded-xl bg-coral px-6 py-3.5 font-semibold text-bg transition hover:brightness-110"
            >
              Start with a free validation
              <ArrowRight size={18} className="transition group-hover:translate-x-0.5" />
            </a>
            <a
              href="/how-it-works"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface/60 px-6 py-3.5 font-semibold backdrop-blur transition hover:bg-surface-2"
            >
              See how it works
            </a>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.6, delay: 0.27 }}
            className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-2"
          >
            <span className="flex items-center gap-1.5"><Check size={14} className="text-mint" /> No revenue share</span>
            <span className="flex items-center gap-1.5"><Check size={14} className="text-mint" /> No lock-in</span>
            <span className="flex items-center gap-1.5"><Check size={14} className="text-mint" /> Export anytime</span>
          </motion.div>
        </div>

        {/* visual */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <RoomiePreview />
        </motion.div>
      </div>

      {/* welcome agent + huge wordmark */}
      <div className="relative border-t border-border py-16">
        <div className="mx-auto mb-1 max-w-[300px]">
          <AgentWelcome />
        </div>
        <div
          className="text-center leading-[0.85] tracking-tight text-[10vw]"
          style={{ fontFamily: "var(--font-heavy)" }}
        >
          competitor<span className="text-coral">.inc</span>
        </div>
      </div>
    </section>
  );
}

/* ── Ethos line ──────────────────────────────────────────────── */
function Ethos() {
  return (
    <section className="border-y border-border bg-surface/30">
      <div className="mx-auto max-w-4xl px-6 py-14 text-center">
        <p className="font-display text-xl leading-relaxed md:text-2xl">
          <span className="text-text">Most tools build first and hope.</span>{" "}
          <span className="text-muted">
            competitor.inc proves there&apos;s real demand first — then builds the winner in the open, and
            never acts on anything consequential without your say-so.
          </span>
        </p>
      </div>
    </section>
  );
}

/* ── How it works ────────────────────────────────────────────── */
const steps = [
  { n: "01", title: "Validate before you build", body: "Every company starts at the Validation Gate — a real landing page, a waitlist, and a small demand test. competitor.inc won't build the product until the signal is there.", icon: FlaskConical, color: "text-amber", ring: "bg-amber/12" },
  { n: "02", title: "Build in the open", body: "Once validated, the agents ship. A task is only “done” when there's proof — a live URL, a passing build, a real metric. Nothing is marked complete on a hunch.", icon: CheckCircle2, color: "text-mint", ring: "bg-mint/12" },
  { n: "03", title: "Approve the moves that matter", body: "Spend, outbound messages, deploys, and deletions land in your Approval Inbox. You bring the taste and the final call; competitor.inc handles the rest.", icon: Inbox, color: "text-coral", ring: "bg-coral/12" },
  { n: "04", title: "Own everything", body: "Flat price, no revenue share. One-click export of all your code and data. Run it on your own infra anytime — or flip on Private Mode so nothing leaves your box.", icon: Lock, color: "text-violet", ring: "bg-violet/12" },
];

function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-6xl px-6 py-28">
      <Reveal className="max-w-2xl">
        <h2 className="display text-3xl md:text-[2.6rem]">Validate first. Build the winner. Own it.</h2>
        <p className="mt-4 text-lg text-muted">
          Four steps that put proof before code — and keep you in the founder&apos;s seat the whole way.
        </p>
      </Reveal>
      <div className="mt-14 grid gap-5 md:grid-cols-2">
        {steps.map((s, i) => (
          <Reveal key={s.n} delay={(i % 2) * 0.08}>
            <div className="card h-full p-7">
              <div className="flex items-center justify-between">
                <span className={`grid h-12 w-12 place-items-center rounded-xl ${s.ring} ${s.color}`}>
                  <s.icon size={21} />
                </span>
                <span className="font-display text-sm text-muted-2">{s.n}</span>
              </div>
              <h3 className="mt-5 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2.5 leading-relaxed text-muted">{s.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ── Capabilities ────────────────────────────────────────────── */
const capabilities = [
  { icon: FlaskConical, title: "Validation Gate", body: "Tests real demand with a landing page, waitlist, and smoke-test before a single line of product code.", color: "text-amber", ring: "bg-amber/12" },
  { icon: CheckCircle2, title: "Proof-of-Work", body: "A task counts as done only with a verifiable artifact — a live URL, a passing build, a real metric.", color: "text-mint", ring: "bg-mint/12" },
  { icon: Eye, title: "The Glass Box", body: "A human-readable log of every action, every dollar, every decision — with one-click undo.", color: "text-violet", ring: "bg-violet/12" },
  { icon: Inbox, title: "Approval Inbox", body: "Consequential actions wait for your yes/no. Safe autonomy by design — and the right way to handle prompt injection.", color: "text-coral", ring: "bg-coral/12" },
  { icon: Lock, title: "Private Mode", body: "Swap in a self-hosted open-weight model so sensitive business data never leaves your own infrastructure.", color: "text-violet", ring: "bg-violet/12" },
  { icon: Wallet, title: "Fair pricing", body: "A flat subscription with no revenue share. Failed work is credited back — you only pay for work that lands. Export and eject anytime.", color: "text-mint", ring: "bg-mint/12" },
];

function Capabilities() {
  return (
    <section id="capabilities" className="border-t border-border bg-surface/20">
      <div className="mx-auto max-w-6xl px-6 py-28">
        <Reveal className="max-w-2xl">
          <h2 className="display text-3xl md:text-[2.6rem]">Built on trust, not vibes</h2>
          <p className="mt-4 text-lg text-muted">
            Each capability is designed to make autonomy feel safe, transparent, and yours.
          </p>
        </Reveal>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((c, i) => (
            <Reveal key={c.title} delay={(i % 3) * 0.07}>
              <div className="card h-full p-6">
                <span className={`grid h-11 w-11 place-items-center rounded-xl ${c.ring} ${c.color}`}>
                  <c.icon size={19} />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{c.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Glass Box showcase ──────────────────────────────────────── */
const logEntries = [
  { icon: Rocket, color: "text-mint", ring: "bg-mint/12", agent: "Engineering", action: "Deployed landing page → bedtime-stories.app", meta: "build passed · 0:42s", cost: "$0.18", status: "done" },
  { icon: TrendingUp, color: "text-amber", ring: "bg-amber/12", agent: "Marketing", action: "Ran $20 demand test on Meta · 4.6% CTR", meta: "within budget", cost: "$20.00", status: "done" },
  { icon: Send, color: "text-coral", ring: "bg-coral/12", agent: "Growth", action: "Drafted launch post — waiting for your approval", meta: "outbound · needs sign-off", cost: "—", status: "pending" },
];

function GlassBox() {
  return (
    <section id="trust" className="mx-auto max-w-6xl px-6 py-28">
      <div className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal>
          <div className="inline-flex items-center gap-2 rounded-full border border-violet/25 bg-violet/[0.06] px-3 py-1 text-xs text-violet">
            <Eye size={13} /> The Glass Box
          </div>
          <h2 className="display mt-5 text-3xl md:text-[2.6rem]">See everything. Undo anything.</h2>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            competitor.inc logs every action, dollar, and decision it makes — in plain language. Nothing
            consequential happens without your sign-off, and you can reverse any step in one click.
          </p>
          <ul className="mt-7 space-y-3 text-sm text-muted">
            {["Plain-language audit trail of every overnight action", "Approval required for spend, outreach & deploys", "One-click undo on anything the agents did"].map((t) => (
              <li key={t} className="flex items-start gap-2.5">
                <ShieldCheck size={17} className="mt-0.5 shrink-0 text-mint" /> {t}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="ring-soft rounded-3xl border border-border bg-surface/70 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between px-1 pb-4">
              <span className="text-sm font-semibold">Last night&apos;s activity</span>
              <span className="text-xs text-muted-2">3 actions · $20.18 spent</span>
            </div>
            <div className="space-y-3">
              {logEntries.map((e, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-2xl border border-border bg-bg/50 p-4"
                >
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${e.ring} ${e.color}`}>
                    <e.icon size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-2">
                      {e.agent} · {e.meta}
                    </div>
                    <div className="mt-0.5 text-sm text-text">{e.action}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-xs text-muted">{e.cost}</span>
                    {e.status === "done" ? (
                      <button className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted transition hover:text-text">
                        <Undo2 size={11} /> undo
                      </button>
                    ) : (
                      <span className="rounded-md bg-coral/15 px-2 py-1 text-[11px] font-medium text-coral">
                        approve
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Pricing ─────────────────────────────────────────────────── */
const plans = [
  { name: "Validate", price: "$0", tag: "free forever", points: ["Run the Validation Gate", "Real landing page + waitlist", "Honest go / tweak / kill verdict", "No card required"], cta: "Start free", href: "/dashboard", highlight: false },
  { name: "Operator", price: "$39", tag: "/ month", points: ["Everything in Validate", "Build-the-winner agent team", "Glass Box + Approval Inbox", "Never charged for failed work", "BYOK + Private Mode · export anytime"], cta: "Hire your co-founder", href: "/dashboard", highlight: true },
  { name: "Founding", price: "$99", tag: "once · launch only", points: ["Everything in Operator — for life", "Founding-member badge", "Shape the roadmap", "Lock today's price forever"], cta: "Claim a seat", href: "/join", highlight: false },
];

function Pricing() {
  return (
    <section id="pricing" className="border-t border-border bg-surface/20">
      <div className="mx-auto max-w-5xl px-6 py-28">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="display text-3xl md:text-[2.6rem]">Honest pricing</h2>
          <p className="mt-4 text-lg text-muted">
            Pay for the work. Keep your upside. No revenue share, no lock-in.
          </p>
        </Reveal>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {plans.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.07}>
              <div
                className={`relative flex h-full flex-col rounded-2xl glass-panel p-7 ${
                  p.highlight ? "border-white/30 shadow-[0_0_60px_-22px_rgba(255,255,255,0.22)]" : ""
                }`}
              >
                {p.highlight && (
                  <span className="absolute -top-3 left-7 rounded-full bg-coral px-3 py-1 text-xs font-semibold text-bg">
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <div className="mt-3 flex items-end gap-1.5">
                  <span className="font-display text-4xl font-bold">{p.price}</span>
                  <span className="mb-1 text-sm text-muted-2">{p.tag}</span>
                </div>
                <ul className="mt-6 flex-1 space-y-3 text-sm text-muted">
                  {p.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2">
                      <Check size={16} className="mt-0.5 shrink-0 text-mint" /> {pt}
                    </li>
                  ))}
                </ul>
                <a
                  href={p.href}
                  className={`mt-7 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold transition ${
                    p.highlight
                      ? "bg-coral text-bg hover:brightness-110"
                      : "border border-border hover:bg-surface-2"
                  }`}
                >
                  {p.cta}
                </a>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Final CTA ───────────────────────────────────────────────── */
function FinalCTA() {
  return (
    <section className="relative overflow-hidden mesh">
      <div className="absolute inset-0 grid-bg" />
      <div className="relative mx-auto max-w-3xl px-6 py-32 text-center">
        <h2 className="display text-4xl leading-tight md:text-5xl">
          Don&apos;t build it blind.
          <br />
          <span className="text-coral">Prove it first.</span>
        </h2>
        <p className="mt-5 text-lg text-muted">
          Bring an idea. competitor.inc tells you the honest truth about it — then builds the one that&apos;s worth it.
        </p>
        <a
          href="/dashboard"
          className="group mt-9 inline-flex items-center gap-2 rounded-xl bg-coral px-7 py-4 font-semibold text-bg transition hover:brightness-110"
        >
          Meet your co-founder
          <ArrowRight size={18} className="transition group-hover:translate-x-0.5" />
        </a>
      </div>
    </section>
  );
}

/* ── Footer ──────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-muted-2 sm:flex-row">
        <div className="flex items-center gap-2 font-mono font-semibold text-text tracking-tight">
          <LogoMark size={26} />
          competitor.inc
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <a href="/how-it-works" className="transition hover:text-text">How it works</a>
          <a href="/delegation" className="transition hover:text-text">The Delegation</a>
          <a href="/live" className="transition hover:text-text">Live board</a>
          <a href="/#pricing" className="transition hover:text-text">Pricing</a>
          <a href="/join" className="transition hover:text-text">Founding</a>
        </nav>
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-mint" /> Your data, your call
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <main id="main">
      <Nav />
      <Hero />
      <Ethos />
      <HowItWorks />
      <Capabilities />
      <GlassBox />
      <Pricing />
      <FinalCTA />
      <Footer />
    </main>
  );
}
