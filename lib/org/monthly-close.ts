// ─────────────────────────────────────────────────────────────────────────────
// lib/org/monthly-close.ts — THE MONTHLY CLOSE (1st of each month). A three-way reconciliation of
// settled revenue: what Polar (the merchant of record) says settled, what the revenue_events table
// recorded, and what the treasury inflow ledger shows. Renders a close document and a signed,
// verifiable close receipt.
//
// RAILS THIS MODULE HONORS:
//   · HONESTY FLOOR (crack-audit standing rule): totals are sums of REAL rows handed in by the
//     caller. A zero-revenue month is stated plainly ("No settled revenue this month."), never
//     dressed up or hidden. Discrepancies are surfaced, never smoothed over.
//   · Verifiability: the close is signed the same way metric receipts are (lib/engine/receipt-sign.ts
//     scheme: domain-tagged HMAC-SHA256 hex, fail-closed when no secret, timing-safe verify). The
//     secret is injected here so the close stays pure and offline-testable; production callers pass
//     process.env.RECEIPT_SIGNING_SECRET (the same secret receipt-sign resolves).
//   · Founder-facing prose contains no em-dashes (style rule): periods, commas, colons only.
//   · Pure functions + injected inputs, no I/O — the loop tick reads the real sources and adapts
//     rows to the minimal structural type below, exactly like lib/loop/finance-report.ts.
//
// ROW MAPPING (how callers adapt real rows to MoneyRow):
//   polarEvents    — Polar settled orders (order.paid webhooks or the Polar API):
//                      id = order id (data.id) · amountUsd = total_amount / 100 · occurredAt = created_at
//   revenueEvents  — our revenue_events table (written by app/api/billing/polar/route.ts):
//                      id = external_id · amountUsd = amount_cents / 100 · occurredAt = created_at
//   treasuryLedger — treasury INFLOW entries only (deposits/settlements into the customer-owned
//                    account): id = ledger row id · amountUsd = inflow amount · occurredAt = entry date.
//                    Ledger rows carry bank ids, not Polar ids, so the ledger leg is matched at the
//                    TOTAL level (ledger inflows vs settled), not row by row.
// ─────────────────────────────────────────────────────────────────────────────

import { createHmac, timingSafeEqual } from "node:crypto";

// ── Structural input types ────────────────────────────────────────────────────

/** The minimal structural shape all three sources adapt to (see the mapping table in the header). */
export interface MoneyRow {
  id: string;
  amountUsd: number;
  /** ISO timestamp; the month is taken from its first 7 chars ("YYYY-MM"). */
  occurredAt: string;
  /** Optional source-native kind ("order.paid", "deposit", ...) — carried into discrepancy detail. */
  kind?: string;
}

export interface ReconcileInputs {
  /** The month being closed, "YYYY-MM". Rows outside it are excluded before matching. */
  month: string;
  polarEvents: MoneyRow[];
  revenueEvents: MoneyRow[];
  treasuryLedger: MoneyRow[];
}

export type DiscrepancyKind =
  | "missing-recorded" // Polar settled it, revenue_events has no row for that id
  | "missing-settled" // revenue_events has a row Polar never settled
  | "amount-mismatch" // same id, different amounts
  | "ledger-mismatch"; // treasury inflow total disagrees with the settled total

export interface Discrepancy {
  kind: DiscrepancyKind;
  detail: string;
  amountUsd: number;
}

