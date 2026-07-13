"use client";

import { useEffect, useRef, useState } from "react";
import type { Conversation, Turn } from "@/lib/core";

// THE TEAM ROOM, watchable. The customer types a decision and watches their AI team talk it through: the
// chair opens, each convened role weighs in, the chair calls it (proceed, or escalate to the founder). The
// turns are computed up front by /api/room (one real governed deliberation) — the sequential reveal here is
// pure presentation so it FEELS live. Honest: when the stances are mandate-derived we say so, plainly.

const EXAMPLES = [
  "Build a booking tool for a dog groomer",
  "Launch a paid ads campaign for $2,000",
  "Ship the new pricing page this week",
];

// Stable avatar tint per speaker so the room is easy to follow. Chair-independent; keyed off the role id.
// Only theme tokens that resolve to distinct hues (coral/mint are the same teal, so mint is omitted here).
const TINTS = [
  "bg-coral/10 text-coral",
  "bg-amber/10 text-amber",
  "bg-violet/15 text-violet",
  "bg-text/[0.06] text-muted",
];
function tintFor(roleId: string): string {
  let h = 0;
  for (const c of roleId) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TINTS[h % TINTS.length];
}

function Avatar({ turn }: { turn: Turn }) {
  return (
    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${tintFor(turn.roleId)}`}>
      {turn.initials}
    </span>
  );
}

function Bubble({ turn }: { turn: Turn }) {
  const isDecision = turn.kind === "decision";
  return (
    <div className="flex items-start gap-3">
      <Avatar turn={turn} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-2">{turn.title}</p>
        <div
          className={`mt-1 rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm leading-snug ${
            isDecision ? "border border-coral/30 bg-coral/[0.06] text-text" : "bg-surface text-text"
          }`}
        >
          {turn.text}
        </div>
      </div>
    </div>
  );
}

export default function RoomConversation() {
  const [task, setTask] = useState("");
  const [convo, setConvo] = useState<Conversation | null>(null);
  const [shown, setShown] = useState(0); // how many turns have been revealed
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const scroller = useRef<HTMLDivElement>(null);

  // Sequential reveal — one turn every ~700ms so the room unfolds like a real conversation.
  useEffect(() => {
    if (!convo || shown >= convo.turns.length) return;
    const t = setTimeout(() => setShown((n) => n + 1), shown === 0 ? 250 : 700);
    return () => clearTimeout(t);
  }, [convo, shown]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [shown]);

  async function convene(t: string) {
    const clean = t.trim();
    if (!clean || busy) return;
    setBusy(true); setErr(""); setConvo(null); setShown(0);
    try {
      const res = await fetch("/api/room", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ task: clean }),
      });
      const data = await res.json();
      if (!data.ok) { setErr(data.error || "The room couldn't convene."); return; }
      setConvo(data.conversation as Conversation);
    } catch {
      setErr("Couldn't reach the room. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const revealing = convo && shown < convo.turns.length;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* input */}
      <div className="shrink-0">
        <label className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2.5">
          <input
            value={task}
            onChange={(e) => setTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && convene(task)}
            placeholder="A decision to put to the team…"
            aria-label="A decision to put to the team"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-2"
          />
          <button
            onClick={() => convene(task)}
            disabled={busy || !task.trim()}
            className="shrink-0 rounded-lg bg-coral px-3.5 py-1.5 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
          >
            {busy ? "Convening…" : "Convene the room"}
          </button>
        </label>
        {!convo && !busy && (
          <div className="mt-2.5 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => { setTask(ex); convene(ex); }}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted transition hover:border-coral/50 hover:text-coral"
              >
                {ex}
              </button>
            ))}
          </div>
        )}
        {err && <p className="mt-2 text-xs text-coral" role="alert">{err}</p>}
      </div>

      {/* conversation */}
      <div ref={scroller} className="mt-4 flex flex-1 flex-col gap-4 overflow-y-auto pr-1">
        {!convo && !busy && (
          <p className="mt-8 text-center text-sm text-muted-2">
            Put a decision to your AI team and watch them work it out — live.
          </p>
        )}
        {busy && <p className="mt-8 text-center text-sm text-muted-2">Convening the room…</p>}

        {convo && convo.turns.slice(0, shown).map((turn) => (
          <div key={turn.order} className="animate-[fade-up_.3s_ease-out]">
            <Bubble turn={turn} />
          </div>
        ))}

        {revealing && (
          <div className="flex items-center gap-1.5 pl-11 text-muted-2">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-2 [animation-delay:-0.2s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-2 [animation-delay:-0.1s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-2" />
          </div>
        )}
      </div>

      {/* honesty footer — only once the room has spoken */}
      {convo && !revealing && convo.simulated && (
        <p className="mt-3 shrink-0 border-t border-border pt-3 text-[11px] leading-relaxed text-muted-2">
          The room, the roles, and the governed decision are real. The wording of each stance is drawn from
          each role&apos;s mandate — live, reasoned debate wakes when a model key is connected.
        </p>
      )}
    </div>
  );
}
