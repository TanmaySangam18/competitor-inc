// ─────────────────────────────────────────────────────────────────────────────
// TIER 3, PART TWO: MULTI-REGION SHARDING.
//
// The other half of what the founder asked for. A professional network stops being a CRUD app the moment
// it does not fit on one database, and the three problems it hits then are all here:
//
//   1. PLACEMENT. Which shard holds a member? Modulo hashing is the obvious answer and the wrong one:
//      adding one shard to ten relocates about 90% of the corpus. This uses a consistent-hash ring with
//      virtual nodes, where adding a shard relocates roughly 1/(n+1). The test measures both and asserts
//      the difference, because that gap is the entire argument for the ring.
//
//   2. RESIDENCY. A member in Germany may not be stored outside the EU region, whatever the ring says.
//      Legal placement OVERRIDES the hash, and jurisdiction is not the same thing as geography (Türkiye
//      routes to the EU region for latency while carrying no EU residency obligation). Getting that
//      distinction wrong is a compliance incident, not a bug.
//
//   3. FAN-OUT. A feed read has to gather from every shard holding a connection. For a member with nine
//      connections that is a couple of shards; for a hub with a thousand it is all of them, every time.
//      That read amplification is the thing that quietly decides whether the product is affordable, and
//      it is invisible until you measure it against a power-law graph, which is what the 50,000-member
//      corpus exists to provide.
//
// Pure and deterministic: no I/O, no clock. Same corpus and same topology ⇒ identical placement.
// ─────────────────────────────────────────────────────────────────────────────

import { hash32 } from "./rand";
import type { SyntheticSocialNetwork } from "./social-network";

export type Region = "us-east" | "eu-west" | "ap-south" | "sa-east" | "af-south";
export const REGIONS: readonly Region[] = ["us-east", "eu-west", "ap-south", "sa-east", "af-south"] as const;

/** Where a country's traffic is SERVED from. Latency, not law. */
const REGION_BY_COUNTRY: Record<string, Region> = {
  "United States": "us-east", Canada: "us-east", Mexico: "us-east",
  Germany: "eu-west", Poland: "eu-west", "United Kingdom": "eu-west", Ireland: "eu-west",
  Netherlands: "eu-west", Sweden: "eu-west", Portugal: "eu-west", "Türkiye": "eu-west",
  India: "ap-south", Singapore: "ap-south", Japan: "ap-south",
  Brazil: "sa-east",
  Nigeria: "af-south", Kenya: "af-south",
};

/** Where a country's data must LEGALLY sit. Law, not latency. The two lists differ on purpose. */
export type Jurisdiction = "eu" | "uk" | "none";
const JURISDICTION_BY_COUNTRY: Record<string, Jurisdiction> = {
  Germany: "eu", Poland: "eu", Ireland: "eu", Netherlands: "eu", Sweden: "eu", Portugal: "eu",
  "United Kingdom": "uk",
};
/** A jurisdiction pins its members to exactly one region, whatever the ring would otherwise choose. */
const REGION_BY_JURISDICTION: Record<Exclude<Jurisdiction, "none">, Region> = { eu: "eu-west", uk: "eu-west" };

export const regionOf = (country: string): Region => REGION_BY_COUNTRY[country] ?? "us-east";
export const jurisdictionOf = (country: string): Jurisdiction => JURISDICTION_BY_COUNTRY[country] ?? "none";

export interface ShardKey { region: Region; shard: number }
export const shardIdOf = (k: ShardKey): string => `${k.region}/${k.shard}`;

// ── the consistent-hash ring ────────────────────────────────────────────────

interface RingPoint { point: number; shard: number }
export interface Ring { region: Region; shards: number; vnodes: number; points: RingPoint[] }

/**
 * Build one ring per region. Each shard gets `vnodes` points scattered around a 32-bit circle, so the
 * shards interleave and no single shard owns one huge contiguous arc. Too few virtual nodes and the
 * distribution is lumpy; 128 is the usual working number and gives a few percent spread at this scale.
 */
