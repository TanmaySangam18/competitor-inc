import { describe, it, expect } from "vitest";
import { generateSocialNetwork } from "./social-network";
import {
  REGIONS, regionOf, jurisdictionOf, buildRing, lookupRing, buildTopology, placeMember,
  placeMemberModulo, placeAll, shardIdOf, indexAdjacency, planFeedRead, clusterReport,
  planRebalance, measureResharding,
} from "./sharding";

const NOW = Date.UTC(2026, 7, 15);
const net = generateSocialNetwork("shard-test", { members: 4000, now: NOW });
const topo = buildTopology(8);
const place = placeAll(net, topo);

describe("regions and jurisdictions are not the same thing", () => {
  it("routes traffic by geography", () => {
    expect(regionOf("United States")).toBe("us-east");
    expect(regionOf("Germany")).toBe("eu-west");
    expect(regionOf("India")).toBe("ap-south");
    expect(regionOf("Brazil")).toBe("sa-east");
    expect(regionOf("Kenya")).toBe("af-south");
  });

  it("separates where data is SERVED from where it must LEGALLY sit", () => {
    // Türkiye routes to the European region for latency and carries no EU residency obligation.
    // Collapsing these two ideas into one lookup is how a company ends up with a compliance incident
    // it believed was an architecture decision.
    expect(regionOf("Türkiye")).toBe("eu-west");
    expect(jurisdictionOf("Türkiye")).toBe("none");
    expect(jurisdictionOf("Germany")).toBe("eu");
    expect(jurisdictionOf("United Kingdom")).toBe("uk");
    expect(jurisdictionOf("United States")).toBe("none");
  });

  it("places every jurisdiction-bound member inside its required region", () => {
    for (const m of net.members) {
      const k = place.get(m.id)!;
      if (jurisdictionOf(m.country) !== "none") expect(k.region, `${m.id} (${m.country}) stored outside its jurisdiction`).toBe("eu-west");
      expect(REGIONS).toContain(k.region);
      expect(k.shard).toBeGreaterThanOrEqual(0);
      expect(k.shard).toBeLessThan(topo.shardsPerRegion[k.region]);
    }
  });

  it("reports zero residency violations on a clean cluster", () => {
    expect(clusterReport(net, topo, place, 500).residencyViolations).toBe(0);
  });
});

describe("the consistent-hash ring", () => {
  it("is deterministic", () => {
    const a = buildRing("us-east", 8);
    const b = buildRing("us-east", 8);
    expect(a.points.length).toBe(b.points.length);
    for (const m of net.members.slice(0, 300)) expect(lookupRing(a, m.id)).toBe(lookupRing(b, m.id));
  });

  it("spreads members across every shard rather than piling them on one", () => {
    const ring = buildRing("us-east", 8);
    const counts = new Array<number>(8).fill(0);
    for (const m of net.members) counts[lookupRing(ring, m.id)]++;
    const mean = net.members.length / 8;
    for (let s = 0; s < 8; s++) {
      expect(counts[s], `shard ${s} is empty`).toBeGreaterThan(0);
      // 128 virtual nodes should hold every shard inside roughly a third of the mean.
      expect(Math.abs(counts[s] - mean) / mean, `shard ${s} is lopsided`).toBeLessThan(0.35);
    }
  });

  it("moves far fewer members than modulo when the cluster grows", () => {
    // THE reason to use a ring at all. Modulo relocates almost everything when a shard is added; the
    // ring relocates roughly 1/(n+1). This is measured rather than asserted from theory.
    const m = measureResharding(net, "us-east", 8, 9);
    expect(m.members).toBeGreaterThan(100);
    expect(m.ringMovedShare).toBeLessThan(0.2);
    expect(m.moduloMovedShare).toBeGreaterThan(0.7);
    expect(m.ringMovedShare * 3).toBeLessThan(m.moduloMovedShare);
  });

  it("keeps the ring's advantage as the cluster gets bigger", () => {
    const small = measureResharding(net, "us-east", 4, 5);
    const big = measureResharding(net, "us-east", 16, 17);
    // Adding one shard to sixteen should disturb less than adding one to four.
    expect(big.ringMovedShare).toBeLessThan(small.ringMovedShare);
  });

  it("survives an empty ring without throwing", () => {
    expect(lookupRing(buildRing("us-east", 0), "m_1")).toBe(0);
  });
});

