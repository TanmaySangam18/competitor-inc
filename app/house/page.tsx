"use client";

// /house — "The Founder Console": competitor.inc's own private cockpit. Founder-only, gated.
// The old 3D "moving agents" floor (DelegationScene + ambient banter) was RETIRED — a real software
// company doesn't ship a toy office. This is a clean index into the genuine internal tooling: the
// receipted revenue ledger, the pipeline, the metrics board, the cohort view, and the funding pack.

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, KeyRound, Landmark, LineChart, Loader2, Lock, Receipt, Users } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { useAuth } from "@/lib/engine/useAuth";
import { FOUNDER_EMAILS } from "@/lib/engine/founders";
import { SignupsWidget } from "@/components/house/SignupsWidget";

// The on-device unlock is a dev convenience and must NEVER work on a public URL. Only true localhost.
function hostIsLocalhost(): boolean {
  if (typeof window === "undefined") return false;
  return /^(localhost|127\.0\.0\.1|0\.0\.0\.0|::1|\[::1\])$/.test(window.location.hostname);
}

// The real internal tooling — each is its own gated page under /house.
const TOOLS: { href: string; title: string; desc: string; icon: typeof Receipt }[] = [
  { href: "/house/proof", title: "Proof & receipts", desc: "The private, receipted revenue ledger: real numbers only, no projected fiction.", icon: Receipt },
  { href: "/house/ledger", title: "Revenue pipeline", desc: "The cohort-owner pipeline toward $10K MRR.", icon: LineChart },
  { href: "/house/board", title: "Metrics board", desc: "The live KPI board (secret-gated).", icon: BarChart3 },
  { href: "/house/cohort", title: "Cohort", desc: "Cohort view with sample data.", icon: Users },
  { href: "/house/funding", title: "Funding pack", desc: "The private founder funding pack.", icon: Landmark },
];

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
            This is competitor.inc&apos;s own internal console — founder only. Users never see it.
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

  // ── The Founder Console (founder view) ─────────────────────────────
  return (
    <main id="main" className="relative min-h-[100dvh] w-full bg-bg mesh">
      <header className="glass-nav sticky top-0 z-20">
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
          <span className="hidden text-xs text-muted-2 sm:inline">competitor.inc — founder console</span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-10 lg:pr-72">
        <h1 className="text-2xl font-bold">Founder console</h1>
        <p className="mt-1 max-w-xl text-sm text-muted">
          competitor.inc&apos;s own private cockpit — the real, receipted internals. Every number here is
          measured, never projected.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((t) => {
            const Icon = t.icon;
            return (
              <Link key={t.href} href={t.href} className="clay-panel group p-5 transition hover:brightness-105">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-surface-2 text-text"><Icon size={18} /></span>
                <h2 className="mt-3 text-sm font-semibold">{t.title}</h2>
                <p className="mt-1 text-[13px] leading-snug text-muted-2">{t.desc}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Founder-only launch metric — floats top-right (its own absolute positioning). */}
      <SignupsWidget app="lockin" label="Lockin signups" />
    </main>
  );
}
