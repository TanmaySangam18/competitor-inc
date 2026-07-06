"use client";

// /delegation — a 3D "living office" where the agent crew works, collaborates, and talks in real
// time. Wired to the real useEngine store; also the destination after a build is approved (you watch
// the crew ship the MVP and run the first shift). The crew keeps up an ambient conversation — work
// talk woven with jokes and chatter — so the floor never goes quiet. Concept inspired by "The
// Delegation"; built original + on-brand (monochrome liquid glass + claymorphism on the playful bits).

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, Check, ExternalLink, Inbox, Loader2, MessagesSquare, Pencil, Play, Power, Send, Sparkles, X } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { useEngine } from "@/lib/engine/useEngine";
import { DELEGATION, delegationForCrew, toneHex } from "@/lib/engine/delegation";
import { generateCrewFromIdea, matchBenchmarkCompany } from "@/lib/engine/dynamic-crew";
import { pickExchange, type BanterCtx, type Turn } from "@/lib/engine/banter";
import { AGENTS, type AgentRole } from "@/lib/engine/types";
import { getByok } from "@/lib/engine/config";

const DelegationScene = dynamic(() => import("./DelegationScenePixel"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center">
      <Loader2 className="animate-spin text-muted-2" size={28} />
    </div>
  ),
});

type CustomerGender = "man" | "woman";

const BY_ROLE = Object.fromEntries(DELEGATION.map((a) => [a.role, a])) as Record<
  AgentRole,
  (typeof DELEGATION)[number]
>;

