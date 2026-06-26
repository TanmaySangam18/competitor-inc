// Framework-neutral evals / observability. Fully gated: with no OBSERVABILITY_URL set, every call is a
// no-op (zero overhead, no network). When set, it fire-and-forgets a trace event to any HTTP ingest —
// a Langfuse/LangSmith proxy, Vercel AI Gateway log sink, or your own collector. This is developer-side
// tracing for US (latency, failure rate, drift on autonomous actions) — distinct from the user-facing
// Glass Box. Never throws; never blocks the request it's tracing.

const URL = process.env.OBSERVABILITY_URL;
const KEY = process.env.OBSERVABILITY_KEY;

export interface TraceEvent {
  name: string; // the operation, e.g. "shift" | "validate" | "chat"
  ok: boolean; // did it succeed
  ms: number; // wall-clock duration
  meta?: Record<string, unknown>; // small, non-sensitive context (ids, counts, error message)
}

export function trace(ev: TraceEvent): void {
  if (!URL) return;
  try {
    void fetch(URL, {
      method: "POST",
      headers: { "content-type": "application/json", ...(KEY ? { authorization: `Bearer ${KEY}` } : {}) },
      body: JSON.stringify({ ...ev, ts: Date.now(), service: "competitor.inc" }),
      signal: AbortSignal.timeout(3000),
    }).catch(() => {
      /* fire-and-forget: tracing must never affect the traced request */
    });
  } catch {
    /* ignore */
  }
}

// Wrap an async op: time it, emit a trace (ok/fail + duration), return its result UNCHANGED. The wrapped
// function's behavior and return value are untouched — safe to drop around any model/engine call.
export async function withTrace<T>(name: string, fn: () => Promise<T>, meta?: Record<string, unknown>): Promise<T> {
  const start = Date.now();
  try {
    const r = await fn();
    trace({ name, ok: true, ms: Date.now() - start, meta });
    return r;
  } catch (e) {
    trace({ name, ok: false, ms: Date.now() - start, meta: { ...meta, error: e instanceof Error ? e.message : "unknown" } });
    throw e;
  }
}
