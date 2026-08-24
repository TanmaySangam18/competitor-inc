// ─────────────────────────────────────────────────────────────────────────────
// AUDITABLE AUTONOMY — answer "why did the company do that?" without inventing the answer.
//
// The ledger is already tamper-evident. Tamper-evident is not the same as LEGIBLE: a founder, a
// university security review and an insurer all ask the same question, and "here are 400 hash-chained
// rows" is not an answer to it.
//
// THE ONE RULE THIS MODULE EXISTS TO ENFORCE: an explanation may only assert what the ledger actually
// recorded. Where the record is missing, it says the record is missing. A plausible narrative stitched
// from timestamps would be more useful and completely worthless, because the entire value of an audit
// trail is that it cannot flatter you.
// ─────────────────────────────────────────────────────────────────────────────

import { type AuditEntry, AuditLog } from "./audit";

export interface Link {
  seq: number;
  actor: string;
  action: string;
  verdict?: string;
  costUsd: number;
  rationale?: string;
}

export interface Explanation {
  seq: number;
  what: string;
  who: string;
  when: string;
  /** The chain of authorisation, nearest first, root last. Empty when nothing was recorded. */
  authorisedBy: Link[];
  /** What this entry cost by itself. */
  directCostUsd: number;
  /** This entry plus everything that names it, transitively, as their cause. */
  totalCostUsd: number;
  /** Entries that cite this one as their reason. */
  ledTo: Link[];
  /** Every question this explanation could NOT answer from the record, named. */
  gaps: string[];
  /** False when the hash chain does not verify, in which case nothing above should be trusted. */
  chainVerified: boolean;
}

const link = (e: AuditEntry): Link => ({
  seq: e.seq,
  actor: e.actor,
  action: e.action,
  verdict: e.verdict,
  costUsd: e.costUsd ?? 0,
  rationale: e.rationale,
});

/** Round to cents. Floating point drift in a money figure shown to a customer is not acceptable. */
const money = (n: number): number => Math.round(n * 100) / 100;

/**
 * Walk upward through `because` to the root authorisation.
 * Cycle-safe: a corrupted or hand-edited ledger could contain a loop, and this must terminate rather
 * than hang a request.
 */
function chainUp(start: AuditEntry, bySeq: Map<number, AuditEntry>): { chain: Link[]; gaps: string[] } {
  const chain: Link[] = [];
  const gaps: string[] = [];
  const seen = new Set<number>([start.seq]);
  let cur = start;

  for (;;) {
    if (cur.because === undefined) {
      if (cur.seq === start.seq) gaps.push("No authorising decision was recorded for this action.");
      return { chain, gaps };
    }
    if (seen.has(cur.because)) {
      gaps.push(`The authorisation chain loops at entry ${cur.because}, so the root cannot be established.`);
      return { chain, gaps };
    }
    const parent = bySeq.get(cur.because);
    if (!parent) {
      gaps.push(`Entry ${cur.seq} cites entry ${cur.because} as its authorisation, but that entry is not in the ledger.`);
      return { chain, gaps };
    }
    seen.add(parent.seq);
    chain.push(link(parent));
    cur = parent;
  }
}

/** Everything caused by `seq`, transitively. Cycle-safe for the same reason. */
function descendants(seq: number, children: Map<number, AuditEntry[]>): AuditEntry[] {
  const out: AuditEntry[] = [];
  const seen = new Set<number>([seq]);
  const queue = [seq];
  while (queue.length) {
    for (const kid of children.get(queue.shift()!) ?? []) {
      if (seen.has(kid.seq)) continue;
      seen.add(kid.seq);
      out.push(kid);
      queue.push(kid.seq);
    }
  }
  return out;
}

/**
 * Explain one entry. Pure: takes the entries and returns a verdict, so it is exhaustively testable and
 * a route can hand it either the live ledger or a customer's stored one.
 */
export function explain(seq: number, entries: readonly AuditEntry[], chainVerified: boolean): Explanation | null {
  const bySeq = new Map(entries.map((e) => [e.seq, e]));
  const target = bySeq.get(seq);
  if (!target) return null;

  const children = new Map<number, AuditEntry[]>();
  for (const e of entries) {
    if (e.because === undefined) continue;
    const list = children.get(e.because) ?? [];
    list.push(e);
    children.set(e.because, list);
  }

  const { chain, gaps } = chainUp(target, bySeq);
  const caused = descendants(seq, children);
  const direct = target.costUsd ?? 0;
  const total = money(direct + caused.reduce((sum, e) => sum + (e.costUsd ?? 0), 0));

  // Name the gaps that matter to somebody deciding whether to trust this, rather than only the
  // structural ones. A spend with no outcome recorded is the single most common real question.
  if (direct > 0 && caused.length === 0) {
    gaps.push("Money was spent and no resulting outcome was recorded, so the return on it cannot be shown.");
  }
  if (!target.rationale) {
    gaps.push("No rationale was written for this action.");
  }
  if (!chainVerified) {
    gaps.push("The ledger's hash chain does not verify, so nothing in this explanation can be trusted.");
  }

  return {
    seq,
    what: target.action,
    who: target.actor,
    when: target.ts,
    authorisedBy: chain,
    directCostUsd: money(direct),
    totalCostUsd: total,
    ledTo: caused.map(link),
    gaps,
    chainVerified,
  };
}

/** The convenience form, against the live ledger, with integrity checked rather than assumed. */
export function explainFromLog(seq: number, log: AuditLog): Explanation | null {
  return explain(seq, log.all(), log.verifyIntegrity().ok);
}

/** One-line human summary. Leads with the gap when there is one, because that is the honest headline. */
export function summarise(x: Explanation): string {
  if (!x.chainVerified) return `Entry ${x.seq} cannot be explained: the ledger's hash chain is broken.`;
  const spend = x.totalCostUsd > 0 ? ` It accounts for $${x.totalCostUsd.toFixed(2)}.` : "";
  const auth = x.authorisedBy.length
    ? ` Authorised by ${x.authorisedBy[x.authorisedBy.length - 1].actor} (entry ${x.authorisedBy[x.authorisedBy.length - 1].seq}).`
    : " No authorising decision was recorded.";
  const gaps = x.gaps.length ? ` ${x.gaps.length} thing${x.gaps.length === 1 ? "" : "s"} could not be established from the record.` : "";
  return `${x.who} ran ${x.what}.${auth}${spend}${gaps}`;
}
