// lib/core/govern.ts — THE ONE GOVERNED ENTRY POINT.
//
// Every real action should flow through here so the three control-plane guarantees hold together and in
// order: (1) the out-of-band kill switch gets first say — if the platform, this agent, or this customer is
// stopped, nothing runs; (2) the deterministic policy engine (decide → AUTO|QUEUE|BLOCK) rules; (3) the
// action is written to the append-only audit ledger no matter the verdict. Nothing decides without being
// recorded; nothing runs while a switch is thrown.
//
// decide() stays pure (no I/O) — this wrapper adds the stateful guards around it, so the policy engine
// remains unit-testable and this layer owns the side effects (audit write, switch read).

import { decide, type ActionContext, type PolicyDecision, type Policy, POLICY } from "@/lib/engine/policy";
import { auditLog, type AuditLog, type AuditEntry } from "./audit";
import { killSwitch, type KillSwitch } from "./killswitch";

export interface GovernOptions {
  customer?: string; // per-customer namespace, for kill-switch scope + audit attribution
  input?: string; // short summary (never secrets/PII)
  output?: string; // short outcome summary, if known at decision time
  costUsd?: number;
  policy?: Policy;
  log?: AuditLog; // injectable for tests
  switch?: KillSwitch; // injectable for tests
}

export interface GovernResult {
  decision: PolicyDecision;
  halted: boolean; // true if a kill switch (not the policy) refused it
  entry: AuditEntry; // the sealed audit record for this action
}

export function governAction(ctx: ActionContext, opts: GovernOptions = {}): GovernResult {
  const policy = opts.policy ?? POLICY;
  const log = opts.log ?? auditLog;
  const ks = opts.switch ?? killSwitch;

  // (1) Out-of-band kill switch — first say, before any policy reasoning.
  const halt = ks.haltReason({ agent: ctx.agent, customer: opts.customer });
  if (halt) {
    const decision: PolicyDecision = { verdict: "BLOCK", reason: halt };
    const entry = log.record({
      actor: ctx.agent, action: String(ctx.type), customer: opts.customer,
      verdict: "BLOCK", input: opts.input, output: opts.output, costUsd: opts.costUsd,
      rationale: `kill switch: ${halt}`, reversible: ctx.reversible,
    });
    return { decision, halted: true, entry };
  }

  // (2) The deterministic policy engine.
  const decision = decide(ctx, policy);

  // (3) Record — every decision, every verdict, into the append-only ledger.
  const entry = log.record({
    actor: ctx.agent, action: String(ctx.type), customer: opts.customer,
    verdict: decision.verdict, input: opts.input, output: opts.output, costUsd: opts.costUsd,
    rationale: decision.reason, reversible: ctx.reversible,
  });

  return { decision, halted: false, entry };
}
