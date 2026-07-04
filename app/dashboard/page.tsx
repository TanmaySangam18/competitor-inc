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
  Gauge,
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
  Activity as ActivityIcon,
  Brain as BrainIcon,
  LineChart,
  MessagesSquare,
  Zap,
  Rocket,
  Lock,
  Target,
  AlertTriangle,
  Copy,
} from "lucide-react";
import { useEngine } from "@/lib/engine/useEngine";
import { useConfig, getByok } from "@/lib/engine/config";
import { AGENTS, type AgentRole, type ApprovalKind, type Activity, type Company } from "@/lib/engine/types";
import { LogoMark } from "@/components/Logo";
import { CompanyLogo } from "@/components/CompanyLogo";
import ActionBell from "@/components/ActionBell";
import EntitlementNotice from "@/components/EntitlementNotice";
import GuestSavePrompt from "@/components/GuestSavePrompt";
import { LiveGlassBox } from "@/components/LiveGlassBox";
import GTMPanel from "@/components/GTMPanel";
import GaugePanel from "@/components/GaugePanel";
import GrowthPanel from "@/components/GrowthPanel";
import DemandRadarPanel from "@/components/DemandRadarPanel";
import DemandTestPanel from "@/components/DemandTestPanel";
import MomTestKit from "@/components/MomTestKit";
import CrewCard from "@/components/CrewCard";
import CampaignPanel from "@/components/CampaignPanel";
import { SelfEnrichPanel } from "@/components/SelfEnrichPanel";
import { rationaleFor } from "@/lib/engine/rationale";
import { CoachCard } from "@/components/CoachCard";
import MorningBrief from "@/components/MorningBrief";
import { Onboarding } from "@/components/dashboard/Onboarding";
import { ChatTab } from "@/components/dashboard/ChatTab";
import { CrewBoard } from "@/components/dashboard/CrewBoard";
import { BrainTab } from "@/components/dashboard/BrainTab";
import { OperateTab } from "@/components/dashboard/OperateTab";
import { ActivityRow } from "@/components/dashboard/ActivityRow";
import { ApprovalCard } from "@/components/dashboard/ApprovalCard";
import { BarChart } from "@/components/dashboard/BarChart";
import { Stat } from "@/components/dashboard/Stat";
import { agentStyle } from "@/components/dashboard/agentStyle";
import { netSpend } from "@/lib/engine/ledger";
import { useAuth } from "@/lib/engine/useAuth";
import { billingLive, checkEntitled, checkoutUrlFor } from "@/lib/engine/billing";
import { isFounderEmail } from "@/lib/engine/founders";
import { repoFromUrl } from "@/lib/engine/hosting";

