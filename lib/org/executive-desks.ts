// ─────────────────────────────────────────────────────────────────────────────
// EXECUTIVE DESKS — finance drafts the invoices, legal drafts the contracts.
//
// Day One's supporting cast: the CFO desk and the General Counsel desk PREPARE real artifacts and hand
// them to the decision queue. Nothing here sends, signs, or charges — Naomi's own persona line is the
// spec: "she advises and drafts, a human signs." Deterministic text generation (no model call needed
// for the artifact skeleton; a model may later polish wording INSIDE these drafts, never beyond them).
// Pure: injected clock/id, no I/O.
// ─────────────────────────────────────────────────────────────────────────────

import type { EnqueueInput } from "./decision-queue";

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

// ── The CFO desk (chief-financial-officer) ──────────────────────────────────
export interface InvoiceLine { description: string; amountCents: number }
export interface InvoiceInput {
  customer: string;
  lines: InvoiceLine[];
  dueDate: string; // ISO date — kept as text; the desk drafts, it doesn't schedule
  invoiceNumber: string;
}

export function draftInvoice(input: InvoiceInput): EnqueueInput {
  const total = input.lines.reduce((n, l) => n + l.amountCents, 0);
  const body = [
    `INVOICE ${input.invoiceNumber}`,
    `Bill to: ${input.customer}`,
    `Due: ${input.dueDate}`,
    ``,
    ...input.lines.map((l) => `  ${l.description} — ${money(l.amountCents)}`),
    `  ────────────`,
    `  TOTAL: ${money(total)}`,
    ``,
    `Status: DRAFT — prepared by the finance desk; requires principal approval before sending.`,
  ].join("\n");
  return {
    kind: "invoice",
    title: `Invoice ${input.invoiceNumber} to ${input.customer} — ${money(total)}`,
    summary: `Finance drafted invoice ${input.invoiceNumber} for ${input.customer}: ${input.lines.length} line item(s), total ${money(total)}, due ${input.dueDate}. Approve to send.`,
    artifact: body,
    preparedBy: "chief-financial-officer",
  };
}

// ── The General Counsel desk (general-counsel — Naomi) ──────────────────────
export interface ContractInput {
  counterparty: string;
  purpose: string; // what the agreement covers, in one line
  termMonths: number;
  valueCents?: number; // optional consideration
  keyTerms: string[]; // the terms that matter, plain English
}

export function draftContract(input: ContractInput): EnqueueInput {
  const body = [
    `AGREEMENT (DRAFT)`,
    `Between: Competitor.Inc and ${input.counterparty}`,
    `Purpose: ${input.purpose}`,
    `Term: ${input.termMonths} month(s)${input.valueCents ? ` · Consideration: ${money(input.valueCents)}` : ""}`,
    ``,
    `Key terms:`,
    ...input.keyTerms.map((t, i) => `  ${i + 1}. ${t}`),
    ``,
    `Drafted by the General Counsel desk in plain English. This document is a DRAFT for the principal's`,
    `review — it is not executed, and only a human signature can execute it.`,
  ].join("\n");
  return {
    kind: "contract",
    title: `Contract with ${input.counterparty} — ${input.purpose}`,
    summary: `Legal drafted a ${input.termMonths}-month agreement with ${input.counterparty} covering ${input.purpose}${input.valueCents ? ` (${money(input.valueCents)})` : ""}; ${input.keyTerms.length} key terms flagged. Approve, reject, or send back with changes.`,
    artifact: body,
    preparedBy: "general-counsel",
  };
}

// ── Revision (the modify loop's return path) ─────────────────────────────────
// The desk takes the principal's note and produces the revised artifact. Deterministic v0: the note is
// applied as an explicit amendment block (honest about what changed); a model may later rewrite the
// artifact body around the note, but the amendment record always remains.
export function reviseArtifact(artifact: string, note: string, revision: number): { summary: string; artifact: string } {
  const amended = [
    artifact,
    ``,
    `── AMENDMENT (revision ${revision}) ──`,
    `Per the principal's note: ${note}`,
  ].join("\n");
  return {
    summary: `Revision ${revision}: updated per the principal's note — "${note}". Re-submitted for approval.`,
    artifact: amended,
  };
}
