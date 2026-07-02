"use client";

import { ChevronDown, Copy, Check, MessagesSquare } from "lucide-react";
import { buildMomTestKit } from "@/lib/engine/momtest";
import { useCopy } from "@/components/useCopy";

// Validation pillars 1 + 3 in the founder's hand: the Mom-Test interview kit + the costly-ask
// ladder, generated for THIS idea. Collapsed by default (progressive disclosure) — one tap when
// they're ready to talk to humans. Every block is copy-paste ready.
export default function MomTestKit({ name, idea }: { name: string; idea: string }) {
  const kit = buildMomTestKit({ name, idea });
  const { copied, copy } = useCopy(1800);

  const fullScript =
    `MOM TEST INTERVIEWS — ${name}\n\nWHO (aim for 5+):\n${kit.whoToAsk.map((w) => `• ${w}`).join("\n")}\n\n` +
    `OPENERS:\n${kit.openers.map((o) => `• ${o}`).join("\n")}\n\n` +
    `QUESTIONS:\n${kit.questions.map((x, i) => `${i + 1}. ${x.q}`).join("\n")}\n\n` +
    `NEVER:\n${kit.sins.map((s) => `✗ ${s}`).join("\n")}\n\n` +
    `THE ASK LADDER (end every good conversation one rung up):\n${kit.costlyAsks.map((a) => `• [${a.label} — costs them ${a.cost}] ${a.script}`).join("\n")}\n\n` +
    `SCORING:\n${kit.debrief.map((d) => `• ${d}`).join("\n")}`;

  return (
    <details className="group mt-4 rounded-2xl border border-border bg-bg/40">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium text-muted transition hover:text-text">
        <span className="flex items-center gap-2">
          <MessagesSquare size={15} className="text-amber" />
          Talk to 5 humans first — your Mom-Test interview kit
        </span>
        <ChevronDown size={16} className="shrink-0 text-muted-2 transition group-open:rotate-180" />
      </summary>
      <div className="space-y-4 border-t border-border p-4">
        <p className="text-xs leading-relaxed text-muted">
          The AI estimate is a fast read; five real conversations are the truth. Ask about the <span className="text-text">past</span>, never
          &ldquo;would you&rdquo; — and end every good conversation with an ask that <span className="text-text">costs them something</span>.
        </p>

        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted-2">Ask these ({kit.questions.length})</div>
          <ul className="mt-2 space-y-2">
            {kit.questions.map((x) => (
              <li key={x.q} className="rounded-xl border border-border bg-surface/40 px-3 py-2">
                <div className="text-sm text-text">{x.q}</div>
                <div className="mt-0.5 text-[11px] text-muted-2">{x.why}</div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted-2">The ask ladder — commitment beats compliments</div>
          <ul className="mt-2 space-y-1.5">
            {kit.costlyAsks.map((a) => (
              <li key={a.label} className="flex items-start gap-2 text-xs">
                <span className="mt-0.5 shrink-0 rounded bg-coral/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-coral">{a.label}</span>
                <span className="text-muted">{a.script}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
          <p className="text-[11px] text-muted-2">{kit.debrief[1]}</p>
          <button
            onClick={() => copy(fullScript)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted transition hover:text-text"
          >
            {copied ? <Check size={13} className="text-mint" /> : <Copy size={13} />} {copied ? "Copied!" : "Copy full kit"}
          </button>
        </div>
      </div>
    </details>
  );
}
