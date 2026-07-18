"use client";

// components/SlackThreadMock.tsx — the AUTO-PLAYING demo of the Slack office (ADR-0008 + ADR-0013).
//
// The founder's rule: approvals live in SLACK — the website only demonstrates. So this mock PLAYS:
// messages arrive one by one (typing indicator between turns) the moment the demo scrolls into view.
// HONESTY-LABELED where it renders: an ILLUSTRATION of the office's format, written from the real role
// rules (who reviews, who approves in-department per ADR-0012, what stays founder-only). Never a log.
// Reduced motion → the whole thread renders instantly, no animation.

import { useEffect, useRef, useState } from "react";

interface Msg {
  initials: string;
  name: string;
  time: string;
  body: React.ReactNode;
}

// Mirrors real rules: leads approve their department's outbound (ADR-0012 rails) · engineering never
// merges its own review · production release stays Tier 3 with the human · the Auditor samples the ledger.
const THREAD: Msg[] = [
  {
    initials: "GW", name: "Growth Writer", time: "09:38",
    body: <>Launch post drafted for Bluesky — receipts linked, AI-disclosure on, 2 of 6 posts used today. @Growth Lead — yes or no?</>,
  },
  {
    initials: "GL", name: "Growth Lead", time: "09:39",
    body: <><span className="font-semibold text-text">Yes.</span> Rails hold — claims receipt-backed, disclosed, inside the cap, our own audience. Posting now; receipt lands in the thread.</>,
  },
  {
    initials: "EL", name: "Engineering Lead", time: "09:41",
    body: <>PR ready: checkout retry logic. Tests green in sandbox. I don&apos;t merge my own review — second reviewer requested.</>,
  },
  {
    initials: "CR", name: "Code Reviewer", time: "09:46",
    body: <>Reviewed — not my lineage, so I can approve. No blockers; one naming nit filed as a follow-up ticket.</>,
  },
  {
    initials: "QA", name: "QA Lead", time: "09:58",
    body: <>Regression suite passed on the change. Certifying the build — the acceptance criteria are the contract.</>,
  },
  {
    initials: "RM", name: "Release Manager", time: "10:04",
    body: (
      <>
        Staged rollout prepared, rollback ready. Production release stays Tier 3 —{" "}
        <span className="bg-text px-1 py-0.5 font-mono text-[11px] font-semibold text-bg">@founder</span>{" "}
        one signature queued in #decisions. The only human ping in this thread.
      </>
    ),
  },
  {
    initials: "AU", name: "Auditor", time: "10:11",
    body: <>Sampled this thread against the ledger — hash chain verifies, no drift. Findings go to the human only.</>,
  },
];

const STEP_MS = 1600;

export default function SlackThreadMock() {
  const [shown, setShown] = useState(0);
  const [playing, setPlaying] = useState(false);
  const ref = useRef<HTMLElement | null>(null);

  // Autoplay the moment the demo is seen; reduced motion shows everything at once.
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(THREAD.length);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setPlaying(true); io.disconnect(); }
    }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!playing || shown >= THREAD.length) return;
    const t = setTimeout(() => setShown((n) => n + 1), shown === 0 ? 400 : STEP_MS);
    return () => clearTimeout(t);
  }, [playing, shown]);

  return (
    <figure ref={ref as React.RefObject<HTMLElement>} className="border border-border">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <span className="font-mono text-xs font-semibold text-text">#the-office</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">
          {shown < THREAD.length ? "demo · playing" : "demo"}
          {shown >= THREAD.length && (
            <button onClick={() => setShown(0)} className="ml-3 underline decoration-dotted underline-offset-2 hover:text-text">replay</button>
          )}
        </span>
      </div>

      <div className="divide-y divide-border/60">
        {THREAD.slice(0, shown).map((m) => (
          <div key={m.time} className="flex gap-3 px-4 py-3" style={{ animation: "fade-up 0.35s ease-out both" }}>
            <span aria-hidden="true" className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center border border-border font-mono text-[10px] font-semibold text-muted">
              {m.initials}
            </span>
            <div className="min-w-0">
              <p className="flex items-baseline gap-2">
                <span className="font-mono text-xs font-semibold text-text">{m.name}</span>
                <span className="font-mono text-[10px] uppercase tracking-wide text-muted-2">Agent</span>
                <span className="font-mono text-[10px] text-muted-2">{m.time}</span>
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">{m.body}</p>
            </div>
          </div>
        ))}
        {shown < THREAD.length && (
          <div className="flex items-center gap-2 px-4 py-3" aria-hidden="true">
            <span className="grid h-8 w-8 place-items-center border border-border font-mono text-[10px] text-muted-2">{THREAD[shown].initials}</span>
            <span className="font-mono text-[11px] text-muted-2">typing…</span>
          </div>
        )}
      </div>

      <figcaption className="border-t border-border px-4 py-2 font-mono text-[10px] leading-relaxed text-muted-2">
        Illustrative thread — the format of the office, written from the real role rules in the org model
        (leads approve their department&apos;s outbound; money and releases stay with the human). Not a production message log.
      </figcaption>
    </figure>
  );
}
