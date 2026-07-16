"use client";

// CrewBox — the crew as ONE compact box (a bento tile, not a whole page). Colorful pixel agents that talk
// (ambient banter), a live transcript, and a chat input. Crucially: anything the founder types in Slack or
// Telegram REFLECTS here — the box polls /api/chatops/messages and folds those lines into the floor. This
// is the single crew visualization (replaces the full-page /delegation office + the static PixelCrew).

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, MessagesSquare, Send } from "lucide-react";
import { useEngineContext } from "@/lib/engine/EngineContext";
import { DELEGATION, toneHex } from "@/lib/engine/delegation";
import { PERSONA } from "@/lib/engine/specialists";
import { pickExchange, type BanterCtx } from "@/lib/engine/banter";
import { AGENTS, type AgentRole } from "@/lib/engine/types";
import { getByok } from "@/lib/engine/config";

// 9×9 pixel bot (matches DelegationScenePixel / PixelCrew). Colorful per agent tone.
const BOT = ["....A....", "...AAA...", "....A....", ".XXXXXXX.", ".XEX.XEX.", ".XXXXXXX.", ".X.MMM.X.", ".XXXXXXX.", "..X...X.."];
function PixelBot({ color, size = 30 }: { color: string; size?: number }) {
  const u = size / 9;
  const rects: React.ReactNode[] = [];
  BOT.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === ".") continue;
      const fill = ch === "E" || ch === "M" ? "var(--color-bg, #ffffff)" : color;
      rects.push(<rect key={`${x}-${y}`} x={x * u} y={y * u} width={u + 0.5} height={u + 0.5} fill={fill} />);
    }
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} shapeRendering="crispEdges" style={{ imageRendering: "pixelated" }}>
      {rects}
    </svg>
  );
}

type Line = { role: AgentRole | "you"; text: string; via?: "telegram" | "slack" };
const BY_ROLE = Object.fromEntries(DELEGATION.map((a) => [a.role, a]));

