"use client";

// THE STREAM (Connect-First Reset §2, Block A) — the single conversational operating surface that
// REPLACES the dashboard cockpit (metric hero + 6 tabs; kill list in docs/adr/0007-the-stream.md).
// One thread per company: the named agents' real ledger entries rendered as conversational turns,
// artifacts inline, and ONE pinned decision block for the rare thing that needs the human.
//
// The Bloome distinction (load-bearing): the human here is an OVERSEER reading the thread like a
// board member reading minutes — the pill says "You're overseeing", never "You're driving".
// Monochrome only: white bg, near-black ink, greys, hairlines, square buttons that invert on hover.

import { useMemo, useState } from "react";
import type { useEngine } from "@/lib/engine/useEngine";
import { CompanyLogo } from "@/components/CompanyLogo";
import { isFounderEmail } from "@/lib/engine/founders";
import { billingLive } from "@/lib/engine/billing";
import { continueLocked, previewedCount, waitlistGateOn, trialActive, trialDaysLeft, TRIAL_CREDITS, creditsLeft } from "@/lib/engine/access-gate";
import { RenameTitle } from "./RenameTitle";
import { GoalChip } from "./GoalChip";
import { DecisionBlock } from "./DecisionBlock";
import { StreamTurn } from "./StreamTurn";
import { ProductCard } from "./ProductCard";
import { AskBar } from "./AskBar";

type Filter = "all" | "needs-me" | "done";

const THREAD_CAP = 40; // latest ~40 turns — the thread is a conversation, not an archive

const BTN_PRIMARY =
  "border border-text bg-text px-3.5 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-bg transition hover:bg-bg hover:text-text disabled:opacity-40";
const BTN_SECONDARY =
  "border border-border px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted transition hover:border-text hover:bg-text hover:text-bg disabled:opacity-40";

