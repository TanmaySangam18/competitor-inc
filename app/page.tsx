import type { Metadata } from "next";
import FlowDiagram from "@/components/FlowDiagram";
import FounderSection from "@/components/FounderSection";
import ProductMarquee from "@/components/ProductMarquee";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SlackThreadMock from "@/components/SlackThreadMock";
import { runFailureDrills, readiness } from "@/lib/core";
import { liveCta } from "@/lib/core/slack-invite";
import { DEPARTMENTS, ROLES, orgSize, getRole } from "@/lib/org/organization";

// THE LANDING (/) — the Viktor-structure marketing layer (ADR-0008, restructures ADR-0006's five
// sections; the honesty floor carries over UNCHANGED). One promise per section, one CTA repeated,
// counted proof: hero → proof strip → three steps → the flow drawn → the workforce → Competitor Live
// in Slack → receipts → the honest comparison → FAQ → final CTA → footer. Monochrome dark canvas
// (ADR-0016: charcoal / light ink / hairlines / mono labels / heavy display / square inversion
// buttons — token classes only). No invented numbers, users,
// logos, or testimonials ([[crack-audit-and-no-fake-proof]]): every count on this page is either
// COMPUTED at render from the same code the tests enforce (drills, safety gate, org size) or is the
// radical-honesty figure ($0 settled revenue). Simulation results are always labeled as simulation.

export const metadata: Metadata = {
  title: "competitor.inc · an AI software company that runs itself",
  description:
    "Connect your accounts once. A governed AI organization validates, builds, deploys, runs, and sells — you oversee the work and sign the rare decision that needs a human. Every claim is verifiable.",
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
      "Your accounts, your keys, your ownership. The company runs on accounts you control — bring your own keys — so everything it builds and earns is yours.",
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
      "Every action lands on a tamper-evident, hash-chained ledger. Every claim carries a receipt — or it is labeled simulation and never counted as real.",
  },
];

