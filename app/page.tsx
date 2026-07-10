"use client";

// The landing — "The Company Ledger" (2026-07-10, plan: temporal-honking-cosmos.md).
// A beautifully printed company charter: cream stock, ink rules, serif headlines, letterpress cards,
// and REAL stamped receipts (live, design-reviewed builds anyone can click). No gradients, no glass,
// no AI-cliché — the design is human-grade; the copy stays honest about what runs the company (the
// one AI disclosure line lives in the footer). Mechanisms preserved verbatim from the previous
// landing: first-party demo events, signup attribution, the keyless inline validation demo.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SecretHouseDoor } from "@/components/SecretHouseDoor";
import { useAuth } from "@/lib/engine/useAuth";
import { getProvider } from "@/lib/engine/provider";
import type { ValidationResult } from "@/lib/engine/types";
import TrackBeacon from "@/components/TrackBeacon";

// First-party measurement (unchanged): demo starts, time-to-first-interaction, verdicts, CTA intent.
function fireDemoEvent(type: "demo_start" | "demo_verdict" | "demo_cta", extra: string) {
  try {
    const payload = JSON.stringify({ slug: "home", type, source: extra.slice(0, 60) });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([payload], { type: "application/json" }));
    } else {
      void fetch("/api/track", { method: "POST", headers: { "content-type": "application/json" }, body: payload, keepalive: true });
    }
  } catch {
    /* measurement must never break the page */
  }
}

// CTA clicks fire intent AND mark the referral so a completed signup attributes back to the landing
// (components/SignupAttribution.tsx reads the marker). Unchanged.
function onLandingCta(source: string) {
  fireDemoEvent("demo_cta", source);
  try { localStorage.setItem("cofounder:ref", "home"); } catch { /* ignore */ }
}

const SAMPLE_IDEAS = ["a booking page for my tutoring business", "a campus meal-prep service", "a niche newsletter for machinists"];

// THE RECEIPTS — real builds by the company, live right now, with the design review that shipped them.
// These are verified at implementation time (curl 200) and must never point at a dead deploy.
const RECEIPTS = [
  {
    title: "Campus tutoring marketplace",
    url: "https://a-campus-tutoring-marketplace-post-lac.vercel.app",
    host: "post-lac.vercel.app",
    review: "design review — “enforce spacing rhythm, weight budget, a11y states”",
  },
  {
    title: "Same brief, second run — the bar held",
    url: "https://a-campus-tutoring-marketplace-post-two.vercel.app",
    host: "post-two.vercel.app",
    review: "design review — “single accent color, 8px spacing, mobile-first form”",
  },
];

const STEPS = [
  { n: "1", title: "Describe it", body: "One sentence. Demand gets tested first — weak ideas get told, not built." },
  { n: "2", title: "It gets built", body: "Engineered, design-reviewed, deployed — verified live before you see a link." },
  { n: "3", title: "It keeps running", body: "Support, growth, upkeep — overnight, under rules you signed once." },
];

const serif = { fontFamily: "var(--font-serif), Georgia, serif" } as const;

