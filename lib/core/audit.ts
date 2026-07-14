// lib/core/audit.ts — THE BLACK-BOX RECORDER (REQUIREMENTS §3 · Definition of Done #1).
//
// An append-only, tamper-EVIDENT ledger of every governed action: who (actor), for which customer, what
// action, the tier + verdict it got, a summary of input/output, the cost, the rationale, and whether it was
// reversible. Append-only by construction — there is no update or delete method. Tamper-evident by a hash
// chain: each entry's hash covers its own fields + the previous entry's hash, so altering any past entry
// breaks every hash after it, and `verifyIntegrity()` finds exactly where.
//
// Keyless: the default sink is in-memory (per-process). Durable persistence (Supabase, queryable for legal
// discovery per §3) plugs in at the connect phase via the AuditSink seam — no code above this changes.
// This module is a Node/CLI control-plane concern (uses node:crypto); clients import only its types.

import { createHash } from "node:crypto";

export interface AuditInput {
  actor: string; // the agent/role id (or "human", "system")
  action: string; // e.g. "spend", "deploy", "deliberate", "freeze_customer"
  customer?: string; // per-customer namespace, when the action is on a customer company
  tier?: string; // T0–T3 (once the tier scorer is wired) or a verdict
  verdict?: string; // AUTO | QUEUE | BLOCK | done | escalate | ...
  input?: string; // short summary of the input (never secrets/PII)
  output?: string; // short summary of the outcome
  costUsd?: number; // model/tool cost attributed to this action
  rationale?: string; // WHY the decision went the way it did
  reversible?: boolean;
}

export interface AuditEntry extends AuditInput {
  seq: number; // 0-based position in the chain
  ts: string; // ISO timestamp
  prevHash: string; // hash of the previous entry ("GENESIS" for the first)
  hash: string; // hash of this entry (covers prevHash → tamper-evident chain)
}

// The persistence seam. Default is in-memory; a Supabase/append-only-table sink drops in at connect.
export interface AuditSink {
  append(entry: AuditEntry): void;
  all(): AuditEntry[];
}

export class MemoryAuditSink implements AuditSink {
  private entries: AuditEntry[] = [];
  append(entry: AuditEntry) { this.entries.push(entry); }
  all() { return this.entries.slice(); }
}

// The exact bytes that get hashed — deterministic field order, prevHash included. Kept separate so
// verifyIntegrity recomputes it identically.
function canonical(e: Omit<AuditEntry, "hash">): string {
  return JSON.stringify([
    e.seq, e.ts, e.actor, e.action, e.customer ?? "", e.tier ?? "", e.verdict ?? "",
    e.input ?? "", e.output ?? "", e.costUsd ?? 0, e.rationale ?? "", e.reversible ?? null, e.prevHash,
  ]);
}

function hashOf(e: Omit<AuditEntry, "hash">): string {
  return createHash("sha256").update(canonical(e)).digest("hex");
}

export interface IntegrityResult {
  ok: boolean;
  count: number;
  brokenAt?: number; // seq of the first entry whose hash/chain doesn't verify
  reason?: string;
}

export class AuditLog {
  constructor(private sink: AuditSink = new MemoryAuditSink()) {}

  // Append one action. Returns the sealed entry (with its hash). This is the ONLY way in — no edit, no delete.
  record(input: AuditInput, at: Date = new Date()): AuditEntry {
    const prev = this.sink.all();
    const prevHash = prev.length ? prev[prev.length - 1].hash : "GENESIS";
    const base: Omit<AuditEntry, "hash"> = { ...input, seq: prev.length, ts: at.toISOString(), prevHash };
    const entry: AuditEntry = { ...base, hash: hashOf(base) };
    this.sink.append(entry);
    return entry;
  }

  all(): AuditEntry[] { return this.sink.all(); }

  // Query for the human / the Auditor role. Cheap linear filter (the durable sink does this in SQL later).
  query(filter: { actor?: string; customer?: string; action?: string; since?: Date } = {}): AuditEntry[] {
    const sinceMs = filter.since ? filter.since.getTime() : undefined;
    return this.sink.all().filter((e) =>
      (filter.actor === undefined || e.actor === filter.actor) &&
      (filter.customer === undefined || e.customer === filter.customer) &&
      (filter.action === undefined || e.action === filter.action) &&
      (sinceMs === undefined || new Date(e.ts).getTime() >= sinceMs),
    );
  }

  // Re-hash the whole chain and confirm every link. Any mutation of a past entry surfaces here with the seq.
  verifyIntegrity(): IntegrityResult {
    const entries = this.sink.all();
    let prevHash = "GENESIS";
    for (const e of entries) {
      if (e.prevHash !== prevHash) return { ok: false, count: entries.length, brokenAt: e.seq, reason: "chain link broken (prevHash mismatch)" };
      const { hash, ...base } = e;
      if (hashOf(base) !== hash) return { ok: false, count: entries.length, brokenAt: e.seq, reason: "entry hash mismatch (contents altered)" };
      prevHash = e.hash;
    }
    return { ok: true, count: entries.length };
  }
}

// The one process-wide ledger the governed path, the API, and the CLI share. (Per-process only with the
// memory sink — serverless invocations start fresh; the durable sink at connect makes it persistent.)
export const auditLog = new AuditLog();