const FAQ = [
  {
    q: "Is it free to start?",
    a: "Yes. The demo and the whole showcase are free — no card. You pay only when you put the company to work on paid tiers, and payments are currently paused while the platform proof hardens.",
  },
  {
    q: "Whose keys and accounts does it run on?",
    a: "Yours. BYOK — the org runs on your model keys, your GitHub, your hosting, your payment account. Everything it builds and earns belongs to you, and you can revoke any key at any time.",
  },
  {
    q: "What can it actually do today?",
    a: "Exactly what the benchmark page passes, live: grounded answers, tenant isolation, honest abstention, the failure drills, and the safety gate — proven in simulation. We claim nothing beyond what the machine passes.",
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

export default async function Landing() {
  // Computed proof — the same functions /benchmark runs, executed at render. Never hardcoded.
  const drills = await runFailureDrills();
  const dod = await readiness();
  const cta = liveCta();

  const root = ROLES.find((r) => r.reportsTo === null)!;
  const departments = DEPARTMENTS.map((d) => ({
    ...d,
    head: getRole(d.headRoleId)?.title ?? "—",
    count: ROLES.filter((r) => r.department === d.id).length,
  }));

  return (
    <main id="main" className="min-h-[100dvh] bg-bg text-text">
      <SiteHeader />

      {/* 1 · hero — one big promise, one CTA, one honest trust line */}
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
          <a href="/dashboard" className={BTN_PRIMARY}>
            Start free
          </a>
          <a
            href="/benchmark"
            className="text-sm font-medium text-muted underline underline-offset-4 transition hover:text-text"
          >
            See the proof
          </a>
        </div>
        <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-2">
          Free to start · Bring your own keys · Everything it builds and earns is yours
        </p>
      </section>

      {/* 2 · proof strip — counted, computed, labeled. The honesty floor is the brand. */}
      <section className="border-t border-border">
        <div className="mx-auto w-full max-w-5xl px-6 py-10">
          <div className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-3">
            <div className="bg-bg p-6">
              <p className="display text-4xl sm:text-5xl">
                {drills.passed}/{drills.total}
              </p>
              <p className="mt-2 text-sm text-muted">failure drills survived</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-2">
                proven in simulation · computed at render
              </p>
            </div>
            <div className="bg-bg p-6">
              <p className="display text-4xl sm:text-5xl">
                {dod.passed}/{dod.checks.length}
              </p>
              <p className="mt-2 text-sm text-muted">safety-gate checks pass</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-2">
                definition of done · computed at render
              </p>
            </div>
            <div className="bg-bg p-6">
              {/* HONESTY FLOOR: this figure changes ONLY when real, settled receipts exist.
                  Never seed it, never round it up, never mix simulation into it. */}
              <p className="display text-4xl sm:text-5xl">$0</p>
              <p className="mt-2 text-sm text-muted">settled revenue — the real number, shown proudly</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-2">
                settled = cash received, not refunded
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted-2">
            The drill and gate numbers run from the same code the test suite enforces — rerun them live,
            with methodology, on{" "}
            <a href="/benchmark" className="underline underline-offset-2 transition hover:text-text">
              the benchmark page
            </a>
            . Simulated results are always labeled simulation and never counted as customers or revenue.
          </p>
        </div>
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

      {/* 3.5 · the flow, drawn — the same three steps as a sequence diagram (ADR-0016). Every label
          verified against the codebase; the role count is computed, never typed. */}
      <section className="border-t border-border">
        <div className="mx-auto w-full max-w-5xl px-6 py-16">
          <Label>The flow, drawn</Label>
          <div className="mt-8">
            <FlowDiagram />
          </div>
        </div>
      </section>

      {/* 4 · the workforce — real org, real names, derived counts (lib/org/organization.ts) */}
      <section className="border-t border-border">
        <div className="mx-auto w-full max-w-5xl px-6 py-16">
          <Label>Meet the workforce</Label>
          <h2 className="display mt-6 text-2xl sm:text-4xl">
            {orgSize()} AI employees. {departments.length} departments. One human signature.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
            This is the real org chart, rendered from the same role model the engine runs — it cannot
            show an agent that doesn&apos;t exist or hide one that does. Agents prepare everything; the
            human signs money, contracts, and launches.
          </p>

          {/* compact teaser: the human → the root → the departments */}
          <div className="mt-10">
            <div className="flex flex-col items-center">
              <div className="border border-text px-5 py-3 text-center">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">The only human</p>
                <p className="display mt-1 text-base">The Founder</p>
              </div>
              <div aria-hidden="true" className="h-6 w-px bg-border" />
              <div className="border border-border px-5 py-3 text-center">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">Reports to the human</p>
                <p className="display mt-1 text-base">{root.title}</p>
              </div>
              <div aria-hidden="true" className="h-6 w-px bg-border" />
            </div>
            <div className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-4">
              {departments.map((d) => (
                <a key={d.id} href={`/org#${d.id}`} className="group bg-bg p-4 transition hover:bg-surface-2">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-2">
                    {d.count} {d.count === 1 ? "role" : "roles"}
                  </p>
                  <p className="display mt-1.5 text-sm leading-snug">{d.name}</p>
                  <p className="mt-1 text-[11px] leading-snug text-muted">led by {d.head}</p>
                </a>
              ))}
            </div>
          </div>

          <a href="/org" className={`mt-8 ${BTN_SECONDARY}`}>
            See the whole workforce
          </a>
        </div>
      </section>

      {/* 5 · Competitor Live — the operational experience lives in Slack, and it works while you sleep */}
      <section className="border-t border-border">
        <div className="mx-auto grid w-full max-w-5xl gap-10 px-6 py-16 lg:grid-cols-2 lg:gap-14">
          <div>
            <Label>Competitor Live · in Slack</Label>
            <h2 className="display mt-6 text-2xl sm:text-4xl">
              The company runs 24/7 in Slack. Watch it work, live.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
              No new app to learn. The org deliberates in channels while you sleep — engineering reviews
              in #engineering, decisions queued in #decisions — and @-mentions you exactly when a human
              signature is required. The website is the showcase; the office is Slack.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <a
                href={cta.href}
                className={BTN_PRIMARY}
                {...(cta.live ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {cta.label}
              </a>
              <a
                href="/live"
                className="text-sm font-medium text-muted underline underline-offset-4 transition hover:text-text"
              >
                What you&apos;ll see inside
              </a>
            </div>
            {!cta.live && (
              <p className="mt-4 font-mono text-[11px] leading-relaxed text-muted-2">
                The workspace opens soon — the waitlist gets the first invites. No dead links, no fake doors.
              </p>
            )}
          </div>
          <SlackThreadMock />
        </div>
      </section>

      {/* 6 · the receipts — every drill a case, computed at render, labeled simulation */}
      <section className="border-t border-border">
        <div className="mx-auto w-full max-w-5xl px-6 py-16">
          <Label>The receipts — proven in simulation</Label>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted">
            No customer case studies exist yet, so we don&apos;t invent any. These are the cases we can
            prove: {drills.total} failure drills run against the governed company — each one a disaster
            scenario it must survive. Three of them below, computed at render from the same code the
            test suite enforces; the full set runs live on the benchmark page.
          </p>
          {/* ADR-0009: a TEASER, not the full set — /benchmark is the proof surface; this section links there. */}
          <div className="mt-8 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {drills.drills.slice(0, 3).map((d) => (
              <div key={d.name} className="bg-bg p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-2">
                  {d.passed ? "survived" : "failed"} · simulation
                </p>
                <h3 className="display mt-2 text-base">{d.name}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted">{d.detail}</p>
              </div>
            ))}
          </div>
          <a
            href="/benchmark"
            className="mt-6 inline-block font-mono text-xs font-medium underline underline-offset-4 transition hover:text-muted"
          >
            Run the full benchmark live — numbers + methodology
          </a>
        </div>
        {/* the live surfaces the company runs on itself — every pill a real route */}
        <ProductMarquee />
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
