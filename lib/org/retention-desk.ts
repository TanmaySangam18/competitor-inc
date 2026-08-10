// ─────────────────────────────────────────────────────────────────────────────
// lib/org/retention-desk.ts — THE RETENTION DESK (customer lifetime, armed before customer #1).
//
// Purpose: the machinery that keeps a paying customer once one exists — health scoring from real
// signals, the weekly receipt-backed review each buyer receives, renewal checkpoints on a contract
// clock, and the red-band churn save play that escalates to the founder as a PREPARED decision
// (an EnqueueInput for decision-queue.ts; this module never enqueues, never sends — pure functions,
// injected clock, the caller owns every side effect).
//
// Rails (the honesty floor, non-negotiable):
//   · ZERO customers today — every renderer says so honestly on empty input ("armed and waiting"),
//     and a customer with NO signals gets band "unknown" + score null, NEVER a fabricated number.
//   · Health ≠ abuse. lib/core/abuse.ts freezes misuse (legal exposure); this desk measures
//     engagement + payment + support load (churn risk). Never duplicated, never mixed.
//   · Weekly reviews reference receipt ids minted elsewhere (lib/engine/receipt-sign.ts territory);
//     this desk cites them, it never mints or invents one.
//   · Escalations are RETURNED as EnqueueInput values; the founder approves, a human executes.
//   · Rendered strings carry no em-dashes (founder/customer-facing prose rule).
// ─────────────────────────────────────────────────────────────────────────────

import type { EnqueueInput } from "./decision-queue";

const DAY_MS = 24 * 60 * 60 * 1000;

// ── Signals ───────────────────────────────────────────────────────────────────

export type CustomerSignalKind =
  | "login"
  | "build"
  | "approval"
  | "support-ticket"
  | "payment-ok"
  | "payment-failed"
  | "feature-request"
  | "silence"; // an explicit "we noticed nothing happened" marker recorded by the watcher

export interface CustomerSignal {
  customerId: string;
  at: number; // epoch ms
  kind: CustomerSignalKind;
}

// Signals that count as the customer USING the product (recency + frequency components).
const ENGAGEMENT: ReadonlySet<CustomerSignalKind> = new Set(["login", "build", "approval", "feature-request"] as CustomerSignalKind[]);

// ── Health ────────────────────────────────────────────────────────────────────

export type HealthBand = "green" | "yellow" | "red" | "unknown";

export interface HealthComponents {
  recency: number; // 0..40
  frequency: number; // 0..25
  payment: number; // 0..25
  support: number; // 0..10
}

export interface CustomerHealth {
  score: number | null; // 0..100, or null when no signals exist (a number here would be fabricated)
  band: HealthBand;
  reasons: string[]; // plain sentences, each naming the signal it came from
  components: HealthComponents | null;
}

// The whole scoring policy, visible (tune here, never in a prompt):
//   recency   (0..40): days since the last engagement signal — ≤3d:40 · ≤7d:32 · ≤14d:22 · ≤21d:12 · ≤30d:4 · else 0
//   frequency (0..25): engagement signals in the last 30 days — ≥12:25 · ≥6:18 · ≥3:12 · ≥1:6 · 0:0
//   payment   (0..25): latest payment signal — ok:25 · none yet:12 (unknown, said honestly) · failed:0
//   support   (0..10): support tickets in the last 30 days — 0:10 · ≤2:6 · ≤4:2 · ≥5:0
// Bands: green ≥ 70 · yellow 40..69 · red < 40.
const GREEN_FLOOR = 70;
const YELLOW_FLOOR = 40;

function recencyPoints(days: number): number {
  if (days <= 3) return 40;
  if (days <= 7) return 32;
  if (days <= 14) return 22;
  if (days <= 21) return 12;
  if (days <= 30) return 4;
  return 0;
}

function frequencyPoints(count: number): number {
  if (count >= 12) return 25;
  if (count >= 6) return 18;
  if (count >= 3) return 12;
  if (count >= 1) return 6;
  return 0;
}

function supportPoints(tickets: number): number {
  if (tickets === 0) return 10;
  if (tickets <= 2) return 6;
  if (tickets <= 4) return 2;
  return 0;
}

/**
 * Score one customer's health from their signals. Deterministic, pure, injected clock.
 * No signals ⇒ score null + band "unknown" (we do not invent a health number for silence).
 */
