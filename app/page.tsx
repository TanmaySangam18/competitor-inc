import type { Metadata } from "next";
import ProductMarquee from "@/components/ProductMarquee";

// THE LANDING (/) — Block E of the Connect-First reset (docs/CONNECT-FIRST-RESET.md §2.3): the website
// EXPLAINS, SIMPLY — what happens after you connect, in plain terms, plus the live /benchmark proof.
// Monochrome brutalist (white / #0a0a0a / hairlines / mono labels / heavy display), a SHORT scrolling
// story: hero → three steps → proof (real numbers only) → the honest comparison → footer. No feature
// tour, no retired surfaces, no invented numbers ([[crack-audit-and-no-fake-proof]] — the honesty floor).
// Every claim below is backed by code: 56 roles = lib/org/organization.ts (canonical ORG_56_ROLES);
// tamper-evident ledger = lib/core/audit.ts (sha256 hash chain + integrity verifier); receipts =
// lib/core/receipt-sign.ts; the badge = lib/core/badge.ts; the marquee = real routes (lib/core/showcase.ts).

export const metadata: Metadata = {
  title: "competitor.inc — an AI software company that runs itself",
  description:
    "Connect your accounts once. A governed AI organization validates, builds, deploys, runs, and sells — you oversee the work and sign the rare decision that needs a human. Every claim is verifiable.",
};

// The mono eyebrow label — the section marker of the brutalist system.
function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-muted-2">{children}</p>
  );
}

// Exactly three steps, plain words (§2.3: "what happens after you connect, in plain terms").
const STEPS = [
  {
    n: "01",
    title: "Connect",
    body:
      "Your accounts, your keys, your ownership. The company runs on accounts you control — bring your own keys — so everything it builds and earns is yours.",
  },
  {
    n: "02",
    title: "The org runs",
    body:
      "56 roles plan, build, test, ship, and support in continuous loops. You are tagged only for the decisions that need a human: money, contracts, launches.",
  },
  {
    n: "03",
    title: "Verify everything",
    body:
      "Every action lands on a tamper-evident, hash-chained ledger. Every claim carries a receipt — or it is labeled simulation and never counted as real.",
  },
];

