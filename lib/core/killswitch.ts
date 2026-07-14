// lib/core/killswitch.ts — THE OUT-OF-BAND STOP BUTTON (REQUIREMENTS §3 · Definition of Done #2).
//
// Three levels of "stop everything now": GLOBAL (whole platform), PER-AGENT (one role), PER-CUSTOMER (one
// customer's namespace — the enforcement mechanism for §14 abuse freezes). "Out-of-band" means the switch
// state lives OUTSIDE the agent action path: agents execute by asking `haltReason()` before acting, but
// nothing on the agent path can flip a switch. Only a human — through the control API (auth-gated), the CLI,
// or the break-glass procedure — engages/clears them. So a compromised or runaway agent cannot un-stop
// itself, and one bad agent/customer can be frozen without touching any other (blast-radius containment).
//
// This is the software side of REGISTRY.md's break-glass order. It complements POLICY.spend.killSwitch
// (the static, code-level global flag) with a RUNTIME-flippable, granular control plane. Keyless + in-
// process today (a durable/out-of-band store wires at connect so the state survives restarts).

export interface KillSwitchState {
  global: boolean;
  agents: string[]; // stopped agent/role ids
  customers: string[]; // frozen customer namespaces
}

class KillSwitch {
  private global = false;
  private readonly agents = new Set<string>();
  private readonly customers = new Set<string>();

  // ── control plane (human-only callers) ──────────────────────────────────────
  engageGlobal(): void { this.global = true; }
  disengageGlobal(): void { this.global = false; }
  stopAgent(agent: string): void { this.agents.add(agent); }
  resumeAgent(agent: string): void { this.agents.delete(agent); }
  freezeCustomer(customer: string): void { this.customers.add(customer); }
  unfreezeCustomer(customer: string): void { this.customers.delete(customer); }

  // Break-glass: one call trips the global stop (steps 1–4 of REGISTRY.md happen at the credential layer;
  // this trips the software gate so nothing new is even attempted).
  breakGlass(): void { this.global = true; }

  // ── read plane (the agent path calls this before acting — it can only READ) ──
  // Returns a human-readable reason if the action is halted, else null. Checked in the governed path.
  haltReason(scope: { agent?: string; customer?: string } = {}): string | null {
    if (this.global) return "global kill switch engaged — all actions halted";
    if (scope.agent && this.agents.has(scope.agent)) return `agent "${scope.agent}" is stopped`;
    if (scope.customer && this.customers.has(scope.customer)) return `customer "${scope.customer}" is frozen`;
    return null;
  }

  isHalted(scope: { agent?: string; customer?: string } = {}): boolean {
    return this.haltReason(scope) !== null;
  }

  status(): KillSwitchState {
    return { global: this.global, agents: [...this.agents], customers: [...this.customers] };
  }
}

// The one process-wide switch shared by the governed path, the control API, and the CLI.
export const killSwitch = new KillSwitch();
export type { KillSwitch };