export function customerHealth(signals: CustomerSignal[], opts: { now: number }): CustomerHealth {
  if (signals.length === 0) {
    return {
      score: null,
      band: "unknown",
      reasons: ["No signals recorded for this customer yet. Health is unknown, not assumed."],
      components: null,
    };
  }

  const reasons: string[] = [];
  const windowStart = opts.now - 30 * DAY_MS;
  const days = (at: number) => Math.floor((opts.now - at) / DAY_MS);

  // Recency: days since the last engagement signal (login, build, approval, feature request).
  const engagement = signals.filter((s) => ENGAGEMENT.has(s.kind));
  const lastEngagement = engagement.reduce<number | null>((max, s) => (max === null || s.at > max ? s.at : max), null);
  const recency = lastEngagement === null ? 0 : recencyPoints(days(lastEngagement));
  if (lastEngagement === null) {
    reasons.push("No engagement signals (login, build, approval, feature request) recorded yet.");
  } else {
    reasons.push(`Last engagement signal was ${days(lastEngagement)} days ago.`);
  }

  // Named signal callouts the founder actually acts on.
  const lastLogin = signals.reduce<number | null>((max, s) => (s.kind === "login" && (max === null || s.at > max) ? s.at : max), null);
  if (lastLogin === null) reasons.push("No logins recorded yet.");
  else if (days(lastLogin) > 14) reasons.push(`No logins in ${days(lastLogin)} days.`);

  // Frequency: engagement signals inside the 30-day window.
  const recentEngagement = engagement.filter((s) => s.at >= windowStart).length;
  const frequency = frequencyPoints(recentEngagement);
  reasons.push(
    recentEngagement === 0
      ? "No engagement signals in the last 30 days."
      : `${recentEngagement} engagement ${recentEngagement === 1 ? "signal" : "signals"} in the last 30 days.`,
  );

  // Payment: the LATEST payment signal decides (a recovered card should not stay red).
  const lastPayment = signals
    .filter((s) => s.kind === "payment-ok" || s.kind === "payment-failed")
    .reduce<CustomerSignal | null>((latest, s) => (latest === null || s.at > latest.at ? s : latest), null);
  const payment = lastPayment === null ? 12 : lastPayment.kind === "payment-ok" ? 25 : 0;
  if (lastPayment === null) reasons.push("No payment signals recorded yet.");
  else if (lastPayment.kind === "payment-failed") reasons.push(`The latest payment failed, ${days(lastPayment.at)} days ago.`);
  else reasons.push("The latest payment succeeded.");

  // Support load: tickets inside the 30-day window (load, not abuse; abuse lives in lib/core/abuse.ts).
  const tickets = signals.filter((s) => s.kind === "support-ticket" && s.at >= windowStart).length;
  const support = supportPoints(tickets);
  if (tickets > 0) reasons.push(`${tickets} support ${tickets === 1 ? "ticket" : "tickets"} in the last 30 days.`);

  // An explicit silence marker is a reason on its own (the watcher already said it out loud).
  const lastSilence = signals.reduce<number | null>((max, s) => (s.kind === "silence" && (max === null || s.at > max) ? s.at : max), null);
  if (lastSilence !== null) reasons.push(`A silence signal was recorded ${days(lastSilence)} days ago.`);

  const components: HealthComponents = { recency, frequency, payment, support };
  const score = recency + frequency + payment + support;
  const band: HealthBand = score >= GREEN_FLOOR ? "green" : score >= YELLOW_FLOOR ? "yellow" : "red";
  return { score, band, reasons, components };
}

// ── Weekly receipt review ─────────────────────────────────────────────────────

export interface ReceiptRef {
  id: string; // minted + signed elsewhere; this desk only references it
  title: string;
  at: number; // epoch ms
}

export interface WeeklyReceiptReview {
  customerId: string;
  empty: boolean;
  receiptIds: string[];
  lines: string[];
  text: string; // the digest block, ready to send after human/policy gates
}

const EMPTY_WEEK_LINE = "No agent work was receipted for you this week. That is worth a conversation, reply and tell us why.";

const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/**
 * The weekly digest block each buyer receives: what the agents did for them this week, every line
 * backed by a receipt id. Honest when empty. Receipts are cited, never minted here.
 */
export function weeklyReceiptReview(customer: { id: string; name: string }, receipts: ReceiptRef[]): WeeklyReceiptReview {
  const header = `Weekly review for ${customer.name}.`;
  if (receipts.length === 0) {
    const lines = [header, EMPTY_WEEK_LINE];
    return { customerId: customer.id, empty: true, receiptIds: [], lines, text: lines.join("\n") };
  }
  const ordered = [...receipts].sort((a, b) => a.at - b.at);
  const lines = [
    header,
    `What the agents did for you this week, each line backed by a signed receipt id:`,
    ...ordered.map((r) => `- ${isoDay(r.at)}: ${r.title} (receipt ${r.id})`),
    `Every receipt above is verifiable. If any line does not match what you experienced, reply and say so.`,
  ];
  return { customerId: customer.id, empty: false, receiptIds: ordered.map((r) => r.id), lines, text: lines.join("\n") };
}

// ── Renewal checkpoints ───────────────────────────────────────────────────────

export interface RenewalCheckpoint {
  daysOut: number; // days before contract end when this checkpoint fires
  at: number; // epoch ms when it fires
  action: string; // the concrete thing to do, one sentence
}

