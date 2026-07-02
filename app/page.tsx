"use client";

import { useState, useEffect } from "react";
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
  LogOut,
  Menu,
  ChevronDown,
  X,
} from "lucide-react";
import { LogoMark } from "@/components/Logo";
import ProductFilm from "@/components/ProductFilm";
import { useAuth } from "@/lib/engine/useAuth";
import { CHECKOUT_URL, checkoutUrlFor, checkoutLiveFor } from "@/lib/engine/billing";
import { AgentWelcome } from "@/components/AgentWelcome";
import { SecretHouseDoor } from "@/components/SecretHouseDoor";

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
// Grouped IA (the Stripe/Meta pattern): 4 top-level items — two dropdown groups + the two
// pages a first-time visitor actually decides on (Compare, Pricing) — one auth link, one CTA.
// Never more; a nav that overflows is a nav that failed (Hick's Law + this exact bug report).
const NAV_GROUPS: { label: string; items: { href: string; label: string }[] }[] = [
  {
    label: "Product",
    items: [
      { href: "/how-it-works", label: "How it works" },
      { href: "#film", label: "Watch the film" },
      { href: "/delegation", label: "The Delegation" },
      { href: "#trust", label: "The Glass Box" },
      { href: "/proof", label: "Proof standard" },
    ],
  },
  {
    label: "Resources",
    items: [
      { href: "/playbooks", label: "Playbooks" },
      { href: "/radar", label: "Demand Radar" },
      { href: "/blog", label: "Blog" },
    ],
  },
];

