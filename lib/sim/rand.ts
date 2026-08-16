// Deterministic pseudo-randomness for every SIM module: mulberry32 over an FNV-1a seed.
//
// Shared on purpose. The whole point of the synthetic substrate is that a run in week six is comparable
// to a run in week one, which only holds if every generator draws from the same reproducible stream. No
// module in lib/sim may call Math.random().

export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * FNV-1a followed by a murmur3 finalizer. FNV alone is fine for seeding a PRNG, and badly wrong for a
 * hash ring: over short, near-identical keys like `m_1`, `m_2` or `us-east:shard-4:vnode-7` it leaves the
 * HIGH bits clustered, and a ring lookup compares the full 32-bit value. The avalanche step fixes the
 * distribution, and it measurably does: without it one shard in eight ran 45% off the mean.
 */
export function hash32(s: string): number {
  let h = hashSeed(s);
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

export function rng(seed: string): () => number {
  let a = hashSeed(seed);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const pick = <T,>(r: () => number, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)];
export const between = (r: () => number, lo: number, hi: number): number => lo + Math.floor(r() * (hi - lo + 1));

/** Pick n distinct items, order preserved by draw. Used wherever a repeat would read as a bug. */
export function pickSome<T>(r: () => number, xs: readonly T[], n: number): T[] {
  const out: T[] = [];
  const used = new Set<number>();
  for (let i = 0; i < n * 3 && out.length < Math.min(n, xs.length); i++) {
    const k = Math.floor(r() * xs.length);
    if (used.has(k)) continue;
    used.add(k);
    out.push(xs[k]);
  }
  return out;
}

export const DAY_MS = 86_400_000;
export const YEAR_MS = 365 * DAY_MS;
