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
  LineChart,
  MessagesSquare,
  Zap,
  Rocket,
  Target,
  AlertTriangle,
} from "lucide-react";
import { useRoomie } from "@/lib/roomie/useRoomie";
import { useConfig, getByok } from "@/lib/roomie/config";
import { AGENTS, type AgentRole, type ApprovalKind, type Activity, type Company } from "@/lib/roomie/types";
import { LogoMark } from "@/components/Logo";
import { LiveGlassBox } from "@/components/LiveGlassBox";

const agentStyle: Record<AgentRole, { icon: typeof Gauge; color: string; ring: string }> = {
  ceo: { icon: Gauge, color: "text-violet", ring: "bg-violet/12" },
  engineering: { icon: Code2, color: "text-mint", ring: "bg-mint/12" },
  marketing: { icon: Megaphone, color: "text-amber", ring: "bg-amber/12" },
  support: { icon: LifeBuoy, color: "text-coral", ring: "bg-coral/12" },
  growth: { icon: TrendingUp, color: "text-mint", ring: "bg-mint/12" },
};

const EXAMPLES = [
  "An app for AI bedtime stories for kids",
  "A newsletter for indie game devs",
  "A marketplace for vintage film cameras",
];

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

type Tab = "operations" | "history" | "chat" | "operate";

export default function Dashboard() {
  const r = useRoomie();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("operations");

  // Approving a build is consequential and should be *visible*: ship the MVP, then take the
  // founder straight to the live agent floor so they watch the crew go to work (Nielsen H1).
  const goBuild = () => {
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
        {!r.company && <Onboarding onSubmit={r.createCompany} hasOthers={r.companies.length > 0} onDemo={r.loadDemo} />}
        {r.company?.status === "validating" && <ValidationRunning idea={r.company.idea} />}
        {r.company?.status === "validated" && <ValidationGate r={r} onBuild={goBuild} />}
        {r.company?.status === "rejected" && <Rejected r={r} onBuild={goBuild} />}
        {r.company?.status === "operating" && <Operating r={r} tab={tab} setTab={setTab} />}
      </div>
    </div>
  );
}

/* ── Top bar ─────────────────────────────────────────────────── */
function TopBar({ r }: { r: ReturnType<typeof useRoomie> }) {
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

function CompanySwitcher({ r }: { r: ReturnType<typeof useRoomie> }) {
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
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-text text-bg text-[10px] font-bold">
                    {c.name.charAt(0)}
                  </span>
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
      title={paused ? "Autopilot paused — clear your Approval Inbox to resume" : undefined}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
        paused
          ? "border-amber/40 bg-amber/10 text-amber"
          : on
          ? "border-mint/40 bg-mint/10 text-mint"
          : "border-border text-muted hover:text-text"
      }`}
      aria-pressed={on}
    >
      <Zap size={13} className={paused ? "" : on ? "fill-mint" : ""} />
      {paused ? "Autopilot paused" : on ? "Autopilot on" : "Autopilot"}
    </button>
  );
}

/* ── Onboarding ──────────────────────────────────────────────── */
function Onboarding({ onSubmit, hasOthers, onDemo }: { onSubmit: (idea: string) => void; hasOthers: boolean; onDemo: () => void }) {
  const [idea, setIdea] = useState("");
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto mt-8 max-w-2xl text-center"
    >
      <span className="mx-auto grid h-14 w-14 place-items-center">
        <LogoMark size={56} />
      </span>
      <h1 className="mt-6 text-3xl font-bold md:text-4xl">
        {hasOthers ? "Start another company" : "What should we build together?"}
      </h1>
      <p className="mt-3 text-muted">
        Describe your idea in a sentence. Before building anything, competitor.inc checks whether people
        actually want it.
      </p>

      <div className="mt-8 rounded-2xl glass-panel p-3 text-left">
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="e.g. An app that turns my voice notes into polished blog posts…"
          rows={3}
          className="w-full resize-none rounded-xl bg-transparent px-3 py-2 text-text outline-none placeholder:text-muted-2"
          aria-label="Describe your company idea"
        />
        <div className="flex items-center justify-between px-1 pt-1">
          <span className="text-xs text-muted-2">competitor.inc runs a real demand test first.</span>
          <button
            onClick={() => onSubmit(idea)}
            disabled={!idea.trim()}
            className="group inline-flex items-center gap-2 rounded-xl bg-coral px-5 py-2.5 text-sm font-semibold text-bg transition hover:brightness-110 disabled:opacity-40"
          >
            Hand it over
            <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs text-muted-2">Try:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => setIdea(ex)}
            className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted transition hover:border-coral/40 hover:text-text"
          >
            {ex}
          </button>
        ))}
      </div>

      <button
        onClick={onDemo}
        className="mt-6 text-xs text-muted-2 underline-offset-4 transition hover:text-text hover:underline"
      >
        Or load a demo company to explore the full workflow →
      </button>
    </motion.div>
  );
}

/* ── Validation running ──────────────────────────────────────── */
const VALIDATION_STEPS = [
  "Reading your idea",
  "Spinning up a landing page",
  "Wiring a waitlist + analytics",
  "Running a small demand test",
  "Scoring the signal",
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
    <div className="mx-auto mt-12 max-w-lg text-center">
      <Loader2 size={32} className="mx-auto animate-spin text-coral" />
      <h2 className="mt-5 text-2xl font-bold">Checking demand…</h2>
      <p className="mt-2 text-sm text-muted">&ldquo;{idea}&rdquo;</p>
      <div className="mt-8 space-y-2.5 text-left">
        {VALIDATION_STEPS.map((s, i) => {
          const isDone = i < completed;
          const isCurrent = i === completed;
          return (
            <motion.div
              key={s}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: i <= completed ? 1 : 0.4, x: 0 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-3 rounded-xl glass-panel px-4 py-3 text-sm"
            >
              <span
                className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                  isDone ? "bg-mint/15 text-mint" : isCurrent ? "bg-white/10 text-text" : "border border-border"
                }`}
              >
                {isDone ? (
                  <Check size={12} />
                ) : isCurrent ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-2" />
                )}
              </span>
              <span className={i <= completed ? "" : "text-muted-2"}>{s}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Validation Gate ─────────────────────────────────────────── */