function NavGroup({ label, items, open, onToggle }: { label: string; items: { href: string; label: string }[]; open: boolean; onToggle: (v: boolean) => void }) {
  return (
    <div className="relative" onMouseEnter={() => onToggle(true)} onMouseLeave={() => onToggle(false)}>
      <button
        onClick={() => onToggle(!open)}
        aria-expanded={open}
        className={`inline-flex items-center gap-1 py-2 transition ${open ? "text-text" : "hover:text-text"}`}
      >
        {label} <ChevronDown size={13} className={`transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 min-w-[13rem] rounded-2xl border border-border bg-bg/95 p-2 shadow-xl backdrop-blur-xl">
          {items.map((i) => (
            <a key={i.href} href={i.href} onClick={() => onToggle(false)} className="block rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-surface hover:text-text">
              {i.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function Nav() {
  const { user, ready, signOut } = useAuth();
  const signedIn = !!user && !user.guest;
  const [menuOpen, setMenuOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-border bg-bg/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <a href="#" className="flex shrink-0 items-center gap-2.5 font-mono text-lg font-bold tracking-tight">
          <LogoMark size={34} />
          competitor.inc
          <span className="ml-1 hidden rounded-full border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-2 lg:inline-block">
            beta
          </span>
        </a>

        {/* Desktop: 4 top-level items, nothing more. */}
        <div className="hidden items-center gap-6 whitespace-nowrap text-sm text-muted lg:flex">
          {NAV_GROUPS.map((g) => (
            <NavGroup key={g.label} label={g.label} items={g.items} open={openGroup === g.label} onToggle={(v) => setOpenGroup(v ? g.label : null)} />
          ))}
          <a href="/compare" className="transition hover:text-text">Compare</a>
          <a href="#pricing" className="transition hover:text-text">Pricing</a>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {ready &&
            (signedIn ? (
              <button
                onClick={() => void signOut()}
                title={`Signed in as ${user!.email}`}
                className="hidden items-center gap-1.5 text-sm text-muted transition hover:text-text lg:inline-flex"
              >
                <LogOut size={14} /> Sign out
              </button>
            ) : (
              <a href="/login" className="hidden text-sm text-muted transition hover:text-text lg:inline-block">
                Sign in
              </a>
            ))}
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-text px-3.5 py-2 text-sm font-semibold text-bg transition hover:opacity-90 sm:px-4"
          >
            <span className="hidden sm:inline">Meet your co-founder</span>
            <span className="sm:hidden">Start</span>
            <ArrowRight size={15} />
          </a>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
            aria-expanded={menuOpen}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border text-muted transition hover:text-text lg:hidden"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile: grouped sections, everything reachable. */}
      {menuOpen && (
        <div className="border-t border-border bg-bg/95 backdrop-blur-xl lg:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-6 py-3">
            {NAV_GROUPS.map((g) => (
              <div key={g.label}>
                <div className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-muted-2">{g.label}</div>
                {g.items.map((i) => (
                  <a key={i.href} href={i.href} onClick={() => setMenuOpen(false)} className="block rounded-lg px-2 py-2 text-sm text-muted transition hover:bg-surface hover:text-text">
                    {i.label}
                  </a>
                ))}
              </div>
            ))}
            <div className="my-1 border-t border-border" />
            <a href="/compare" onClick={() => setMenuOpen(false)} className="rounded-lg px-2 py-2.5 text-sm text-muted transition hover:bg-surface hover:text-text">Compare</a>
            <a href="#pricing" onClick={() => setMenuOpen(false)} className="rounded-lg px-2 py-2.5 text-sm text-muted transition hover:bg-surface hover:text-text">Pricing</a>
            <div className="my-1 border-t border-border" />
            {ready &&
              (signedIn ? (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    void signOut();
                  }}
                  className="flex items-center gap-2 rounded-lg px-2 py-2.5 text-left text-sm text-muted transition hover:bg-surface hover:text-text"
                >
                  <LogOut size={14} /> Sign out
                </button>
              ) : (
                <a href="/login" onClick={() => setMenuOpen(false)} className="rounded-lg px-2 py-2.5 text-sm text-muted transition hover:bg-surface hover:text-text">
                  Sign in
                </a>
              ))}
          </div>
        </div>
      )}
    </nav>
  );
}

/* ── Co-founder companion mockup (hero visual) ───────────────── */
function CofounderPreview() {
  const [demo, setDemo] = useState<"idle" | "approved" | "held">("idle");
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
            {demo === "approved"
              ? "On it — building the MVP now. You'll get a real, openable link the moment it ships."
              : demo === "held"
              ? "Held. Nothing happens without your yes — I'll wait."
              : "Strong signal. Want me to start building the MVP?"}
          </p>
          {demo === "idle" ? (
            <div className="mt-3 flex gap-2">
              <button onClick={() => setDemo("approved")} className="flex-1 rounded-lg bg-coral py-2 text-xs font-semibold text-bg transition hover:brightness-110">
                Approve build
              </button>
              <button onClick={() => setDemo("held")} className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted transition hover:text-text">
                Hold
              </button>
            </div>
          ) : (
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${demo === "approved" ? "text-mint" : "text-muted"}`}>
                {demo === "approved" ? <><Check size={13} /> Build approved</> : "On hold"}
              </span>
              <button onClick={() => setDemo("idle")} className="text-[11px] text-muted-2 underline-offset-2 transition hover:text-text hover:underline">
                reset demo
              </button>
            </div>
          )}
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
            Verifiable. Governed. · for first-time founders
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
            competitor.inc is the AI co-founder for{" "}
            <span className="text-text">your first company</span> — it validates your idea before you build
            it, tells you the honest truth (even when that's &ldquo;don&apos;t&rdquo;), then ships only the
            winner. It shows its work, and never spends a dollar or sends a message without your say-so.
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
          <CofounderPreview />
        </motion.div>
      </div>

      {/* The position in three lines — the messaging pillars (Verifiable. Governed.) */}
      <div className="mx-auto mt-14 grid max-w-5xl gap-4 px-6 sm:grid-cols-3">
        {[
          { h: "Building is no longer the hard part.", s: "Most products make $0. ~5% ever cross $100k/yr. The bottleneck is getting the first 100 paying customers — that's what we're built for.", accent: true },
          { h: "It asks before anything risky.", s: "Spend, sends, and deploys wait for your yes. Every action is logged with proof you can click. Nothing goes out without your say-so." },
          { h: "We run on our own product, in public.", s: "The company that sells the company-runner is the demo." },
        ].map((p) => (
          <div key={p.h} className={`rounded-2xl border p-5 ${"accent" in p && p.accent ? "border-coral/30 bg-coral/[0.04]" : "border-border bg-surface/50"}`}>
            <div className={`text-sm font-semibold ${"accent" in p && p.accent ? "text-coral" : "text-text"}`}>{p.h}</div>
            <div className="mt-1 text-sm text-muted">{p.s}</div>
          </div>
        ))}
      </div>

      {/* welcome agent + huge wordmark */}
      <div className="relative border-t border-border py-16">
        <div className="mx-auto mb-1 max-w-[300px]">
          <AgentWelcome />
        </div>
        <SecretHouseDoor
          className="text-center leading-[0.85] tracking-tight text-[10vw]"
        >
          <span style={{ fontFamily: "var(--font-heavy)" }}>
            competitor<span className="text-coral">.inc</span>
          </span>
        </SecretHouseDoor>
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
          <span className="text-text">Building is easy. Selling is the hard part.</span>{" "}
          <span className="text-muted">
            competitor.inc proves there&apos;s real demand before you build — then gets the winner its first paying customers, in the open, never acting on anything consequential without your say-so.
          </span>
        </p>
      </div>
    </section>
  );
}