describe("fan-out is the number that decides the architecture", () => {
  const adj = indexAdjacency(net);

  it("indexes the graph in both directions", () => {
    for (const c of net.connections.slice(0, 200)) {
      expect(adj.get(c.a)).toContain(c.b);
      expect(adj.get(c.b)).toContain(c.a);
    }
  });

  it("makes a hub touch more shards than a tail member", () => {
    const sorted = [...net.members].sort((a, b) => b.connectionCount - a.connectionCount);
    const hub = planFeedRead(net, topo, adj, sorted[0].id, place);
    const tail = planFeedRead(net, topo, adj, sorted[sorted.length - 1].id, place);
    expect(hub.connections).toBeGreaterThan(tail.connections);
    expect(hub.shardsTouched).toBeGreaterThan(tail.shardsTouched);
  });

  it("never claims to touch more shards than exist, or fewer than one", () => {
    const total = REGIONS.reduce((a, r) => a + topo.shardsPerRegion[r], 0);
    for (const m of net.members.slice(0, 400)) {
      const p = planFeedRead(net, topo, adj, m.id, place);
      expect(p.readAmplification).toBeGreaterThanOrEqual(1);
      expect(p.shardsTouched).toBeLessThanOrEqual(total);
      expect(p.perShard.reduce((a, s) => a + s.connections, 0)).toBe(p.connections);
    }
  });

  it("shows the cluster saturating, which is the whole finding", () => {
    // The measured result on 4,000 members across 40 shards: the MEDIAN feed read already touches 20
    // shards and the p99 touches 38 of 40. Fan-out-on-read is therefore not a viable design here, and
    // that verdict is only visible against a graph that actually has hubs. This assertion pins the
    // finding rather than a comfortable inequality.
    const total = REGIONS.reduce((a, r) => a + topo.shardsPerRegion[r], 0);
    const report = clusterReport(net, topo, place, 1500);
    expect(report.fanout.p50).toBeLessThan(report.fanout.p99);
    expect(report.fanout.max).toBe(total);
    expect(report.fanout.p99 / total, "the p99 read should be saturating the cluster").toBeGreaterThan(0.8);
    expect(report.fanout.p50 / total, "even the median read touches much of the cluster").toBeGreaterThan(0.3);
    for (const w of report.fanout.worst) expect(w.connections).toBeGreaterThan(0);
  });

  it("names the skew a rebalance cannot fix", () => {
    // Equal shard counts across unequal regions is skew by construction. Rebalancing cannot touch it,
    // because moving members across a region would break residency. Only re-sizing can.
    const report = clusterReport(net, topo, place, 400);
    const busiest = [...report.rightsizing].sort((a, b) => b.members - a.members)[0];
    const quietest = [...report.rightsizing].sort((a, b) => a.members - b.members)[0];
    expect(busiest.members).toBeGreaterThan(quietest.members);
    expect(busiest.suggestedShards).toBeGreaterThan(quietest.suggestedShards);
    expect(report.rightsizing.reduce((a, r) => a + r.members, 0)).toBe(net.members.length);
  });

  it("counts cross-region reads separately, because they cost the most", () => {
    const p = planFeedRead(net, topo, adj, [...net.members].sort((a, b) => b.connectionCount - a.connectionCount)[0].id, place);
    expect(p.regionsTouched).toBeGreaterThan(1);
    expect(p.crossRegionConnections).toBeGreaterThan(0);
    expect(p.crossRegionConnections).toBeLessThanOrEqual(p.connections);
  });
});