// The renewal playbook, on a clock. Order is chronological (farthest out first).
const RENEWAL_PLAYBOOK: { daysOut: number; action: string }[] = [
  { daysOut: 90, action: "Run the value review: walk the customer through every receipted outcome since kickoff and ask what is missing." },
  { daysOut: 60, action: "Hold the expansion conversation: ask which other team or course could use this and sketch that pilot together." },
  { daysOut: 30, action: "Prepare the renewal paperwork as a draft and queue it for the founder. Only a human signs." },
  { daysOut: 14, action: "Book the founder call to close the renewal, with the value review and the receipts on the table." },
];

/**
 * The ordered checkpoint list for one contract, past checkpoints filtered out. A contract that has
 * already ended returns an empty list (the renewal window is over; that is a different conversation).
 */
export function renewalCheckpoints(contractEndMs: number, nowMs: number): RenewalCheckpoint[] {
  return RENEWAL_PLAYBOOK.map((c) => ({ ...c, at: contractEndMs - c.daysOut * DAY_MS })).filter((c) => c.at >= nowMs);
}

// ── Churn save play ───────────────────────────────────────────────────────────

/**
 * When health is red, prepare the founder's save-play decision (an EnqueueInput for the decision
 * queue; the caller enqueues, the founder approves, a human executes). Anything not red ⇒ null.
 */
export function churnSavePlay(health: CustomerHealth, customer: { id: string; name: string }): EnqueueInput | null {
  if (health.band !== "red") return null;
  const scoreLine = health.score === null ? "no score, no signals" : `${health.score}/100`;
  const paymentFailed = health.reasons.some((r) => r.includes("payment failed"));
  const play = [
    `Proposed save play for ${customer.name}:`,
    `1. The founder sends a personal note within 24 hours. Not a template, name what we saw: ${health.reasons.join(" ")}`,
    `2. Offer a 30 minute working session this week to rebuild one concrete win with them.`,
    paymentFailed ? `3. Name the failed payment plainly and offer to fix billing together on the call.` : `3. Ask directly what stopped them from using the product, and listen.`,
    `4. If they have gone quiet for good, ask for the honest exit interview. A truthful loss reason feeds the win/loss report.`,
    `Nothing above executes automatically. Approve, and a human does it.`,
  ].join("\n");
  return {
    kind: "other",
    title: `Churn risk: ${customer.name} is red (${scoreLine})`,
    summary: `${customer.name} scored ${scoreLine} on customer health, band red. Reasons: ${health.reasons.join(" ")}`,
    artifact: play,
    preparedBy: "retention-desk",
  };
}

// ── The tick (one call for the cron) ──────────────────────────────────────────

export interface RetentionCustomer {
  id: string;
  name: string;
  signals: CustomerSignal[];
  contractEndMs?: number; // absent while the pilot paperwork is not signed yet
  weekReceipts?: ReceiptRef[]; // this week's already-minted receipts for this customer
}

export interface CheckpointDue {
  customerId: string;
  checkpoint: RenewalCheckpoint;
}

export interface RetentionTickResult {
  reviews: WeeklyReceiptReview[];
  escalations: EnqueueInput[]; // red-band save plays, ready for the decision queue
  checkpointsDue: CheckpointDue[]; // checkpoints landing inside this tick's window
  note: string; // one honest line about what this tick saw
}

const ARMED_LINE = "No customers yet. The retention desk is armed and waiting for customer number one.";

/**
 * The pure orchestrator the daily cron consumes in ONE call: every customer's weekly review, every
 * red-band escalation (as EnqueueInput values, nothing enqueued here), and every renewal checkpoint
 * that lands inside this tick's window (default 24 hours, the daily cadence).
 */
export function retentionTick(
  customers: RetentionCustomer[],
  opts: { now: number; checkpointWindowMs?: number },
): RetentionTickResult {
  if (customers.length === 0) {
    return { reviews: [], escalations: [], checkpointsDue: [], note: ARMED_LINE };
  }
  const windowMs = opts.checkpointWindowMs ?? DAY_MS;
  const reviews: WeeklyReceiptReview[] = [];
  const escalations: EnqueueInput[] = [];
  const checkpointsDue: CheckpointDue[] = [];

  for (const c of customers) {
    reviews.push(weeklyReceiptReview({ id: c.id, name: c.name }, c.weekReceipts ?? []));

    const health = customerHealth(c.signals, { now: opts.now });
    const save = churnSavePlay(health, { id: c.id, name: c.name });
    if (save) escalations.push(save);

    if (c.contractEndMs !== undefined) {
      // Due = the checkpoint's moment falls inside (now, now + window]. Future ones wait their turn.
      for (const cp of renewalCheckpoints(c.contractEndMs, opts.now)) {
        if (cp.at - opts.now <= windowMs) checkpointsDue.push({ customerId: c.id, checkpoint: cp });
      }
    }
  }

  const note = `Retention tick reviewed ${customers.length} ${customers.length === 1 ? "customer" : "customers"}: ${escalations.length} red-band ${escalations.length === 1 ? "escalation" : "escalations"}, ${checkpointsDue.length} renewal ${checkpointsDue.length === 1 ? "checkpoint" : "checkpoints"} due.`;
  return { reviews, escalations, checkpointsDue, note };
}
