"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  FlaskConical,
  Loader2,
  Check,
  X,
  Undo2,
  Code2,
  Megaphone,
  LifeBuoy,
  TrendingUp,
  Moon,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  Plus,
  Trash2,
  Settings,
  Send,
  Zap,
  Rocket,
  Lock,
  Target,
  AlertTriangle,
  Copy,
  Eye,
  Pencil,
} from "lucide-react";
import { useEngine } from "@/lib/engine/useEngine";
import { EngineProvider, useEngineContext } from "@/lib/engine/EngineContext";
import { useConfig, getByok } from "@/lib/engine/config";
import { AGENTS, type AgentRole, type ApprovalKind, type Activity, type Company } from "@/lib/engine/types";
import { LogoMark } from "@/components/Logo";
import { CompanyLogo } from "@/components/CompanyLogo";
import ActionBell from "@/components/ActionBell";
import EntitlementNotice from "@/components/EntitlementNotice";
import GuestSavePrompt from "@/components/GuestSavePrompt";
import GTMPanel from "@/components/GTMPanel";
import GrowthPanel from "@/components/GrowthPanel";
import DemandRadarPanel from "@/components/DemandRadarPanel";
import DemandTestPanel from "@/components/DemandTestPanel";
import MomTestKit from "@/components/MomTestKit";
import BringYourKeysNudge from "@/components/dashboard/BringYourKeysNudge";
import CampaignPanel from "@/components/CampaignPanel";
import { SelfEnrichPanel } from "@/components/SelfEnrichPanel";
import { rationaleFor } from "@/lib/engine/rationale";
import { CoachCard } from "@/components/CoachCard";
import MorningBrief from "@/components/MorningBrief";
import { Onboarding } from "@/components/dashboard/Onboarding";
import { TeamRoomTab } from "@/components/dashboard/TeamRoomTab";
import { CrewBoard } from "@/components/dashboard/CrewBoard";
import { DashSidebar } from "@/components/dashboard/DashSidebar";
import { BrainTab } from "@/components/dashboard/BrainTab";
import { OperateTab } from "@/components/dashboard/OperateTab";
import { ActivityRow } from "@/components/dashboard/ActivityRow";
import { ApprovalCard } from "@/components/dashboard/ApprovalCard";
import { BarChart } from "@/components/dashboard/BarChart";
import { useAuth } from "@/lib/engine/useAuth";
import { billingLive, checkEntitled, checkoutUrlFor, checkoutLiveFor } from "@/lib/engine/billing";
import { isFounderEmail } from "@/lib/engine/founders";
import { continueLocked, previewedCount, waitlistGateOn, premiumUnlocked, trialActive, trialDaysLeft, companyCreateLocked, TRIAL_CREDITS, TRIAL_DAYS, creditsLeft } from "@/lib/engine/access-gate";
import { getTrialStart } from "@/lib/engine/trial";
import { repoFromUrl } from "@/lib/engine/hosting";
import FoundingMember from "@/components/dashboard/FoundingMember";

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

// Operate layer (EOS company-OS) — now ON by default. Set NEXT_PUBLIC_OPERATE=0 to freeze it (e.g.
// the launch build keeps it off to shrink the launch surface until v0.2.0, per the blueprint).
const OPERATE_ENABLED = process.env.NEXT_PUBLIC_OPERATE !== "0";

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
            <Operating r={r} entitled={entitled} userEmail={user?.email} trialStartedAt={trialStartedAt} />
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

