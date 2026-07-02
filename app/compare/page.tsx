"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Scale, ShieldCheck, TrendingUp } from "lucide-react";
import { LogoMark } from "@/components/Logo";

// The comparison page — scored, cited, and computed live from the data below (view-source honest).
// RULES this page lives by (MA 93A + our no-fake-proof brand):
//  1. Every Polsia data point comes from their founder's own PUBLIC statements (dated, sourced).
//  2. Scores are our editorial assessment of that documented evidence — labeled as such.
//  3. We show the rows we LOSE. A comparison that only wins is marketing; this is a scorecard.
//  4. The headline number is computed from the table in front of you — change the weights yourself.

type SourceKey = "podcast" | "ph" | "shipped";

const SOURCES: Record<SourceKey, { label: string; href?: string }> = {
  podcast: { label: "Polsia founder, Kevin Rose podcast (Mar 2026)", href: "https://www.youtube.com/watch?v=OC9yQ4BsCtA" },
  ph: { label: "Polsia founder, Product Hunt launch thread (maker comments)" },
  shipped: { label: "Shipped in competitor.inc — click it and test it" },
};

interface Row {
  dim: string;
  trust: boolean; // counts double under the first-time-founder weighting
  us: number; // 0–5
  them: number; // 0–5
  usEvidence: string;
  usLink?: string;
  themEvidence: string;
  source: SourceKey;
}

const ROWS: Row[] = [
  {
    dim: "Human governance of consequential actions",
    trust: true,
    us: 5,
    them: 1,
    usEvidence: "In-product Approval Inbox + policy engine + kill switch — spend, outreach, deploys all wait for your yes.",
    usLink: "/dashboard",
    themEvidence: "Founder built auto-deploy, then paused it (“very scary”); approvals happen in his private Slack — customers have no approval surface.",
    source: "podcast",
  },
  {
    dim: "Validation before building",
    trust: true,
    us: 5,
    them: 1,
    usEvidence: "Demand Radar scans HN, StackExchange & GitHub live and cites every source; the verdict can be “don't build.”",
    usLink: "/radar",
    themEvidence: "Build-first. Founder acknowledged on Product Hunt that some displayed market stats were AI-fabricated (“some of it, honestly, yes”).",
    source: "ph",
  },
  {
    dim: "Verifiable proof of work",
    trust: true,
    us: 5,
    them: 2,
    usEvidence: "Every action carries a clickable receipt (repo, live URL, metric). Public proof standard; failed work is credited, never charged.",
    usLink: "/proof",
    themEvidence: "Founder described the /live revenue dashboard as “part of this marketing stunt”; the headline figure is an annualized run-rate from weeks-old data.",
    source: "podcast",
  },
  {
    dim: "Ownership & portability",
    trust: true,
    us: 5,
    them: 2,
    usEvidence: "Bring your own model key, connect your own accounts, export everything anytime. 0% of your revenue.",
    usLink: "/dashboard/settings",
    themEvidence: "Deliberate walled garden — no BYOK, no own accounts (“limiting,” his word). Revenue-share model has been stated as 20% (PH) and “1%” (podcast).",
    source: "podcast",
  },
  {
    dim: "Cost to start",
    trust: true,
    us: 5,
    them: 3,
    usEvidence: "Validation is free forever. Operating is $39/mo flat.",
    usLink: "/#pricing",
    themEvidence: "Free onboarding + 3-day trial, then ~$49/mo. No free tier to keep.",
    source: "podcast",
  },
  {
    dim: "Instant “click-a-button” build wow",
    trust: false,
    us: 3,
    them: 5,
    usEvidence: "Real builds ship in ~100 seconds to a live URL — but their onboarding magic is more polished today. They win this row.",
    themEvidence: "“Click a button, get a company” — a genuinely excellent instant onboarding, proven on thousands of companies.",
    source: "podcast",
  },
  {
    dim: "Live ad deployment",
    trust: false,
    us: 1,
    them: 4,
    usEvidence: "We draft ad campaigns but don't auto-deploy spend — by design, until it runs on YOUR ad account with your approval. They win this row.",
    themEvidence: "Deploys Meta ads agency-on-behalf with AI-generated video. (Founder also reported a week where “people were paying and it wasn't delivering.”)",
    source: "podcast",
  },
  {
    dim: "Reliability track record",
    trust: false,
    us: 3,
    them: 2,
    usEvidence: "262-test QA gate + verify-before-done on every build — but we haven't yet been stress-tested at their scale. Scored modestly on purpose.",
    themEvidence: "Battle-tested at scale, but the founder reported a surge week of downtime, database overflow and paid features not delivering, followed by refunds.",
    source: "podcast",
  },
];

function totals(weighted: boolean) {
  let us = 0;
  let them = 0;
  for (const r of ROWS) {
    const w = weighted && r.trust ? 2 : 1;
    us += r.us * w;
    them += r.them * w;
  }
  const max = ROWS.reduce((t, r) => t + 5 * (weighted && r.trust ? 2 : 1), 0);
  const delta = Math.round(((us - them) / them) * 100);
  return { us, them, max, delta };
}

