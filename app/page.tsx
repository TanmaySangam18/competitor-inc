"use client";

// The landing page — attention-first (docs/PLAYBOOK-attention-first-landing.md).
// One sentence, one input, one LIVE demo above the fold: the hero runs the real simulated engine
// (deterministic, keyless, $0) so the visitor watches a validation happen before any signup.
// Below: a bento grid of glanceable proofs — every box ≤ a dozen words. Ink on cream, liquid glass,
// no color except meaning. Depth pages (how-it-works, playbooks, compare) live in the footer.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SecretHouseDoor } from "@/components/SecretHouseDoor";
import { SlackMark, TelegramMark } from "@/components/ChatOpsLogos";
import { useAuth } from "@/lib/engine/useAuth";
import { getProvider } from "@/lib/engine/provider";
import type { ValidationResult } from "@/lib/engine/types";
import TrackBeacon from "@/components/TrackBeacon";

// Playbook triggers (docs/PLAYBOOK-attention-first-landing.md): measure demo starts,
// time-to-first-interaction, and verdicts — not just views. First-party pixel, reserved slug.
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

// Clicking a landing CTA fires the demo_cta intent event AND marks the referral, so the completed
// signup can be attributed back to the landing (see components/SignupAttribution.tsx). Fires once
// per completion; a returning sign-in (no marker) is never counted as a home signup.
function onLandingCta(source: string) {
  fireDemoEvent("demo_cta", source);
  try { localStorage.setItem("cofounder:ref", "home"); } catch { /* ignore */ }
}

const SAMPLE_IDEAS = ["campus meal-prep service", "niche newsletter for machinists", "tutoring marketplace"];

// Which crew member narrates each demo line — flavor only; the numbers come from the real engine.
const DEMO_AGENTS = ["Pitch", "Surge", "Guard", "Apex"];

interface DemoLine {
  agent: string;
  text: string;
}

