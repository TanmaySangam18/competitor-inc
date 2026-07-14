// lib/core/vault.ts — THE VAULT CLIENT (Tier D · INFRASTRUCTURE §2, REQUIREMENTS §4).
//
// Agents never hold root and never see a secret in a prompt/log/ground-truth store. They ask the vault, at
// runtime, for a scoped secret by NAME — the value is used and discarded; only the access (name + agent +
// purpose) is recorded to the audit ledger. This is the CLIENT; the real vault (Doppler/Infisical/AWS
// Secrets Manager) stands up at 🔒 (HUMAN_TODO). The default env-backed client is the keyless dev stand-in;
// a null client fails closed.

import { auditLog, type AuditLog } from "./audit";

export interface VaultClient {
  has(name: string): boolean;
  // Returns the secret value for immediate runtime use, or null (fail-closed). Records the ACCESS (never
  // the value) to the audit ledger with the requesting agent + purpose.
  get(name: string, ctx: { agent: string; purpose: string }): string | null;
}

export class EnvVault implements VaultClient {
  constructor(private log: AuditLog = auditLog) {}
  has(name: string): boolean { return typeof process.env[name] === "string" && process.env[name] !== ""; }
  get(name: string, ctx: { agent: string; purpose: string }): string | null {
    const value = process.env[name];
    this.log.record({
      actor: ctx.agent, action: "secret_read", verdict: value ? "done" : "BLOCK",
      input: `name=${name}`, rationale: `purpose: ${ctx.purpose}${value ? "" : " (not configured — fail closed)"}`,
    });
    return value && value !== "" ? value : null;
  }
}

// Fails closed on everything — the safe default until a real vault is connected.
export class NullVault implements VaultClient {
  has(_name: string): boolean { return false; }
  get(_name: string, _ctx: { agent: string; purpose: string }): string | null { return null; }
}

export const vault: VaultClient = new EnvVault();