export default function DelegationPage() {
  const r = useEngine();

  // The floor crew: dynamic when the idea matches a benchmark we hold org data for, else the
  // canonical five. Deterministic + memoized on the idea, so the 3D scene only rebuilds on change.
  const crew = useMemo(() => {
    const idea = r.company?.idea;
    if (!idea || !matchBenchmarkCompany(idea)) return DELEGATION;
    try {
      return delegationForCrew(generateCrewFromIdea(idea).agents);
    } catch {
      return DELEGATION;
    }
  }, [r.company?.idea]);

  const operating = r.company?.status === "operating";
  const live = r.activities.filter((a) => !a.undone);
  const lastActivity = live[0] ?? null;

  const justBuilt = operating && r.company!.night === 1 && live.length <= 1;

  // The build sequence — a short, visible "the crew is shipping it" beat, then the first shift runs.
  const [arriving, setArriving] = useState(false);
  const autoRan = useRef(false);
  useEffect(() => {
    if (!r.hydrated || !justBuilt || autoRan.current || r.working !== null) return;
    autoRan.current = true;
    setArriving(true);
    const t = setTimeout(() => {
      setArriving(false);
      r.runShift();
    }, 2400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r.hydrated, justBuilt]);

  const phase = arriving || r.working === "shift" ? "working" : "idle";
  const busy = arriving || r.working === "shift";

  // ── Ambient conversation ───────────────────────────────────────
  const [speaker, setSpeaker] = useState<Turn | null>(null);
  const [transcript, setTranscript] = useState<Turn[]>([]);

  // Rename the company inline — the auto-derived name is just a starting point; the founder owns it.
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const startRename = () => { setNameDraft(r.company?.name ?? ""); setRenaming(true); };
  const commitRename = () => {
    const n = nameDraft.trim();
    if (n && n !== r.company?.name) r.renameCompany(n);
    setRenaming(false);
  };

  // The customer avatar — man or woman, the founder's pick, remembered on this device.
  const [customerGender, setCustomerGender] = useState<CustomerGender>("man");
  useEffect(() => {
    try {
      const g = localStorage.getItem("cofounder:customer-gender");
      if (g === "man" || g === "woman") setCustomerGender(g);
    } catch { /* ignore */ }
  }, []);
  const chooseGender = (g: CustomerGender) => {
    setCustomerGender(g);
    try { localStorage.setItem("cofounder:customer-gender", g); } catch { /* ignore */ }
  };

  // ── Talk to the crew (customer → the active company's agents) ──
  const [directive, setDirective] = useState("");
  const [target, setTarget] = useState<AgentRole>("ceo");
  const [chatBusy, setChatBusy] = useState(false);
  const chatBusyRef = useRef(false);
  const sendToCrew = async () => {
    const text = directive.trim();
    const co = r.company;
    if (!text || chatBusyRef.current || !co) return;
    const role = target;
    setDirective("");
    chatBusyRef.current = true;
    setChatBusy(true);

    // The addressed agent answers for real (via /api/engine) in its own voice + playbook, about THIS
    // customer's company — never competitor.inc. Consequential moves are drafted + queued, never shipped.
    const a = AGENTS[role];
    const soul =
      `You are ${a.name}, the ${a.label} agent at competitor.inc, working on ${co.name} — "${co.idea}". ` +
      `Your playbook: ${a.playbook}. Your responsibilities: ${a.responsibilities.join("; ")}. ` +
      (a.workflow ? `Follow your workflow, in order: ${a.workflow.join(" → ")}. ` : "") +
      (a.successMetrics ? `Judge your own answer against these success metrics: ${a.successMetrics.join("; ")}. ` : "") +
      (a.objections ? `Reassure these common worries when relevant: ${a.objections.join("; ")}. ` : "") +
      `Reply in-character: concise, specific, action-oriented — name the concrete next steps you'd take for ${co.name}. ` +
      `Anything consequential (spending money, outreach, posting publicly, deploying) you DRAFT and queue for the founder's approval — say so; never claim you already shipped it.`;

    // Echo the customer's OWN message first (so it's obvious they were heard), then the agent's
    // streaming reply bubble that updates live as tokens arrive.
    setTranscript((t) => [...t, { role: "you" as AgentRole, text }, { role, text: "…" }].slice(-40));
    const update = (txt: string) => {
      setSpeaker({ role, text: txt });
      setTranscript((t) => { const copy = t.slice(); copy[copy.length - 1] = { role, text: txt }; return copy; });
    };
    try {
      const res = await fetch("/api/engine", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "chat", company: { name: co.name, idea: co.idea }, message: text, soul, agent: role, byok: getByok() ?? undefined }),
      });
      const consequential = !!res.headers.get("x-approval");
      let acc = "";
      if (!res.body) {
        const d = await res.json().catch(() => ({} as { reply?: string }));
        update((acc = d.reply ?? "On it."));
      } else {
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += dec.decode(value, { stream: true });
          update(acc);
        }
      }
      if (consequential) {
        setTranscript((t) => [...t, { role, text: "🔔 Queued for your approval — nothing consequential ships without your yes." }].slice(-40));
      }
    } catch {
      update("I couldn't reach the engine just now — try again?");
    } finally {
      chatBusyRef.current = false;
      setChatBusy(false);
    }
  };

  const ctxRef = useRef<BanterCtx>({ working: false });
  ctxRef.current = {
    company: r.company?.name,
    idea: r.company?.idea,
    action: lastActivity?.action,
    working: phase === "working",
  };
  const queueRef = useRef<Turn[]>([]);
  const lastIdRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!r.hydrated) return;
    const tick = () => {
      if (chatBusyRef.current) return; // don't talk over a live reply to the customer
      if (queueRef.current.length === 0) {
        const ex = pickExchange(ctxRef.current, lastIdRef.current);
        lastIdRef.current = ex.id;
        queueRef.current = ex.turns;
      }
      const turn = queueRef.current.shift();
      if (turn) {
        setSpeaker(turn);
        setTranscript((t) => [...t, turn].slice(-40));
      }
    };
    tick(); // don't sit silent on arrival
    const iv = setInterval(tick, 3400);
    return () => clearInterval(iv);
  }, [r.hydrated]);

  // The agent talking right now gets the spotlight.
  const spotlight = useMemo<AgentRole | null>(() => speaker?.role ?? null, [speaker]);

  // Auto-scroll the conversation feed to the newest line.
  const feedRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [transcript]);

  return (
    <main id="main" className="relative h-[100dvh] w-full overflow-hidden bg-bg mesh">
      <div className="absolute inset-0">
        <DelegationScene phase={phase} spotlight={spotlight} speech={speaker} agents={crew} customerGender={customerGender} />
      </div>

      {/* Top bar */}
      <header className="glass-nav absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2 text-muted transition hover:text-text">
              <ArrowLeft size={16} />
              <span className="text-sm">Dashboard</span>
            </Link>
            <span className="text-muted-2">/</span>
            <div className="flex items-center gap-2 font-mono text-sm font-bold tracking-tight">
              <LogoMark size={22} />
              <span>The Delegation <span className="font-normal text-muted-2">· The Office</span></span>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-xs text-muted-2 sm:flex">
            {r.company ? (
              <>
                {renaming ? (
                  <span className="pointer-events-auto flex items-center gap-1">
                    <input
                      autoFocus
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenaming(false); }}
                      maxLength={60}
                      aria-label="Company name"
                      className="w-40 rounded-md border border-border bg-bg/70 px-2 py-1 text-xs text-text outline-none focus:border-white/30"
                    />
                    <button onClick={commitRename} aria-label="Save name" className="grid h-6 w-6 place-items-center rounded-md bg-text text-bg transition hover:brightness-110">
                      <Check size={12} />
                    </button>
                    <button onClick={() => setRenaming(false)} aria-label="Cancel rename" className="grid h-6 w-6 place-items-center rounded-md border border-border text-muted transition hover:text-text">
                      <X size={12} />
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={startRename}
                    title="Rename company"
                    className="pointer-events-auto group flex items-center gap-1 text-muted transition hover:text-text"
                  >
                    <span>{r.company.name}</span>
                    <Pencil size={11} className="opacity-0 transition group-hover:opacity-70" />
                  </button>
                )}
                <span>·</span>
                {busy ? (
                  <span className="inline-flex items-center gap-1.5 text-text">
                    <span className="live-dot h-1.5 w-1.5 rounded-full bg-text" />
                    {arriving ? "Building the MVP" : `Running night ${r.company.night + 1}`}
                  </span>
                ) : (
                  <span className="capitalize">{r.company.status}</span>
                )}
              </>
            ) : (
              <span>Demo room</span>
            )}
          </div>
        </div>
      </header>

      {/* Blocked banner (free-tier cap hit) */}
      {r.blocked && (
        <div className="absolute left-1/2 top-20 z-30 w-[min(34rem,calc(100vw-2rem))] -translate-x-1/2">
          <div className="glass-panel pointer-events-auto flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm">
            <span className="text-muted">{r.blocked}</span>
            <Link href="/dashboard/settings" className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs text-text">
              Add key
            </Link>
          </div>
        </div>
      )}

      {/* Controls — top right */}
      <div className="absolute right-4 top-20 z-20 flex flex-col items-end gap-2">
        {operating ? (
          <>
            <button
              onClick={r.runShift}
              disabled={busy}
              className="glass-panel pointer-events-auto flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-text transition hover:border-white/30 disabled:opacity-50"
            >
              {busy ? <Loader2 className="animate-spin" size={15} /> : <Play size={15} />}
              {arriving ? "Building…" : r.working === "shift" ? "Working…" : "Run a shift"}
            </button>
            <button
              onClick={() => r.setAutopilot(!r.autopilot)}
              title={r.autopilotPaused ? "Autopilot paused — clear your Approval Inbox to resume" : r.autopilot ? "Tap to take over and drive the crew manually" : "You're driving — tap to hand back to autopilot"}
              className={`glass-panel pointer-events-auto flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium transition hover:border-white/30 ${
                r.autopilotPaused ? "text-amber" : r.autopilot ? "text-text" : "text-coral"
              }`}
            >
              <Power size={13} className={r.autopilot ? "" : "opacity-60"} />
              {r.autopilotPaused ? "Autopilot paused" : r.autopilot ? "Autopilot on · take over" : "You're driving (manual)"}
            </button>
            {r.pendingApprovals.length > 0 && (
              <Link
                href="/dashboard#approval-inbox"
                className="glass-panel pointer-events-auto flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium text-text transition hover:border-white/30"
              >
                <Inbox size={13} />
                {r.pendingApprovals.length} waiting for your ok →
              </Link>
            )}
          </>
        ) : (
          <Link
            href="/dashboard"
            className="glass-panel pointer-events-auto flex max-w-[15rem] items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-text transition hover:border-white/30"
          >
            <Sparkles size={15} className="shrink-0" />
            <span>Validate &amp; build a company to put them to work →</span>
          </Link>
        )}
      </div>

      {/* Crew legend — bottom left */}
      <aside className="glass-panel pointer-events-auto absolute bottom-4 left-4 z-20 w-[17rem] max-w-[calc(100vw-2rem)] rounded-2xl p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-2">The crew</h2>
        <ul className="mt-3 space-y-2.5">
          {crew.map((a) => {
            const active = spotlight === a.role;
            return (
              <li key={a.role} className="flex items-start gap-2.5">
                <span
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-white/20"
                  style={{
                    background: toneHex(a.tone),
                    boxShadow: active ? "0 0 0 3px rgba(255,255,255,0.25)" : undefined,
                  }}
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium leading-tight">
                    {a.name} <span className="text-muted-2">· {a.label}</span>
                    {active && <span className="ml-1.5 text-[10px] text-text">● speaking</span>}
                  </div>
                  <div className="truncate text-[11px] text-muted-2">Plays {a.playbook}</div>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 border-t border-border pt-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-2">You (the customer)</span>
            <div className="flex overflow-hidden rounded-lg border border-border">
              {(["man", "woman"] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => chooseGender(g)}
                  aria-pressed={customerGender === g}
                  className={`px-2.5 py-1 text-[11px] font-medium capitalize transition ${
                    customerGender === g ? "bg-text text-bg" : "text-muted hover:text-text"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-2">
            They sit together and talk through the build in real time. Every action is logged with proof in the{" "}
            <Link href="/dashboard" className="text-muted underline-offset-2 hover:underline">
              Glass Box
            </Link>
            .
          </p>
        </div>
      </aside>

      {/* Conversation feed (claymorphism) — bottom right */}
      <div className="pointer-events-auto absolute bottom-4 right-4 z-20 w-[22rem] max-w-[calc(100vw-2rem)]">
        <div className="clay-panel flex max-h-[46vh] flex-col p-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-2">
              <MessagesSquare size={13} /> The floor
            </h2>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-2">
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-text" /> live
            </span>
          </div>

          {lastActivity && (
            <div className="clay-chip mt-3 flex items-center gap-2 px-3 py-2 text-[11px]">
              <span className="text-muted">{lastActivity.action}</span>
              <span className="ml-auto shrink-0 text-muted-2">${lastActivity.cost.toFixed(2)}</span>
              {lastActivity.proof?.kind === "url" && (
                <a
                  href={lastActivity.proof.value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-muted hover:text-text"
                  aria-label="proof"
                >
                  <ExternalLink size={11} />
                </a>
              )}
            </div>
          )}

          <div ref={feedRef} className="mt-3 flex-1 space-y-2.5 overflow-y-auto pr-1">
            {transcript.length === 0 ? (
              <p className="text-[11px] text-muted-2">The crew is settling in…</p>
            ) : (
              transcript.map((t, i) => {
                const a = BY_ROLE[t.role];
                const isYou = !a; // the customer's own echoed message
                return (
                  <div key={i} className="flex items-start gap-2">
                    <span
                      className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-white/15"
                      style={{ background: isYou ? "var(--color-text)" : toneHex(a.tone) }}
                    />
                    <div className="min-w-0 text-[12px] leading-snug">
                      <span className="font-mono text-[11px] font-semibold text-text">{isYou ? "You" : a.name}</span>
                      <span className="text-muted"> {t.text}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Talk to the crew — scoped to the active company */}
          {r.company && (
            <div className="mt-3 flex items-center gap-1.5 border-t border-border pt-3">
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value as AgentRole)}
                aria-label="Pick which agent to ask"
                className="w-[5.2rem] shrink-0 truncate rounded-lg border border-border bg-surface px-1.5 py-1.5 text-[11px] outline-none"
              >
                {crew.map((a) => (
                  <option key={a.role} value={a.role}>{a.name}</option>
                ))}
              </select>
              <input
                value={directive}
                onChange={(e) => setDirective(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendToCrew()}
                disabled={chatBusy}
                placeholder={chatBusy ? `${AGENTS[target].name} is thinking…` : `Ask ${r.company.name}'s crew…`}
                aria-label="Talk to the crew"
                className="w-full rounded-lg bg-bg/60 px-2.5 py-1.5 text-[12px] outline-none placeholder:text-muted-2 disabled:opacity-60"
              />
              <button
                onClick={sendToCrew}
                disabled={!directive.trim() || chatBusy}
                aria-label="Send to the crew"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-text text-bg transition hover:brightness-110 disabled:opacity-40"
              >
                {chatBusy ? <Loader2 className="animate-spin" size={13} /> : <Send size={13} />}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
