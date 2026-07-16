"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FlaskConical,
  Loader2,
  X,
  Moon,
  ChevronDown,
  Plus,
  Trash2,
  Settings,
  Zap,
  Lock,
} from "lucide-react";
import { useEngine } from "@/lib/engine/useEngine";
import { EngineProvider, useEngineContext } from "@/lib/engine/EngineContext";
import { LogoMark } from "@/components/Logo";
import { CompanyLogo } from "@/components/CompanyLogo";
import ActionBell from "@/components/ActionBell";
import EntitlementNotice from "@/components/EntitlementNotice";
import GuestSavePrompt from "@/components/GuestSavePrompt";
import DemandRadarPanel from "@/components/DemandRadarPanel";
import DemandTestPanel from "@/components/DemandTestPanel";
import MomTestKit from "@/components/MomTestKit";
import BringYourKeysNudge from "@/components/dashboard/BringYourKeysNudge";
import { SelfEnrichPanel } from "@/components/SelfEnrichPanel";
import { Onboarding } from "@/components/dashboard/Onboarding";
import { DashSidebar } from "@/components/dashboard/DashSidebar";
import { Stream } from "@/components/stream/Stream";
import { useAuth } from "@/lib/engine/useAuth";
import { billingLive, checkEntitled } from "@/lib/engine/billing";
import { isFounderEmail } from "@/lib/engine/founders";
import { waitlistGateOn, premiumUnlocked, companyCreateLocked } from "@/lib/engine/access-gate";
import { getTrialStart } from "@/lib/engine/trial";

const verdictStyle = {
  strong: { ring: "border-black/30 bg-black/[0.06]", text: "text-text", label: "strong signal" },
  mixed: { ring: "border-black/15 bg-black/[0.03]", text: "text-muted", label: "mixed signal" },
  weak: { ring: "border-black/10 bg-transparent", text: "text-muted-2", label: "weak signal" },
} as const;

// Monochrome signals: meaning via brightness/fill — solid white (good) → gray → hollow (bad).
const signalStyle = {
  positive: { dot: "bg-text", text: "text-text" },
  weak: { dot: "bg-muted", text: "text-muted" },
  negative: { dot: "border border-muted-2", text: "text-muted-2" },
} as const;

export default function Dashboard() {
  // ONE engine for the whole dashboard subtree (incl. the CrewBox rendered inside it). See EngineContext.
  return (
    <EngineProvider>
      <DashboardInner />
    </EngineProvider>
  );
}