// Inline rename for the company title — the auto-derived name is a starting point; the founder owns it.
// (Lives here now that the /delegation page, which used to host rename, is retired.)
function RenameTitle({ name, onRename }: { name: string; onRename: (n: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const commit = () => { const n = draft.trim(); if (n && n !== name) onRename(n); setEditing(false); };
  if (editing) {
    return (
      <span className="flex items-center gap-1.5">
        <input
          autoFocus
          value={draft}
          maxLength={60}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
          aria-label="Company name"
          className="w-56 rounded-lg border border-border bg-bg/70 px-2 py-1 text-2xl font-bold outline-none focus:border-black/30"
        />
        <button onClick={commit} aria-label="Save name" className="grid h-7 w-7 place-items-center rounded-md bg-text text-bg transition hover:brightness-110"><Check size={14} /></button>
        <button onClick={() => setEditing(false)} aria-label="Cancel rename" className="grid h-7 w-7 place-items-center rounded-md border border-border text-muted transition hover:text-text"><X size={14} /></button>
      </span>
    );
  }
  return (
    <button onClick={() => { setDraft(name); setEditing(true); }} title="Rename company" className="group flex items-center gap-2 text-left">
      <h1 className="text-3xl font-bold">{name}</h1>
      <Pencil size={14} className="opacity-0 transition group-hover:opacity-60" />
    </button>
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

/* ── Operating ───────────────────────────────────────────────── */
function Operating({ r, entitled, userEmail, trialStartedAt }: { r: ReturnType<typeof useEngine>; entitled: boolean; userEmail?: string; trialStartedAt: number | null }) {
  const c = r.company!;
  // Post-preview "continue" gate (build order #2). OFF unless NEXT_PUBLIC_WAITLIST_GATE=1, so the current
  // pre-launch demo is unaffected. Founders + truly-paid users are never gated, and an active reverse
  // trial keeps it unlocked (they're mid-taste). Once the trial ends + a product is previewed, further
  // building locks behind the waitlist — the project stays saved (the view still renders), so unlocking
  // resumes. `paid` = REAL entitlement only (billing must be live), never the billing-off demo bypass.
  const gateOn = waitlistGateOn(process.env.NEXT_PUBLIC_WAITLIST_GATE);
  const paid = billingLive() ? entitled : false;
  const locked = continueLocked({
    gateOn,
    founder: isFounderEmail(userEmail),
    paid,
    previewedCount: previewedCount(r.companies),
    trialStartedAt,
  });
  const onTrial = gateOn && !isFounderEmail(userEmail) && !paid && trialActive(trialStartedAt);
  const [blitzDone, setBlitzDone] = useState(false);
  function doBlitz() {
    r.launchBlitz();
    setBlitzDone(true);
    setTimeout(() => setBlitzDone(false), 2200);
  }
  const [tab, setTab] = useState<SecTab>("activity");
  const { config } = useConfig();
  const roles = (Object.keys(AGENTS) as AgentRole[]).filter((role) => config.agents[role]?.enabled ?? true);
  const lockedUrl = !entitled && c.product?.status === "live" ? c.product?.url : undefined;
  // Standing-authorization ledger: activities the autopilot resolved itself (tagged by resolveApproval).
  const autoRanCount = r.activities.filter((a) => a.meta?.startsWith("autopilot")).length;

  // COCKPIT V3 — "Metric hero" (founder-approved design, 2026-07-15). One enormous, honest number
  // (settled revenue — $0 until a verified receipt exists) over a live audit-ledger masthead, two flat
  // working bands (approvals · work split), then the tabbed workspace. The tab bar is STICKY at the
  // viewport bottom, so the recurring "can't reach the tabs" fault is dead structurally, not patched.
  return (
    <div className="flex flex-col gap-3">
      {/* Company strip + primary actions (fixed) */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <CompanyLogo name={c.name} size={40} className="shrink-0 rounded-xl shadow-sm" />
          <div className="min-w-0">
            <RenameTitle name={c.name} onRename={r.renameCompany} />
            <p className="max-w-md truncate text-xs text-muted">{c.idea}</p>
          </div>
          <div className="hidden sm:block"><GoalChip goal={c.growthGoal} imported={c.product?.status === "live"} onSet={r.setGrowthGoal} /></div>
        </div>
        {locked ? (
          <a href="/join" className="inline-flex items-center gap-2 rounded-xl border border-coral/40 bg-coral/[0.08] px-4 py-2.5 text-sm font-semibold text-text transition hover:brightness-110">
            <Lock size={14} className="text-coral" /> Join the waitlist to continue
          </a>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={r.revalidate} disabled={r.working !== null} title="Re-run the demand test" className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-muted transition hover:text-text disabled:opacity-50">
              {r.working === "validating" ? <><Loader2 size={15} className="animate-spin" /> Re-testing…</> : <><FlaskConical size={15} /> Re-test</>}
            </button>
            <button onClick={doBlitz} disabled={r.working !== null || blitzDone} title="Marketing drafts launch posts for your approval" className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition disabled:opacity-70 ${blitzDone ? "border-mint/40 text-mint" : "border-border text-muted hover:text-text"}`}>
              {blitzDone ? <><Check size={15} /> Drafted</> : <><Megaphone size={15} /> Accelerate</>}
            </button>
            <button onClick={r.runShift} disabled={r.working !== null} className="inline-flex items-center gap-2 rounded-xl bg-coral px-4 py-2.5 font-semibold text-bg transition hover:brightness-110 disabled:opacity-50">
              {r.working === "shift" ? <><Loader2 size={16} className="animate-spin" /> Working…</> : <><Moon size={16} /> Run</>}
            </button>
          </div>
        )}
      </div>

      {/* Slim contextual banners — only when they matter (fixed) */}
      {onTrial && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 rounded-xl border border-mint/30 bg-mint/[0.06] px-4 py-2 text-sm text-text">
          <Sparkles size={14} className="shrink-0 text-mint" />
          <span><b className="font-medium">Free trial</b> — {trialDaysLeft(trialStartedAt)} days left of full autopilot.</span>
          <a href="/join" className="ml-auto font-medium text-mint underline-offset-2 hover:underline">Upgrade →</a>
        </div>
      )}
      {r.autopilotPaused && (
        <div className="flex shrink-0 items-center gap-2 rounded-xl border border-amber/30 bg-amber/[0.06] px-4 py-2 text-sm text-amber">
          <AlertTriangle size={14} className="shrink-0" />
          Autopilot paused — {r.pendingApprovals.length} approvals waiting. Clear the inbox to resume nightly shifts.
        </div>
      )}

      {/* THE FRAME — audit-ledger masthead, the one number, and the two working bands. */}
      <div className="reveal overflow-hidden rounded-2xl border border-text/80 bg-bg">
        <AuditTicker activities={r.activities} killSwitch={r.killSwitch} />
        <MetricHero c={c} autoRan={autoRanCount} />
        <div className="grid border-t border-text/80 lg:grid-cols-[1.25fr_1fr]">
          <ApprovalsBand r={r} autoRan={autoRanCount} />
          <WorkBars activities={r.activities} />
        </div>
      </div>

      {/* The money moment — the built product's live / locked / shipping state. */}
      {c.product && c.product.status === "live" && /^https?:\/\//.test(c.product.url) ? (
        entitled ? (
          <>
            <a href={c.product.url} target="_blank" rel="noreferrer" className="group flex items-center justify-between rounded-2xl border border-mint/25 bg-mint/[0.05] px-4 py-3">
              <div className="flex min-w-0 items-center gap-2"><Rocket size={16} className="shrink-0 text-mint" /><div className="min-w-0"><div className="text-sm font-medium">Your product is live</div><div className="truncate text-xs text-mint">{c.product.url}</div></div></div>
              <span className="ml-2 shrink-0 rounded-lg border border-border px-2 py-1 text-xs text-muted transition group-hover:text-text">View ↗</span>
            </a>
            {!checkoutLiveFor("operator") && <FoundingMember tier="operator" email={userEmail} />}
          </>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-coral/30 bg-coral/[0.05] px-4 py-3">
            <div className="flex min-w-0 items-center gap-2"><Rocket size={16} className="shrink-0 text-coral" /><div className="text-sm font-medium">Built &amp; live</div><Lock size={15} className="shrink-0 text-coral" /></div>
            <a href={userEmail ? checkoutUrlFor(userEmail) : "/login"} className="flex items-center gap-2 rounded-xl bg-coral px-3 py-2 text-sm font-semibold text-bg transition hover:opacity-90">Unlock — Operator $199/mo <ArrowRight size={14} /></a>
          </div>
        )
      ) : c.product ? (
        <div className="flex items-center gap-2 rounded-2xl border border-amber/25 bg-amber/[0.05] px-4 py-3 text-sm"><Rocket size={16} className="shrink-0 text-amber" /><span>Shipping your site… <Link href="/dashboard/settings#connect-accounts" className="font-medium text-amber underline-offset-2 hover:underline">Connect keys →</Link></span></div>
      ) : null}

      {/* Workspace — one surface at a time; the sticky bar below is the frame's permanent bottom edge. */}
      <WorkspacePanel r={r} c={c} roles={roles} entitled={entitled} lockedUrl={lockedUrl} tab={tab} onTab={setTab} />
      <CockpitTabBar tab={tab} onTab={setTab} />
    </div>
  );
}

/* ── Metric-hero cockpit pieces (founder-approved design, 2026-07-15) ─────────────── */

// Count a stat up from 0 with a cubic ease-out — real values only, instant under reduced motion.
function useCountUp(end: number, ms = 900): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (end <= 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setV(Math.max(end, 0));
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min((t - t0) / ms, 1);
      setV(Math.round(end * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [end, ms]);
  return v;
}

// The masthead ticker IS the audit ledger — the latest real activity entries scrolling by. Real rows
// only: when the ledger is empty it says so instead of inventing motion.
function AuditTicker({ activities, killSwitch }: { activities: Activity[]; killSwitch: boolean }) {
  const lines = activities
    .slice(0, 14)
    .map((a) => `S${a.night} · ${AGENTS[a.agent].name.toUpperCase()} · ${a.action}${a.status === "done" ? " ✓" : a.status === "pending-approval" ? " — WAITING ON YOU" : " — CREDITED BACK"}`);
  const track = lines.join("   ···   ") + "   ···   ";
  return (
    <div className="flex items-stretch border-b border-border bg-surface/50">
      <span className="flex shrink-0 items-center gap-1.5 border-r border-border px-3 font-mono text-[10px] font-medium tracking-[0.14em] text-text">
        <span className={`live-dot inline-block h-1.5 w-1.5 rounded-full ${killSwitch ? "border border-text bg-transparent" : "bg-text"}`} />
        {killSwitch ? "HALTED" : "LEDGER"}
      </span>
      {lines.length === 0 ? (
        <span className="truncate px-3 py-2 font-mono text-[10px] tracking-wide text-muted-2">EMPTY — RUN A SHIFT AND EVERY ACTION LANDS HERE, IN ORDER</span>
      ) : (
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="marquee-track flex w-max">
            <span className="whitespace-pre px-3 py-2 font-mono text-[10px] tracking-wide text-muted">{track}</span>
            <span aria-hidden className="whitespace-pre px-3 py-2 font-mono text-[10px] tracking-wide text-muted">{track}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// The one enormous number. Settled revenue is the only number allowed this big — and it stays $0
// until real money settles. No payment rail is wired into this client engine yet, so $0 is the hard
// truth, not a placeholder: this number never moves without a verified receipt (honesty floor).
function MetricHero({ c, autoRan }: { c: Company; autoRan: number }) {
  const settled = 0;
  const goal = c.growthGoal;
  const revenueGoal = goal?.northStar === "revenue" && goal.target > 0 ? goal.target : undefined;
  const pct = revenueGoal ? Math.min((settled / revenueGoal) * 100, 100) : 0;
  const tasks = useCountUp(c.ledger.tasksDone);
  const shifts = useCountUp(c.night);
  const auto = useCountUp(autoRan);
  const heroStats = [
    { label: "Tasks done", val: String(tasks) },
    { label: "Shifts run", val: String(shifts) },
    { label: "Ran autonomously", val: String(auto) },
    // Play-money trial credits, never dollars: approving a spend deducts credits; they map to real
    // dollars only when the payment gates open.
    { label: "Trial credits left", val: `${creditsLeft(c.ledger.creditsSpent)} / ${TRIAL_CREDITS}` },
  ];
  return (
    <div className="px-5 pb-6 pt-7 sm:px-7">
      <div className="reveal font-mono text-[10px] uppercase tracking-[0.18em] text-muted">Settled revenue · trailing 30 days</div>
      <div className="reveal mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1 [animation-delay:80ms]">
        <span className="font-display text-6xl font-bold leading-none tracking-tighter sm:text-7xl">${settled.toLocaleString()}</span>
        <span className="font-mono text-xs text-muted">{revenueGoal ? `of $${revenueGoal.toLocaleString()} · ` : ""}verified receipts only — this number never moves without one</span>
      </div>
      <div className="reveal mt-6 h-0.5 w-full bg-border [animation-delay:160ms]">
        <div className="sweep h-full bg-text" style={{ width: `${Math.max(pct, 0.5)}%` }} />
      </div>
      <div className="reveal mt-5 grid grid-cols-2 gap-x-3 gap-y-4 [animation-delay:240ms] sm:grid-cols-4">
        {heroStats.map((s) => (
          <div key={s.label} className="border-l border-text/80 pl-3">
            <div className="font-display text-2xl font-bold leading-none">{s.val}</div>
            <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-muted">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Needs your OK — the left working band. Same queue + kill switch as before, flat brutalist chrome.
function ApprovalsBand({ r, autoRan }: { r: ReturnType<typeof useEngine>; autoRan: number }) {
  const n = r.pendingApprovals.length;
  return (
    <div id="approval-inbox" className="border-b border-border p-4 sm:p-5 lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between gap-2">
        <div className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-text">Needs your OK{n > 0 ? ` — ${n}` : ""}</div>
        <button
          onClick={() => r.setKillSwitch(!r.killSwitch)}
          title={r.killSwitch ? "Autonomy halted — every action queues for you. Tap to resume." : "Hard-stop the autonomous loop instantly — everything queues for you."}
          className={`border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide transition ${r.killSwitch ? "border-text bg-text text-bg" : "border-border text-muted hover:border-text hover:bg-text hover:text-bg"}`}
        >
          {r.killSwitch ? "Halted — resume" : "Kill switch"}
        </button>
      </div>
      <div className="mt-2.5 border-b border-border pb-2 font-mono text-[10px] text-muted-2">
        <span className="text-text">⚡ {autoRan} ran autonomously</span> · {n} need{n === 1 ? "s" : ""} you
      </div>
      {n === 0 ? (
        <p className="mt-3 text-xs leading-relaxed text-muted-2">
          {r.killSwitch
            ? "Kill switch engaged — the crew still proposes, but nothing executes; every action queues here for your yes."
            : "Clear — only money over caps, contracts, pricing, deletion, and launches land here."}
        </p>
      ) : (
        <div className="mt-3 grid gap-3 xl:grid-cols-2">
          {r.pendingApprovals.map((ap) => (
            <ApprovalCard key={ap.id} title={ap.title} detail={ap.detail} agent={ap.agent} kind={ap.kind} onApprove={() => r.resolveApproval(ap.id, true)} onReject={() => r.resolveApproval(ap.id, false)} />
          ))}
        </div>
      )}
    </div>
  );
}

// Where the work went — share of completed actions per role. Monochrome: value encoded in tone.
const BAR_TONES = ["bg-text", "bg-text/70", "bg-text/45", "bg-text/25"];
function WorkBars({ activities }: { activities: Activity[] }) {
  const done = activities.filter((a) => a.status === "done" && !a.undone);
  const counts = new Map<AgentRole, number>();
  for (const a of done) counts.set(a.agent, (counts.get(a.agent) ?? 0) + 1);
  const rows = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, BAR_TONES.length);
  return (
    <div className="p-4 sm:p-5">
      <div className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-text">Where the work went</div>
      {rows.length === 0 ? (
        <p className="mt-3 text-xs leading-relaxed text-muted-2">No completed work yet — the split appears after the first shift.</p>
      ) : (
        <div className="mt-3.5 space-y-3">
          {rows.map(([role, count], i) => {
            const pct = Math.round((count / done.length) * 100);
            return (
              <div key={role}>
                <div className="flex items-baseline justify-between font-mono text-[10px] text-muted">
                  <span className="uppercase tracking-[0.1em]">{AGENTS[role].name}</span>
                  <span>{pct}%</span>
                </div>
                <div className="mt-1 h-2 w-full bg-border/50">
                  <div className={`sweep h-full ${BAR_TONES[i]}`} style={{ width: `${pct}%`, animationDelay: `${350 + i * 130}ms` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// The permanent bottom edge: sticky inside the scroll viewport, so the workspace index can never be
// scrolled out of reach again (the recurring "can't reach the tabs" fault, killed structurally).
function CockpitTabBar({ tab, onTab }: { tab: SecTab; onTab: (t: SecTab) => void }) {
  return (
    <nav aria-label="Workspace sections" className="sticky bottom-0 z-30">
      <div className="flex flex-wrap overflow-hidden rounded-xl border border-text/80 bg-bg shadow-[0_-8px_24px_rgba(0,0,0,0.07)]">
        {SEC_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => onTab(t.key)}
            aria-current={t.key === tab ? "true" : undefined}
            className={`min-w-fit flex-1 border-t-2 px-2.5 py-2.5 text-center font-mono text-[10px] font-medium uppercase tracking-[0.08em] transition ${
              t.key === tab ? "border-text bg-text text-bg" : "border-transparent text-muted hover:border-text hover:text-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

/* ── Main workspace panel — one surface at a time, ONE surface per question (2026-07-15 founder
   consolidation: "if two things solve the same problem, there should only be one"). 10 tabs → 6:
   Activity(+History) · Brief(+Operate) · Team(absorbed Agents) · Sell(Growth+Marketing) ·
   Chat(=the team room) · Knowledge. Each answers exactly one founder question. ── */
type SecTab = "activity" | "brief" | "team" | "sell" | "chat" | "knowledge";

const SEC_TABS: { key: SecTab; label: string }[] = [
  { key: "activity", label: "Activity" }, // what happened — the ledger + per-shift trends
  { key: "brief", label: "Brief" }, // what should I do — today (brief/coach) + the quarter (rocks/issues)
  { key: "team", label: "Team" }, // who's working on what — the live work board
  { key: "sell", label: "Sell" }, // make money — plan → campaigns → funnel/attribution
  { key: "chat", label: "Chat" }, // talk to the company — direct any leader, sign mandates
  { key: "knowledge", label: "Knowledge" }, // why it decided — the company brain
];

function WorkspacePanel({ r, c, roles, entitled, lockedUrl, tab, onTab }: { r: ReturnType<typeof useEngine>; c: Company; roles: AgentRole[]; entitled: boolean; lockedUrl?: string; tab: SecTab; onTab: (t: SecTab) => void }) {
  return (
    <section className="rounded-3xl glass-panel p-4 lg:min-h-[420px]">
      <div className="pr-1">
        {tab === "activity" && (
          <div className="space-y-4">
            {r.activities.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border px-6 py-8 text-center text-sm text-muted-2">Nothing yet. Hit <span className="text-muted">Run</span> and watch it work.</div>
            ) : (
              <div className="space-y-2.5">
                <AnimatePresence initial={false}>
                  {r.activities.slice(0, 30).map((a) => <ActivityRow key={a.id} a={a} onUndo={() => r.undoActivity(a.id)} lockedUrl={lockedUrl} />)}
                </AnimatePresence>
                {r.activities.length > 30 && (
                  <p className="pt-1 text-center text-xs text-muted-2">Showing the latest 30 — the trends below cover every shift.</p>
                )}
              </div>
            )}
            <NightTrends activities={r.activities} company={c} />
          </div>
        )}
        {tab === "brief" && (
          <div className="space-y-3">
            <CoachCard company={c} />
            <MorningBrief
              company={c}
              activities={r.activities}
              pendingApprovals={r.pendingApprovals}
              experiments={r.experiments}
              onReviewDecisions={() => document.getElementById("approval-inbox")?.scrollIntoView({ behavior: "smooth" })}
              onSeeFunnel={() => onTab("sell")}
            />
            {OPERATE_ENABLED && <OperateTab r={r} c={c} />}
          </div>
        )}
        {tab === "team" && <CrewBoard r={r} />}
        {tab === "sell" && (
          <div className="space-y-3">
            <GrowthPanel company={c} experiments={r.experiments} />
            <GTMPanel company={c} activities={r.activities} />
            <div className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-bg/40 p-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-text">Build in public</div>
                <p className="mt-0.5 text-[12px] leading-relaxed text-muted-2">Let the crew share {c.name}&apos;s verified milestones on competitor.inc&apos;s own accounts. Only real, proof-backed progress — nothing fabricated.</p>
              </div>
              <button role="switch" aria-checked={!!c.shareInPublic} onClick={() => r.setShareInPublic(!c.shareInPublic)} className={`mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition ${c.shareInPublic ? "border-text bg-text" : "border-border bg-surface"}`}>
                <span className={`h-4 w-4 rounded-full transition ${c.shareInPublic ? "translate-x-6 bg-bg" : "translate-x-1 bg-muted-2"}`} />
              </button>
            </div>
            <CampaignPanel company={c} locked={!entitled} />
          </div>
        )}
        {tab === "chat" && <TeamRoomTab company={c} r={r} />}
        {tab === "knowledge" && <BrainTab r={r} />}
      </div>
    </section>
  );
}

/* ── Per-shift trends — lives INSIDE Activity (one ledger, raw feed + rollup; the History tab is gone) ── */
function NightTrends({ activities, company }: { activities: Activity[]; company: Company }) {
  if (company.night === 0) return null;
  const nights = Array.from({ length: company.night }, (_, i) => i + 1);
  const tasksByNight = nights.map((n) => activities.filter((a) => a.night === n && a.status === "done").length);
  const spendByNight = nights.map((n) =>
    Math.round(activities.filter((a) => a.night === n && a.status === "done").reduce((t, a) => t + a.cost, 0) * 100) / 100
  );
  return (
    <div className="grid gap-6 border-t border-border pt-4 md:grid-cols-2">
      <BarChart title="Tasks completed / shift" values={tasksByNight} nights={nights} color="var(--color-mint)" fmt={(v) => String(v)} />
      <BarChart title="Spend / shift" values={spendByNight} nights={nights} color="var(--color-coral)" fmt={(v) => "$" + v.toFixed(2)} />
    </div>
  );
}

/* ── Growth goal (the Revenue Loop scoreboard) ───────────────── */
const NORTH_STARS: { key: NonNullable<Company["growthGoal"]>["northStar"]; label: string }[] = [
  { key: "signups", label: "Signups" },
  { key: "paying_customers", label: "Paying customers" },
  { key: "revenue", label: "Revenue" },
];

function GoalChip({ goal, imported, onSet }: { goal?: Company["growthGoal"]; imported: boolean; onSet: (g: Company["growthGoal"]) => void }) {
  const [editing, setEditing] = useState(false);
  // Sensible default per stage: an already-live import chases customers; a fresh idea chases signups.
  const [star, setStar] = useState<NonNullable<Company["growthGoal"]>["northStar"]>(goal?.northStar ?? (imported ? "paying_customers" : "signups"));
  const [target, setTarget] = useState(String(goal?.target ?? (imported ? 3 : 25)));

  if (!editing) {
    const meta = goal && NORTH_STARS.find((n) => n.key === goal.northStar);
    return (
      <button
        onClick={() => setEditing(true)}
        className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
          goal ? "border-violet/30 bg-violet/[0.06] text-violet hover:brightness-110" : "border-coral/40 text-coral hover:bg-coral/10"
        }`}
      >
        <Target size={12} />
        {goal && meta ? `Goal: ${goal.northStar === "revenue" ? "$" : ""}${goal.target} ${meta.label.toLowerCase()}` : "Set your goal — what number matters?"}
      </button>
    );
  }
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <select
        value={star}
        onChange={(e) => setStar(e.target.value as typeof star)}
        aria-label="North-star metric"
        className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs outline-none"
      >
        {NORTH_STARS.map((n) => (
          <option key={n.key} value={n.key}>{n.label}</option>
        ))}
      </select>
      <input
        value={target}
        onChange={(e) => setTarget(e.target.value.replace(/[^0-9]/g, ""))}
        aria-label="Goal target"
        className="w-20 rounded-lg border border-border bg-surface px-2 py-1.5 text-xs outline-none focus:border-violet/40"
      />
      <button
        onClick={() => {
          const t = parseInt(target, 10);
          if (!Number.isFinite(t) || t <= 0) return;
          onSet({ northStar: star, target: t, setAt: Date.now() });
          setEditing(false);
        }}
        className="rounded-lg bg-violet px-3 py-1.5 text-xs font-semibold text-bg transition hover:brightness-110"
      >
        Save goal
      </button>
      <button onClick={() => setEditing(false)} className="text-xs text-muted-2 transition hover:text-text">cancel</button>
    </div>
  );
}

