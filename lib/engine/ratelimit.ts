// Per-IP rate limit for the engine API — a cost/abuse guard so a single source can't flood
// /api/engine and drain the model budget.
//
// Scope: best-effort, in-memory, per-serverless-instance. It resets on cold start and isn't shared
// across instances, so it's a SOFT guard — enough to stop casual or scripted abuse from one IP during
// beta. The launch-grade hard guard is to (a) gate the paid/managed model to authenticated users so
// anonymous traffic gets the free simulated engine, and/or (b) back this with a shared store
// (Vercel KV / Upstash). Tracked as a follow-up.

const WINDOW_MS = 5 * 60_000; // 5-minute fixed window
const MAX = 40; // requests per window per IP — generous for a human, throttles scripts

interface Entry {
  count: number;
  reset: number;
}
const hits = new Map<string, Entry>();

// Returns true when this IP has exceeded the window budget (caller should 429). `now` is injectable
// for testing.
export function rateLimited(ip: string, now: number = Date.now()): boolean {
  const e = hits.get(ip);
  if (!e || now > e.reset) {
    hits.set(ip, { count: 1, reset: now + WINDOW_MS });
    // Opportunistic prune so the map can't grow unbounded across many IPs.
    if (hits.size > 10_000) for (const [k, v] of hits) if (now > v.reset) hits.delete(k);
    return false;
  }
  e.count += 1;
  return e.count > MAX;
}

// Client IP from the proxy headers Vercel sets. Falls back to a constant (shared bucket) if absent.
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export const RATE_LIMIT = { WINDOW_MS, MAX };