function DashboardInner() {
  const r = useEngineContext();
  const router = useRouter();
  const { user } = useAuth();

  // Value-first funnel: building & watching the crew work is FREE for everyone. The paywall moves
  // DOWNSTREAM — to revealing the live site (the "product is live" card in Operating). A founder
  // watches their idea get validated, sees the crew ship a REAL deployed site, *then* unlocks the
  // link by paying. That's a far stronger "pay now" moment than a cold checkout (Cialdini: commitment
  // + the endowment effect — it's already theirs, they just can't open it yet).
  const [entitled, setEntitled] = useState(false);
  useEffect(() => {
    // Founder full access: an allow-listed founder dogfoods the full paid product (build + reveal +
    // operate) at $0 — "customer #1". Bypasses the paywall regardless of billing state. (Client-side is
    // fine: it only unmasks a link the founder already owns; nothing chargeable rides on it.)
    if (isFounderEmail(user?.email)) {
      setEntitled(true);
      return;
    }
    // Reveal the live link to anyone who already pays — and, until billing is live, to everyone (so
    // the pre-launch demo shows real, openable sites). When billing is live, gate on real entitlement.
    if (!billingLive()) {
      setEntitled(true);
      return;
    }
    let alive = true;
    checkEntitled(user?.email).then((e) => {
      if (alive) setEntitled(e);
    });
    return () => {
      alive = false;
    };
  }, [user?.email]);

  // Reverse-trial + premium gate (CPO tiering). OFF unless NEXT_PUBLIC_WAITLIST_GATE=1, so the current
  // demo is unaffected. premiumUnlocked = founder OR real-paid OR an active trial → autopilot + real
  // actions. Read the trial clock client-side after hydration (re-read when the company list changes so a
  // just-created first company flips it on).
  const gateOn = waitlistGateOn(process.env.NEXT_PUBLIC_WAITLIST_GATE);
  const [trialStartedAt, setTrialStartedAt] = useState<number | null>(null);
  useEffect(() => {
    setTrialStartedAt(getTrialStart());
  }, [r.companies.length, r.hydrated]);
  const paid = billingLive() ? entitled : false;
  const premium = premiumUnlocked({ founder: isFounderEmail(user?.email), paid, trialStartedAt });

  // Approving a build ships the MVP; the founder stays on the dashboard, where the live CrewBox + Glass Box
  // now show the crew going to work (no separate full-page office). The reveal is where they pay.
  const goBuild = async () => {
    r.decideBuild(true);
    router.push("/dashboard");
  };

  if (!r.hydrated) {
    return (
      <div className="grid min-h-screen place-items-center text-muted-2">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div id="main" className="flex h-[100dvh] overflow-hidden">
      <DashSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <TopBar r={r} premium={premium} gateOn={gateOn} />
      <SelfEnrichPanel />
      {r.blocked && (
        <div className="mx-auto max-w-6xl px-6 pt-4">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-amber/30 bg-amber/[0.06] px-4 py-3 text-sm">
            <span className="text-amber">{r.blocked}</span>
            <div className="flex shrink-0 items-center gap-2">
              <Link href="/dashboard/settings" className="rounded-lg bg-amber/15 px-3 py-1.5 text-xs font-medium text-amber transition hover:bg-amber/25">
                Connect keys
              </Link>
              <button onClick={r.clearBlocked} aria-label="Dismiss" className="text-muted-2 transition hover:text-text">
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
      {r.company && !r.blocked && <BringYourKeysNudge />}
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col overflow-hidden px-6 py-5">
        <EntitlementNotice email={user?.email} />
        {r.company?.status === "operating" ? (
          <div className="min-h-0 flex-1 overflow-y-auto">
            {/* THE STREAM (Block A) — the one conversational operating surface; replaced the cockpit. */}
            <Stream r={r} entitled={entitled} userEmail={user?.email} trialStartedAt={trialStartedAt} />
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            {!r.company && (
              companyCreateLocked({ gateOn, founder: isFounderEmail(user?.email), paid, currentCount: r.companies.length })
                ? <UpgradeToAddCompany count={r.companies.length} onBack={() => r.switchCompany(r.companies[0]?.id ?? null)} />
                : <Onboarding onSubmit={r.createCompany} hasOthers={r.companies.length > 0} onDemo={r.loadDemo} onImport={r.importCompany} />
            )}
            {r.company?.status === "validating" && <ValidationRunning idea={r.company.idea} />}
            {r.company?.status === "validated" && <ValidationGate r={r} onBuild={goBuild} />}
            {r.company?.status === "rejected" && <Rejected r={r} onBuild={goBuild} />}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

/* ── Upgrade prompt: 2nd company (the value metric) ──────────── */
function UpgradeToAddCompany({ count, onBack }: { count: number; onBack: () => void }) {
  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-coral/30 bg-coral/[0.05] p-8 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-coral/12 text-coral"><Lock size={22} /></div>
      <h1 className="mt-4 text-2xl font-bold">One company on the free plan</h1>
      <p className="mt-2 text-sm text-muted">
        You&apos;ve got {count === 1 ? "a company" : `${count} companies`} running. A portfolio of companies is a
        premium feature — join the waitlist to run more (and keep autopilot going).
      </p>
      <div className="mt-5 flex items-center justify-center gap-2.5">
        <a href="/join" className="hover-lift rounded-xl bg-coral px-5 py-2.5 text-sm font-semibold text-bg transition hover:brightness-110">Join the waitlist</a>
        <button onClick={onBack} className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted transition hover:text-text">Back to my company</button>
      </div>
    </div>
  );
}

/* ── Top bar ─────────────────────────────────────────────────── */
function TopBar({ r, premium, gateOn }: { r: ReturnType<typeof useEngine>; premium: boolean; gateOn: boolean }) {
  const { user, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 font-mono text-lg font-bold tracking-tight">
            <LogoMark size={32} />
            <span className="hidden sm:inline">
              competitor.inc
              <span aria-hidden className="blink-block ml-0.5 inline-block h-[0.9em] w-[7px] translate-y-[2px] bg-text" />
            </span>
          </Link>
          {r.companies.length > 0 && <CompanySwitcher r={r} />}
        </div>
        <div className="flex items-center gap-2">
          {r.company?.status === "operating" && (
            gateOn && !premium ? (
              <a
                href="/join"
                title="Autopilot is a premium feature — start your trial or upgrade"
                className="hidden h-9 items-center gap-1.5 rounded-lg border border-coral/40 px-3 text-xs font-medium text-coral transition hover:bg-coral/10 sm:flex"
              >
                <Lock size={13} /> Autopilot — upgrade
              </a>
            ) : (
              <AutopilotToggle on={r.autopilot} onToggle={() => r.setAutopilot(!r.autopilot)} paused={r.autopilotPaused} />
            )
          )}
          {user && !user.guest && (
            <button
              onClick={() => void signOut()}
              title={`Signed in as ${user.email}`}
              className="hidden h-9 items-center rounded-lg border border-border px-3 text-xs text-muted transition hover:text-text sm:flex"
            >
              Sign out
            </button>
          )}
          <ActionBell
            pendingApprovals={r.pendingApprovals.length}
            companyStatus={r.company?.status}
            companyName={r.company?.name}
          />
          <Link
            href="/dashboard/settings"
            className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted transition hover:text-text"
            aria-label="Settings"
          >
            <Settings size={16} />
          </Link>
        </div>
      </div>
    </header>
  );
}

function CompanySwitcher({ r }: { r: ReturnType<typeof useEngine> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm transition hover:bg-surface-2"
      >
        <span className="max-w-[140px] truncate">{r.company?.name ?? "Choose company"}</span>
        <ChevronDown size={14} className="text-muted-2" />
      </button>
      {open && (
        <div className="absolute left-0 top-11 z-50 w-64 overflow-hidden rounded-xl glass-panel shadow-2xl">
          <div className="max-h-72 overflow-y-auto p-1.5">
            {r.companies.map((c) => (
              <div
                key={c.id}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition hover:bg-surface-2 ${
                  c.id === r.activeId ? "bg-surface-2" : ""
                }`}
              >
                <button onClick={() => { r.switchCompany(c.id); setOpen(false); }} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                  <CompanyLogo name={c.name} size={24} className="shrink-0 rounded-md" />
                  <span className="min-w-0">
                    <span className="block truncate">{c.name}</span>
                    <span className="block truncate text-[11px] text-muted-2">{c.status}</span>
                  </span>
                </button>
                <button
                  onClick={() => r.deleteCompany(c.id)}
                  className="text-muted-2 transition hover:text-coral"
                  aria-label={`Delete ${c.name}`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => { r.switchCompany(null); setOpen(false); }}
            className="flex w-full items-center gap-2 border-t border-border px-3.5 py-2.5 text-sm text-coral transition hover:bg-surface-2"
          >
            <Plus size={15} /> New company
          </button>
        </div>
      )}
    </div>
  );
}

function AutopilotToggle({ on, onToggle, paused }: { on: boolean; onToggle: () => void; paused?: boolean }) {
  return (
    <button
      onClick={onToggle}
      title={paused ? "Autopilot paused — clear your Approval Inbox to resume" : on ? "Autopilot on — tap to take over and drive manually" : "You're driving — tap to hand back to autopilot"}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
        paused
          ? "border-amber/40 bg-amber/10 text-amber"
          : on
          ? "border-mint/40 bg-mint/10 text-mint"
          : "border-coral/40 bg-coral/10 text-coral"
      }`}
      aria-pressed={on}
    >
      <Zap size={13} className={paused ? "" : on ? "fill-mint" : ""} />
      {paused ? "Autopilot paused" : on ? "Autopilot on" : "You're driving"}
    </button>
  );
}

/* ── Validation running ──────────────────────────────────────── */
// Honest framing: this is a fast AI estimate, not a live test. (A real live test — deploy a page,
// collect real signups over time — is the separate, opt-in path.)
const VALIDATION_STEPS = [
  "Parsing your idea",
  "Mapping the market & look-alike companies",
  "Modeling landing-page + waitlist demand",
  "Estimating paid-ad & search signals",
  "Pressure-testing the riskiest assumption",
  "Weighing the evidence — no thumb on the scale",
  "Scoring the signal & writing the honest verdict",
];

function ValidationRunning({ idea }: { idea: string }) {
  // Walk the steps over the real validate window (~1.9s) so the checkmarks reflect actual progress
  // instead of all showing "done" instantly (Nielsen H1).
  const [completed, setCompleted] = useState(0);
  useEffect(() => {
    if (completed >= VALIDATION_STEPS.length) return;
    const t = setTimeout(() => setCompleted((c) => c + 1), completed === 0 ? 280 : 360);
    return () => clearTimeout(t);
  }, [completed]);

  return (
    <div className="mx-auto mt-12 max-w-xl">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Checking demand — before a line of code</h2>
        <p className="mt-2 text-sm text-muted">&ldquo;{idea}&rdquo;</p>
      </div>
      {/* Live terminal — the crew working in real time. Alive, but honest: the copy describes what the
          model actually does (estimates the signal), and the footer says plainly we don't fake a number. */}
      <div className="mt-7 overflow-hidden rounded-2xl border border-border bg-bg/70 font-mono text-[13px] shadow-sm">
        <div className="flex items-center gap-2 border-b border-border bg-surface/40 px-4 py-2.5">
          <span className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-coral/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-mint/60" />
          </span>
          <span className="ml-1 text-[11px] text-muted-2">validation-gate · live</span>
          <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-mint">
            <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-mint" /> working
          </span>
        </div>
        <div className="space-y-1.5 px-4 py-4">
          {VALIDATION_STEPS.map((s, i) => {
            if (i > completed) return null; // reveal line-by-line, terminal style
            const isDone = i < completed;
            const isCurrent = i === completed;
            return (
              <motion.div
                key={s}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-2.5"
              >
                <span className={isDone ? "text-mint" : "text-coral"}>{isDone ? "✓" : "›"}</span>
                <span className={isDone ? "text-muted" : "text-text"}>
                  {s}
                  {isCurrent && <span className="ml-1 inline-block animate-pulse">▋</span>}
                </span>
              </motion.div>
            );
          })}
        </div>
        <div className="border-t border-border px-4 py-2.5 text-[11px] text-muted-2">
          An AI estimate to start — we model the signal honestly and never fabricate a number. The real demand test runs next.
        </div>
      </div>
    </div>
  );
}

/* ── Validation Gate ─────────────────────────────────────────── */
function ValidationGate({ r, onBuild }: { r: ReturnType<typeof useEngine>; onBuild: () => void }) {
  const v = r.company!.validation!;
  const vs = verdictStyle[v.verdict];
  const recommendHold = v.verdict === "weak";
  // Imported products are already built — the next move is distribution, not a build.
  const imported = r.company!.product?.status === "live";
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto mt-6 max-w-2xl">
      {/* Real, cited web demand comes FIRST — the honest evidence. The AI estimate below is the fast read. */}
      <div className="mb-5">
        <DemandRadarPanel initialIdea={r.company!.idea} autoRun />
      </div>

      <div className={`rounded-3xl border p-7 ${vs.ring}`}>
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 text-sm font-semibold ${vs.text}`}>
            <FlaskConical size={16} /> AI READ · {vs.label}
            <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-2">estimate</span>
          </div>
          <div className="text-right">
            <div className={`font-display text-2xl font-bold ${vs.text}`}>{v.confidence}%</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-2">confidence</div>
          </div>
        </div>

        <div className="mt-6 space-y-2.5">
          {v.experiments.map((e) => {
            const ss = signalStyle[e.signal] ?? signalStyle.weak; // defensive: never white-screen on an unexpected signal
            return (
              <div key={e.key} className="flex items-center gap-3 rounded-2xl border border-border bg-bg/40 px-4 py-3">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${ss.dot}`} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{e.label}</div>
                  <div className="truncate text-xs text-muted-2">{e.detail}</div>
                </div>
                <div className={`shrink-0 pl-2 text-right text-xs font-medium ${ss.text}`}>{e.metric}</div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex items-start gap-2.5 rounded-2xl glass-panel px-4 py-3">
          <LogoMark size={24} className="mt-0.5 shrink-0" />
          <p className="text-sm text-muted">{v.recommendation}</p>
        </div>

        {recommendHold && (
          <p className="mt-4 rounded-2xl border border-mint/25 bg-mint/[0.05] px-4 py-3 text-sm text-muted">
            <span className="font-medium text-mint">A &ldquo;not yet&rdquo; is a win.</span> You just learned it
            cheaply — before months and your savings went in. Tweak the idea or the audience and run the gate
            again; that&apos;s the whole point.
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {recommendHold ? (
            <>
              <button onClick={() => r.decideBuild(false)} className="flex-1 rounded-xl bg-coral px-5 py-3 font-semibold text-bg transition hover:brightness-110">
                Hold — I agree
              </button>
              <button onClick={onBuild} className="rounded-xl border border-border px-5 py-3 font-medium text-muted transition hover:text-text">
                {imported ? "Grow it anyway" : "Build anyway"}
              </button>
            </>
          ) : (
            <>
              <button onClick={onBuild} className="flex-1 rounded-xl bg-coral px-5 py-3 font-semibold text-bg transition hover:brightness-110">
                {imported ? "Start getting customers" : "Build it"}
              </button>
              <button onClick={() => r.decideBuild(false)} className="rounded-xl border border-border px-5 py-3 font-medium text-muted transition hover:text-text">
                Hold for now
              </button>
            </>
          )}
        </div>
        {/* Set the expectation BEFORE the reveal paywall — never surprise them at the door. Only when
            billing is actually live; during the free pre-launch there's no wall, so we say nothing. */}
        {!imported && !recommendHold && billingLive() && (
          <p className="mt-3 text-center text-[11px] text-muted-2">
            Building is free — you&apos;ll watch the crew ship a real, working site. Opening the live link is the paid unlock.
          </p>
        )}
      </div>
      <GuestSavePrompt context="save this validation" />
      <p className="mt-3 text-center text-xs text-muted-2">
        These are <span className="text-muted">AI estimates</span> from your idea — a fast read, not a live test with real signups yet. You decide; competitor.inc only builds once you approve.
      </p>
      <MomTestKit name={r.company!.name} idea={r.company!.idea} />
      <DemandTestPanel slug={r.company!.slug} idea={r.company!.idea} />
    </motion.div>
  );
}

/* ── Rejected ────────────────────────────────────────────────── */
function Rejected({ r, onBuild }: { r: ReturnType<typeof useEngine>; onBuild: () => void }) {
  return (
    <div className="mx-auto mt-16 max-w-md text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber/12 text-amber">
        <Moon size={26} />
      </span>
      <h2 className="mt-5 text-2xl font-bold">Held — nothing got built</h2>
      <p className="mt-3 text-sm text-muted">
        No compute spent on a product nobody asked for yet. Tweak the idea and test again, or build anyway — your call.
      </p>
      <div className="mt-7 flex justify-center gap-3">
        <button onClick={onBuild} className="rounded-xl bg-coral px-5 py-2.5 text-sm font-semibold text-bg transition hover:brightness-110">
          Build anyway
        </button>
        <button onClick={() => r.switchCompany(null)} className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted transition hover:text-text">
          <ArrowLeft size={15} /> New idea
        </button>
      </div>
    </div>
  );
}

