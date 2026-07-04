"use client";

import { motion } from "framer-motion";
import { Check, Lock, Undo2, Ban } from "lucide-react";
import { AGENTS, type Activity } from "@/lib/engine/types";
import { rationaleFor } from "@/lib/engine/rationale";
import { agentStyle } from "@/components/dashboard/agentStyle";
import { reversibility, canOfferUndo } from "@/lib/engine/reversibility";

export function ActivityRow({ a, onUndo, lockedUrl }: { a: Activity; onUndo: () => void; lockedUrl?: string }) {
  const S = agentStyle[a.agent];
  const A = AGENTS[a.agent];
  const failed = a.status === "failed-credited";
  // Honest undo: only offer it where a real reversal exists; otherwise say plainly it can't be recalled.
  const rev = reversibility(a);
  const offerUndo = canOfferUndo(a);
  const showCantRecall = !a.undone && a.status === "done" && !rev.reversible;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: a.undone ? 0.45 : 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-start gap-3 rounded-2xl glass-panel p-4"
    >
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${S.ring} ${S.color}`}>
        <S.icon size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-2">
          {A.name} · night {a.night}
          {a.meta && <span className="normal-case tracking-normal">· {a.meta}</span>}
        </div>
        <div className={`mt-0.5 text-sm ${a.undone ? "text-muted line-through" : "text-text"}`}>{a.action}</div>
        {a.proof && !a.undone &&
          (lockedUrl && a.proof.value === lockedUrl ? (
            // Paywall integrity: the build's proof IS the live URL. Mask it here too so a non-paying
            // user can't just read the link out of the Glass Box (the reveal card is the only door).
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-coral/10 px-2 py-1 text-[11px] text-coral">
              <Lock size={11} /> live site — unlock to view
            </div>
          ) : (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-bg/60 px-2 py-1 text-[11px] text-mint">
              <Check size={11} />
              {a.proof.value}
            </div>
          ))}
        {/* Rationale Stream (PDR §6): the "why" behind the action — one tap, tiered (Education view). */}
        {!a.undone && (
          <details className="mt-1.5 text-[11px] text-muted-2">
            <summary className="cursor-pointer list-none transition hover:text-muted">Why?</summary>
            {(() => {
              const r = a.rationale ?? rationaleFor(a.agent, a.action, a.meta);
              return (
                <div className="mt-1 space-y-0.5">
                  <div className="text-muted">{r.why}</div>
                  <div>Principle: {r.principle}</div>
                </div>
              );
            })()}
          </details>
        )}
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <span className={`text-xs ${failed ? "text-muted-2 line-through" : "text-muted"}`}>{a.cost > 0 ? "$" + a.cost.toFixed(2) : "—"}</span>
        {offerUndo && (
          <button onClick={onUndo} title={rev.reason} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted transition hover:text-text">
            <Undo2 size={11} /> undo
          </button>
        )}
        {showCantRecall && (
          <span title={rev.reason} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted-2">
            <Ban size={11} /> can&apos;t recall
          </span>
        )}
        {failed && <span className="rounded-md bg-mint/12 px-2 py-1 text-[11px] text-mint">credited back</span>}
        {a.undone && <span className="text-[11px] text-muted-2">undone</span>}
      </div>
    </motion.div>
  );
}
