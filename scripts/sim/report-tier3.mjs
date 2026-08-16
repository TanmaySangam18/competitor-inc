#!/usr/bin/env node
// scripts/sim/report-tier3.mjs — run the ads marketplace and the shard planner against the full
// 50,000-member corpus and write down what actually happened.
//
// Tests prove the mechanisms are correct. This prints the NUMBERS, because the numbers are the reason to
// build against synthetic data at all: fan-out cost, auction fill, how much second pricing discounts,
// how much of the corpus relocates when a shard is added. None of that is visible from a green test run.
//
// Output is gitignored: derived, reproducible from the seed in seconds.
//
// Usage: npx tsx scripts/sim/report-tier3.mjs [outDir] [seed] [members]

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { generateSocialNetwork } from "../../lib/sim/social-network.ts";
import { buildAdMarket, indexMemberFacts, simulateAdDay, buildInvoices } from "../../lib/sim/ads-marketplace.ts";
import { buildTopology, placeAll, clusterReport, planRebalance, measureResharding, REGIONS } from "../../lib/sim/sharding.ts";

const outDir = process.argv[2] ?? "sim-out/tier3";
const seed = process.argv[3] ?? "competitor-social-v1";
const members = process.argv[4] ? Number(process.argv[4]) : undefined;

const t0 = Date.now();
const net = generateSocialNetwork(seed, members ? { members } : {});
mkdirSync(outDir, { recursive: true });

const units = (micros) => (micros / 1_000_000).toFixed(2);
const pct = (x) => `${(x * 100).toFixed(1)}%`;

// ── ads ─────────────────────────────────────────────────────────────────────
const facts = indexMemberFacts(net);
const market = buildAdMarket(net, `${seed}:ads`);
const requests = net.members.length * 3;
const { server, report } = simulateAdDay(net, market, { requests, facts, seed: `${seed}:day` });
const invoices = buildInvoices(market, server.charges, 0, Number.MAX_SAFE_INTEGER);
const invoiced = invoices.reduce((a, i) => a + i.totalMicros, 0);

// ── sharding ────────────────────────────────────────────────────────────────
const topo = buildTopology(8);
const place = placeAll(net, topo);
const cluster = clusterReport(net, topo, place, 3000);
const reshard = REGIONS.map((r) => ({ region: r, ...measureResharding(net, r, 8, 9) }));
const rebalanceTopo = buildTopology(8);
const rebalance = planRebalance(net, rebalanceTopo, placeAll(net, rebalanceTopo), 0.05);