function ValidationGate({ r, onBuild }: { r: ReturnType<typeof useRoomie>; onBuild: () => void }) {
  const v = r.company!.validation!;
  const vs = verdictStyle[v.verdict];
  const recommendHold = v.verdict === "weak";
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto mt-6 max-w-2xl">
      <div className={`rounded-3xl border p-7 ${vs.ring}`}>
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 text-sm font-semibold ${vs.text}`}>
            <FlaskConical size={16} /> VALIDATION GATE · {vs.label}
          </div>
          <div className="text-right">
            <div className={`font-display text-2xl font-bold ${vs.text}`}>{v.confidence}%</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-2">confidence</div>
          </div>
        </div>

        <div className="mt-6 space-y-2.5">
          {v.experiments.map((e) => {
            const ss = signalStyle[e.signal];
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

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {recommendHold ? (
            <>
              <button onClick={() => r.decideBuild(false)} className="flex-1 rounded-xl bg-coral px-5 py-3 font-semibold text-bg transition hover:brightness-110">
                Hold — I agree
              </button>
              <button onClick={onBuild} className="rounded-xl border border-border px-5 py-3 font-medium text-muted transition hover:text-text">
                Build anyway
              </button>
            </>
          ) : (
            <>
              <button onClick={onBuild} className="flex-1 rounded-xl bg-coral px-5 py-3 font-semibold text-bg transition hover:brightness-110">
                Approve build
              </button>
              <button onClick={() => r.decideBuild(false)} className="rounded-xl border border-border px-5 py-3 font-medium text-muted transition hover:text-text">
                Hold for now
              </button>
            </>
          )}
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-muted-2">You decide. competitor.inc only builds once you approve.</p>
    </motion.div>
  );
}

/* ── Rejected ────────────────────────────────────────────────── */
function Rejected({ r, onBuild }: { r: ReturnType<typeof useRoomie>; onBuild: () => void }) {
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
function Operating({ r, tab, setTab }: { r: ReturnType<typeof useRoomie>; tab: Tab; setTab: (t: Tab) => void }) {
  const c = r.company!;
  const net = Math.round((c.ledger.spent - (c.ledger.credited ?? 0)) * 100) / 100;
  const stats = [
    { label: "Nights run", val: c.night },
    { label: "Tasks done", val: c.ledger.tasksDone },
    { label: "Net spend", val: "$" + net.toFixed(2) },
    { label: "Credited back", val: "$" + (c.ledger.credited ?? 0).toFixed(2) },
  ];
  const tabs: { id: Tab; label: string; icon: typeof ActivityIcon }[] = [
    { id: "operations", label: "Operations", icon: ActivityIcon },
    { id: "history", label: "History", icon: LineChart },
    { id: "chat", label: "Chat", icon: MessagesSquare },
    ...(OPERATE_ENABLED ? [{ id: "operate" as Tab, label: "Operate", icon: Gauge }] : []),
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{c.name}</h1>
          <p className="mt-1 max-w-xl text-sm text-muted">{c.idea}</p>
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
            onClick={r.launchBlitz}
            disabled={r.working !== null}
            title="Surge drafts launch posts — queued for your approval, nothing posts without your yes"
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium text-muted transition hover:text-text disabled:opacity-50"
          >
            <Megaphone size={16} /> Draft launch blitz
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

      {r.autopilotPaused && (
        <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-amber/30 bg-amber/[0.06] px-4 py-3 text-sm text-amber">
          <AlertTriangle size={15} className="shrink-0" />
          Autopilot paused — {r.pendingApprovals.length} approvals are waiting on you. Clear your inbox below to resume nightly shifts.
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl glass-panel px-4 py-3">
            <div className="font-display text-xl font-bold">{s.val}</div>
            <div className="text-xs text-muted-2">{s.label}</div>
          </div>
        ))}
      </div>

      {c.product && (
        <a
          href={c.product.url}
          target="_blank"
          rel="noreferrer"
          className="mt-6 flex items-center justify-between rounded-2xl border border-mint/25 bg-mint/[0.05] p-4 transition hover:border-mint/40"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-mint/12 text-mint">
              <Rocket size={18} />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-medium">Your product is live</div>
              <div className="truncate text-xs text-mint">{c.product.url}</div>
            </div>
          </div>
          <span className="ml-3 shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs text-muted">View site ↗</span>
        </a>
      )}

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
        {tab === "operations" && <OperationsTab r={r} />}
        {tab === "history" && <HistoryTab activities={r.activities} company={c} />}
        {tab === "chat" && <ChatTab company={c} r={r} />}
        {tab === "operate" && OPERATE_ENABLED && <OperateTab r={r} c={c} />}
      </div>
    </div>
  );
}

function OperationsTab({ r }: { r: ReturnType<typeof useRoomie> }) {
  const { config } = useConfig();
  const roles = (Object.keys(AGENTS) as AgentRole[]).filter((role) => config.agents[role]?.enabled ?? true);
  return (
    <div className="space-y-8">
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
            <div className="space-y-2.5">
              <AnimatePresence initial={false}>
                {r.activities.map((a) => (
                  <ActivityRow key={a.id} a={a} onUndo={() => r.undoActivity(a.id)} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>

      <aside className="space-y-6">
        {r.pendingApprovals.length > 0 && (
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-coral">
              <Sparkles size={15} /> Approval Inbox · {r.pendingApprovals.length}
            </h2>
            <div className="mt-3 space-y-3">
              {r.pendingApprovals.map((ap) => (
                <ApprovalCard
                  key={ap.id}
                  title={ap.title}
                  detail={ap.detail}
                  agent={ap.agent}
                  onApprove={() => r.resolveApproval(ap.id, true)}
                  onReject={() => r.resolveApproval(ap.id, false)}
                />
              ))}
            </div>
          </div>
        )}
        <div>
          <h2 className="text-sm font-semibold text-muted">Your team</h2>
          <div className="mt-3 space-y-2">
            {roles.map((role) => {
              const A = AGENTS[role];
              const S = agentStyle[role];
              return (
                <div key={role} className="flex items-center gap-3 rounded-xl glass-panel px-3 py-2.5">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${S.ring} ${S.color}`}>
                    <S.icon size={16} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium">
                      {A.name} <span className="text-muted-2">· {A.label}</span>
                    </div>
                    <div className="truncate text-xs text-muted-2">{A.blurb}</div>
                    <div className="mt-0.5 truncate text-[10px] text-muted-2">Plays <span className="text-muted">{A.playbook}</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
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
    <div className="grid gap-6 md:grid-cols-2">
      <BarChart title="Tasks completed / night" values={tasksByNight} nights={nights} color="var(--color-mint)" fmt={(v) => String(v)} />
      <BarChart title="Spend / night" values={spendByNight} nights={nights} color="var(--color-coral)" fmt={(v) => "$" + v.toFixed(2)} />
    </div>
  );
}