export default function LandingPage() {
  const { user, ready } = useAuth();
  const appHref = user ? "/dashboard" : "/signup";

  const [idea, setIdea] = useState("");
  const [running, setRunning] = useState(false);
  const [lines, setLines] = useState<DemoLine[]>([]);
  const [verdict, setVerdict] = useState<ValidationResult | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const mountTs = useRef(Date.now());
  const firedStart = useRef(false);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

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

    // The REAL crew: the model-backed engine reads this specific idea (server-side, where the key lives).
    // Falls back to the deterministic offline read on any error / rate-limit / no-key, so it never breaks
    // and stays instant + keyless-friendly.
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

    const demoLines: DemoLine[] = v.experiments.slice(0, 4).map((x, i) => ({
      agent: DEMO_AGENTS[i % DEMO_AGENTS.length],
      text: `${x.label} — ${x.metric} (${x.signal})`,
    }));

    demoLines.forEach((line, i) => {
      timers.current.push(setTimeout(() => setLines((prev) => [...prev, line]), 500 * (i + 1)));
    });
    timers.current.push(
      setTimeout(() => {
        setVerdict(v);
        setRunning(false);
        fireDemoEvent("demo_verdict", `verdict:${v.verdict}/conf:${v.confidence}`);
      }, 500 * (demoLines.length + 1))
    );
  }

  return (
    <main id="main" className="min-h-screen bg-bg text-text">
      <TrackBeacon slug="home" />
      {/* ── Nav: wordmark, one link, one CTA ─────────────────────── */}
      <header className="glass-nav sticky top-0 z-30">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="group flex items-center" aria-label="competitor.inc home">
            <span
              className="text-lg tracking-tight sm:text-xl"
              style={{ fontFamily: "var(--font-heavy)" }}
            >
              competitor<span className="text-muted-2 transition-colors duration-200 group-hover:text-text">.inc</span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-1.5 text-sm sm:gap-3">
            {ready && !user && (
              <Link href="/login" className="px-2 py-1 text-muted transition hover:text-text">
                Sign in
              </Link>
            )}
            <Link
              href={appHref}
              onClick={() => onLandingCta("nav")}
              className="rounded-full border border-text/25 px-4 py-1.5 text-sm font-medium text-text transition hover:border-text hover:bg-text hover:text-bg"
            >
              {user ? "Dashboard" : "Start free"}
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* ── Hero: one sentence, one input, one live demo ────────── */}
        <div className="mx-auto max-w-2xl pt-14 text-center sm:pt-20">
          <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            An AI crew that builds and runs your startup.
          </h1>
          <p className="mt-3 text-balance text-sm text-muted sm:text-base">
            Describe your idea. The crew validates it, ships a real product, and works the growth — and nothing
            spends or ships without your yes. Built for first-time founders.
          </p>

          <div className="mx-auto mt-7 flex max-w-xl gap-2">
            <input
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runDemo()}
              placeholder="an AI resume coach for new grads"
              aria-label="Your startup idea"
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none transition placeholder:text-muted-2 focus:border-text"
            />
            <button
              onClick={() => runDemo()}
              disabled={running || !idea.trim()}
              title={!idea.trim() ? "Type your idea first" : undefined}
              className="hover-lift shrink-0 rounded-xl bg-text px-4 py-2.5 text-sm font-medium text-bg transition hover:opacity-90 disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none disabled:hover:opacity-50"
            >
              {running ? "Working…" : "See it work"}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {SAMPLE_IDEAS.map((s) => (
              <button
                key={s}
                onClick={() => runDemo(s)}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted transition duration-200 hover:-translate-y-0.5 hover:border-text hover:bg-surface hover:text-text"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Demo strip — the aha, before any capture. */}
          {(lines.length > 0 || verdict || running) && (
            <div className="glass-panel mx-auto mt-6 max-w-xl rounded-2xl p-4 text-left font-mono text-xs leading-7">
              {lines.map((l, i) => (
                <div key={i} className="reveal text-muted">
                  <span className="font-semibold text-text">{l.agent}</span> — {l.text}
                </div>
              ))}
              {running && <div className="animate-pulse text-muted-2">the crew is working…</div>}
              {verdict && (
                <div className="reveal mt-2 border-t border-border pt-2">
                  <span className="font-semibold">Apex — verdict:</span>{" "}
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      verdict.verdict === "strong"
                        ? "bg-text text-bg"
                        : verdict.verdict === "mixed"
                          ? "border border-text text-text"
                          : "border border-dashed border-text text-muted"
                    }`}
                  >
                    {verdict.verdict} · {verdict.confidence}% confidence
                  </span>
                  <div className="mt-1.5 font-sans text-muted">{verdict.recommendation}</div>
                  <div className="mt-2.5 flex items-center gap-3 font-sans">
                    <Link
                      href={appHref}
                      onClick={() => onLandingCta(`keep:${verdict.verdict}`)}
                      className="group hover-lift rounded-full bg-text px-3.5 py-1.5 text-xs font-medium text-bg transition hover:opacity-90"
                    >
                      Build this for real →
                    </Link>
                    <span className="text-[10px] text-muted-2">
                      That was the 60-second validation. Next, the crew builds it — you approve every step.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── How it works: the 3-step mental model ────────────────── */}
        <div className="mx-auto mt-16 max-w-4xl">
          <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-muted-2">How it works</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              ["1", "Describe it", "One sentence. The crew gives you an honest demand verdict — with receipts."],
              ["2", "Approve the plan", "You're the founder. Nothing spends or ships without your yes."],
              ["3", "The crew builds & runs it", "A real, live product — then daily growth work, drafted for your approval."],
            ].map(([n, title, desc]) => (
              <div key={n} className="glass-panel rounded-3xl p-5">
                <div className="grid h-7 w-7 place-items-center rounded-full bg-text text-xs font-bold text-bg">{n}</div>
                <div className="mt-3 text-sm font-semibold">{title}</div>
                <p className="mt-1 text-xs text-muted">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Why it's safe to hand a company to AI: glanceable proofs ─ */}
        <h2 className="mt-16 text-center text-sm font-semibold uppercase tracking-wide text-muted-2">
          Why it&apos;s safe to hand a company to AI
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Box wide title="Glass box" sub="Every action logged, with cost and proof.">
            <div className="font-mono text-[11px] leading-7 text-muted">
              <div>
                Forge · deployed site · <Mono>sha 9f2c1a ✓</Mono>
              </div>
              <div>
                Pitch · search test live · <Mono>url resolves ✓</Mono>
              </div>
              <div>
                Apex · closed experiment · <Mono>metric verified ✓</Mono>
              </div>
              <div className="text-[10px] text-muted-2">from a sample run — your runs carry your receipts</div>
            </div>
          </Box>

          <Box title="Your yes required" sub="Nothing ships without approval.">
            <div className="rounded-xl border border-border bg-surface/60 p-2.5 text-[11px]">
              <div className="text-text">Spend $40 on search test</div>
              <div className="mt-1.5 flex gap-1.5">
                <span className="rounded-lg bg-text px-2.5 py-0.5 font-medium text-bg">Approve</span>
                <span className="rounded-lg border border-border px-2.5 py-0.5 text-muted">Reject</span>
              </div>
            </div>
            <div className="mt-2.5 flex items-center gap-2 text-[11px] text-muted">
              approve from
              <SlackMark size={14} className="bob" />
              <TelegramMark size={14} className="bob bob-late" />
              or the inbox
            </div>
          </Box>

          <Box title="A crew, not a chatbot" sub="Five specialists, one goal.">
            <div className="flex flex-wrap gap-1.5">
              {[
                ["Apex", "strategy"],
                ["Forge", "ships"],
                ["Pitch", "demand"],
                ["Guard", "users"],
                ["Surge", "growth"],
              ].map(([n, j]) => (
                <span key={n} className="rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted">
                  {n} · {j}
                </span>
              ))}
            </div>
          </Box>

          <Box title="Honest verdicts" sub="It will tell you not to build.">
            <span className="rounded-full border border-dashed border-text px-3 py-1 text-xs font-medium text-muted">
              weak — hold
            </span>
          </Box>

          <Box title="Built to earn" sub="It optimizes for real revenue, not busywork.">
            <div className="font-mono text-[11px] text-muted">
              views → signups → <span className="rounded bg-text px-1.5 py-0.5 text-bg">paying ← the goal</span>
            </div>
          </Box>

          <Box title="Capped & reversible" sub="Hard limits on every dollar; kill switch anytime.">
            <div className="font-mono text-[11px] leading-6 text-muted">
              <div>five gates before any action</div>
              <div>hard caps on every dollar</div>
            </div>
          </Box>
        </div>

        {/* ── One CTA ──────────────────────────────────────────────── */}
        <div className="mt-12 flex flex-col items-center gap-2 text-center">
          <Link
            href={appHref}
            onClick={() => onLandingCta("footer")}
            className="group hover-lift rounded-full bg-text px-6 py-2.5 text-sm font-medium text-bg transition hover:opacity-90"
          >
            Start your company — free
 →
          </Link>
          <span className="text-xs text-muted-2">Free to start. You approve anything that costs money.</span>
        </div>

        {/* ── Wordmark (the House door stays on the wordmark) ─────── */}
        <div className="mt-16 border-t border-border py-10">
          <SecretHouseDoor className="text-center leading-[0.85] tracking-tight text-[10vw]">
            <span style={{ fontFamily: "var(--font-heavy)" }}>
              competitor<span className="text-muted-2">.inc</span>
            </span>
          </SecretHouseDoor>
          <p className="mt-4 text-center text-xs text-muted-2">
            You own the company. The AI crew does the work. <span className="text-muted">You approve the big calls.</span>
          </p>
        </div>
      </section>

      {/* ── Slim footer: depth on demand ───────────────────────────── */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-5 gap-y-2 px-4 py-6 text-xs text-muted">
          <Link href="/how-it-works" className="transition hover:text-text">How it works</Link>
          <Link href="/dashboard" className="transition hover:text-text">Your crew</Link>
          <Link href="/playbooks" className="transition hover:text-text">Playbooks</Link>
          <Link href="/compare" className="transition hover:text-text">Compare</Link>
          <Link href="/blog" className="transition hover:text-text">Blog</Link>
          <Link href="/terms" className="transition hover:text-text">Terms</Link>
          <Link href="/privacy" className="transition hover:text-text">Privacy</Link>
        </div>
      </footer>
    </main>
  );
}

function Mono({ children }: { children: React.ReactNode }) {
  return <span className="text-text">{children}</span>;
}

function Box({
  title,
  sub,
  wide,
  children,
}: {
  title: string;
  sub: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`glass-panel hover-lift rounded-xl p-5 ${wide ? "md:col-span-2" : ""}`}>
      <div className="text-sm font-semibold">{title}</div>
      <p className="mt-0.5 text-xs text-muted">{sub}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}