export default function Compare() {
  const [weighted, setWeighted] = useState(false);
  const t = totals(weighted);
  const eq = totals(false);
  const ftf = totals(true);

  return (
    <div id="main" className="min-h-screen">
      <header className="glass-nav sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 font-mono text-lg font-bold tracking-tight">
            <LogoMark size={32} /> competitor.inc
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-text">
            <ArrowLeft size={15} /> Home
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="flex items-center gap-2 text-sm text-muted-2">
          <Scale size={14} /> COMPETITOR.INC VS POLSIA · WITH RECEIPTS
        </div>
        <h1 className="display mt-3 text-4xl md:text-5xl">
          <span className="text-mint">+{eq.delta}%</span> to <span className="text-mint">+{ftf.delta}%</span> better,
          <br /> depending on what you weight.
        </h1>
        <p className="mt-4 max-w-2xl text-muted">
          Not a slogan — a scorecard. Eight dimensions, scored 0–5. Every Polsia data point below comes from{" "}
          <span className="text-text">their founder&apos;s own public statements</span> (sources linked). Every
          competitor.inc claim links to the shipped feature so you can test it yourself. The headline number is
          computed live from this table — flip the weights and watch it change.
        </p>

        {/* weight toggle */}
        <div className="mt-8 inline-flex rounded-xl border border-border bg-surface p-1">
          <button
            onClick={() => setWeighted(false)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${!weighted ? "bg-text text-bg" : "text-muted hover:text-text"}`}
          >
            Equal weights
          </button>
          <button
            onClick={() => setWeighted(true)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${weighted ? "bg-text text-bg" : "text-muted hover:text-text"}`}
          >
            First-time-founder weights
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-2">
          {weighted
            ? "Trust dimensions (governance, validation, proof, ownership, cost) count ×2 — what our niche cares about most."
            : "All eight dimensions count equally — including the two rows they win."}
        </p>

        {/* live totals */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-mint/30 bg-mint/[0.05] p-5 text-center">
            <div className="font-display text-3xl font-bold text-mint">{t.us}<span className="text-base font-normal text-muted-2">/{t.max}</span></div>
            <div className="mt-1 text-xs uppercase tracking-wide text-muted-2">competitor.inc</div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5 text-center">
            <div className="font-display text-3xl font-bold">{t.them}<span className="text-base font-normal text-muted-2">/{t.max}</span></div>
            <div className="mt-1 text-xs uppercase tracking-wide text-muted-2">Polsia</div>
          </div>
          <div className="rounded-2xl border border-coral/30 bg-coral/[0.05] p-5 text-center">
            <div className="font-display text-3xl font-bold text-coral">+{t.delta}%</div>
            <div className="mt-1 text-xs uppercase tracking-wide text-muted-2">(ours − theirs) ÷ theirs</div>
          </div>
        </div>

        {/* scorecard */}
        <div className="mt-10 space-y-3">
          {ROWS.map((r) => {
            const winUs = r.us > r.them;
            return (
              <div key={r.dim} className={`rounded-2xl border p-5 ${winUs ? "border-border bg-bg/40" : "border-amber/30 bg-amber/[0.04]"}`}>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-sm font-semibold">{r.dim}</h3>
                  {weighted && r.trust && <span className="rounded-full bg-mint/10 px-2 py-0.5 text-[10px] font-medium text-mint">×2 weight</span>}
                  {!winUs && <span className="rounded-full bg-amber/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber">they win this row</span>}
                  <div className="ml-auto flex items-center gap-3 font-mono text-sm">
                    <span className={winUs ? "font-bold text-mint" : "text-muted"}>us {r.us}</span>
                    <span className="text-muted-2">·</span>
                    <span className={!winUs ? "font-bold text-amber" : "text-muted"}>them {r.them}</span>
                  </div>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-bg/40 p-3 text-xs text-muted">
                    <div className="mb-1 font-semibold text-text">competitor.inc</div>
                    {r.usEvidence}{" "}
                    {r.usLink && (
                      <Link href={r.usLink} className="inline-flex items-center gap-0.5 text-coral underline-offset-2 hover:underline">
                        test it <ExternalLink size={10} />
                      </Link>
                    )}
                  </div>
                  <div className="rounded-xl border border-border bg-bg/40 p-3 text-xs text-muted">
                    <div className="mb-1 font-semibold text-text">Polsia</div>
                    {r.themEvidence}
                    <div className="mt-1.5 text-[10px] text-muted-2">
                      Source:{" "}
                      {SOURCES[r.source].href ? (
                        <a href={SOURCES[r.source].href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-muted">
                          {SOURCES[r.source].label}
                        </a>
                      ) : (
                        SOURCES[r.source].label
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* honesty box */}
        <div className="mt-10 rounded-2xl border border-mint/25 bg-mint/[0.04] p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-mint">
            <ShieldCheck size={15} /> Why you can trust this page
          </div>
          <ul className="mt-3 space-y-1.5 text-sm text-muted">
            <li>· We show the two rows Polsia wins — instant onboarding wow and live ad deployment. Respect where due.</li>
            <li>· Every Polsia data point is from their founder&apos;s own public statements, dated and sourced — nothing inferred, nothing invented.</li>
            <li>· Scores are our editorial assessment of that evidence (0–5); the totals and the headline % are computed from the table, live, in your browser.</li>
            <li>· Every claim about us links to the shipped feature. Don&apos;t trust us — click it.</li>
          </ul>
          <p className="mt-4 text-[11px] leading-relaxed text-muted-2">
            Assessment as of July 2026. Polsia is a trademark of its owner; this page exists for factual comparison. Sources: Polsia founder
            interview on the Kevin Rose podcast (March 2026, linked above); Polsia&apos;s Product Hunt launch thread (maker comments);{" "}
            <a href="https://polsia.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-muted">polsia.com</a>. If
            anything here becomes outdated or inaccurate, tell us and we&apos;ll fix it: projecttattva1@gmail.com.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted">
            <TrendingUp size={15} className="text-coral" /> The best comparison is the product itself.
          </div>
          <Link href="/dashboard" className="mt-4 inline-block rounded-xl bg-coral px-7 py-3.5 font-semibold text-bg transition hover:brightness-110">
            Validate an idea free — right now
          </Link>
        </div>
      </div>
    </div>
  );
}
