"use client";

// /house — "The House": competitor.inc, run by its own agent crew (customer zero). PRIVATE — founder
// only. The Office (/delegation) builds the USER's company; the House is competitor.inc building and
// growing ITSELF. Same 3D floor as the Office, but vivid (colorful figures with faces) and gated.

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, KeyRound, Loader2, Lock, MessagesSquare } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { useAuth } from "@/lib/roomie/useAuth";
import { DELEGATION, type DelegationAgent } from "@/lib/roomie/delegation";
import { pickExchange, type BanterCtx, type Turn } from "@/lib/roomie/banter";
import type { AgentRole } from "@/lib/roomie/types";

const DelegationScene = dynamic(() => import("../delegation/DelegationScene"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center">
      <Loader2 className="animate-spin text-muted-2" size={28} />
    </div>
  ),
});

const BY_ROLE = Object.fromEntries(DELEGATION.map((a) => [a.role, a])) as Record<AgentRole, DelegationAgent>;
const FOUNDER_EMAILS = (process.env.NEXT_PUBLIC_FOUNDER_EMAILS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export default function House() {
  const { user, ready, configured } = useAuth();
  const [unlocked, setUnlocked] = useState(false);
  useEffect(() => {
    try { setUnlocked(localStorage.getItem("roomie:founder") === "1"); } catch { /* ignore */ }
  }, []);

  // Founder gate. Deployed (Supabase configured) → only an allow-listed founder email gets in.
  // Local/offline → an on-device unlock (the founder's own machine) — there are no public links to
  // this page, and real enforcement is the email allow-list + a route guard once deployed.
  const isFounder = configured
    ? !!user && !user.guest && FOUNDER_EMAILS.includes(user.email.toLowerCase())
    : unlocked;

  // ── Ambient House conversation (competitor.inc growing itself) ──
  const [speaker, setSpeaker] = useState<Turn | null>(null);
  const [transcript, setTranscript] = useState<Turn[]>([]);
  const ctxRef = useRef<BanterCtx>({ company: "competitor.inc", idea: "the honest AI co-founder", working: true });
  const queueRef = useRef<Turn[]>([]);
  const lastIdRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!isFounder) return;
    const tick = () => {
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
          ) : (
            <button
              onClick={() => { try { localStorage.setItem("roomie:founder", "1"); } catch { /* ignore */ } setUnlocked(true); }}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-coral px-5 py-2.5 text-sm font-semibold text-bg transition hover:brightness-110"
            >
              <KeyRound size={15} /> Unlock on this device
            </button>
          )}
          <p className="mt-4 text-[11px] text-muted-2">
            {configured
              ? "Access is the NEXT_PUBLIC_FOUNDER_EMAILS allow-list."
              : "Local preview unlock. When deployed, access is the founder email allow-list."}
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
