"use client";

// /house — "The House": competitor.inc, run by its own agent crew (customer zero). PRIVATE — founder
// only. The Office (/delegation) builds the USER's company; the House is competitor.inc building and
// growing ITSELF. Same 3D floor as the Office, but vivid (colorful figures with faces) and gated.

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, KeyRound, Loader2, Lock, MessagesSquare, Send } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { useAuth } from "@/lib/engine/useAuth";
import { DELEGATION, type DelegationAgent } from "@/lib/engine/delegation";
import { pickExchange, type BanterCtx, type Turn } from "@/lib/engine/banter";
import { AGENTS, type AgentRole } from "@/lib/engine/types";
import { getByok } from "@/lib/engine/config";

const DelegationScene = dynamic(() => import("../delegation/DelegationScene"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center">
      <Loader2 className="animate-spin text-muted-2" size={28} />
    </div>
  ),
});

const BY_ROLE = Object.fromEntries(DELEGATION.map((a) => [a.role, a])) as Record<AgentRole, DelegationAgent>;

// Founder allow-list. Defaults to the two founder addresses so access is locked-down even before the
// NEXT_PUBLIC_FOUNDER_EMAILS env var is set on a deployment; env (comma-separated) overrides/extends it.
const FOUNDER_EMAILS = (
  process.env.NEXT_PUBLIC_FOUNDER_EMAILS || "projecttattva1@gmail.com,sangam.d@northeastern.edu,tanmaysangam018@gmail.com"
)
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

// The on-device unlock is a dev convenience and must NEVER work on a public URL. Only true localhost.
function hostIsLocalhost(): boolean {
  if (typeof window === "undefined") return false;
  return /^(localhost|127\.0\.0\.1|0\.0\.0\.0|::1|\[::1\])$/.test(window.location.hostname);
}

