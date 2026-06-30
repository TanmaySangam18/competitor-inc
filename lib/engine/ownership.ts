import "server-only";
import crypto from "node:crypto";
import { promises as dns } from "node:dns";
import { assertSafeBaseUrl } from "./net";

// v2 — Import ownership VERIFICATION (PDR §5). Reading a public site is fine for anyone (an SEO audit),
// but OPERATING an imported project — letting the agents change it — must be gated on proof the user
// owns the domain. We use the same two methods Search Console does, both checkable + non-spoofable:
//   1. DNS TXT  — a `_competitor-inc-verify.<host>` TXT record containing the token.
//   2. Well-known file — `https://<host>/.well-known/competitor-inc-verify` whose body contains the token.
// The token is deterministic per (subject, host) and HMAC-salted with a server secret, so a user can't
// guess another user's token and can't claim a host they don't control. Pure helpers are unit-tested;
// the network probes are thin + fail-soft.

const SECRET = process.env.OWNERSHIP_SECRET || process.env.METRICS_SECRET || "competitor-inc-ownership-dev";

// Bare, lowercased host from a URL or host string. null if it isn't a real host.
export function normalizeHost(input: string): string | null {
  if (!input || typeof input !== "string") return null;
  let h = input.trim().toLowerCase();
  try {
    if (h.includes("/") || h.includes(":")) h = new URL(h.startsWith("http") ? h : `https://${h}`).hostname;
  } catch {
    return null;
  }
  h = h.replace(/^www\./, "");
  // A valid host has at least one dot and only host-legal characters.
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(h)) return null;
  return h;
}

// Deterministic, per-(subject,host), un-guessable verification token.
export function ownershipToken(subject: string, host: string): string {
  const h = normalizeHost(host);
  if (!h || !subject) return "";
  const mac = crypto.createHmac("sha256", SECRET).update(`${subject.toLowerCase()}|${h}`).digest("hex").slice(0, 32);
  return `competitor-inc-verify=${mac}`;
}

// Pure: does any TXT record contain the token? (DNS returns chunked string[][].)
export function txtContainsToken(records: string[][] | string[], token: string): boolean {
  if (!token) return false;
  const flat = (records as unknown[]).map((r) => (Array.isArray(r) ? r.join("") : String(r)));
  return flat.some((line) => line.includes(token));
}

export interface OwnershipResult {
  verified: boolean;
  host?: string;
  method?: "dns" | "file";
  token: string;
  error?: string;
}

// Run both probes (DNS first, then the well-known file). Fail-soft: any error → not verified, never throws.
export async function verifyOwnership(input: string, subject: string): Promise<OwnershipResult> {
  const host = normalizeHost(input);
  if (!host) return { verified: false, token: "", error: "that doesn't look like a domain" };
  const token = ownershipToken(subject, host);
  if (!token) return { verified: false, host, token: "", error: "sign in to verify a domain" };

  // 1) DNS TXT on the verification subdomain.
  try {
    const records = await dns.resolveTxt(`_competitor-inc-verify.${host}`);
    if (txtContainsToken(records, token)) return { verified: true, host, method: "dns", token };
  } catch {
    /* no record / NXDOMAIN — fall through to the file method */
  }

  // 2) Well-known file over https (SSRF-guarded, bounded).
  try {
    const origin = `https://${host}`;
    assertSafeBaseUrl(origin);
    const res = await fetch(`${origin}/.well-known/competitor-inc-verify`, {
      signal: AbortSignal.timeout(8000),
      headers: { "user-agent": "competitor.inc-ownership" },
      redirect: "follow",
    });
    if (res.ok) {
      const body = (await res.text()).slice(0, 4000);
      if (body.includes(token)) return { verified: true, host, method: "file", token };
    }
  } catch {
    /* unreachable / blocked — not verified */
  }

  return { verified: false, host, token };
}