function BarChart({ title, values, nights, color, fmt }: { title: string; values: number[]; nights: number[]; color: string; fmt: (v: number) => string }) {
  const max = Math.max(1, ...values);
  return (
    <div className="overflow-hidden rounded-2xl glass-panel p-5">
      <div className="text-sm font-semibold">{title}</div>
      {/* Wide-data rule (Refactoring UI): the bars live in their own horizontal scroll box, so many
          nights scroll *inside* the card instead of bleeding past it. Each bar keeps a readable min
          width. The height % is measured against a fixed track, with labels outside it — so a tall
          bar can never push past the chart area. */}
      <div className="mt-5 overflow-x-auto pb-1">
        <div className="flex gap-2" style={{ minWidth: `${values.length * 26}px` }}>
          {values.map((v, i) => (
            <div key={i} className="group flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="relative flex h-40 w-full items-end">
                <span className="pointer-events-none absolute inset-x-0 -top-4 text-center text-[10px] text-muted-2 opacity-0 transition group-hover:opacity-100">{fmt(v)}</span>
                <div
                  className="w-full rounded-t-md transition-all"
                  style={{ height: `${(v / max) * 100}%`, minHeight: v > 0 ? 4 : 2, backgroundColor: v > 0 ? color : "var(--color-border)" }}
                />
              </div>
              <span className="text-[10px] text-muted-2">{nights[i]}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 text-center text-[10px] uppercase tracking-wide text-muted-2">night</div>
    </div>
  );
}

/* ── Chat ────────────────────────────────────────────────────── */
interface ChatMsg { role: "you" | "roomie"; text: string }

function ChatTab({ company, r }: { company: Company; r: ReturnType<typeof useRoomie> }) {
  const { config } = useConfig();
  const storeKey = `roomie:chat:${company.id}`;
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storeKey);
      setMsgs(raw ? (JSON.parse(raw) as ChatMsg[]) : [{ role: "roomie", text: `Hey! I'm running ${company.name} with you — what should we tackle?` }]);
    } catch {
      setMsgs([]);
    }
  }, [storeKey, company.name]);

  useEffect(() => {
    if (msgs.length) {
      try { window.localStorage.setItem(storeKey, JSON.stringify(msgs)); } catch { /* ignore */ }
    }
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, storeKey]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setMsgs((m) => [...m, { role: "you", text }]);
    setSending(true);
    try {
      const res = await fetch("/api/roomie", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "chat", company: { name: company.name, idea: company.idea }, message: text, soul: config.soul, byok: getByok() ?? undefined }),
      });
      // A consequential request? The engine flags it; queue a real approval so the inbox matches
      // what the co-founder promises.
      let queued: { agent: AgentRole; kind: ApprovalKind; title: string; detail: string; amount?: number } | null = null;
      const approvalHeader = res.headers.get("x-roomie-approval");
      if (approvalHeader) {
        try { queued = JSON.parse(decodeURIComponent(approvalHeader)); } catch { /* ignore */ }
      }
      if (!res.body) {
        const data = await res.json().catch(() => ({ reply: "…" }));
        setMsgs((m) => [...m, { role: "roomie", text: data.reply ?? "…" }]);
      } else {
        // stream the reply token-by-token
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        setMsgs((m) => [...m, { role: "roomie", text: "" }]);
        let acc = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setMsgs((m) => {
            const copy = m.slice();
            copy[copy.length - 1] = { role: "roomie", text: acc };
            return copy;
          });
        }
      }
      if (queued) {
        r.addApproval(queued);
        setMsgs((m) => [...m, { role: "roomie", text: "🔔 Queued for your approval — open the Operations tab to approve or reject. Nothing happens until you say yes." }]);
      }
    } catch {
      setMsgs((m) => [...m, { role: "roomie", text: "I couldn't reach the engine just now — try again?" }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col rounded-2xl border border-border bg-surface">
      <div className="h-[420px] space-y-3 overflow-y-auto p-5">
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "you" ? "flex justify-end" : "flex items-start gap-2.5"}>
            {m.role === "roomie" && (
              <LogoMark size={28} className="mt-0.5 shrink-0" />
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.role === "you" ? "rounded-tr-sm bg-surface-2" : "rounded-tl-sm border border-border bg-bg/50 text-muted"}`}>
              {m.text}
            </div>
          </div>
        ))}
        {sending && msgs[msgs.length - 1]?.role === "you" && (
          <div className="flex items-center gap-2 text-xs text-muted-2"><Loader2 size={12} className="animate-spin" /> Thinking…</div>
        )}
        <div ref={endRef} />
      </div>
      <div className="flex items-center gap-2 border-t border-border p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Message your co-founder…"
          className="w-full rounded-xl bg-bg/50 px-4 py-2.5 text-sm outline-none placeholder:text-muted-2"
          aria-label="Message your co-founder"
        />
        <button onClick={send} disabled={!input.trim() || sending} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-coral text-bg transition hover:brightness-110 disabled:opacity-40">
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

/* ── Operate (EOS company-OS, gated) ─────────────────────────── */
function OperateTab({ r, c }: { r: ReturnType<typeof useRoomie>; c: Company }) {
  const [rock, setRock] = useState("");
  const [issue, setIssue] = useState("");
  const net = Math.round((c.ledger.spent - (c.ledger.credited ?? 0)) * 100) / 100;
  const resolvedApprovals = r.approvals.filter((a) => a.resolved).length;
  const doneRocks = r.operate.rocks.filter((rk) => rk.done).length;
  const autoIssues = r.activities
    .filter((a) => a.status === "failed-credited" || a.meta === "recommend killing")
    .slice(0, 4)
    .map((a) => (a.meta === "recommend killing" ? a.action : `${a.action} — credited back, not charged`));
  const openCount = r.operate.issues.filter((i) => !i.resolved).length + autoIssues.length;

  const score = [
    { label: "Net spend", val: "$" + net.toFixed(2) },
    { label: "Tasks shipped", val: String(c.ledger.tasksDone) },
    { label: "Validation", val: (c.validation?.confidence ?? "—") + "%" },
    { label: "Approvals handled", val: String(resolvedApprovals) },
    { label: "Marginal cost", val: "$0" },
    { label: "Open issues", val: String(openCount) },
  ];

  const review =
    `This quarter Apex shipped ${c.ledger.tasksDone} task${c.ledger.tasksDone === 1 ? "" : "s"} for ${c.name} ` +
    `at $${net.toFixed(2)} net spend — marginal cost ~$0 (BYOK / free-tier). Validation confidence ` +
    `${c.validation?.confidence ?? "—"}%. ${doneRocks}/${r.operate.rocks.length} Rocks done, ${openCount} open issue${openCount === 1 ? "" : "s"}. ` +
    (openCount > 0 ? "Recommended focus: run IDS on the top issue." : "Recommended focus: keep shipping the winners.");

  return (
    <div className="space-y-8">
      <section>
        <h2 className="flex items-center gap-2 text-sm font-semibold text-muted">
          <Gauge size={15} className="text-violet" /> Scorecard · the numbers that matter
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {score.map((s) => (
            <div key={s.label} className="rounded-2xl glass-panel px-4 py-3">
              <div className="font-display text-xl font-bold">{s.val}</div>
              <div className="text-xs text-muted-2">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-muted">
            <Target size={15} className="text-coral" /> Rocks · this quarter ({doneRocks}/{r.operate.rocks.length})
          </h2>
          <div className="mt-4 space-y-2">
            {r.operate.rocks.length === 0 && (
              <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-xs text-muted-2">No Rocks yet — set 3–5 priorities for the quarter.</div>
            )}
            {r.operate.rocks.map((rk) => (
              <div key={rk.id} className="flex items-center gap-3 rounded-xl glass-panel px-3 py-2.5">
                <button onClick={() => r.toggleRock(rk.id)} aria-label="Toggle rock" className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${rk.done ? "border-mint bg-mint text-bg" : "border-muted-2"}`}>
                  {rk.done && <Check size={12} />}
                </button>
                <span className={`flex-1 text-sm ${rk.done ? "text-muted line-through" : "text-text"}`}>{rk.title}</span>
                <button onClick={() => r.deleteRock(rk.id)} aria-label="Delete rock" className="text-muted-2 transition hover:text-coral">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); r.addRock(rock); setRock(""); }} className="mt-3 flex gap-2">
            <input value={rock} onChange={(e) => setRock(e.target.value)} placeholder="Add a quarterly Rock…" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted-2 focus:border-coral/40" aria-label="New rock" />
            <button type="submit" className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm text-muted transition hover:text-text" aria-label="Add rock"><Plus size={15} /></button>
          </form>
        </section>

        <section>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-muted">
            <AlertTriangle size={15} className="text-amber" /> Issues · identify, discuss, solve
          </h2>
          <div className="mt-4 space-y-2">
            {autoIssues.map((t, i) => (
              <div key={"auto" + i} className="flex items-center gap-2 rounded-xl border border-amber/25 bg-amber/[0.05] px-3 py-2.5 text-sm">
                <span className="rounded bg-amber/15 px-1.5 py-0.5 text-[10px] font-medium uppercase text-amber">auto</span>
                <span className="flex-1 text-muted">{t}</span>
              </div>
            ))}
            {r.operate.issues.map((i) => (
              <div key={i.id} className="flex items-center gap-3 rounded-xl glass-panel px-3 py-2.5">
                <button onClick={() => r.resolveIssue(i.id)} aria-label="Resolve issue" className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${i.resolved ? "border-mint bg-mint text-bg" : "border-muted-2"}`}>
                  {i.resolved && <Check size={12} />}
                </button>
                <span className={`flex-1 text-sm ${i.resolved ? "text-muted line-through" : "text-text"}`}>{i.title}</span>
              </div>
            ))}
            {autoIssues.length === 0 && r.operate.issues.length === 0 && (
              <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-xs text-muted-2">No issues. Clean week.</div>
            )}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); r.addIssue(issue); setIssue(""); }} className="mt-3 flex gap-2">
            <input value={issue} onChange={(e) => setIssue(e.target.value)} placeholder="Log an issue…" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted-2 focus:border-coral/40" aria-label="New issue" />
            <button type="submit" className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm text-muted transition hover:text-text" aria-label="Add issue"><Plus size={15} /></button>
          </form>
        </section>
      </div>

      <section className="rounded-2xl glass-panel p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-muted">
          <MessagesSquare size={15} className="text-mint" /> Weekly review
        </h2>
        <div className="mt-3 flex items-start gap-2.5">
          <LogoMark size={24} className="mt-0.5 shrink-0" />
          <p className="text-sm leading-relaxed text-muted">{review}</p>
        </div>
      </section>
    </div>
  );
}

/* ── shared rows ─────────────────────────────────────────────── */
function ActivityRow({ a, onUndo }: { a: Activity; onUndo: () => void }) {
  const S = agentStyle[a.agent];
  const A = AGENTS[a.agent];
  const failed = a.status === "failed-credited";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: a.undone ? 0.45 : 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-start gap-3 rounded-2xl glass-panel p-4"
    >
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${S.ring} ${S.color}`}>
        <S.icon size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-2">
          {A.name} · night {a.night}
          {a.meta && <span className="normal-case tracking-normal">· {a.meta}</span>}
        </div>
        <div className={`mt-0.5 text-sm ${a.undone ? "text-muted line-through" : "text-text"}`}>{a.action}</div>
        {a.proof && !a.undone && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-bg/60 px-2 py-1 text-[11px] text-mint">
            <Check size={11} />
            {a.proof.value}
          </div>
        )}
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <span className={`text-xs ${failed ? "text-muted-2 line-through" : "text-muted"}`}>{a.cost > 0 ? "$" + a.cost.toFixed(2) : "—"}</span>
        {!a.undone && a.status === "done" && a.cost > 0 && (
          <button onClick={onUndo} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted transition hover:text-text">
            <Undo2 size={11} /> undo
          </button>
        )}
        {failed && <span className="rounded-md bg-mint/12 px-2 py-1 text-[11px] text-mint">credited back</span>}
        {a.undone && <span className="text-[11px] text-muted-2">undone</span>}
      </div>
    </motion.div>
  );
}

function ApprovalCard({ title, detail, agent, onApprove, onReject }: { title: string; detail: string; agent: AgentRole; onApprove: () => void; onReject: () => void }) {
  const A = AGENTS[agent];
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl border border-coral/30 bg-coral/[0.05] p-4">
      <div className="text-[11px] uppercase tracking-wide text-muted-2">{A.name} · needs your ok</div>
      <div className="mt-1 text-sm font-semibold">{title}</div>
      <p className="mt-1 text-xs text-muted">{detail}</p>
      <div className="mt-3 flex gap-2">
        <button onClick={onApprove} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-coral py-2 text-xs font-semibold text-bg transition hover:brightness-110">
          <Check size={13} /> Approve
        </button>
        <button onClick={onReject} className="inline-flex items-center justify-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted transition hover:text-text">
          <X size={13} /> Reject
        </button>
      </div>
    </motion.div>
  );
}