export default function House() {
  const { user, ready, configured } = useAuth();
  const [unlocked, setUnlocked] = useState(false);
  const [isLocalhost, setIsLocalhost] = useState(false);
  useEffect(() => {
    try { setUnlocked(localStorage.getItem("cofounder:founder") === "1"); } catch { /* ignore */ }
    setIsLocalhost(hostIsLocalhost());
  }, []);

  // Founder gate — secure-by-default on every deployment:
  //  • Supabase configured → ONLY an allow-listed founder email gets in (the real guard).
  //  • Not configured + localhost → on-device unlock (dev convenience, the founder's own machine).
  //  • Not configured + deployed (public URL) → LOCKED. The on-device unlock cannot fire off localhost,
  //    so a stranger can never reach the House; founder access on a live site needs sign-in.
  const isFounder = configured
    ? !!user && !user.guest && FOUNDER_EMAILS.includes(user.email.toLowerCase())
    : isLocalhost && unlocked;

  // ── Ambient House conversation (competitor.inc growing itself) ──
  const [speaker, setSpeaker] = useState<Turn | null>(null);
  const [transcript, setTranscript] = useState<Turn[]>([]);
  const ctxRef = useRef<BanterCtx>({ company: "competitor.inc", idea: "the honest AI co-founder", working: true });
  const queueRef = useRef<Turn[]>([]);
  const lastIdRef = useRef<number | undefined>(undefined);
  // True while a founder directive is streaming a real (Sonnet) reply — pause the ambient banter so
  // it doesn't talk over the agent actually responding.
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!isFounder) return;
    const tick = () => {
      if (busyRef.current) return;
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
    tick();
    const iv = setInterval(tick, 3400);
    return () => clearInterval(iv);
  }, [isFounder]);

  const spotlight = useMemo<AgentRole | null>(() => speaker?.role ?? null, [speaker]);
  const feedRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [transcript]);

  // ── Founder → crew directives (you tell the agents what to do next) ──
  const [directive, setDirective] = useState("");
  const [target, setTarget] = useState<AgentRole>("ceo");
  const [directives, setDirectives] = useState<{ text: string; role: AgentRole; at: number }[]>([]);
  useEffect(() => {
    try { const raw = localStorage.getItem("cofounder:house:directives"); if (raw) setDirectives(JSON.parse(raw)); } catch { /* ignore */ }
  }, []);
  const sendDirective = async () => {
    const text = directive.trim();
    if (!text || busyRef.current) return;
    const role = target;
    const entry = { text, role, at: Date.now() };
    setDirectives((d) => {
      const next = [entry, ...d].slice(0, 50);
      try { localStorage.setItem("cofounder:house:directives", JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
    setDirective("");
    busyRef.current = true;
    setBusy(true);

    // The addressed agent answers for real (Sonnet 4.6 via /api/engine) in its own voice + playbook,
    // about competitor.inc itself (customer zero). Streamed onto the floor. Consequential moves
    // (spend, outreach, posting, deploys) it drafts and queues for your sign-off — never auto-ships.
    const a = AGENTS[role];
    const soul =
      `You are ${a.name}, the ${a.label} agent at competitor.inc — the proof-first AI co-founder. ` +
      `Right now you're working on competitor.inc ITSELF (customer zero), not a user's company. Your playbook: ${a.playbook}. ` +
      `Your responsibilities: ${a.responsibilities.join("; ")}. ` +
      (a.objections ? `Reassure these common worries when relevant: ${a.objections.join("; ")}. ` : "") +
      `Reply in-character: concise, specific, action-oriented — name the concrete next steps you'd take. ` +
      `Anything consequential (spending money, outreach, posting publicly, deploying) you DRAFT and queue for the founder's approval — say so; never claim you already shipped it.`;

    // Streaming bubble: append one floor entry for this agent and update it live as tokens arrive.
    setTranscript((t) => [...t, { role, text: "…" }].slice(-40));
    const update = (txt: string) => {
      setSpeaker({ role, text: txt });
      setTranscript((t) => { const copy = t.slice(); copy[copy.length - 1] = { role, text: txt }; return copy; });
    };

    try {
      const res = await fetch("/api/engine", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: "chat",
          company: { name: "competitor.inc", idea: "the proof-first AI co-founder that validates demand before building" },
          message: text,
          soul,
          byok: getByok() ?? undefined,
        }),
      });
      const consequential = !!res.headers.get("x-approval");
      let acc = "";
      if (!res.body) {
        const d = await res.json().catch(() => ({} as { reply?: string }));
        acc = d.reply ?? "On it.";
        update(acc);
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
      // Honest human-in-the-loop signal: a consequential ask is flagged as waiting on the founder.
      if (consequential) {
        setTranscript((t) => [...t, { role, text: "🔔 Queued for your approval — nothing consequential ships without your yes." }].slice(-40));
      }
    } catch {
      update("I couldn't reach the engine just now — try again?");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  // ── Gate screens ────────────────────────────────────────────────
  if (!ready) {
    return <div className="grid min-h-screen place-items-center bg-bg"><Loader2 className="animate-spin text-muted-2" size={28} /></div>;
  }
  if (!isFounder) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg mesh px-6">
        <div className="clay-panel w-full max-w-md p-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-surface-2 text-muted"><Lock size={26} /></span>
          <h1 className="mt-5 text-2xl font-bold">The House is private</h1>
          <p className="mt-2 text-sm text-muted">
            This is competitor.inc&apos;s own internal floor — founder only. Users never see it.
          </p>
          {configured ? (
            <Link href="/login" className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-coral px-5 py-2.5 text-sm font-semibold text-bg transition hover:brightness-110">
              <KeyRound size={15} /> Sign in as the founder
            </Link>
          ) : isLocalhost ? (
            <button
              onClick={() => { try { localStorage.setItem("cofounder:founder", "1"); } catch { /* ignore */ } setUnlocked(true); }}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-coral px-5 py-2.5 text-sm font-semibold text-bg transition hover:brightness-110"
            >
              <KeyRound size={15} /> Unlock on this device
            </button>
          ) : (
            <div className="mt-6 rounded-xl border border-border bg-surface/60 px-4 py-3 text-sm text-muted">
              Founder sign-in isn&apos;t enabled on this deployment yet. The House stays locked on public
              URLs by design — no stranger can open it.
            </div>
          )}
          <p className="mt-4 text-[11px] text-muted-2">
            {configured
              ? "Access is restricted to the founder email allow-list."
              : isLocalhost
              ? "On-device unlock — your machine only. On any deployed site, access requires founder sign-in."
              : "Locked on deployed sites until founder auth is enabled; the on-device unlock works only on localhost."}
          </p>
          <Link href="/" className="mt-6 inline-flex items-center gap-2 text-xs text-muted-2 transition hover:text-text"><ArrowLeft size={13} /> Home</Link>
        </div>
      </div>
    );
  }

  // ── The House floor (founder view) ─────────────────────────────
  return (
    <main id="main" className="relative h-[100dvh] w-full overflow-hidden bg-bg mesh">
      <div className="absolute inset-0">
        <DelegationScene phase="working" spotlight={spotlight} speech={speaker} vivid faces />
      </div>

      <header className="glass-nav absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2 text-muted transition hover:text-text">
              <ArrowLeft size={16} /><span className="text-sm">Dashboard</span>
            </Link>
            <span className="text-muted-2">/</span>
            <div className="flex items-center gap-2 font-mono text-sm font-bold tracking-tight">
              <LogoMark size={22} /><span>The House</span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-amber/40 bg-amber/10 px-2 py-0.5 text-[10px] font-medium text-amber">
              <Lock size={9} /> private
            </span>
          </div>
          <span className="hidden text-xs text-muted-2 sm:inline">competitor.inc, run by its own agents</span>
        </div>
      </header>

      {/* Founder command bar — tell the crew what to do next */}
      <div className="pointer-events-auto absolute left-1/2 top-20 z-20 w-[min(92vw,40rem)] -translate-x-1/2">
        <div className="clay-panel p-3">
          <div className="flex items-center gap-2">
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value as AgentRole)}
              aria-label="Choose which agent to direct"
              className="shrink-0 rounded-lg border border-border bg-surface px-2.5 py-2 text-xs font-medium outline-none"
            >
              {DELEGATION.map((a) => (
                <option key={a.role} value={a.role}>{a.name}</option>
              ))}
            </select>
            <input
              value={directive}
              onChange={(e) => setDirective(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendDirective()}
              disabled={busy}
              placeholder={busy ? `${AGENTS[target].name} is working…` : "Tell the crew what to do next…"}
              aria-label="Command the crew"
              className="w-full rounded-lg bg-bg/60 px-3 py-2 text-sm outline-none placeholder:text-muted-2 disabled:opacity-60"
            />
            <button
              onClick={sendDirective}
              disabled={!directive.trim() || busy}
              aria-label="Send directive"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-coral text-bg transition hover:brightness-110 disabled:opacity-40"
            >
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>
          {directives.length > 0 && (
            <div className="mt-2 max-h-24 space-y-1 overflow-y-auto border-t border-border pt-2">
              {directives.slice(0, 5).map((d, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[11px]">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: BY_ROLE[d.role].color }} />
                  <span className="shrink-0 font-mono text-text">{BY_ROLE[d.role].name}</span>
                  <span className="truncate text-muted-2">{d.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Crew (vivid) — bottom left */}
      <aside className="glass-panel pointer-events-auto absolute bottom-4 left-4 z-20 w-[17rem] max-w-[calc(100vw-2rem)] rounded-2xl p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-2">The House crew</h2>
        <ul className="mt-3 space-y-2.5">
          {DELEGATION.map((a) => {
            const active = spotlight === a.role;
            return (
              <li key={a.role} className="flex items-start gap-2.5">
                <span
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-white/20"
                  style={{ background: a.color, boxShadow: active ? `0 0 0 3px ${a.color}55` : undefined }}
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium leading-tight">
                    {a.name} <span className="text-muted-2">· {a.label}</span>
                    {active && <span className="ml-1.5 text-[10px] text-text">● speaking</span>}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 border-t border-border pt-2.5 text-[11px] leading-relaxed text-muted-2">
          Customer zero — we grow competitor.inc with its own crew. Consequential moves wait for your yes.
        </p>
      </aside>

      {/* House conversation (claymorphism) — bottom right */}
      <div className="pointer-events-auto absolute bottom-4 right-4 z-20 w-[22rem] max-w-[calc(100vw-2rem)]">
        <div className="clay-panel flex max-h-[46vh] flex-col p-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-2">
              <MessagesSquare size={13} /> The House floor
            </h2>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-2">
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-text" /> live
            </span>
          </div>
          <div ref={feedRef} className="mt-3 flex-1 space-y-2.5 overflow-y-auto pr-1">
            {transcript.length === 0 ? (
              <p className="text-[11px] text-muted-2">The crew is settling in…</p>
            ) : (
              transcript.map((t, i) => {
                const a = BY_ROLE[t.role];
                return (
                  <div key={i} className="flex items-start gap-2">
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-white/15" style={{ background: a.color }} />
                    <div className="min-w-0 text-[12px] leading-snug">
                      <span className="font-mono text-[11px] font-semibold text-text">{a.name}</span>
                      <span className="text-muted"> {t.text}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