/* ── How it works ────────────────────────────────────────────── */
const steps = [
  { n: "01", title: "Validate before you build", body: "Every company starts at the Validation Gate — a fast, honest read on your idea, then a real plan to prove it: talk to a few real users, find where people already pay, and make one costly ask (a pre-order, a deposit). Commitment, not free signups. competitor.inc won't build until the signal is there.", icon: FlaskConical, color: "text-amber", ring: "bg-amber/12" },
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
  { icon: FlaskConical, title: "Validation Gate", body: "A fast, honest read first — then a commitment test that actually proves demand: real conversations, evidence people already pay, and one costly ask. Not vanity signups, and never a line of product code on a hunch.", color: "text-amber", ring: "bg-amber/12" },
  { icon: CheckCircle2, title: "Proof-of-Work", body: "A task counts as done only with a verifiable artifact — a live URL, a passing build, a real metric.", color: "text-mint", ring: "bg-mint/12" },
  { icon: Eye, title: "The Glass Box", body: "A human-readable log of every action, every dollar, every decision — with one-click undo.", color: "text-violet", ring: "bg-violet/12" },
  { icon: Inbox, title: "Approval Inbox", body: "Consequential actions wait for your yes/no. Safe autonomy by design — and the right way to handle prompt injection.", color: "text-coral", ring: "bg-coral/12" },
  { icon: Send, title: "Autopilot growth", body: "Approve one campaign and the crew drafts launch posts that market your product — to Bluesky and Mastodon, from competitor.inc's own accounts. Each post is policy-checked before it goes out; you never touch a login. Unlocked on Operator.", color: "text-amber", ring: "bg-amber/12" },
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

/* ── The honest alternative (factual contrast — names no competitor) ── */
const contrastRows = [
  { black: "Builds blindly on whatever you type", ours: "Validates real demand first — and tells you the honest truth, even when it’s “don’t build this”" },
  { black: "Impresses with projections (“growth through 2030”)", ours: "Proof, not projections — a live URL, a passing build, a real metric, or it doesn’t count" },
  { black: "Acts on your behalf unattended — and sometimes sends the message you’d never have approved", ours: "Approval Inbox — nothing consequential ships without your explicit yes" },
  { black: "Takes a cut of your revenue", ours: "0% cut — you keep everything, own your code and data, and export anytime" },
  { black: "A black box you’re asked to trust", ours: "The Glass Box — every action, every dollar, every decision, in the open" },
];

function HonestAlternative() {
  return (
    <section id="why" className="mx-auto max-w-6xl px-6 py-28">
      <Reveal className="max-w-2xl">
        <h2 className="display text-3xl md:text-[2.6rem]">Everything the autonomous black box isn’t</h2>
        <p className="mt-4 text-lg text-muted">
          The first wave of “AI that runs your company” builds fast and asks for your trust. competitor.inc
          earns it instead — proof before code, your hand on every consequential move, and none of your revenue.
        </p>
      </Reveal>
      <Reveal delay={0.06}>
        <div className="mt-14 overflow-hidden rounded-2xl border border-border">
          <div className="grid grid-cols-2 border-b border-border bg-surface/30 text-sm font-semibold">
            <div className="flex items-center gap-2 px-5 py-4 text-muted-2"><Lock size={15} /> The autonomous black box</div>
            <div className="flex items-center gap-2 border-l border-border px-5 py-4 text-text"><LogoMark size={18} /> competitor.inc</div>
          </div>
          {contrastRows.map((r, i) => (
            <div key={i} className={`grid grid-cols-2 ${i < contrastRows.length - 1 ? "border-b border-border" : ""}`}>
              <div className="flex items-start gap-2.5 px-5 py-5 text-sm text-muted-2">
                <X size={16} className="mt-0.5 shrink-0 opacity-60" />
                <span>{r.black}</span>
              </div>
              <div className="flex items-start gap-2.5 border-l border-border bg-mint/[0.04] px-5 py-5 text-sm text-text">
                <Check size={16} className="mt-0.5 shrink-0 text-mint" />
                <span>{r.ours}</span>
              </div>
            </div>
          ))}
        </div>
      </Reveal>
      <p className="mt-5 text-xs text-muted-2">
        A factual comparison of two approaches to AI company-building. We name no competitor — we just hold ourselves to a higher standard.
      </p>
    </section>
  );
}

/* ── Glass Box showcase ──────────────────────────────────────── */
const logEntries = [
  { icon: Rocket, color: "text-mint", ring: "bg-mint/12", agent: "Engineering", action: "Deployed landing page → bedtime-stories.app", meta: "build passed · 0:42s", cost: "$0.18", status: "done" },
  { icon: TrendingUp, color: "text-amber", ring: "bg-amber/12", agent: "Marketing", action: "Ran a $20 demand test · 4.6% CTR", meta: "on your connected ad account", cost: "$20.00", status: "done" },
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
          <h2 className="display mt-5 text-3xl md:text-[2.6rem]">See every move. Nothing risky without your yes.</h2>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            competitor.inc logs every action, dollar, and decision it makes — in plain language. Nothing
            consequential — real spend, outreach, a deploy — fires without your sign-off, and any step
            that&apos;s still reversible can be undone in one click.
          </p>
          <ul className="mt-7 space-y-3 text-sm text-muted">
            {["Plain-language audit trail of every overnight action", "Approval required for spend, outreach & deploys", "One-click undo on any reversible step"].map((t) => (
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
  { name: "Validate", price: "$0", tag: "free forever", audience: "For first-time & student founders", tier: "", points: ["Prove demand before you build", "Real commitment test, not a vanity signup", "Honest go / tweak / kill verdict", "No card required"], cta: "Start free", href: "/dashboard", highlight: false },
  { name: "Operator", price: "$39", tag: "/ month", audience: "Build it yourself, with the crew", tier: "operator", points: ["Everything in Validate", "Build-the-winner agent team", "Glass Box + Approval Inbox", "Never charged for failed work", "BYOK + Private Mode · export anytime"], cta: "Hire your co-founder", href: "/dashboard", highlight: false },
  { name: "Founder", price: "$299", tag: "/ month", audience: "Done WITH you — for founders who'd rather not DIY", tier: "founder", points: ["Everything in Operator", "We validate, build & launch alongside you", "A weekly working session with the crew", "Direct line + priority on everything", "Only a handful of slots at a time"], cta: "Work with us", href: "/join", highlight: true },
];

function Pricing() {
  const { user } = useAuth();
  const email = user && !user.guest ? user.email : "";
  // Each paid tier routes to its OWN LemonSqueezy checkout when that tier's link is live (email prefilled
  // if signed in); otherwise it falls back to the in-app/apply path so the page always works.
  const planHref = (p: { tier: string; href: string }) =>
    p.tier && checkoutLiveFor(p.tier) ? checkoutUrlFor(email, p.tier) : p.href;
  return (
    <section id="pricing" className="border-t border-border bg-surface/20">
      <div className="mx-auto max-w-5xl px-6 py-28">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="display text-3xl md:text-[2.6rem]">Honest pricing</h2>
          <p className="mt-4 text-lg text-muted">
            Validate free. Build it yourself, or have us do it with you. No revenue share, no lock-in.
          </p>
          <p className="mt-2 text-sm text-muted-2">
            Free to prove the idea — you only pay once there&apos;s a winner worth building.
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
                    Done with you
                  </span>
                )}
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <div className="mt-3 flex items-end gap-1.5">
                  <span className="font-display text-4xl font-bold">{p.price}</span>
                  <span className="mb-1 text-sm text-muted-2">{p.tag}</span>
                </div>
                <p className="mt-2 text-xs text-muted-2">{p.audience}</p>
                <ul className="mt-6 flex-1 space-y-3 text-sm text-muted">
                  {p.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2">
                      <Check size={16} className="mt-0.5 shrink-0 text-mint" /> {pt}
                    </li>
                  ))}
                </ul>
                <a
                  href={planHref(p)}
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

        {/* One-time option — cash-now foot in the door that upsells to Founder. */}
        <Reveal className="mx-auto mt-8 max-w-3xl">
          <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-border bg-surface/40 px-6 py-5 text-center sm:flex-row sm:text-left">
            <div>
              <div className="text-sm font-semibold">Not ready for a monthly commitment?</div>
              <p className="mt-1 text-sm text-muted">
                Start with a one-time <span className="text-text">Validation Sprint — $499</span>: we run the full
                commitment-based validation with you in a week. It credits toward Founder if you continue.
              </p>
            </div>
            <a
              href={checkoutLiveFor("sprint") ? checkoutUrlFor(email, "sprint") : "/join"}
              className="shrink-0 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold transition hover:bg-surface-2"
            >
              Book a Sprint
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Final CTA ───────────────────────────────────────────────── */
function FinalCTA() {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    fetch("/api/waitlist")
      .then((r) => r.json())
      .then((d) => { if (typeof d?.count === "number") setCount(d.count); })
      .catch(() => {});
  }, []);

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
        {count !== null && count > 0 && (
          <p className="mt-5 text-sm text-muted-2">
            <span className="font-semibold text-text">{count.toLocaleString()}</span> founders already on the waitlist
          </p>
        )}
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
          <a href="/playbooks" className="transition hover:text-text">Playbooks</a>
          <a href="/delegation" className="transition hover:text-text">The Delegation</a>
          <a href="/blog" className="transition hover:text-text">Blog</a>
          <a href="/live" className="transition hover:text-text">Live board</a>
          <a href="/#pricing" className="transition hover:text-text">Pricing</a>
          <a href="/join" className="transition hover:text-text">Founding</a>
          <a href="mailto:projecttattva1@gmail.com" className="transition hover:text-text">Contact</a>
        </nav>
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-mint" /> Your data, your call
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-6 py-4 text-xs text-muted-2">
          <span>Founder —</span>
          <a
            href="https://www.linkedin.com/in/tanmaysangam/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-medium text-text transition hover:text-coral"
          >
            Tanmay Sangam
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
            </svg>
          </a>
          <span>· © 2026 ·</span>
          <a href="/privacy" className="transition hover:text-text">Privacy</a>
          <span>·</span>
          <a href="/terms" className="transition hover:text-text">Terms</a>
        </div>
      </div>
    </footer>
  );
}

