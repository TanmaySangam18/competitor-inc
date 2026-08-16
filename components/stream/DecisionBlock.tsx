"use client";

// The decision block, Slack-native (ADR-0013, founder directive 2026-07-18): the website shows NO
// approval buttons — decisions are ASKED AND ANSWERED IN SLACK. Department-lane items are answered by
// the department LEAD (ADR-0012 rails); founder-floor items @-mention the human in #decisions.
//
// This sandbox (keyless demo) SIMULATES those Slack replies on a timer so visitors watch the real
// model work: the ask appears, the right approver replies yes/no in-thread, the engine proceeds.
// Every simulated reply is labeled simulated — the honesty floor applies to demos too.

import { useEffect, useRef, useState } from "react";
import { AGENTS, type ApprovalItem, type ApprovalKind } from "@/lib/core/types";
import { rationaleFor } from "@/lib/engine/rationale";

const DEPT_LANE: ApprovalKind[] = ["twitter", "linkedin", "bluesky", "mastodon", "reddit", "video", "outreach"];

// Who answers in Slack, per the governance model: leads for their department's lane (ADR-0012),
// the founder for the irreducible floor (money, deploys, deletion).
function approverFor(kind: ApprovalKind): { name: string; label: string; founder: boolean } {
  if (DEPT_LANE.includes(kind)) return { name: "Growth Lead", label: "department lead", founder: false };
  return { name: "You (founder)", label: "#decisions · founder floor", founder: true };
}

const REPLY_AFTER_MS = 4200;

export function DecisionBlock({ approvals, onResolve }: { approvals: ApprovalItem[]; onResolve: (id: string, approve: boolean) => void }) {
  if (approvals.length === 0) return null;
  return (
    <section aria-label="Decisions asked in Slack" className="border-[1.5px] border-text bg-bg">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border px-4 py-2.5">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-text">
          Asked in Slack — {approvals.length} decision{approvals.length === 1 ? "" : "s"}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-2">
          answered in the office, never on this page ·{" "}
          <a href="/live" className="underline decoration-dotted underline-offset-2 hover:text-text">see the demo</a>
        </span>
      </div>
      <div className="divide-y divide-border">
        {approvals.map((ap) => (
          <SlackAsk key={ap.id} ap={ap} onResolve={onResolve} />
        ))}
      </div>
    </section>
  );
}

function SlackAsk({ ap, onResolve }: { ap: ApprovalItem; onResolve: (id: string, approve: boolean) => void }) {
  const [replied, setReplied] = useState(false);
  const resolved = useRef(false);
  const approver = approverFor(ap.kind);
  const why = rationaleFor(ap.agent, ap.title, ap.detail);

  // The simulated Slack reply: the right approver answers on a timer, then the engine proceeds.
  useEffect(() => {
    const reply = setTimeout(() => setReplied(true), REPLY_AFTER_MS);
    const resolve = setTimeout(() => {
      if (!resolved.current) { resolved.current = true; onResolve(ap.id, true); }
    }, REPLY_AFTER_MS + 2600);
    return () => { clearTimeout(reply); clearTimeout(resolve); };
  }, [ap.id, onResolve]);

  return (
    <div className="p-4">
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-text">{AGENTS[ap.agent].name}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-2">
          {AGENTS[ap.agent].label} · night {ap.night} · asks {approver.name}
        </span>
        <span
          title={`${why.why} Principle: ${why.principle}`}
          className="ml-auto cursor-help font-mono text-[10px] uppercase tracking-[0.16em] text-muted-2 underline decoration-dotted underline-offset-2"
        >
          why?
        </span>
      </div>
      <div className="mt-1.5 text-sm font-semibold text-text">{ap.title}</div>
      <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-muted">{ap.detail}</p>

      <div className="mt-3 border border-border">
        <div className="border-b border-border/60 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-2">
          {approver.founder ? "#decisions" : "#the-office"} · simulated reply — in the real product this happens in your Slack
        </div>
        <div className="flex gap-2.5 px-3 py-2.5">
          <span aria-hidden className="grid h-7 w-7 shrink-0 place-items-center border border-border font-mono text-[9px] font-semibold text-muted">
            {approver.name.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-semibold text-text">
              {approver.name} <span className="font-normal text-muted-2">· {approver.label}</span>
            </p>
            {replied ? (
              <p className="mt-0.5 text-[12px] leading-relaxed text-muted" style={{ animation: "fade-up 0.3s ease-out both" }}>
                <span className="font-semibold text-text">Yes.</span>{" "}
                {approver.founder
                  ? "Signed in #decisions — proceeding."
                  : "Rails hold (separation, honesty, disclosure, cap, own audience) — proceeding."}
              </p>
            ) : (
              <p className="mt-0.5 font-mono text-[11px] text-muted-2">typing…</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
