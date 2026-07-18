// ─────────────────────────────────────────────────────────────────────────────
// OAUTH ENGINE — the "2 minutes" connect flow (founder-approved 2026-07-18, ADR-0010).
//
// Viktor-lesson adopted, our way: OAuth convenience with BYOK CUSTODY — the customer authorizes on the
// provider's own page, the token lands ENCRYPTED in their row, revocable any time; we never see a pasted
// key and never own their account. A provider is "armed" only when the founder has registered the OAuth
// app and set its client env vars — unarmed providers fall back to the honest env-var instructions on
// /connect (no dead buttons).
//
// Pure module: URL building, HMAC state (CSRF), token exchange with injectable fetch. No I/O at import.
// ─────────────────────────────────────────────────────────────────────────────

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export interface OAuthProvider {
  id: string; // route segment, e.g. "github"
  name: string;
  connectionId: string; // which connection-map entry a token satisfies
  authorizeUrl: string;
  tokenUrl: string;
  scopes: string[];
  clientIdEnv: string;
  clientSecretEnv: string;
  tokenStyle: "json" | "form"; // how the token endpoint wants the exchange + replies
}

// Start with the two rails that are core AND standard-OAuth-simple; the registry is the extension point.
export const OAUTH_PROVIDERS: OAuthProvider[] = [
  {
    id: "github",
    name: "GitHub",
    connectionId: "github",
    authorizeUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    scopes: ["repo", "workflow"],
    clientIdEnv: "OAUTH_GITHUB_CLIENT_ID",
    clientSecretEnv: "OAUTH_GITHUB_CLIENT_SECRET",
    tokenStyle: "json",
  },
  {
    id: "slack",
    name: "Slack",
    connectionId: "slack",
    authorizeUrl: "https://slack.com/oauth/v2/authorize",
    tokenUrl: "https://slack.com/api/oauth.v2.access",
    scopes: ["chat:write", "channels:read", "channels:manage", "users:read"],
    clientIdEnv: "OAUTH_SLACK_CLIENT_ID",
    clientSecretEnv: "OAUTH_SLACK_CLIENT_SECRET",
    tokenStyle: "form",
  },
];

export function getProvider(id: string): OAuthProvider | null {
  return OAUTH_PROVIDERS.find((p) => p.id === id) ?? null;
}

/** Armed = the founder registered the OAuth app (client id + secret present). Never fake a button. */
export function providerArmed(p: OAuthProvider, env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env[p.clientIdEnv] && env[p.clientSecretEnv]);
}

/** The armed provider that satisfies a connection-map entry, if any (drives the CONNECT button). */
export function oauthProviderFor(connectionId: string, env: Record<string, string | undefined> = process.env): OAuthProvider | null {
  const p = OAUTH_PROVIDERS.find((x) => x.connectionId === connectionId);
  return p && providerArmed(p, env) ? p : null;
}

// ── CSRF state: HMAC-signed, time-boxed, bound to the signed-in user ─────────
const STATE_MAX_AGE_MS = 10 * 60 * 1000;

function hmac(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function signState(input: { provider: string; userId: string }, secret: string, now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ p: input.provider, u: input.userId, t: now, n: randomBytes(8).toString("hex") })).toString("base64url");
  return `${payload}.${hmac(payload, secret)}`;
}

export function verifyState(state: string, secret: string, now = Date.now()): { provider: string; userId: string } | null {
  const dot = state.lastIndexOf(".");
  if (dot < 1) return null;
  const payload = state.slice(0, dot);
  const sig = state.slice(dot + 1);
  const want = hmac(payload, secret);
  const a = Buffer.from(sig), b = Buffer.from(want);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const d = JSON.parse(Buffer.from(payload, "base64url").toString()) as { p?: string; u?: string; t?: number };
    if (!d.p || !d.u || typeof d.t !== "number") return null;
    if (now - d.t > STATE_MAX_AGE_MS) return null; // stale = replay risk, refuse
    return { provider: d.p, userId: d.u };
  } catch {
    return null;
  }
}

export function authorizeUrl(p: OAuthProvider, state: string, redirectUri: string, env: Record<string, string | undefined> = process.env): string {
  const u = new URL(p.authorizeUrl);
  u.searchParams.set("client_id", env[p.clientIdEnv] ?? "");
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("state", state);
  u.searchParams.set("scope", p.scopes.join(p.id === "slack" ? "," : " "));
  return u.toString();
}

export type TokenResult =
  | { ok: true; accessToken: string; meta: Record<string, string> }
  | { ok: false; error: string };

/** Exchange the callback code for a token. Injectable fetch → tested offline; provider quirks stay here. */
export async function exchangeCode(
  p: OAuthProvider,
  code: string,
  redirectUri: string,
  opts: { fetchImpl?: typeof fetch; env?: Record<string, string | undefined> } = {},
): Promise<TokenResult> {
  const env = opts.env ?? process.env;
  const doFetch = opts.fetchImpl ?? fetch;
  const body = new URLSearchParams({
    client_id: env[p.clientIdEnv] ?? "",
    client_secret: env[p.clientSecretEnv] ?? "",
    code,
    redirect_uri: redirectUri,
  });
  try {
    const res = await doFetch(p.tokenUrl, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
      body: body.toString(),
    });
    if (!res.ok) return { ok: false, error: `${p.name} token endpoint → HTTP ${res.status}` };
    const data = (await res.json()) as Record<string, unknown>;
    if (p.id === "slack") {
      if (!data.ok) return { ok: false, error: `Slack: ${String(data.error ?? "exchange failed")}` };
      const team = (data.team as { name?: string } | undefined)?.name ?? "";
      const token = String(data.access_token ?? "");
      if (!token) return { ok: false, error: "Slack returned no bot token" };
      return { ok: true, accessToken: token, meta: { team } };
    }
    const token = String(data.access_token ?? "");
    if (!token) return { ok: false, error: `${p.name}: ${String(data.error_description ?? data.error ?? "no access_token in reply")}` };
    return { ok: true, accessToken: token, meta: {} };
  } catch (e) {
    return { ok: false, error: `network: ${e instanceof Error ? e.message : "unknown"}` };
  }
}