export function buildRing(region: Region, shards: number, vnodes = 128): Ring {
  const points: RingPoint[] = [];
  for (let s = 0; s < shards; s++) {
    for (let v = 0; v < vnodes; v++) points.push({ point: hash32(`${region}:shard-${s}:vnode-${v}`), shard: s });
  }
  points.sort((a, b) => a.point - b.point || a.shard - b.shard);
  return { region, shards, vnodes, points };
}

/** First point clockwise from the key's hash, wrapping at the top of the circle. */
export function lookupRing(ring: Ring, key: string): number {
  if (!ring.points.length) return 0;
  const h = hash32(key);
  let lo = 0, hi = ring.points.length - 1, ans = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (ring.points[mid].point >= h) { ans = mid; hi = mid - 1; } else { lo = mid + 1; }
  }
  return ring.points[ans].shard;
}

export interface Topology {
  /** Shard count per region. A region with heavier traffic gets more shards. */
  shardsPerRegion: Record<Region, number>;
  vnodes: number;
  rings: Record<Region, Ring>;
  /** Explicit placement overrides, which is how a rebalance is expressed without rehashing everything. */
  overrides: Map<string, number>;
}

export function buildTopology(shardsPerRegion: Partial<Record<Region, number>> | number = 8, vnodes = 128): Topology {
  const counts = {} as Record<Region, number>;
  for (const r of REGIONS) counts[r] = typeof shardsPerRegion === "number" ? shardsPerRegion : (shardsPerRegion[r] ?? 8);
  const rings = {} as Record<Region, Ring>;
  for (const r of REGIONS) rings[r] = buildRing(r, counts[r], vnodes);
  return { shardsPerRegion: counts, vnodes, rings, overrides: new Map() };
}

/**
 * Place one member. Residency wins over the ring: a German member is in eu-west even if the ring for
 * their serving region would have chosen elsewhere, and no rebalance may move them out.
 */
export function placeMember(topo: Topology, memberId: string, country: string): ShardKey {
  const j = jurisdictionOf(country);
  const region = j === "none" ? regionOf(country) : REGION_BY_JURISDICTION[j];
  const override = topo.overrides.get(memberId);
  return { region, shard: override ?? lookupRing(topo.rings[region], memberId) };
}

/** Modulo placement, kept only so the ring's advantage can be measured rather than asserted. */
export function placeMemberModulo(memberId: string, country: string, shards: number): ShardKey {
  const j = jurisdictionOf(country);
  return { region: j === "none" ? regionOf(country) : REGION_BY_JURISDICTION[j], shard: hash32(memberId) % Math.max(1, shards) };
}

// ── fan-out ─────────────────────────────────────────────────────────────────

export type Adjacency = Map<string, string[]>;

/** Undirected adjacency, built once. A 1M-edge graph re-walked per query is its own kind of outage. */
export function indexAdjacency(net: SyntheticSocialNetwork): Adjacency {
  const adj: Adjacency = new Map();
  const add = (a: string, b: string): void => {
    const list = adj.get(a);
    if (list) list.push(b); else adj.set(a, [b]);
  };
  for (const c of net.connections) { add(c.a, c.b); add(c.b, c.a); }
  return adj;
}

export interface FanoutPlan {
  memberId: string;
  home: string;
  connections: number;
  shardsTouched: number;
  regionsTouched: number;
  crossRegionConnections: number;
  /** Shards read to answer ONE feed query. A single-shard read is 1; this is the multiplier on it. */
  readAmplification: number;
  perShard: { shard: string; connections: number }[];
}

/**
 * What a feed read costs. This is the number that decides architecture: if the median member touches two
 * shards and the p99 touches all of them, a fan-out-on-read design collapses at the top of the graph and
 * the hubs need materialised timelines instead. You cannot know which without measuring it on a graph
 * that actually has hubs.
 */