export default function Landing() {
  return (
    <main id="main" className="min-h-[100dvh] bg-bg text-text">
      {/* header */}
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <span className="font-mono text-lg font-semibold tracking-tight">
          competitor<span className="text-muted-2">.inc</span>
        </span>
        <a
          href="/login"
          className="border border-border px-4 py-2 font-mono text-xs font-medium text-muted transition hover:border-text hover:text-text"
        >
          Sign in
        </a>
      </header>

      {/* 1 · hero — the vision in one breath, ONE CTA + one quiet link */}
      <section className="mx-auto flex min-h-[72dvh] w-full max-w-5xl flex-col justify-center px-6 py-20">
        <Label>The whole pitch, in one breath</Label>
        <h1 className="display mt-6 text-4xl leading-[1.02] sm:text-6xl lg:text-7xl">
          An AI software company that runs itself.
          <br />
          <span className="text-muted">Governed by one human: you.</span>
        </h1>
        <p className="mt-7 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
          Connect your accounts once. The AI organization validates, builds, deploys, runs, and sells —
          you oversee the work and sign the rare decision that needs a human.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-6">
          <a
            href="/dashboard"
            className="bg-coral px-7 py-3.5 text-sm font-semibold text-white transition hover:opacity-85"
          >
            Try the demo
          </a>
          <a
            href="/benchmark"
            className="text-sm font-medium text-muted underline underline-offset-4 transition hover:text-text"
          >
            See the proof
          </a>
        </div>
      </section>

      {/* 2 · how it works — exactly three steps, plain words */}
      <section className="border-t border-border">
        <div className="mx-auto w-full max-w-5xl px-6 py-16">
          <Label>How it works</Label>
          <div className="mt-8 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {STEPS.map((s) => (
              <div key={s.n}>
                <p className="font-mono text-xs text-muted-2">{s.n}</p>
                <h2 className="display mt-2 text-xl sm:text-2xl">{s.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3 · proof — real, verifiable numbers ONLY. The honesty floor is the brand:
          no invented users, no testimonials, no logo walls. */}
      <section className="border-t border-border">
        <div className="mx-auto w-full max-w-5xl px-6 py-16">
          <Label>Proof — real numbers only</Label>
          <div className="mt-8 grid gap-10 sm:grid-cols-2 sm:gap-12">
            <div>
              <h2 className="display text-xl sm:text-2xl">Proven in simulation</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                The governed company is stress-tested live on every visit to the benchmark page: grounded
                answers, tenant isolation, honest abstention, six failure drills, and the safety gate —
                every number computed on page load and clearly labeled simulation, never passed off as
                customers.
              </p>
              <a
                href="/benchmark"
                className="mt-4 inline-block font-mono text-xs font-medium underline underline-offset-4 transition hover:text-muted"
              >
                Run the live benchmark — numbers + methodology
              </a>
            </div>
            <div>
              {/* HONESTY FLOOR: this figure changes ONLY when real, settled receipts exist.
                  Never seed it, never round it up, never mix simulation into it. */}
              <p className="display text-5xl sm:text-6xl">$0</p>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Settled revenue to date. That is the real number, and we show it until receipts exist —
                this company never fakes proof. No invented users, no testimonials we did not earn, no
                logo walls.
              </p>
              <p className="mt-3 font-mono text-[11px] leading-relaxed text-muted-2">
                Methodology: settled = cash received and not refunded, counted from real payment receipts
                only. Simulated results never count toward this number.
              </p>
            </div>
          </div>
        </div>
        {/* the live surfaces the company runs on itself — every pill a real route */}
        <ProductMarquee />
      </section>

      {/* 4 · the honest comparison — category framing, no name-bashing */}
      <section className="border-t border-border">
        <div className="mx-auto w-full max-w-5xl px-6 py-16">
          <Label>The honest comparison</Label>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted">
            Agent platforms today govern <span className="font-semibold text-text">spend and process</span>.
            That matters, and we run all of it too. What we have not seen anyone else govern:{" "}
            <span className="font-semibold text-text">truth and outcome</span>.
          </p>
          <div className="mt-8 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2">
            <div className="bg-bg p-6">
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-muted-2">
                The category governs
              </p>
              <h2 className="display mt-2 text-lg">Spend + process</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Budgets, caps, approval queues, kill switches. Necessary — ours are on by default.
              </p>
            </div>
            <div className="bg-bg p-6">
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-muted-2">
                We also govern
              </p>
              <h2 className="display mt-2 text-lg">Truth + outcome</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Validate before build — the org tests demand first and will tell you &quot;don&apos;t
                build it.&quot; Verify after ship — every action is hash-chained to the ledger, and every
                public number traces to a receipt or is labeled simulation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5 · footer — the badge (the growth lever, honest attribution) + the real routes */}
      <footer className="border-t border-border">
        <div className="mx-auto w-full max-w-5xl px-6 py-12">
          <div className="flex flex-wrap items-center gap-4">
            {/* the same pill lib/core/badge.ts injects into every product the company ships */}
            <span className="inline-flex items-center bg-coral px-3.5 py-2 font-mono text-xs font-semibold text-white">
              Built with competitor<span className="opacity-70">.inc</span>
            </span>
            <p className="text-xs leading-relaxed text-muted-2">
              Every product the company ships carries this badge — honest attribution that links home.
            </p>
          </div>
          <nav className="mt-8 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs text-muted">
            <a href="/connect" className="transition hover:text-text">Connect</a>
            <a href="/services" className="transition hover:text-text">Services</a>
            <a href="/benchmark" className="transition hover:text-text">Benchmark</a>
            <a href="/org" className="transition hover:text-text">The Org</a>
            <a href="/notices" className="transition hover:text-text">Third-party notices</a>
          </nav>
          <p className="mt-6 text-[11px] text-muted-2">
            competitor.inc — an autonomous AI software company, governed by a human.
          </p>
        </div>
      </footer>
    </main>
  );
}