describe("the cluster report", () => {
  const report = clusterReport(net, topo, place, 800);

  it("accounts for every member exactly once", () => {
    expect(report.shards.reduce((a, s) => a + s.members, 0)).toBe(net.members.length);
    expect(report.members).toBe(net.members.length);
    expect(report.totalShards).toBe(REGIONS.reduce((a, r) => a + topo.shardsPerRegion[r], 0));
  });

  it("measures the share of edges that cross a shard boundary", () => {
    // On a graph this fragmented almost every edge is a cross-shard read, which is precisely the cost a
    // single-database design hides from you.
    expect(report.crossShardEdgeShare).toBeGreaterThan(0.5);
    expect(report.crossShardEdgeShare).toBeLessThanOrEqual(1);
    expect(report.crossRegionEdgeShare).toBeLessThanOrEqual(report.crossShardEdgeShare);
  });

  it("reports skew rather than an average that hides it", () => {
    expect(report.memberSkew.min).toBeLessThanOrEqual(report.memberSkew.p50);
    expect(report.memberSkew.p50).toBeLessThanOrEqual(report.memberSkew.max);
    expect(report.memberSkew.hotRatio).toBeGreaterThan(0);
  });

  it("is marked simulated", () => {
    expect(report.simulated).toBe(true);
  });
});

describe("rebalancing", () => {
  it("never moves a member out of its jurisdiction", () => {
    // A rebalance that fixes a load problem by moving a German member to us-east has traded an
    // availability incident for a regulatory one. This is the assertion that forbids it.
    const t = buildTopology(8);
    const p = placeAll(net, t);
    const plan = planRebalance(net, t, p, 0.02);
    const country = new Map(net.members.map((m) => [m.id, m.country]));
    for (const move of plan.moves) {
      expect(move.from.split("/")[0], "a rebalance crossed regions").toBe(move.to.split("/")[0]);
      const j = jurisdictionOf(country.get(move.memberId)!);
      if (j !== "none") expect(move.to.startsWith("eu-west/")).toBe(true);
    }
  });

  it("flattens the hot shard", () => {
    const t = buildTopology(8);
    const plan = planRebalance(net, t, placeAll(net, t), 0.02);
    expect(plan.moves.length).toBeGreaterThan(0);
    expect(plan.after.hotRatio).toBeLessThanOrEqual(plan.before.hotRatio);
    expect(plan.after.max).toBeLessThanOrEqual(plan.before.max);
  });

  it("moves a small share of the corpus, which is the point of the ring", () => {
    const t = buildTopology(8);
    const plan = planRebalance(net, t, placeAll(net, t), 0.02);
    expect(plan.movedShare).toBeLessThan(0.1);
    expect(plan.simulated).toBe(true);
  });

  it("takes effect: placement honours the overrides afterwards", () => {
    const t = buildTopology(8);
    const before = placeAll(net, t);
    const plan = planRebalance(net, t, before, 0.02);
    const move = plan.moves[0];
    const country = new Map(net.members.map((m) => [m.id, m.country]));
    expect(shardIdOf(placeMember(t, move.memberId, country.get(move.memberId)!))).toBe(move.to);
    // And the cluster report agrees, rather than reporting the pre-move layout.
    const after = clusterReport(net, t, placeAll(net, t), 400);
    expect(after.residencyViolations).toBe(0);
    expect(after.shards.reduce((a, s) => a + s.members, 0)).toBe(net.members.length);
  });
});

describe("modulo placement, kept only for comparison", () => {
  it("still respects residency", () => {
    for (const m of net.members.slice(0, 500)) {
      const k = placeMemberModulo(m.id, m.country, 8);
      if (jurisdictionOf(m.country) !== "none") expect(k.region).toBe("eu-west");
      expect(k.shard).toBeLessThan(8);
    }
  });

  it("is deterministic", () => {
    for (const m of net.members.slice(0, 200)) {
      expect(placeMemberModulo(m.id, m.country, 8)).toEqual(placeMemberModulo(m.id, m.country, 8));
    }
  });
});