export default function LandingPage() {
  const { user, ready } = useAuth();
  const appHref = user ? "/dashboard" : "/signup";

  const [idea, setIdea] = useState("");
  const [running, setRunning] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const [verdict, setVerdict] = useState<ValidationResult | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const mountTs = useRef(Date.now());
  const firedStart = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null); // "Try another idea" refocuses the box

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // The inline demo (unchanged mechanism): real model-backed validation server-side, deterministic
  // keyless fallback on any failure — instant, honest, no signup wall before the aha.
  async function runDemo(raw?: string) {
    const text = (raw ?? idea).trim();
    if (!text) return;
    if (raw) setIdea(raw);
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setLines([]);
    setVerdict(null);
    setRunning(true);

    if (!firedStart.current) {
      firedStart.current = true;
      fireDemoEvent("demo_start", `tti:${Math.min(999, Math.round((Date.now() - mountTs.current) / 1000))}s`);
    }

    let v: ValidationResult;
    try {
      const res = await fetch("/api/engine", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "validate", idea: text }),
      });
      const d = (await res.json().catch(() => ({}))) as { validation?: ValidationResult };
      v = d?.validation ?? getProvider().validate(text);
    } catch {
      v = getProvider().validate(text);
    }

    const rows = v.experiments.slice(0, 4).map((x) => `${x.label} — ${x.metric} (${x.signal})`);
    rows.forEach((line, i) => {
      timers.current.push(setTimeout(() => setLines((prev) => [...prev, line]), 450 * (i + 1)));
    });
    timers.current.push(
      setTimeout(() => {
        setVerdict(v);
        setRunning(false);
        fireDemoEvent("demo_verdict", `verdict:${v.verdict}/conf:${v.confidence}`);
      }, 450 * (rows.length + 1))
    );
  }

  const verdictLabel = verdict?.verdict === "strong" ? "worth building" : verdict?.verdict === "weak" ? "don’t build this" : "needs a tweak";

  return (
    <main id="main" className="min-h-screen bg-cream text-ink">
      <TrackBeacon slug="home" />

      {/* ── Nav: the wordmark (with the quiet door), sign in, one CTA ── */}
      <header className="border-b-[1.5px] border-ink bg-cream">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <SecretHouseDoor>
            <span className="cursor-default select-none text-[17px] font-semibold" style={serif}>
              competitor<span className="text-sienna">.inc</span>
            </span>
          </SecretHouseDoor>
          <nav className="flex items-center gap-5">
            {ready && !user && (
              <Link href="/login" className="text-[13px] text-ink-muted transition hover:text-ink">Sign in</Link>
            )}
            <Link
              href={appHref}
              onClick={() => onLandingCta("nav")}
              className="rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-cream transition hover:opacity-90"
            >
              Start your company
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero: the charter statement + the one input ── */}
      <section className="mx-auto max-w-3xl px-5 pb-14 pt-16">
        <p className="font-mono text-[11px] font-semibold tracking-[0.14em] text-sienna">A WORKING SOFTWARE COMPANY, ON DEMAND</p>
        <h1 className="mt-4 text-[40px] font-medium leading-[1.08] sm:text-[46px]" style={serif}>
          Describe the software.
          <br />
          <em className="font-normal">A company</em> builds it.
        </h1>
        <p className="mt-5 max-w-[480px] text-base leading-relaxed text-ink-muted">
          Engineers, a design lead, quality, support — a real organization that tests your idea, ships to a
          live URL, and runs what it shipped. You approve anything that matters.
        </p>

        <div className="press mt-7 flex max-w-[520px] items-center gap-2 rounded-2xl bg-cream-2 p-1.5 pl-4">
          <input
            ref={inputRef}
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runDemo()}
            placeholder="A booking page for my tutoring business…"
            aria-label="Describe your software idea"
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink-faint"
          />
          <button
            onClick={() => runDemo()}
            disabled={!idea.trim() || running}
            className="shrink-0 rounded-xl bg-pine px-4 py-2.5 text-[13px] font-semibold text-cream transition hover:brightness-110 disabled:opacity-40"
          >
            {running ? "Working…" : "Put it to work"}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {SAMPLE_IDEAS.map((s) => (
            <button
              key={s}
              onClick={() => runDemo(s)}
              className="rounded-full border border-rule bg-cream-2 px-3 py-1 text-xs text-ink-muted transition hover:border-ink hover:text-ink"
            >
              {s}
            </button>
          ))}
        </div>
        <p className="mt-4 text-[12.5px] italic text-ink-faint" style={serif}>
          Free to try — and it will tell you honestly if your idea isn’t worth building.
        </p>

        {/* The demand read — quiet ledger rows, not a terminal. Appears only once a demo runs. */}
        {(lines.length > 0 || verdict || running) && (
          <div className="press mt-6 max-w-[520px] rounded-2xl bg-cream-2 px-5 py-4">
            <p className="font-mono text-[10px] font-semibold tracking-[0.14em] text-sienna">THE DEMAND READ</p>
            <div className="mt-2">
              {lines.map((l, i) => (
                <p key={i} className="reveal border-t border-rule py-2 font-mono text-[11.5px] leading-relaxed text-ink-muted first:border-t-0">
                  {l}
                </p>
              ))}
              {running && lines.length === 0 && <p className="py-2 text-xs text-ink-faint">Reading real demand…</p>}
            </div>
            {verdict && (
              <div className="reveal mt-2 flex flex-wrap items-center justify-between gap-3 border-t-[1.5px] border-ink pt-3">
                <span className="text-sm font-semibold">
                  Verdict: {verdictLabel} <span className="font-normal text-ink-muted">· {verdict.confidence}% confidence</span>
                </span>
                {/* The CTA agrees with the verdict (defect 2026-07-10): after an honest "don't build",
                    trying another idea is the PRIMARY action; building anyway stays possible but quiet.
                    Saying "don't" and shouting "build!" in the same breath is the money-printer voice. */}
                {verdict.verdict === "weak" ? (
                  <span className="flex flex-wrap items-center gap-2">
                    <Link
                      href={appHref}
                      onClick={() => onLandingCta("demo-override")}
                      className="rounded-xl border-[1.5px] border-ink/40 px-4 py-2 text-[13px] font-medium text-ink-muted transition hover:border-ink hover:text-ink"
                    >
                      Build it anyway
                    </Link>
                    <button
                      onClick={() => { setVerdict(null); setLines([]); setIdea(""); inputRef.current?.focus(); }}
                      className="rounded-xl bg-pine px-4 py-2 text-[13px] font-semibold text-cream transition hover:brightness-110"
                    >
                      Try another idea
                    </button>
                  </span>
                ) : (
                  <Link
                    href={appHref}
                    onClick={() => onLandingCta("demo")}
                    className="rounded-xl bg-pine px-4 py-2 text-[13px] font-semibold text-cream transition hover:brightness-110"
                  >
                    Build it for real
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── The receipts: real builds, live now, with the review that shipped them ── */}
      <section className="border-t-[1.5px] border-ink bg-cream-2">
        <div className="mx-auto max-w-3xl px-5 py-12">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-2xl font-medium" style={serif}>The receipts</h2>
            <p className="text-[12.5px] text-ink-muted">Real builds, live right now. Click them — we insist.</p>
          </div>
          <div className="mt-5">
            {RECEIPTS.map((r, i) => (
              <div
                key={r.host}
                className={`flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-rule px-1 py-4 ${i === RECEIPTS.length - 1 ? "border-b" : ""}`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{r.title}</p>
                  <p className="mt-1 font-mono text-[11px] leading-relaxed text-ink-muted">{r.review}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-[11.5px] text-pine underline decoration-dotted underline-offset-4 transition hover:decoration-solid"
                  >
                    {r.host} ↗
                  </a>
                  <span className="stamp">VERIFIED · LIVE</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it runs + the governance, in full ── */}
      <section className="mx-auto max-w-3xl px-5 py-14">
        <div className="grid gap-8 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n}>
              <p className="text-3xl text-sienna" style={serif}>{s.n}</p>
              <p className="mb-1 mt-1.5 text-sm font-semibold">{s.title}</p>
              <p className="text-[13px] leading-relaxed text-ink-muted">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="press mt-10 rounded-2xl bg-cream px-6 py-5">
          <p className="font-mono text-[10px] font-semibold tracking-[0.14em] text-sienna">THE GOVERNANCE, IN FULL</p>
          <div className="mt-2.5 flex flex-wrap gap-x-7 gap-y-1.5 text-[13px]">
            <span><strong>One signature</strong> governs everything</span>
            <span><strong>Money &amp; contracts</strong> always come to you</span>
            <span><strong>One tap</strong> stops it all</span>
          </div>
        </div>
        <div className="mt-10 text-center">
          <Link
            href={appHref}
            onClick={() => onLandingCta("footer")}
            className="inline-block rounded-full bg-ink px-6 py-3 text-sm font-medium text-cream transition hover:opacity-90"
          >
            Start your company — free
          </Link>
        </div>
      </section>

      {/* ── Footer: the honest line + the depth pages ── */}
      <footer className="border-t-[1.5px] border-ink">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-5 py-6">
          <p className="text-[11.5px] italic text-ink-faint" style={serif}>
            Operated by AI employees under human governance — every claim above is verifiable.
          </p>
          <nav className="flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-ink-faint">
            <Link href="/how-it-works" className="transition hover:text-ink">How it works</Link>
            <Link href="/dashboard" className="transition hover:text-ink">Dashboard</Link>
            <Link href="/playbooks" className="transition hover:text-ink">Playbooks</Link>
            <Link href="/compare" className="transition hover:text-ink">Compare</Link>
            <Link href="/blog" className="transition hover:text-ink">Blog</Link>
            <Link href="/terms" className="transition hover:text-ink">Terms</Link>
            <Link href="/privacy" className="transition hover:text-ink">Privacy</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