const verdictStyle = {
  strong: { ring: "border-white/30 bg-white/[0.06]", text: "text-text", label: "strong signal" },
  mixed: { ring: "border-white/15 bg-white/[0.03]", text: "text-muted", label: "mixed signal" },
  weak: { ring: "border-white/10 bg-transparent", text: "text-muted-2", label: "weak signal" },
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

type Tab = "operations" | "growth" | "history" | "chat" | "brain" | "operate";

export default function Dashboard() {
  const r = useEngine();
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("operations");

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

  // Approving a build ships the MVP, then takes the founder straight to the live agent floor so they
  // watch the crew go to work (Nielsen H1). No paywall here — the reveal is where they pay.
  const goBuild = async () => {
    r.decideBuild(true);
    router.push("/delegation");
  };

  if (!r.hydrated) {
    return (
      <div className="grid min-h-screen place-items-center text-muted-2">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div id="main" className="min-h-screen">
      <TopBar r={r} />
      <SelfEnrichPanel />
      {r.blocked && (
        <div className="mx-auto max-w-6xl px-6 pt-4">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-amber/30 bg-amber/[0.06] px-4 py-3 text-sm">
            <span className="text-amber">{r.blocked}</span>
            <div className="flex shrink-0 items-center gap-2">
              <Link href="/dashboard/settings" className="rounded-lg bg-amber/15 px-3 py-1.5 text-xs font-medium text-amber transition hover:bg-amber/25">
                Add your key
              </Link>
              <button onClick={r.clearBlocked} aria-label="Dismiss" className="text-muted-2 transition hover:text-text">
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="mx-auto max-w-6xl px-6 py-10">
        <EntitlementNotice email={user?.email} />
        {!r.company && <Onboarding onSubmit={r.createCompany} hasOthers={r.companies.length > 0} onDemo={r.loadDemo} onImport={r.importCompany} />}
        {r.company?.status === "validating" && <ValidationRunning idea={r.company.idea} />}
        {r.company?.status === "validated" && <ValidationGate r={r} onBuild={goBuild} />}
        {r.company?.status === "rejected" && <Rejected r={r} onBuild={goBuild} />}
        {r.company?.status === "operating" && <Operating r={r} tab={tab} setTab={setTab} entitled={entitled} userEmail={user?.email} />}
      </div>
    </div>
  );
}

/* ── Top bar ─────────────────────────────────────────────────── */
function TopBar({ r }: { r: ReturnType<typeof useEngine> }) {
  const { user, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 font-mono text-lg font-bold tracking-tight">
            <LogoMark size={32} />
            <span className="hidden sm:inline">competitor.inc</span>
          </Link>
          {r.companies.length > 0 && <CompanySwitcher r={r} />}
        </div>
        <div className="flex items-center gap-2">
          {r.company?.status === "operating" && (
            <AutopilotToggle on={r.autopilot} onToggle={() => r.setAutopilot(!r.autopilot)} paused={r.autopilotPaused} />
          )}
          <Link
            href="/delegation"
            className="hidden h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs text-muted transition hover:text-text sm:flex"
          >
            <Rocket size={14} /> The Delegation
          </Link>
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
                {imported ? "Start getting customers" : "Approve build"}
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
function Operating({ r, tab, setTab, entitled, userEmail }: { r: ReturnType<typeof useEngine>; tab: Tab; setTab: (t: Tab) => void; entitled: boolean; userEmail?: string }) {
  const c = r.company!;
  const [blitzDone, setBlitzDone] = useState(false);
  function doBlitz() {
    r.launchBlitz();
    setBlitzDone(true);
    setTimeout(() => setBlitzDone(false), 2200);
  }
  const stats = [
    { label: "Nights run", val: c.night },
    { label: "Tasks done", val: c.ledger.tasksDone },
    { label: "Net spend", val: "$" + netSpend(c).toFixed(2) },
    { label: "Credited back", val: "$" + (c.ledger.credited ?? 0).toFixed(2) },
  ];
  const tabs: { id: Tab; label: string; icon: typeof ActivityIcon }[] = [
    { id: "operations", label: "Operations", icon: ActivityIcon },
    { id: "growth", label: "Growth", icon: Target },
    { id: "history", label: "History", icon: LineChart },
    { id: "chat", label: "Chat", icon: MessagesSquare },
    { id: "brain", label: "Brain", icon: BrainIcon },
    ...(OPERATE_ENABLED ? [{ id: "operate" as Tab, label: "Operate", icon: Gauge }] : []),
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <CompanyLogo name={c.name} size={48} className="shrink-0 rounded-xl shadow-sm" />
          <div>
            <h1 className="text-3xl font-bold">{c.name}</h1>
            <p className="mt-1 max-w-xl text-sm text-muted">{c.idea}</p>
            <GoalChip goal={c.growthGoal} imported={c.product?.status === "live"} onSet={r.setGrowthGoal} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={r.revalidate}
            disabled={r.working !== null}
            title="Re-run the demand test — validation is continuous, not one-shot"
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium text-muted transition hover:text-text disabled:opacity-50"
          >
            {r.working === "validating" ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Re-testing…
              </>
            ) : (
              <>
                <FlaskConical size={16} /> Re-test demand
              </>
            )}
          </button>
          <button
            onClick={doBlitz}
            disabled={r.working !== null || blitzDone}
            title="Surge drafts launch posts — queued for your approval, nothing posts without your yes"
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition disabled:opacity-70 ${blitzDone ? "border-mint/40 text-mint" : "border-border text-muted hover:text-text"}`}
          >
            {blitzDone ? <><Check size={16} /> Drafted — see Approval Inbox</> : <><Megaphone size={16} /> Draft launch blitz</>}
          </button>
          <button
            onClick={r.runShift}
            disabled={r.working !== null}
            className="inline-flex items-center gap-2 rounded-xl bg-coral px-5 py-3 font-semibold text-bg transition hover:brightness-110 disabled:opacity-50"
          >
            {r.working === "shift" ? (
              <>
                <Loader2 size={17} className="animate-spin" /> Working…
              </>
            ) : (
              <>
                <Moon size={17} /> Run tonight&apos;s shift
              </>
            )}
          </button>
        </div>
      </div>

      <CoachCard company={c} />

      {r.autopilotPaused && (
        <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-amber/30 bg-amber/[0.06] px-4 py-3 text-sm text-amber">
          <AlertTriangle size={15} className="shrink-0" />
          Autopilot paused — {r.pendingApprovals.length} approvals are waiting on you. Clear your inbox below to resume nightly shifts.
        </div>
      )}

      <MorningBrief
        company={c}
        activities={r.activities}
        pendingApprovals={r.pendingApprovals}
        experiments={r.experiments}
        onReviewDecisions={() => {
          setTab("operations");
          setTimeout(() => document.getElementById("approval-inbox")?.scrollIntoView({ behavior: "smooth" }), 60);
        }}
        onSeeFunnel={() => setTab("growth")}
      />

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Stat key={s.label} label={s.label} val={s.val} />
        ))}
      </div>

      {/* Anti-crowding (Hick's Law): autonomous marketing is advanced — collapsed by default so a
          first-time founder isn't hit with it; one tap reveals it. */}
      <details className="group mt-6">
        <summary className="flex cursor-pointer list-none items-center justify-between rounded-2xl border border-border bg-bg/40 px-4 py-3 text-sm font-medium text-muted transition hover:text-text">
          <span>Advanced · autonomous marketing</span>
          <ChevronDown size={16} className="shrink-0 text-muted-2 transition group-open:rotate-180" />
        </summary>
        <div className="mt-3 space-y-3">
          {/* Build-in-public consent — the crew shares THIS company's real milestones on
              competitor.inc's own channels (never yours). Opt-in; off by default. */}
          <div className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-bg/40 p-4">
            <div className="min-w-0">
              <div className="text-sm font-medium text-text">Build in public</div>
              <p className="mt-0.5 text-[12px] leading-relaxed text-muted-2">
                Let the crew share {c.name}&apos;s <span className="text-muted">verified</span> milestones on competitor.inc&apos;s own
                accounts — free distribution. Only real, proof-backed progress is ever posted; nothing is fabricated.
              </p>
            </div>
            <button
              role="switch"
              aria-checked={!!c.shareInPublic}
              onClick={() => r.setShareInPublic(!c.shareInPublic)}
              className={`mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition ${c.shareInPublic ? "border-text bg-text" : "border-border bg-surface"}`}
            >
              <span className={`h-4 w-4 rounded-full transition ${c.shareInPublic ? "translate-x-6 bg-bg" : "translate-x-1 bg-muted-2"}`} />
            </button>
          </div>
          <CampaignPanel company={c} locked={!entitled} />
        </div>
      </details>

      {/* The conversion moment. A REAL, resolvable site exists — but the link only OPENS once they pay
          (value-first: they've already watched the crew build it). Until billing is live, `entitled` is
          true for everyone, so this stays an open clickable card (pre-launch demo). Never a fake link. */}
      {c.product && c.product.status === "live" && /^https?:\/\//.test(c.product.url) ? (
        entitled ? (
          <div className="mt-6 rounded-2xl border border-mint/25 bg-mint/[0.05] p-4">
            <a href={c.product.url} target="_blank" rel="noreferrer" className="group flex items-center justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-mint/12 text-mint">
                  <Rocket size={18} />
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium">Your product is live</div>
                  <div className="truncate text-xs text-mint">{c.product.url}</div>
                </div>
              </div>
              <span className="ml-3 shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition group-hover:text-text">View site ↗</span>
            </a>
            {/* "Own your code" doors — the anti-black-box move: the build is a REAL repo the founder
                owns, openable in a full browser IDE via GitHub's free bridges. Renders only when the
                repo is verifiably derivable from the shipped URL (never a dead link). */}
            {(() => {
              const repo = repoFromUrl(c.product.url);
              if (!repo) return null;
              return (
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-mint/15 pt-3 text-xs">
                  <span className="flex items-center gap-1.5 text-muted-2"><Code2 size={12} /> Your code — own it:</span>
                  <a href={`https://github.com/${repo}`} target="_blank" rel="noreferrer" className="text-muted underline-offset-2 transition hover:text-text hover:underline">View repo</a>
                  <span className="text-muted-2">·</span>
                  <a href={`https://stackblitz.com/github/${repo}`} target="_blank" rel="noreferrer" className="text-muted underline-offset-2 transition hover:text-text hover:underline">Edit in StackBlitz</a>
                  <span className="text-muted-2">·</span>
                  <a href={`https://replit.com/github/${repo}`} target="_blank" rel="noreferrer" className="text-muted underline-offset-2 transition hover:text-text hover:underline">Open in Replit</a>
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-coral/30 bg-coral/[0.05] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-coral/12 text-coral">
                  <Rocket size={18} />
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium">Your product is built &amp; live</div>
                  {/* The real URL exists but is NEVER emitted to a locked client (CSS blur is cosmetic —
                      the value would still sit in the DOM). We render a masked decoy so it LOOKS like a
                      real link is right there, while the actual URL stays server-side until they unlock. */}
                  <div className="mt-0.5 select-none truncate font-mono text-xs text-coral blur-[5px]" aria-hidden>
                    https://{"•".repeat(16)}.live
                  </div>
                </div>
              </div>
              <Lock size={16} className="shrink-0 text-coral" aria-label="Locked" />
            </div>
            <a
              href={userEmail ? checkoutUrlFor(userEmail) : "/login"}
              className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-coral px-4 py-2.5 text-sm font-semibold text-bg transition hover:opacity-90"
            >
              Unlock your live site — Operator $39/mo <ArrowRight size={15} />
            </a>
            <p className="mt-2 text-center text-[11px] text-muted-2">
              It&apos;s real and already deployed — paying just opens it. Cancel anytime, own the repo, no lock-in.
            </p>
          </div>
        )
      ) : c.product ? (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-amber/25 bg-amber/[0.05] p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber/12 text-amber">
            <Rocket size={18} />
          </span>
          <div className="min-w-0">
            <div className="text-sm font-medium">Shipping your site…</div>
            <div className="text-xs text-muted-2">
              A real, openable link appears here the moment the build finishes (≈1 min once your keys are live).{" "}
              <Link href="/dashboard/settings#connect-accounts" className="font-medium text-amber underline-offset-2 hover:underline">Add your keys →</Link>
            </div>
          </div>
        </div>
      ) : null}

      {/* tabs */}
      <div className="mt-8 flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              tab === t.id ? "border-coral text-text" : "border-transparent text-muted hover:text-text"
            }`}
          >
            <t.icon size={15} /> {t.label}
            {t.id === "operations" && r.pendingApprovals.length > 0 && (
              <span className="ml-1 grid h-4 min-w-4 place-items-center rounded-full bg-coral px-1 text-[10px] font-bold text-bg">
                {r.pendingApprovals.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "operations" && <OperationsTab r={r} lockedUrl={!entitled && c.product?.status === "live" ? c.product?.url : undefined} />}
        {tab === "growth" && <GrowthPanel company={c} experiments={r.experiments} />}
        {tab === "history" && <HistoryTab activities={r.activities} company={c} />}
        {tab === "chat" && <ChatTab company={c} r={r} />}
        {tab === "brain" && <BrainTab r={r} />}
        {tab === "operate" && OPERATE_ENABLED && <OperateTab r={r} c={c} />}
      </div>
    </div>
  );
}

function OperationsTab({ r, lockedUrl }: { r: ReturnType<typeof useEngine>; lockedUrl?: string }) {
  const { config } = useConfig();
  const roles = (Object.keys(AGENTS) as AgentRole[]).filter((role) => config.agents[role]?.enabled ?? true);
  return (
    <div className="space-y-8">
      <CrewBoard r={r} />
      <div className="rounded-3xl glass-panel p-5 sm:p-7">
        <LiveGlassBox company={r.company ?? undefined} />
      </div>
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section>
        <h2 className="flex items-center gap-2 text-sm font-semibold text-muted">
          <ShieldCheck size={15} className="text-violet" /> The Glass Box · every action, logged
        </h2>
        <div className="mt-4">
          {r.activities.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-2">
              Nothing yet. Hit <span className="text-muted">Run tonight&apos;s shift</span> (or flip on Autopilot) and watch it work.
            </div>
          ) : (
            <div className="max-h-[60vh] space-y-2.5 overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {r.activities.map((a) => (
                  <ActivityRow key={a.id} a={a} onUndo={() => r.undoActivity(a.id)} lockedUrl={lockedUrl} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>

      <aside className="space-y-6">
        {r.pendingApprovals.length > 0 && (
          <div id="approval-inbox" className="scroll-mt-24">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-coral">
              <Sparkles size={15} /> Approval Inbox · {r.pendingApprovals.length}
            </h2>
            <div className="mt-3 max-h-[44vh] space-y-3 overflow-y-auto pr-1">
              {r.pendingApprovals.map((ap) => (
                <ApprovalCard
                  key={ap.id}
                  title={ap.title}
                  detail={ap.detail}
                  agent={ap.agent}
                  kind={ap.kind}
                  onApprove={() => r.resolveApproval(ap.id, true)}
                  onReject={() => r.resolveApproval(ap.id, false)}
                />
              ))}
            </div>
          </div>
        )}
        {r.company && <GTMPanel company={r.company} activities={r.activities} />}
        <div>
          <h2 className="text-sm font-semibold text-muted">Your team</h2>
          <p className="mt-1 text-[11px] text-muted-2">Tap anyone to see their job description.</p>
          <div className="mt-3 space-y-2">
            {roles.map((role) => {
              const A = AGENTS[role];
              const S = agentStyle[role];
              return (
                <details key={role} className="group rounded-xl glass-panel px-3 py-2.5">
                  <summary className="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${S.ring} ${S.color}`}>
                      <S.icon size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">
                        {A.name} <span className="text-muted-2">· {A.label}</span>
                      </div>
                      <div className="truncate text-xs text-muted-2">{A.blurb}</div>
                      <div className="mt-0.5 truncate text-[10px] text-muted-2">Plays <span className="text-muted">{A.playbook}</span></div>
                    </div>
                    <ChevronDown size={14} className="shrink-0 text-muted-2 transition group-open:rotate-180" />
                  </summary>
                  <div className="mt-3 space-y-3 border-t border-border pt-3 text-xs">
                    <div>
                      <div className="font-semibold uppercase tracking-wide text-muted-2">Owns</div>
                      <ul className="mt-1.5 space-y-1">
                        {A.responsibilities.map((x, i) => (
                          <li key={i} className="flex gap-1.5 text-muted"><span className="text-muted-2">·</span><span>{x}</span></li>
                        ))}
                      </ul>
                    </div>
                    {A.icp && (
                      <div>
                        <span className="font-semibold uppercase tracking-wide text-muted-2">Talks to </span>
                        <span className="text-muted">{A.icp}</span>
                      </div>
                    )}
                    {A.objections && A.objections.length > 0 && (
                      <div>
                        <div className="font-semibold uppercase tracking-wide text-muted-2">Answers the worry</div>
                        <ul className="mt-1.5 space-y-1">
                          {A.objections.map((x, i) => (
                            <li key={i} className="flex gap-1.5 text-muted"><span className="text-muted-2">·</span><span>{x}</span></li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        </div>
        <CrewCard idea={r.company!.idea} />
      </aside>
    </div>
    </div>
  );
}

/* ── History / analytics ─────────────────────────────────────── */
function HistoryTab({ activities, company }: { activities: Activity[]; company: Company }) {
  if (company.night === 0) {
    return <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-2">No nights run yet.</div>;
  }
  const nights = Array.from({ length: company.night }, (_, i) => i + 1);
  const tasksByNight = nights.map((n) => activities.filter((a) => a.night === n && a.status === "done").length);
  const spendByNight = nights.map((n) =>
    Math.round(activities.filter((a) => a.night === n && a.status === "done").reduce((t, a) => t + a.cost, 0) * 100) / 100
  );

  return (
    <div className="space-y-6">
      <GaugePanel company={company} activities={activities} />
      <div className="grid gap-6 md:grid-cols-2">
        <BarChart title="Tasks completed / night" values={tasksByNight} nights={nights} color="var(--color-mint)" fmt={(v) => String(v)} />
        <BarChart title="Spend / night" values={spendByNight} nights={nights} color="var(--color-coral)" fmt={(v) => "$" + v.toFixed(2)} />
      </div>
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

