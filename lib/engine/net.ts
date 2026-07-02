// Shared network-safety helpers. Single source of truth for the SSRF guard applied to ANY
// user-supplied URL that we fetch server-side with credentials attached — the model BYOK base URL
// (server.ts) and the per-user ads webhook (execution.ts) both run through it.

// THE bounded fetch. Every upstream call gets a deadline so a hung provider can't wedge a request;
// on abort the caller catches and degrades (simulated engine, failed executor, etc.). `ms` is
// required on purpose — each caller owns its own timeout budget.
export async function fetchWithTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

// SSRF guard: a user-supplied URL may receive an API key / payload and is fetched server-side, so a
// malicious/typo'd URL could turn our server into a proxy to internal hosts (e.g. cloud metadata at
// 169.254.169.254). Require https + reject private/loopback/link-local. Operator-set (env) URLs are
// trusted and skip this — they may legitimately point at internal/self-hosted infra.
export function assertSafeBaseUrl(raw: string): void {
  let u: URL;
  try { u = new URL(raw); } catch { throw new Error("invalid baseUrl"); }
  if (u.protocol !== "https:") throw new Error("baseUrl must be https");
  const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host === "metadata.google.internal") throw new Error("blocked host");
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    const [a, b] = host.split(".").map(Number);
    if (a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168))
      throw new Error("blocked private IP");
  }
  // IPv6: loopback (::1), unspecified (::), unique-local (fc00::/7 → fc/fd), link-local (fe80::/10 →
  // fe8–feb), and ANY IPv4-mapped form (::ffff:… — the URL parser serializes it as hex or dotted, and
  // it can smuggle a private/metadata IPv4 such as 169.254.169.254). Public APIs use hostnames.
  if (host === "::1" || host === "::" || host.startsWith("::ffff:") || /^f[cd]/.test(host) || /^fe[89ab]/.test(host))
    throw new Error("blocked IPv6 host");
}
