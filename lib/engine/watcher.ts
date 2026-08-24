// ─────────────────────────────────────────────────────────────────────────────
// THE SENSES. lib/core/incident.ts can decide what to do about an outage; nothing was telling it that
// one had happened. This performs the probes and keeps the short history that decide() reasons over.
//
// THE GUARD THAT MATTERS MOST, and it is not obvious: WE HAVE ONE VANTAGE POINT. Real monitors probe
// from several places precisely because a single observer cannot distinguish "their site is down" from
// "our network is broken". When every target fails in the same sweep, the far likelier explanation is us,
// not the simultaneous death of every unrelated product. So a total sweep failure reports `unknown`
// rather than `down`, and incident.ts already refuses to act on unknown.
//
// Without that, the first time this laptop loses wifi the machine reverts every student's product at once.
// ─────────────────────────────────────────────────────────────────────────────

import type { Probe, Health } from "@/lib/core/incident";

export interface Target {
  id: string;
  url: string;
}

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

/** Slower than this and the page is not usably alive, even when it answers. */
export const DEGRADED_MS = 5_000;
export const TIMEOUT_MS = 10_000;
/** Keep only a short tail: decide() needs a run of recent probes, not a year of them. */
export const HISTORY_LIMIT = 20;

/** Classify one response. Kept separate from the I/O so every branch is testable without network. */
export function classify(status: number | null, ms: number, threw: boolean): Health {
  if (threw) return "down"; // connection refused, DNS failure, or a timeout: not serving
  if (status === null) return "unknown";
  if (status >= 200 && status < 400) return ms > DEGRADED_MS ? "degraded" : "up";
  return "down"; // 4xx and 5xx alike: a product returning 404 at its root is broken for its user
}

/** Probe one target. Never throws: a watcher that crashes is worse than one that reports uncertainty. */
export async function probeOne(
  target: Target,
  deps: { fetchImpl?: FetchLike; now?: () => number; timeoutMs?: number } = {}
): Promise<Probe & { id: string }> {
  const fetchImpl = deps.fetchImpl ?? (globalThis.fetch as FetchLike);
  const clock = deps.now ?? (() => Date.now());
  const timeoutMs = deps.timeoutMs ?? TIMEOUT_MS;
  const started = clock();

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetchImpl(target.url, { method: "GET", signal: ac.signal, redirect: "follow" });
    const ms = clock() - started;
    return {
      id: target.id,
      at: new Date(clock()).toISOString(),
      health: classify(res.status, ms, false),
      status: res.status,
      ms,
    };
  } catch (e) {
    const ms = clock() - started;
    return {
      id: target.id,
      at: new Date(clock()).toISOString(),
      health: classify(null, ms, true),
      ms,
      detail: e instanceof Error ? e.message : "probe failed",
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * One sweep across every target.
 *
 * Applies the single-vantage-point guard: if EVERY target failed and there was more than one, the
 * finding is downgraded to `unknown`, because the shared cause is almost certainly this machine.
 */
export async function sweep(
  targets: readonly Target[],
  deps: { fetchImpl?: FetchLike; now?: () => number; timeoutMs?: number } = {}
): Promise<{ probes: Array<Probe & { id: string }>; allFailed: boolean }> {
  const probes = await Promise.all(targets.map((t) => probeOne(t, deps)));
  const failing = probes.filter((p) => p.health === "down" || p.health === "degraded");
  const allFailed = targets.length > 1 && failing.length === targets.length;

  if (!allFailed) return { probes, allFailed };

  return {
    probes: probes.map((p) => ({
      ...p,
      health: "unknown" as Health,
      detail: `${p.detail ? p.detail + ". " : ""}All ${targets.length} targets failed in the same sweep, so this is more likely our own network than every product failing at once. Reported as unknown rather than down.`,
    })),
    allFailed,
  };
}

/** Append a probe to a target's history, oldest first, capped. Pure. */
export function appendHistory(
  history: Readonly<Record<string, Probe[]>>,
  probe: Probe & { id: string }
): Record<string, Probe[]> {
  const prior = history[probe.id] ?? [];
  const { id: _id, ...rest } = probe;
  return { ...history, [probe.id]: [...prior, rest].slice(-HISTORY_LIMIT) };
}