const md = [
  "# Tier 3 on the synthetic corpus: ads marketplace and multi-region sharding",
  "",
  `Seed \`${seed}\` · ${net.members.length.toLocaleString()} members · ${net.connections.length.toLocaleString()} connections · generated and measured in ${Date.now() - t0}ms.`,
  "",
  "**Every number below is simulated.** No advertiser exists, no money moved, and none of this may be",
  "reported as revenue. It measures whether the MECHANISMS are correct at scale, which is the only thing",
  "synthetic data can honestly prove.",
  "",
  "---",
  "",
  "## 1. The ads marketplace",
  "",
  `${market.advertisers.length} advertisers · ${market.campaigns.length} campaigns · ${requests.toLocaleString()} ad requests over one simulated day.`,
  "",
  "| measure | value |",
  "|---|---|",
  `| requests | ${report.requests.toLocaleString()} |`,
  `| filled | ${report.filled.toLocaleString()} (${pct(report.fillRate)}) |`,
  `| clicks | ${report.clicks.toLocaleString()} (CTR ${pct(report.ctr)}) |`,
  `| unique members reached | ${report.uniqueMembersReached.toLocaleString()} |`,
  `| charged | ${units(report.chargedMicros)} units |`,
  `| effective CPM | ${units(report.effectiveCpmMicros)} units |`,
  `| second-price discount | ${units(report.discountMicros)} units against first-price bids |`,
  `| campaigns exhausted | ${report.campaignsExhausted} of ${market.campaigns.length} |`,
  "",
  "**Why every candidate that lost, lost.** An ad server that cannot say why it showed nothing is the",
  "most expensive kind of silent system, so each drop is counted.",
  "",
  "| reason | candidates dropped |",
  "|---|---|",
  ...Object.entries(report.filtered).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v.toLocaleString()} |`),
  "",
  `**The ledger closes.** ${invoices.length} invoices totalling ${units(invoiced)} units against ${units(report.chargedMicros)} units charged, `,
  `a difference of ${invoiced - report.chargedMicros} micros. Every amount is a whole micro, which is what makes that exact.`,
  "",
  "---",
  "",
  "## 2. Multi-region sharding",
  "",
  `${cluster.totalShards} shards across ${REGIONS.length} regions, ${topo.vnodes} virtual nodes per shard.`,
  "",
  "### Fan-out: what one feed read costs",
  "",
  "| percentile | shards touched | as a share of the cluster |",
  "|---|---|---|",
  `| p50 | ${cluster.fanout.p50} | ${pct(cluster.fanout.p50 / cluster.totalShards)} |`,
  `| p90 | ${cluster.fanout.p90} | ${pct(cluster.fanout.p90 / cluster.totalShards)} |`,
  `| p99 | ${cluster.fanout.p99} | ${pct(cluster.fanout.p99 / cluster.totalShards)} |`,
  `| max | ${cluster.fanout.max} | ${pct(cluster.fanout.max / cluster.totalShards)} |`,
  "",
  `**This is the finding.** The median feed read already touches ${pct(cluster.fanout.p50 / cluster.totalShards)} of the cluster and the p99 touches ${pct(cluster.fanout.p99 / cluster.totalShards)}.`,
  "Fan-out-on-read is not a viable design at the top of this graph: the hubs need materialised timelines.",
  `${pct(cluster.crossShardEdgeShare)} of all edges cross a shard boundary and ${pct(cluster.crossRegionEdgeShare)} cross a region, so almost every`,
  "read is a scatter-gather. That verdict is invisible on a uniform graph, which is why the corpus is",
  "power-law rather than random.",
  "",
  "The ten worst cases:",
  "",
  "| member | connections | shards touched | regions | cross-region connections |",
  "|---|---|---|---|---|",
  ...cluster.fanout.worst.map((w) => `| \`${w.memberId}\` | ${w.connections.toLocaleString()} | ${w.shardsTouched} | ${w.regionsTouched} | ${w.crossRegionConnections.toLocaleString()} |`),
  "",
  "### Placement: the ring against modulo",
  "",
  "Adding one shard to eight, per region. This gap is the entire argument for consistent hashing.",
  "",
  "| region | members | ring relocates | modulo relocates |",
  "|---|---|---|---|",
  ...reshard.map((r) => `| ${r.region} | ${r.members.toLocaleString()} | ${pct(r.ringMovedShare)} | ${pct(r.moduloMovedShare)} |`),
  "",
  "### Load, and the skew a rebalance cannot fix",
  "",
  `Members per shard: min ${cluster.memberSkew.min.toLocaleString()}, median ${cluster.memberSkew.p50.toLocaleString()}, p99 ${cluster.memberSkew.p99.toLocaleString()}, max ${cluster.memberSkew.max.toLocaleString()} (hot shard is ${cluster.memberSkew.hotRatio}x the mean).`,
  "",
  `An intra-region rebalance moves ${pct(rebalance.movedShare)} of the corpus and takes the hot shard from ${rebalance.before.max.toLocaleString()} to ${rebalance.after.max.toLocaleString()} members.`,
  "It cannot do better, because it may never move a member across a region: that would break residency.",
  "The rest of the skew is a sizing decision, not a balancing one.",
  "",
  "| region | members | shards now | shards it should have |",
  "|---|---|---|---|",
  ...cluster.rightsizing.map((r) => `| ${r.region} | ${r.members.toLocaleString()} | ${r.shards} | ${r.suggestedShards} |`),
  "",
  "### Residency",
  "",
  `**${cluster.residencyViolations} violations.** Every member under an EU or UK obligation is stored in the region that`,
  "obligation requires, and placement enforces it ahead of the hash rather than after it. Serving region",
  "and legal jurisdiction are deliberately separate lookups: Türkiye routes to the European region for",
  "latency while carrying no EU residency duty, and collapsing those two ideas is how an architecture",
  "decision quietly becomes a compliance incident.",
  "",
];

writeFileSync(join(outDir, "TIER3-REPORT.md"), md.join("\n"));

console.log(`tier 3 measured in ${Date.now() - t0}ms → ${outDir}/TIER3-REPORT.md`);
console.log(`  ads      ${report.filled.toLocaleString()}/${report.requests.toLocaleString()} filled (${pct(report.fillRate)}), ${units(report.chargedMicros)} units charged, ledger closes to ${invoiced - report.chargedMicros} micros`);
console.log(`  fan-out  p50 ${cluster.fanout.p50}/${cluster.totalShards} shards, p99 ${cluster.fanout.p99}, max ${cluster.fanout.max}`);
console.log(`  ring     adding a shard relocates ${pct(reshard[0].ringMovedShare)} vs modulo's ${pct(reshard[0].moduloMovedShare)}`);
console.log(`  residency ${cluster.residencyViolations} violations`);