export interface Reconciliation {
  month: string;
  settledUsd: number; // per Polar (merchant of record)
  recordedUsd: number; // per revenue_events
  ledgerUsd: number; // per treasury inflows
  settledCount: number;
  recordedCount: number;
  ledgerCount: number;
  discrepancies: Discrepancy[];
  clean: boolean;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;
const usd = (n: number): string => `$${n.toFixed(2)}`;
const CENT = 0.005; // amounts closer than half a cent are equal (float tolerance)

const inMonth = (rows: MoneyRow[], month: string): MoneyRow[] =>
  rows.filter((r) => typeof r.occurredAt === "string" && r.occurredAt.slice(0, 7) === month && Number.isFinite(r.amountUsd));

const total = (rows: MoneyRow[]): number => round2(rows.reduce((sum, r) => sum + r.amountUsd, 0));

/** Sum rows per id (a redelivered duplicate id sums rather than silently overwriting). */
function byId(rows: MoneyRow[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) m.set(r.id, round2((m.get(r.id) ?? 0) + r.amountUsd));
  return m;
}

/**
 * The three-way match for one month. Pure and deterministic:
 *   leg 1 · Polar ↔ revenue_events, matched row by row on id (external_id = Polar order id);
 *   leg 2 · treasury inflows ↔ settled total, matched at the total level (ledger rows carry bank
 *           ids, not order ids — pretending to row-match them would be fiction).
 * clean = zero discrepancies. Empty inputs reconcile clean at $0.00 — an honest zero month.
 */
export function reconcile(inputs: ReconcileInputs): Reconciliation {
  const polar = inMonth(inputs.polarEvents, inputs.month);
  const recorded = inMonth(inputs.revenueEvents, inputs.month);
  const ledger = inMonth(inputs.treasuryLedger, inputs.month);

  const settledUsd = total(polar);
  const recordedUsd = total(recorded);
  const ledgerUsd = total(ledger);

  const discrepancies: Discrepancy[] = [];
  const settledById = byId(polar);
  const recordedById = byId(recorded);

  for (const [id, settled] of settledById) {
    const rec = recordedById.get(id);
    if (rec === undefined) {
      discrepancies.push({
        kind: "missing-recorded",
        detail: `Polar order ${id} settled ${usd(settled)} but revenue_events has no row for it.`,
        amountUsd: settled,
      });
    } else if (Math.abs(rec - settled) > CENT) {
      discrepancies.push({
        kind: "amount-mismatch",
        detail: `Order ${id}: Polar settled ${usd(settled)}, revenue_events recorded ${usd(rec)}.`,
        amountUsd: round2(Math.abs(rec - settled)),
      });
    }
  }
  for (const [id, rec] of recordedById) {
    if (!settledById.has(id)) {
      discrepancies.push({
        kind: "missing-settled",
        detail: `revenue_events row ${id} records ${usd(rec)} but Polar shows no settled order behind it.`,
        amountUsd: rec,
      });
    }
  }

  if (Math.abs(ledgerUsd - settledUsd) > CENT) {
    discrepancies.push({
      kind: "ledger-mismatch",
      detail: `Treasury inflows total ${usd(ledgerUsd)} but Polar settled ${usd(settledUsd)} (totals compared, ledger rows carry bank ids).`,
      amountUsd: round2(Math.abs(ledgerUsd - settledUsd)),
    });
  }

  return {
    month: inputs.month,
    settledUsd,
    recordedUsd,
    ledgerUsd,
    settledCount: polar.length,
    recordedCount: recorded.length,
    ledgerCount: ledger.length,
    discrepancies,
    clean: discrepancies.length === 0,
  };
}

// ── The close document ────────────────────────────────────────────────────────

/**
 * The monthly close document (markdown). Totals, the discrepancy table (or the clean line), and the
 * honesty section: a zero-revenue month is stated plainly, never padded or hidden. Pure string.
 */
export function closeArtifact(recon: Reconciliation): string {
  const lines: string[] = [
    `# Monthly close: ${recon.month}`,
    "",
    "## Totals",
    `- Settled per Polar (merchant of record): ${usd(recon.settledUsd)} across ${recon.settledCount} order${recon.settledCount === 1 ? "" : "s"}`,
    `- Recorded in revenue_events: ${usd(recon.recordedUsd)} across ${recon.recordedCount} row${recon.recordedCount === 1 ? "" : "s"}`,
    `- Treasury inflows: ${usd(recon.ledgerUsd)} across ${recon.ledgerCount} entr${recon.ledgerCount === 1 ? "y" : "ies"}`,
    "",
    "## Reconciliation",
  ];

  if (recon.clean) {
    lines.push("No discrepancies. Books match.");
  } else {
    lines.push("| Kind | Detail | Amount |", "| --- | --- | --- |");
    for (const d of recon.discrepancies) {
      lines.push(`| ${d.kind} | ${d.detail} | ${usd(d.amountUsd)} |`);
    }
  }

  lines.push("", "## Honesty");
  if (recon.settledUsd === 0) {
    lines.push("- No settled revenue this month. Zero is the real number, stated plainly.");
  } else {
    lines.push(`- Settled revenue this month: ${usd(recon.settledUsd)}. Collected and settled, not booked or promised.`);
  }
  lines.push(
    "- Every figure above is a sum of real rows: Polar settled orders, the revenue_events table, the treasury inflow ledger. Nothing is estimated.",
    `- Rows outside ${recon.month} were excluded before matching.`,
  );

  return lines.join("\n");
}

// ── The signed close receipt ──────────────────────────────────────────────────

export interface SignedClose {
  month: string;
  /** The exact close document that was signed (closeArtifact output). */
  body: string;
  /** HMAC-SHA256 hex over "close|" + body, keyed by the injected secret. */
  signature: string;
}

/**
 * Sign the close so it verifies like every other receipt. Same scheme as
 * lib/engine/receipt-sign.ts signMetricCard: domain-tagged HMAC-SHA256 hex, fail-closed — no secret
 * means no signed close (null), never an unverifiable stamp. Pass process.env.RECEIPT_SIGNING_SECRET
 * in production so close receipts share the platform receipt secret.
 */
export function signedClose(recon: Reconciliation, secret: string): SignedClose | null {
  const s = secret?.trim();
  if (!s) return null;
  const body = closeArtifact(recon);
  const signature = createHmac("sha256", s).update(`close|${body}`).digest("hex");
  return { month: recon.month, body, signature };
}

/** Timing-safe verification of a signed close (mirror of receipt-sign verifyMetricSig). */
export function verifySignedClose(payload: { body: string; signature: string }, secret: string): boolean {
  const s = secret?.trim();
  if (!s || !payload?.body || !payload?.signature) return false;
  const want = createHmac("sha256", s).update(`close|${payload.body}`).digest("hex");
  if (payload.signature.length !== want.length) return false;
  try {
    return timingSafeEqual(Buffer.from(want, "hex"), Buffer.from(payload.signature, "hex"));
  } catch {
    return false;
  }
}

// ── Cadence ───────────────────────────────────────────────────────────────────

/** The close runs monthly: true on the 1st (UTC — the same clock treasury rollMonth uses). */
export function isCloseDay(d: Date): boolean {
  return d.getUTCDate() === 1;
}
