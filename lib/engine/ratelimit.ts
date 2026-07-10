// Per-IP rate limiting for the public APIs — a cost/abuse guard so a single source can't flood the
// engine and drain the model budget. TWO layers (Block 5, durable hardening):
//
//  1. In-memory fixed window — always on, zero latency, per-instance. Catches casual/scripted abuse
//     even with no external store (identical semantics to the original soft guard).
//  2. Upstash Redis fixed window — SHARED across all serverless instances and deploys, so a flood
//     can't dodge the limit by fanning out across instances. Activates automatically when
//     UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set (the founder's keys); no-op otherwise.
//
// Posture: this guard fails OPEN on store errors (availability first; it protects cost, not money) —
// the HARD caps are elsewhere and fail closed (usage_counters via bump_usage, the policy spend caps,
// the mandate). The async signature is deliberate: the old sync `rateLimited` name is GONE so every
// call site was forced through the compiler to `await overLimit(...)` — no silent truthy-Promise bugs.

const WINDOW_MS = 5 * 60_000; // 5-minute fixed window
const MAX = 40; // requests per window per key — generous for a human, throttles scripts

interface Entry {
  count: number;
  reset: number;
}
const hits = new Map<string, Entry>();

// Layer 1 — the original in-memory window, unchanged semantics. Exported for tests.
export function memoryLimited(key: string, now: number = Date.now()): boolean {
  const e = hits.get(key);
  if (!e || now > e.reset) {
    hits.set(key, { count: 1, reset: now + WINDOW_MS });
    // Opportunistic prune so the map can't grow unbounded across many keys.
    if (hits.size > 10_000) for (const [k, v] of hits) if (now > v.reset) hits.delete(k);
    return false;
  }
  e.count += 1;
  return e.count > MAX;
}

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

// Layer 2 — Upstash REST fixed window: INCR the window-bucketed key + EXPIRE it, one pipeline call.
// Injectable fetch ⇒ unit-testable with zero network. Fail-open: any error/misconfig returns false.
export async function durableLimited(
  key: string,
  now: number = Date.now(),
  env: { url?: string; token?: string } = { url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN },
  fetchImpl: FetchLike = fetch,
): Promise<boolean> {
  if (!env.url || !env.token) return false; // not configured — layer 1 stands alone
  try {
    const bucket = Math.floor(now / WINDOW_MS);
    const k = `rl:${key}:${bucket}`;
    const res = await fetchImpl(`${env.url.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: { authorization: `Bearer ${env.token}`, "content-type": "application/json" },
      body: JSON.stringify([
        ["INCR", k],
        ["EXPIRE", k, String(Math.ceil(WINDOW_MS / 1000) + 60)],
      ]),
      signal: AbortSignal.timeout(1500), // never let the limiter become the outage
    });
    if (!res.ok) return false;
    const data = (await res.json()) as Array<{ result?: number }>;
    const count = Number(data?.[0]?.result ?? 0);
    return count > MAX;
  } catch {
    return false; // fail-open (cost guard, not money guard)
  }
}

// The guard the routes call: true ⇒ the caller should 429. Memory first (free), then the shared store.
export async function overLimit(key: string, now: number = Date.now()): Promise<boolean> {
  if (memoryLimited(key, now)) return true;
  return durableLimited(key, now);
}

// Client IP from the proxy headers Vercel sets. Falls back to a constant (shared bucket) if absent.
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export const RATE_LIMIT = { WINDOW_MS, MAX };