export function planFeedRead(net: SyntheticSocialNetwork, topo: Topology, adj: Adjacency, memberId: string, placement: Map<string, ShardKey>): FanoutPlan {
  const home = placement.get(memberId) ?? placeMember(topo, memberId, "United States");
  const peers = adj.get(memberId) ?? [];
  const counts = new Map<string, number>();
  const regions = new Set<string>();
  let crossRegion = 0;
  for (const p of peers) {
    const k = placement.get(p);
    if (!k) continue;
    const id = shardIdOf(k);
    counts.set(id, (counts.get(id) ?? 0) + 1);
    regions.add(k.region);
    if (k.region !== home.region) crossRegion++;
  }
  return {
    memberId,
    home: shardIdOf(home),
    connections: peers.length,
    shardsTouched: counts.size,
    regionsTouched: regions.size,
    crossRegionConnections: crossRegion,
    readAmplification: Math.max(1, counts.size),
    perShard: [...counts.entries()].map(([shard, connections]) => ({ shard, connections })).sort((a, b) => b.connections - a.connections),
  };
}

/** Place the whole corpus once. Everything else reads this map. */
export function placeAll(net: SyntheticSocialNetwork, topo: Topology): Map<string, ShardKey> {
  const out = new Map<string, ShardKey>();
  for (const m of net.members) out.set(m.id, placeMember(topo, m.id, m.country));
  return out;
}

// ── cluster health ──────────────────────────────────────────────────────────

export interface ShardStat { shard: string; region: Region; members: number; localEdges: number }

export interface ClusterReport {
  totalShards: number;
  shardsPerRegion: Record<Region, number>;
  members: number;
  shards: ShardStat[];
  memberSkew: { min: number; p50: number; p99: number; max: number; hotRatio: number };
  /** Share of edges whose two endpoints live on different shards. Every one is a cross-shard read. */
  crossShardEdgeShare: number;
  crossRegionEdgeShare: number;
  /** Members stored outside the region their jurisdiction requires. Must be zero, always. */
  residencyViolations: number;
  fanout: { p50: number; p90: number; p99: number; max: number; worst: FanoutPlan[] };
  /**
   * Shards each region SHOULD have, given how many members actually live there. Giving every region the
   * same shard count is the usual default and it is the usual cause of skew: a region holding a quarter
   * of the corpus and a region holding a twentieth end up with identical capacity. A rebalance cannot
   * fix this, because a rebalance may not move members across regions. Only re-sizing can.
   */
  rightsizing: { region: Region; members: number; shards: number; suggestedShards: number }[];
  simulated: true;
}

const quantile = (sorted: number[], q: number): number => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] : 0);

