"use client";

// One conversational turn in the Stream — a real ledger entry rendered as a teammate speaking.
// Everything on it is real engine data: the acting agent, the shift ("night N"), the action, the cost,
// and — when the work produced an artifact — a receipt strip. Undo appears only where a real reversal
// exists (lib/engine/reversibility); irreversible work says "can't recall" plainly.
//
// Paywall integrity, preserved EXACTLY from the old ActivityRow: when the proof IS the locked live
// URL, it renders masked ("unlock to view"), never as a link — a non-paying user must not be able to
// read the link out of the thread (the product card is the only door).

import { AGENTS, type Activity } from "@/lib/core/types";
import { rationaleFor } from "@/lib/engine/rationale";
import { reversibility, canOfferUndo } from "@/lib/engine/reversibility";

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export function StreamTurn({ a, onUndo, lockedUrl, delay = 0 }: { a: Activity; onUndo: () => void; lockedUrl?: string; delay?: number }) {
  const spec = AGENTS[a.agent];
  const failed = a.status === "failed-credited";
  const waiting = a.status === "pending-approval";
  const rev = reversibility(a);
  const offerUndo = canOfferUndo(a);
  const showCantRecall = !a.undone && a.status === "done" && !rev.reversible;
  const why = a.rationale ?? rationaleFor(a.agent, a.action, a.meta);
  const proofIsUrl = !!a.proof && /^https?:\/\//.test(a.proof.value);
  return (
    <div className="rise flex items-start gap-3 border-b border-border py-3.5" style={{ animationDelay: `${delay}ms` }}>
      <span aria-hidden className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center border border-border font-mono text-[10px] font-semibold text-text">
        {initialsOf(spec.name)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-text">{spec.name}</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-2">{spec.label} · night {a.night}</span>
          {waiting && (
            <span className="border border-text px-1.5 py-px font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-text">waiting on you ↑</span>
          )}
          {failed && <span className="border border-border px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.16em] text-muted">credited back</span>}
          {a.undone && <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-2">undone</span>}
        </div>
        <div className={`mt-1 text-sm leading-relaxed ${a.undone ? "text-muted-2 line-through" : failed ? "text-muted" : "text-text"}`}>{a.action}</div>
        {a.meta && <div className="mt-0.5 truncate font-mono text-[10px] text-muted-2">{a.meta}</div>}
        {a.proof && !a.undone &&
          (lockedUrl && a.proof.value === lockedUrl ? (
            <div className="mt-2 flex items-center justify-between gap-2 border border-border bg-surface-2 px-2.5 py-1.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">live site — unlock to view</span>
              <span className="shrink-0 border border-border px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.16em] text-muted-2">locked</span>
            </div>
          ) : (
            <div className="mt-2 flex items-center justify-between gap-2 border border-border px-2.5 py-1.5">
              <span className="min-w-0 truncate font-mono text-[11px] text-muted">{a.proof.value}</span>
              <span className="flex shrink-0 items-center gap-1.5">
                <span className="border border-border px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.16em] text-muted">receipt</span>
                {proofIsUrl && (
                  <a
                    href={a.proof.value}
                    target="_blank"
                    rel="noreferrer"
                    className="border border-text px-1.5 py-px font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-text transition hover:bg-text hover:text-bg"
                  >
                    view ↗
                  </a>
                )}
              </span>
            </div>
          ))}
        {/* The Rationale Stream (PDR §6): the "why" behind the action — one tap, on every turn. */}
        {!a.undone && (
          <details className="mt-1.5">
            <summary className="cursor-pointer list-none font-mono text-[10px] uppercase tracking-[0.16em] text-muted-2 transition hover:text-text">why?</summary>
            <div className="mt-1 space-y-0.5 text-[11px] leading-relaxed text-muted">
              <div>{why.why}</div>
              <div className="text-muted-2">Principle: {why.principle}</div>
            </div>
          </details>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span className={`font-mono text-[11px] ${failed ? "text-muted-2 line-through" : "text-muted"}`}>{a.cost > 0 ? "$" + a.cost.toFixed(2) : "—"}</span>
        {offerUndo && (
          <button
            onClick={onUndo}
            title={rev.reason}
            className="border border-border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-muted transition hover:border-text hover:bg-text hover:text-bg"
          >
            undo
          </button>
        )}
        {showCantRecall && (
          <span title={rev.reason} className="cursor-help border border-border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-2">
            can&apos;t recall
          </span>
        )}
      </div>
    </div>
  );
}