export function CrewBox() {
  const r = useEngineContext();
  const crew = DELEGATION;

  const [lines, setLines] = useState<Line[]>([]);
  const [speaker, setSpeaker] = useState<AgentRole | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  // ── Ambient banter (deterministic, free) ──
  const ctxRef = useRef<BanterCtx>({ working: false });
  ctxRef.current = { company: r.company?.name, idea: r.company?.idea, action: r.activities[0]?.action, working: r.working === "shift" };
  const lastId = useRef<number | undefined>(undefined);
  const queue = useRef<{ role: AgentRole; text: string }[]>([]);
  const busyRef = useRef(false);
  useEffect(() => {
    if (!r.hydrated) return;
    const tick = () => {
      if (busyRef.current) return; // don't talk over a live reply
      if (queue.current.length === 0) {
        const ex = pickExchange(ctxRef.current, lastId.current);
        lastId.current = ex.id;
        queue.current = ex.turns as { role: AgentRole; text: string }[];
      }
      const t = queue.current.shift();
      if (t) { setSpeaker(t.role); setLines((l) => [...l, { role: t.role, text: t.text }].slice(-24)); }
    };
    tick();
    const iv = setInterval(tick, 3600);
    return () => clearInterval(iv);
  }, [r.hydrated]);

  // ── ChatOps reflection: poll for what the founder typed in Slack/Telegram (+ the crew's replies). ──
  // Self-scheduling with backoff: 4s while messages are arriving, backing off to 30s when idle, and paused
  // entirely while the tab is hidden — so an open dashboard doesn't hammer the endpoint for nothing.
  const sinceRef = useRef<string>(new Date(Date.now() - 60_000).toISOString());
  useEffect(() => {
    let alive = true;
    let delay = 4000;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = async () => {
      if (!alive) return;
      if (typeof document !== "undefined" && document.hidden) { timer = setTimeout(tick, delay); return; }
      try {
        const res = await fetch(`/api/chatops/messages?since=${encodeURIComponent(sinceRef.current)}`);
        if (res.ok) {
          const d = (await res.json()) as { messages?: { source: "telegram" | "slack"; direction: "in" | "out"; text: string; createdAt: string; agent?: string }[] };
          const msgs = d.messages ?? [];
          if (alive && msgs.length > 0) {
            sinceRef.current = msgs[msgs.length - 1].createdAt;
            setLines((l) => [
              ...l,
              ...msgs.map((m): Line => (m.direction === "in" ? { role: "you", text: m.text, via: m.source } : { role: (m.agent as AgentRole) || "ceo", text: m.text })),
            ].slice(-24));
            delay = 4000; // active → poll fast
          } else {
            delay = Math.min(delay * 1.5, 30000); // idle → back off
          }
        }
      } catch { delay = Math.min(delay * 1.5, 30000); /* fail-soft: no table / offline → just banter */ }
      if (alive) timer = setTimeout(tick, delay);
    };
    tick();
    return () => { alive = false; if (timer) clearTimeout(timer); };
  }, []);

  useEffect(() => { feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" }); }, [lines]);

  // ── Talk to the crew from the box (same engine as before). ──
  const [target, setTarget] = useState<AgentRole>("ceo");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const send = async () => {
    const text = draft.trim();
    const co = r.company;
    if (!text || sending || !co) return;
    setDraft(""); setSending(true); busyRef.current = true;
    setLines((l) => [...l, { role: "you" as const, text }, { role: target, text: "…" }].slice(-24));
    setSpeaker(target);
    const a = AGENTS[target];
    const soul = `You are ${a.name}, the ${a.label} agent at competitor.inc working on ${co.name} — "${co.idea}". Playbook: ${a.playbook}. Style: ${PERSONA[target]} Reply concise, specific, in-character; anything consequential you DRAFT and queue for approval (say so), never claim you shipped it.`;
    try {
      const res = await fetch("/api/engine", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "chat", company: { name: co.name, idea: co.idea }, message: text, soul, agent: target, byok: getByok() ?? undefined }),
      });
      let acc = "";
      if (!res.body) { const d = await res.json().catch(() => ({} as { reply?: string })); acc = d.reply ?? "On it."; }
      else {
        const reader = res.body.getReader(); const dec = new TextDecoder();
        for (;;) { const { done, value } = await reader.read(); if (done) break; acc += dec.decode(value, { stream: true }); setLines((l) => { const c = l.slice(); c[c.length - 1] = { role: target, text: acc }; return c; }); }
      }
      setLines((l) => { const c = l.slice(); c[c.length - 1] = { role: target, text: acc || "On it." }; return c; });
    } catch {
      setLines((l) => { const c = l.slice(); c[c.length - 1] = { role: target, text: "Couldn't reach the engine — try again?" }; return c; });
    } finally { setSending(false); busyRef.current = false; }
  };

  return (
    <div className="glass-panel flex h-full min-h-[19rem] flex-col rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-2">
          <MessagesSquare size={13} /> The crew · the floor
        </h2>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-2"><span className="live-dot h-1.5 w-1.5 rounded-full bg-text" /> live</span>
      </div>

      {/* colorful pixel crew — the speaker pops + bobs */}
      <div className="mt-3 flex flex-wrap items-end gap-2">
        {crew.map((a) => {
          const on = speaker === a.role;
          return (
            <div key={a.role} className="flex flex-col items-center" style={{ opacity: speaker && !on ? 0.55 : 1, transition: "opacity .3s" }}>
              <div style={{ animation: on ? "crewBob .9s ease-in-out infinite" : undefined }} className={on ? "rounded-full ring-2 ring-text/40" : undefined}>
                <PixelBot color={toneHex(a.tone)} size={on ? 34 : 28} />
              </div>
              <span className={`mt-0.5 font-mono text-[8px] ${on ? "text-text" : "text-muted-2"}`}>{a.name}</span>
            </div>
          );
        })}
        <style>{`@keyframes crewBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}`}</style>
      </div>

      {/* transcript — banter + whatever you typed in Slack/Telegram */}
      <div ref={feedRef} className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1">
        {lines.length === 0 ? (
          <p className="text-[11px] text-muted-2">The crew is settling in…</p>
        ) : (
          lines.map((t, i) => {
            const a = t.role !== "you" ? BY_ROLE[t.role] : null;
            return (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full ring-1 ring-black/15" style={{ background: a ? toneHex(a.tone) : "var(--color-text)" }} />
                <div className="min-w-0 text-[11.5px] leading-snug">
                  <span className="font-mono text-[10px] font-semibold text-text">{a ? a.name : "You"}</span>
                  {t.via && <span className="ml-1 rounded bg-surface px-1 text-[8px] uppercase tracking-wide text-muted-2">via {t.via}</span>}
                  <span className="text-muted"> {t.text}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* talk to the crew */}
      {r.company && (
        <div className="mt-2 flex items-center gap-1.5 border-t border-border pt-2">
          <select value={target} onChange={(e) => setTarget(e.target.value as AgentRole)} aria-label="Pick which agent to ask" className="w-[4.8rem] shrink-0 truncate rounded-lg border border-border bg-surface px-1.5 py-1.5 text-[11px] outline-none">
            {crew.map((a) => (<option key={a.role} value={a.role}>{a.name}</option>))}
          </select>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} disabled={sending} placeholder={sending ? "thinking…" : "Ask the crew…"} aria-label="Talk to the crew" className="w-full rounded-lg bg-bg/60 px-2.5 py-1.5 text-[12px] outline-none placeholder:text-muted-2 disabled:opacity-60" />
          <button onClick={send} disabled={!draft.trim() || sending} aria-label="Send to the crew" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-text text-bg transition hover:brightness-110 disabled:opacity-40">
            {sending ? <Loader2 className="animate-spin" size={13} /> : <Send size={13} />}
          </button>
        </div>
      )}
    </div>
  );
}