export function clusterReport(net: SyntheticSocialNetwork, topo: Topology, placement?: Map<string, ShardKey>, sampleFanout = 2000): ClusterReport {
  const place = placement ?? placeAll(net, topo);
  const stats = new Map<string, ShardStat>();
  for (const r of REGIONS) {
    for (let s = 0; s < topo.shardsPerRegion[r]; s++) stats.set(`${r}/${s}`, { shard: `${r}/${s}`, region: r, members: 0, localEdges: 0 });
  }
  let residencyViolations = 0;
  for (const m of net.members) {
    const k = place.get(m.id);
    if (!k) continue;
    const stat = stats.get(shardIdOf(k));
    if (stat) stat.members++;
    const j = jurisdictionOf(m.country);
    if (j !== "none" && k.region !== REGION_BY_JURISDICTION[j]) residencyViolations++;
  }

  let crossShard = 0, crossRegion = 0;
  for (const c of net.connections) {
    const ka = place.get(c.a), kb = place.get(c.b);
    if (!ka || !kb) continue;
    if (ka.region !== kb.region) { crossRegion++; crossShard++; continue; }
    if (ka.shard !== kb.shard) { crossShard++; continue; }
    const stat = stats.get(shardIdOf(ka));
    if (stat) stat.localEdges++;
  }

  const counts = [...stats.values()].map((s) => s.members).sort((a, b) => a - b);
  const mean = counts.reduce((a, b) => a + b, 0) / Math.max(1, counts.length);

  // Right-sizing: how many shards each region would need for an even members-per-shard load. The gap
  // between this and the configured count is skew that no rebalance can touch, because rebalancing may
  // not cross a region boundary.
  const membersByRegion = new Map<Region, number>(REGIONS.map((r) => [r, 0]));
  for (const m of net.members) {
    const k = place.get(m.id);
    if (k) membersByRegion.set(k.region, (membersByRegion.get(k.region) ?? 0) + 1);
  }
  const perShardTarget = Math.max(1, Math.round(net.members.length / Math.max(1, stats.size)));
  const rightsizing = REGIONS.map((region) => ({
    region,
    members: membersByRegion.get(region) ?? 0,
    shards: topo.shardsPerRegion[region],
    suggestedShards: Math.max(1, Math.round((membersByRegion.get(region) ?? 0) / perShardTarget)),
  }));

  // Fan-out on a sample spread across the degree distribution, plus the ten genuinely worst cases,
  // because the p99 is what pages you and the average is what lies to you.
  const adj = indexAdjacency(net);
  const byDegree = [...net.members].sort((a, b) => b.connectionCount - a.connectionCount);
  const step = Math.max(1, Math.floor(net.members.length / sampleFanout));
  const sampled: FanoutPlan[] = [];
  for (let i = 0; i < net.members.length; i += step) sampled.push(planFeedRead(net, topo, adj, net.members[i].id, place));
  const worst = byDegree.slice(0, 10).map((m) => planFeedRead(net, topo, adj, m.id, place));
  const amps = sampled.map((p) => p.readAmplification).sort((a, b) => a - b);

  return {
    totalShards: stats.size,
    shardsPerRegion: topo.shardsPerRegion,
    members: net.members.length,
    shards: [...stats.values()].sort((a, b) => b.members - a.members),
    memberSkew: {
      min: counts[0] ?? 0,
      p50: quantile(counts, 0.5),
      p99: quantile(counts, 0.99),
      max: counts[counts.length - 1] ?? 0,
      hotRatio: mean > 0 ? Math.round(((counts[counts.length - 1] ?? 0) / mean) * 100) / 100 : 0,
    },
    crossShardEdgeShare: net.connections.length ? Math.round((crossShard / net.connections.length) * 1000) / 1000 : 0,
    crossRegionEdgeShare: net.connections.length ? Math.round((crossRegion / net.connections.length) * 1000) / 1000 : 0,
    residencyViolations,
    fanout: {
      p50: quantile(amps, 0.5),
      p90: quantile(amps, 0.9),
      p99: quantile(amps, 0.99),
      max: amps[amps.length - 1] ?? 0,
      worst,
    },
    rightsizing,
    simulated: true,
  };
}

// ── rebalancing ─────────────────────────────────────────────────────────────

export interface RebalanceMove { memberId: string; from: string; to: string }
export interface RebalancePlan {
  moves: RebalanceMove[];
  /** Share of the corpus that has to move. The whole point of the ring is keeping this small. */
  movedShare: number;
  before: { max: number; hotRatio: number };
  after: { max: number; hotRatio: number };
  simulated: true;
}

/**
 * Even out the hottest shards by moving the minimum number of members, and NEVER across a region: a
 * rebalance that fixes a load problem by moving a German member to us-east has traded an availability
 * incident for a regulatory one. Moves are expressed as placement overrides rather than a rehash, which
 * is how this is done in production without a stop-the-world migration.
 */