export function Stream({ r, entitled, userEmail, trialStartedAt }: { r: ReturnType<typeof useEngine>; entitled: boolean; userEmail?: string; trialStartedAt: number | null }) {
  const c = r.company!;
  // Post-preview "continue" gate — same rules as the old Operating surface (see lib/engine/access-gate):
  // founders + truly-paid are never gated; an active reverse trial keeps it unlocked; `paid` counts only
  // when billing is actually live (never the billing-off demo bypass).
  const gateOn = waitlistGateOn(process.env.NEXT_PUBLIC_WAITLIST_GATE);
  const paid = billingLive() ? entitled : false;
  const founder = isFounderEmail(userEmail);
  const locked = continueLocked({ gateOn, founder, paid, previewedCount: previewedCount(r.companies), trialStartedAt });
  const onTrial = gateOn && !founder && !paid && trialActive(trialStartedAt);
  // Paywall integrity: the live URL is masked in the thread until entitled (the product card is the door).
  const lockedUrl = !entitled && c.product?.status === "live" ? c.product?.url : undefined;
  // Standing-authorization ledger: activities the autopilot resolved itself (tagged by resolveApproval).
  const autoRan = r.activities.filter((a) => a.meta?.startsWith("autopilot")).length;

  const [filter, setFilter] = useState<Filter>("all");
  const [blitzDone, setBlitzDone] = useState(false);
  function doBlitz() {
    r.launchBlitz();
    setBlitzDone(true);
    setTimeout(() => setBlitzDone(false), 2200);
  }

  // The thread: latest ~40 real ledger entries, oldest → newest so it reads like a conversation
  // (the store is newest-first). Filters are client-side over the same slice.
  const turns = useMemo(() => {
    const latest = r.activities.slice(0, THREAD_CAP);
    const filtered =
      filter === "needs-me"
        ? latest.filter((a) => a.status === "pending-approval")
        : filter === "done"
          ? latest.filter((a) => a.status === "done" && !a.undone)
          : latest;
    return filtered.slice().reverse();
  }, [r.activities, filter]);

  const needsMe = r.pendingApprovals.length;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 pb-8">
      {/* ── 1 · Header band ──────────────────────────────────────── */}
      <header className="border-b-[1.5px] border-text pb-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <CompanyLogo name={c.name} size={36} className="shrink-0" />
            <div className="min-w-0">
              <RenameTitle name={c.name} onRename={r.renameCompany} />
              <p className="max-w-md truncate text-xs text-muted">{c.idea}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="border border-border px-2.5 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
              You&apos;re overseeing
            </span>
            <button
              onClick={() => r.setKillSwitch(!r.killSwitch)}
              title={
                r.killSwitch
                  ? "Autonomy halted — every action queues for you. Tap to resume."
                  : "Hard-stop the autonomous loop instantly — everything queues for you."
              }
              className={`border px-2.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] transition ${
                r.killSwitch ? "border-text bg-text text-bg" : "border-border text-muted hover:border-text hover:bg-text hover:text-bg"
              }`}
            >
              {r.killSwitch ? "Halted — resume" : "Kill switch"}
            </button>
          </div>
        </div>
        <div className="mt-2.5">
          <GoalChip goal={c.growthGoal} imported={c.product?.status === "live"} onSet={r.setGrowthGoal} />
        </div>

        {/* Settled revenue — the one number allowed this big. No revenue field exists on the client
            engine yet (no payment rail is wired into it), so $0 here is the hard truth, not a
            placeholder: bind this to real settled revenue when a verified receipt exists. It NEVER
            moves without one (honesty floor). */}
        <div className="mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">Settled revenue · trailing 30 days</div>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-display text-5xl font-bold leading-none tracking-tighter sm:text-6xl">$0</span>
          <span className="font-mono text-[11px] text-muted-2">verified receipts only — this number never moves without one</span>
        </div>
        <div className="mt-3.5 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-2">
          <span><span className="font-semibold text-text">{c.ledger.tasksDone}</span> tasks done</span>
          <span><span className="font-semibold text-text">{c.night}</span> shifts run</span>
          <span><span className="font-semibold text-text">{autoRan}</span> ran autonomously</span>
          <span><span className="font-semibold text-text">{creditsLeft(c.ledger.creditsSpent)}</span>/{TRIAL_CREDITS} trial credits</span>
        </div>

        {/* Compact action row — the operator verbs that survive the cockpit. */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {locked ? (
            <a href="/join" className={BTN_PRIMARY}>Join the waitlist to continue</a>
          ) : (
            <>
              <button onClick={r.runShift} disabled={r.working !== null} className={BTN_PRIMARY}>
                {r.working === "shift" ? "Working…" : "Run shift"}
              </button>
              <button onClick={r.revalidate} disabled={r.working !== null} title="Re-run the demand test" className={BTN_SECONDARY}>
                {r.working === "validating" ? "Re-testing…" : "Re-test"}
              </button>
              <button
                onClick={doBlitz}
                disabled={r.working !== null || blitzDone}
                title="Marketing drafts launch posts for your approval"
                className={BTN_SECONDARY}
              >
                {blitzDone ? "Drafted" : "Accelerate"}
              </button>
            </>
          )}
        </div>
      </header>

      {/* Slim contextual lines — only when they matter. */}
      {onTrial && (
        <div className="flex flex-wrap items-center gap-2 border border-border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
          <span><span className="font-semibold text-text">Free trial</span> — {trialDaysLeft(trialStartedAt)} days left of full autopilot</span>
          <a href="/join" className="ml-auto font-semibold text-text underline decoration-dotted underline-offset-2 hover:no-underline">Upgrade →</a>
        </div>
      )}
      {r.autopilotPaused && (
        <div className="border border-border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
          Autopilot paused — {needsMe} decision{needsMe === 1 ? "" : "s"} pinned below. Clear them to resume nightly shifts.
        </div>
      )}

      {/* ── 2 · Filter chips ─────────────────────────────────────── */}
      <div className="flex items-center gap-1.5" aria-label="Filter the thread">
        {(
          [
            { key: "all", label: "All" },
            { key: "needs-me", label: `Needs me${needsMe > 0 ? ` — ${needsMe}` : ""}` },
            { key: "done", label: "Done" },
          ] as { key: Filter; label: string }[]
        ).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={`border px-2.5 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.16em] transition ${
              filter === f.key ? "border-text bg-text text-bg" : "border-border text-muted hover:border-text hover:bg-text hover:text-bg"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── 3 · Pinned decision block — exists only when a decision does. */}
      <DecisionBlock approvals={r.pendingApprovals} onResolve={r.resolveApproval} />

      {/* ── 4 · The money moment — a special pinned artifact turn. */}
      <ProductCard product={c.product} entitled={entitled} userEmail={userEmail} />

      {/* ── 5 · The thread ───────────────────────────────────────── */}
      <section aria-label="The thread">
        {turns.length === 0 ? (
          <p className="border border-dashed border-border px-4 py-6 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-muted-2">
            {filter === "needs-me"
              ? "Nothing waiting on you"
              : filter === "done"
                ? "No completed work yet"
                : "Nothing yet — run a shift and every action lands here, in order"}
          </p>
        ) : (
          <div className="border-t border-border">
            {r.activities.length > THREAD_CAP && filter === "all" && (
              <p className="pt-2 text-center font-mono text-[9px] uppercase tracking-[0.16em] text-muted-2">Showing the latest {THREAD_CAP} turns</p>
            )}
            {turns.map((a, i) => (
              <StreamTurn key={a.id} a={a} onUndo={() => r.undoActivity(a.id)} lockedUrl={lockedUrl} delay={Math.min(i * 35, 420)} />
            ))}
          </div>
        )}
      </section>

      {/* ── 6 · The bottom line — a real input on the real chat path. */}
      <AskBar company={c} onApproval={r.addApproval} />
    </div>
  );
}