/* ── ChatOps teaser (coming soon — texting your agents) ───────── */
function ChatOpsTeaser() {
  return (
    <section className="border-t border-border bg-surface/20">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-24 md:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-coral/30 bg-coral/10 px-3 py-1 text-xs font-medium text-coral">
            <Sparkles size={13} /> Coming soon
          </span>
          <h2 className="display mt-5 text-3xl md:text-[2.6rem]">Run it from your texts.</h2>
          <p className="mt-4 max-w-md text-muted">
            Soon you won&apos;t need to open competitor.inc at all. Your agents will text you what they&apos;re
            doing and what needs your call — you reply <span className="text-text">approve</span> or{" "}
            <span className="text-text">reject</span>, right from your phone. The Approval Inbox, brought to
            where you already live.
          </p>
          <p className="mt-3 text-sm text-muted-2">
            Same rule as always: nothing consequential happens without your yes.
          </p>
        </div>

        {/* a little text-thread preview */}
        <div className="clay-panel mx-auto w-full max-w-sm p-5">
          <div className="space-y-3">
            <div className="flex items-start gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-text text-bg"><LogoMark size={16} /></span>
              <div className="rounded-2xl rounded-tl-sm border border-border bg-bg/60 px-3.5 py-2 text-sm text-muted">
                Pitch wants to spend $40 on an X ad test. Approve?
              </div>
            </div>
            <div className="flex justify-end">
              <div className="rounded-2xl rounded-tr-sm bg-coral px-3.5 py-2 text-sm font-medium text-bg">approve ✅</div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-text text-bg"><LogoMark size={16} /></span>
              <div className="rounded-2xl rounded-tl-sm border border-border bg-bg/60 px-3.5 py-2 text-sm text-muted">
                Done — it&apos;s live. I&apos;ll report results tonight. 🚀
              </div>
            </div>
          </div>
          <p className="mt-4 text-center text-[11px] text-muted-2">Texting with your crew · preview</p>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main id="main">
      <Nav />
      <Hero />
      <ProductFilm />
      <Ethos />
      <HowItWorks />
      <Capabilities />
      <HonestAlternative />
      <GlassBox />
      <ChatOpsTeaser />
      <Pricing />
      <FinalCTA />
      <Footer />
    </main>
  );
}