export function planRebalance(net: SyntheticSocialNetwork, topo: Topology, placement?: Map<string, ShardKey>, tolerance = 0.1): RebalancePlan {
  const place = placement ?? placeAll(net, topo);
  const byRegion = new Map<Region, Map<number, string[]>>();
  for (const m of net.members) {
    const k = place.get(m.id);
    if (!k) continue;
    const region = byRegion.get(k.region) ?? new Map<number, string[]>();
    const list = region.get(k.shard) ?? [];
    list.push(m.id);
    region.set(k.shard, list);
    byRegion.set(k.region, region);
  }

  const moves: RebalanceMove[] = [];
  const sizesBefore: number[] = [];
  const sizesAfter: number[] = [];

  for (const region of REGIONS) {
    const shards = byRegion.get(region);
    if (!shards) continue;
    const n = topo.shardsPerRegion[region];
    for (let s = 0; s < n; s++) if (!shards.has(s)) shards.set(s, []);
    const total = [...shards.values()].reduce((a, l) => a + l.length, 0);
    const target = total / Math.max(1, n);
    const ceiling = Math.ceil(target * (1 + tolerance));
    for (const list of shards.values()) sizesBefore.push(list.length);

    // Take from every shard above the ceiling, hand to whichever shard is currently smallest.
    const donors: { shard: number; ids: string[] }[] = [];
    for (const [shard, ids] of shards) {
      if (ids.length > ceiling) donors.push({ shard, ids: ids.slice(0, ids.length - ceiling) });
    }
    const pool = donors.flatMap((d) => d.ids.map((id) => ({ id, from: d.shard })));
    const sizes = new Map<number, number>([...shards].map(([s, l]) => [s, l.length]));
    for (const d of donors) sizes.set(d.shard, (sizes.get(d.shard) ?? 0) - d.ids.length);

    for (const { id, from } of pool) {
      let best = -1, bestSize = Infinity;
      for (const [shard, size] of sizes) {
        if (shard === from) continue;
        if (size < bestSize) { bestSize = size; best = shard; }
      }
      if (best < 0) continue;
      sizes.set(best, bestSize + 1);
      topo.overrides.set(id, best);
      moves.push({ memberId: id, from: `${region}/${from}`, to: `${region}/${best}` });
    }
    for (const size of sizes.values()) sizesAfter.push(size);
  }

  const stat = (xs: number[]): { max: number; hotRatio: number } => {
    const mean = xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
    const max = xs.reduce((a, b) => (b > a ? b : a), 0);
    return { max, hotRatio: mean > 0 ? Math.round((max / mean) * 100) / 100 : 0 };
  };

  return {
    moves,
    movedShare: net.members.length ? Math.round((moves.length / net.members.length) * 10_000) / 10_000 : 0,
    before: stat(sizesBefore),
    after: stat(sizesAfter),
    simulated: true,
  };
}

/**
 * How much of the corpus relocates when the cluster grows. This is the measurement that justifies a ring
 * over modulo, and it is reported rather than asserted so the number can be checked rather than trusted.
 */
export function measureResharding(net: SyntheticSocialNetwork, region: Region, from: number, to: number, vnodes = 128): { ringMovedShare: number; moduloMovedShare: number; members: number } {
  const before = buildRing(region, from, vnodes);
  const after = buildRing(region, to, vnodes);
  const members = net.members.filter((m) => regionOf(m.country) === region);
  let ringMoved = 0, moduloMoved = 0;
  for (const m of members) {
    if (lookupRing(before, m.id) !== lookupRing(after, m.id)) ringMoved++;
    if (hash32(m.id) % Math.max(1, from) !== hash32(m.id) % Math.max(1, to)) moduloMoved++;
  }
  const n = Math.max(1, members.length);
  return {
    ringMovedShare: Math.round((ringMoved / n) * 10_000) / 10_000,
    moduloMovedShare: Math.round((moduloMoved / n) * 10_000) / 10_000,
    members: members.length,
  };
}
