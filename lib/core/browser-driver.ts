// ─────────────────────────────────────────────────────────────────────────────
// BROWSER BACKEND — the physical hands (ADR-0019). Implements the runner's BrowserDriver.
//
// The runner (ADR-0018) decides; THIS drives the screen. It speaks a tiny typed command protocol over an
// injectable `BrowserTransport` — the one seam a real backend (a Chrome extension via CDP, Playwright, or
// claude-in-chrome) implements. So the same driver code is tested offline with a fake transport, and the
// physical backend is a drop-in that runs CUSTOMER-SIDE on their machine, on their consent. competitor.inc
// never drives screens from our servers.
//
// TWO GUARDS AT THE BOUNDARY (defense in depth — the plan already promises these, the driver ENFORCES them
// so a slip upstream still can't cause harm):
//   1. NO SECRETS — fill() refuses any value that looks like a credential (token prefixes, JWT, PEM, long
//      opaque runs). Non-secret prefill (names, scopes, redirect URLs, "copy: …" instructions) passes.
//   2. SAFE NAVIGATION — navigate() allows only http(s) URLs or same-app relative paths; refuses
//      javascript:/data:/file: schemes (anti-injection: a page can't steer the driver to a hostile scheme).
// ─────────────────────────────────────────────────────────────────────────────

import type { BrowserDriver } from "@/lib/core/onboarding-runner";

// The wire protocol to the physical backend. Minimal + typed so any backend is a drop-in.
export interface BrowserCommand {
  op: "navigate" | "fill" | "detect";
  url?: string;
  fields?: string[];
  signal?: string;
}
export interface BrowserResult {
  ok: boolean;
  detected?: boolean; // for op:"detect"
  error?: string;
}
export interface BrowserTransport {
  send(cmd: BrowserCommand): Promise<BrowserResult>;
}

// Credential shapes we refuse to type into a field. Deliberately matches VALUES, not labels — so
// "copy: service_role key" (an instruction) passes, but "ghp_<40 chars>" (the secret itself) is blocked.
const SECRET_PATTERNS: RegExp[] = [
  /sk-[A-Za-z0-9]{20,}/,                    // OpenAI-style
  /xox[baprs]-[A-Za-z0-9-]{10,}/,           // Slack tokens
  /gh[pousr]_[A-Za-z0-9]{20,}/,             // GitHub PAT (classic + fine-grained prefixes)
  /github_pat_[A-Za-z0-9_]{20,}/,           // GitHub fine-grained
  /(pk|sk|rk|whsec)_(live|test)_[A-Za-z0-9]{16,}/, // Stripe
  /AKIA[A-Z0-9]{16}/,                       // AWS access key id
  /eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}\./, // JWT
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,     // PEM
  /(?:^|[\s:=])[A-Za-z0-9_\-+/]{40,}={0,2}(?:$|[\s])/, // long opaque run (base64/hex tokens); labels have spaces + short values
];

export function looksSecret(value: string): boolean {
  return SECRET_PATTERNS.some((re) => re.test(value));
}

export function safeNavUrl(url: string): boolean {
  if (url.startsWith("/")) return true; // same-app relative path (e.g. /api/oauth/slack/start)
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Build a real BrowserDriver from a transport to the physical backend. Enforces both boundary guards
 * before anything crosses the wire. Errors are thrown so the runner records them as unverified/blocked
 * and pauses — it never silently proceeds.
 */
export function makeBrowserDriver(transport: BrowserTransport): BrowserDriver {
  return {
    async navigate(url: string): Promise<void> {
      if (!safeNavUrl(url)) throw new Error(`refused unsafe navigation target: ${url.slice(0, 40)}`);
      const r = await transport.send({ op: "navigate", url });
      if (!r.ok) throw new Error(r.error ?? "navigate failed");
    },
    async fill(fields: string[]): Promise<void> {
      const offending = fields.find(looksSecret);
      if (offending) throw new Error("refused to type a value that looks like a secret — secrets are the human's to enter");
      const r = await transport.send({ op: "fill", fields });
      if (!r.ok) throw new Error(r.error ?? "fill failed");
    },
    async detect(signal: string): Promise<boolean> {
      const r = await transport.send({ op: "detect", signal });
      return r.ok && r.detected === true;
    },
  };
}
