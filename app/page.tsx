import type { Metadata } from "next";
import FounderSection from "@/components/FounderSection";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { liveCta } from "@/lib/core/slack-invite";
import { orgSize } from "@/lib/org/organization";
import { coverageReport } from "@/lib/org/coverage";
import { totalStudentActs } from "@/lib/core/campus";

// THE LANDING (/) — the Viktor-structure marketing layer (ADR-0008, restructures ADR-0006's five
// sections; the honesty floor carries over UNCHANGED). One promise per section, one CTA repeated,
// SIMPLIFIED 2026-08-19 (founder: "keep the honesty, cut the explanation. One promise, one proof, one
// button above the fold; move the ledger and the drills to /proof"). Nine sections became five:
// hero (one promise + the ONE proof that matters + one button) → three steps → the honest comparison →
// FAQ → final CTA. The four cut sections each moved to the page that already owned them: the workforce
// to /org, Competitor Live to /live, and the drills + safety gate + the three-number strip to
// /benchmark (which /proof redirects to). Nothing was deleted, it was relocated to where a reader who
// ASKS will find it, which is the point: the storefront sells, the proof surface proves. Monochrome dark canvas
// (ADR-0016: charcoal / light ink / hairlines / mono labels / heavy display / square inversion
// buttons — token classes only). No invented numbers, users,
// logos, or testimonials ([[crack-audit-and-no-fake-proof]]): every count on this page is either
// COMPUTED at render from the same code the tests enforce (drills, safety gate, org size) or is the
// radical-honesty figure ($0 settled revenue). Simulation results are always labeled as simulation.

export const metadata: Metadata = {
  title: "competitor.inc · an AI software company your students can run",
  description:
    "A campus licence gives every student a governed AI organization that plans, builds, deploys and operates real software. The university authorises the accounts once. Students connect nothing. Every action lands on a tamper-evident ledger, and every claim is verifiable.",
};

// The mono eyebrow label — the section marker of the brutalist system.
function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-muted-2">{children}</p>
  );
}

// Square inversion-hover buttons — the system's only two button styles.
const BTN_PRIMARY =
  "inline-block border border-text bg-text px-7 py-3.5 text-sm font-semibold text-bg transition hover:bg-bg hover:text-text";
const BTN_SECONDARY =
  "inline-block border border-border px-7 py-3.5 text-sm font-semibold text-text transition hover:border-text hover:bg-text hover:text-bg";

// Exactly three steps, plain words (kept from ADR-0006 — the role count derives from the org model).
const STEPS = [
  {
    n: "01",
    title: "Connect",
    body:
      "Your accounts, your keys, your ownership. The company runs on accounts you control, with your own keys, so everything it builds and earns is yours.",
  },
  {
    n: "02",
    title: "The org runs",
    body:
      `${orgSize()} roles plan, build, test, ship, and support in continuous loops. You are tagged only for the decisions that need a human: money, contracts, launches.`,
  },
  {
    n: "03",
    title: "Verify everything",
    body:
      "Every action lands on a tamper-evident, hash-chained ledger. Every claim carries a receipt, or it is labeled simulation and never counted as real.",
  },
];

const FAQ = [
  {
    q: "Is it free to start?",
    a: "Yes. The demo and the whole showcase are free, no card. You pay only when you put the company to work on paid tiers, and payments are currently paused while the platform proof hardens.",
  },
  {
    q: "Whose keys and accounts does it run on?",
    a: "Yours. With BYOK, the org runs on your model keys, your GitHub, your hosting, your payment account. Everything it builds and earns belongs to you, and you can revoke any key at any time.",
  },
  {
    q: "What can it actually do today?",
    a: "Exactly what the benchmark page passes, live: grounded answers, tenant isolation, honest abstention, the failure drills, and the safety gate, proven in simulation. We claim nothing beyond what the machine passes.",
  },
  {
    q: "Is anything on this site made up?",
    a: "No. Counts are computed from the same code the test suite enforces, simulation results are labeled simulation, and the revenue figure is the real one: $0 settled. No invented users, logos, or testimonials.",
  },
  {
    q: "Who is in control?",
    a: "One human. Agents prepare; the human signs money, contracts, launches, and deletions. An out-of-band kill switch stops everything instantly, and an independent Auditor reports to the human alone.",
  },
];

export default function Landing() {
  // Computed proof — the same functions /benchmark runs, executed at render. Never hardcoded.
  // The coverage ledger is the strongest single number we own and the only published one in the
  // category, so it earns the hero slot that three weaker numbers used to share.
  const cov = coverageReport();
  const studentActs = totalStudentActs(); // real count from the vendor inventory, never hardcoded
  const cta = liveCta(); // never renders a dead link: falls back to the waitlist when Slack is unset

  return (
    <main id="main" className="min-h-[100dvh] bg-bg text-text">
      <SiteHeader />

      {/* 1 · hero — ONE promise, ONE proof, ONE button. Everything else is below or on /proof. */}
      <section className="mx-auto flex min-h-[78dvh] w-full max-w-5xl flex-col justify-center px-6 py-20">
        <Label>The whole pitch, in one breath</Label>
        <h1 className="display mt-6 text-4xl leading-[1.02] sm:text-6xl lg:text-7xl">
          An AI software company that runs itself.
          <br />
          <span className="text-muted">Governed by one human: you.</span>
        </h1>

        {/* THE ONE PROOF. Computed at render from lib/org/coverage.ts, function by function, and the
            only figure of its kind published in this category. It replaces three weaker numbers. */}
        <div className="mt-10 border-l-2 border-text pl-6">
          <p className="display text-5xl sm:text-6xl">{cov.coverageOfAutomatableWork}%</p>
          <p className="mt-2 max-w-xl text-base leading-relaxed text-muted">
            of the automatable work of running a software company runs here unattended. The{" "}
            {cov.uncovered} things that do not are named, not hidden.
          </p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-2">
            counted from {cov.total} company functions · computed at render · {cov.humanOnly} stay human by design
          </p>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-6">
          <a href="/dashboard" className={BTN_PRIMARY}>
            Start free
          </a>
          <a
            href="/proof"
            className="text-sm font-medium text-muted underline underline-offset-4 transition hover:text-text"
          >
            See the whole ledger
          </a>
        </div>
        <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-2">
          $0 settled revenue · zero customers · every number on this site is real or labeled simulation
        </p>
      </section>

      {/* 3 · how it works — exactly three steps, plain words. id="how" is a REDIRECT TARGET:
          the killed /how-it-works page 308s to /#how (ADR-0009) — keep the anchor. */}
      <section id="how" className="border-t border-border">
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

      {/* 4 · WHO IT IS FOR — added 2026-08-22. The site previously never once said the words
          "university", "campus" or "student", so an intelligent reader could study the whole page and
          conclude the customer was a solo SaaS founder. That is not a copy nit, it is the top of the
          funnel arguing against the GTM. Every number here is COMPUTED (the student's real act count
          comes from lib/core/campus.ts), and it deliberately claims NO campus: zero are signed, and
          saying otherwise would break the one rule this whole company is built on. */}
      <section id="who" className="border-t border-border">
        <div className="mx-auto w-full max-w-5xl px-6 py-16">
          <Label>Who this is built for</Label>
          <div className="mt-8 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2">
            <div className="bg-bg p-6">
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-muted-2">
                The university buys it
              </p>
              <h2 className="display mt-2 text-lg">One licence, a whole cohort</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                An administrator authorises the accounts once. Every student after that inherits them
                and connects nothing, so the {studentActs} setup steps a student would otherwise face
                become zero. Nothing here needs a service key pasted into a form.
              </p>
            </div>
            <div className="bg-bg p-6">
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-muted-2">
                The student uses it
              </p>
              <h2 className="display mt-2 text-lg">Sign in and start</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Describe what you want to build. A governed AI organization plans it, builds it, and
                asks you to approve the decisions that carry real consequences. The work, the code and
                anything it earns are yours.
              </p>
            </div>
          </div>
          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-2">
            no campus has signed yet · we will name the first one here when it does
          </p>
        </div>
      </section>

      {/* 7 · the honest comparison — category framing, no name-bashing */}
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
                Budgets, caps, approval queues, kill switches. Necessary, and ours are on by default.
              </p>
            </div>
            <div className="bg-bg p-6">
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-muted-2">
                We also govern
              </p>
              <h2 className="display mt-2 text-lg">Truth + outcome</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Validate before build: the org tests demand first and will tell you &quot;don&apos;t
                build it.&quot; Verify after ship: every action is hash-chained to the ledger, and every
                public number traces to a receipt or is labeled simulation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8 · FAQ — the questions people actually ask, answered plainly */}
      <section className="border-t border-border">
        <div className="mx-auto w-full max-w-5xl px-6 py-16">
          <Label>Questions, answered plainly</Label>
          <div className="mt-8 divide-y divide-border border-y border-border">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
                  <span className="display text-base sm:text-lg">{f.q}</span>
                  <span aria-hidden="true" className="font-mono text-lg text-muted-2 transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 9 · final CTA — one promise, one button, restated */}
      <section className="border-t border-border">
        <div className="mx-auto w-full max-w-5xl px-6 py-20 text-center">
          <h2 className="display text-3xl sm:text-5xl">
            One human. {orgSize()} AI employees.
            <br />
            <span className="text-muted">Yours to govern.</span>
          </h2>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
            <a href="/dashboard" className={BTN_PRIMARY}>
              Start free
            </a>
            <a
              href={cta.href}
              className={BTN_SECONDARY}
              {...(cta.live ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {cta.label}
            </a>
          </div>
          <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-2">
            Free to start · Bring your own keys · Every claim verifiable
          </p>
        </div>
      </section>

      <FounderSection />

      <SiteFooter />
    </main>
  );
}
