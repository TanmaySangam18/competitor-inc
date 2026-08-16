#!/usr/bin/env node
// scripts/sim/export-social.mjs — write the synthetic social network to disk so a human can READ it.
//
// The generator is pure and in-memory, which is right for tests and wrong for inspection. This emits:
//   - one NDJSON file per entity (the machine-readable corpus, one JSON object per line)
//   - SCHEMA.md, every table with every column and its type, so nothing is a mystery
//   - SAMPLE.md, twenty-five profiles rendered in full so fidelity can be judged by eye
//
// Output is gitignored: it is derived data, reproducible from the seed in one second, and large.
//
// Usage: npx tsx scripts/sim/export-social.mjs [outDir] [seed] [members]

import { mkdirSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { generateSocialNetwork, socialStats } from "../../lib/sim/social-network.ts";

const outDir = process.argv[2] ?? "sim-out/social";
const seed = process.argv[3] ?? "competitor-social-v1";
const members = process.argv[4] ? Number(process.argv[4]) : undefined;

const t0 = Date.now();
const net = generateSocialNetwork(seed, members ? { members } : {});
const stats = socialStats(net);
mkdirSync(outDir, { recursive: true });

const TABLES = [
  "members", "companies", "positions", "educations", "skills", "certifications",
  "recommendations", "connections", "posts", "comments", "messages", "notifications", "jobs",
];

// Synchronous on purpose: a write stream's end() does not mean the bytes have landed, and the size
// report below stats the files immediately. writeFileSync keeps "written" literally true.
const written = [];
for (const t of TABLES) {
  const rows = net[t];
  const path = join(outDir, `${t}.ndjson`);
  writeFileSync(path, rows.map((row) => JSON.stringify(row)).join("\n") + (rows.length ? "\n" : ""));
  written.push([t, rows.length, path]);
}

// ── SCHEMA.md: every column, derived from the data itself so it cannot drift from reality ──
const typeOf = (v) => (v === null ? "null" : Array.isArray(v) ? "string[]" : typeof v);
const schema = ["# Synthetic social network: schema", "", `Seed \`${seed}\` · generated deterministically · **every row is simulated, none of it is a real person**.`, ""];
for (const [t, count] of written) {
  const rows = net[t];
  if (!rows.length) continue;
  // Union the keys across a sample, so nullable fields are described by both of their shapes.
  const cols = new Map();
  for (const row of rows.slice(0, 500)) {
    for (const [k, v] of Object.entries(row)) {
      const prev = cols.get(k);
      const ty = typeOf(v);
      cols.set(k, prev && prev !== ty && !prev.includes(ty) ? `${prev} | ${ty}` : (prev ?? ty));
    }
  }
  schema.push(`## ${t} (${count.toLocaleString()} rows)`, "", "| column | type |", "|---|---|");
  for (const [k, ty] of cols) schema.push(`| \`${k}\` | ${ty} |`);
  schema.push("");
}
writeFileSync(join(outDir, "SCHEMA.md"), schema.join("\n"));

// ── SAMPLE.md: 25 complete profiles, joined across every table, rendered for a human ──
const byMember = (rows, key = "memberId") => {
  const m = new Map();
  for (const r of rows) {
    const k = r[key];
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(r);
  }
  return m;
};
const positions = byMember(net.positions);
const educations = byMember(net.educations);
const skills = byMember(net.skills);
const certs = byMember(net.certifications);
const recs = byMember(net.recommendations);
const companyName = new Map(net.companies.map((c) => [c.id, c.name]));
const d = (ms) => new Date(ms).toISOString().slice(0, 10);
const dur = (a, b) => `${d(a)} to ${b === null ? "present" : d(b)}`;

// Pick a spread: the most-connected member, the least, and a random middle, so fidelity is judged
// across the whole distribution rather than on 25 identical rows.
const sorted = [...net.members].sort((a, b) => b.connectionCount - a.connectionCount);
const chosen = [sorted[0], sorted[1], ...net.members.slice(100, 121), sorted[sorted.length - 2], sorted[sorted.length - 1]];

const byId = new Map(net.members.map((m) => [m.id, m]));
const companyById = new Map(net.companies.map((c) => [c.id, c]));
const money = (n, cur) => `${cur} ${n.toLocaleString()}`;

const sample = [
  "# Synthetic social network: 25 complete profiles",
  "",
  `Seed \`${seed}\`. Every field every table holds, joined and rendered. **These people do not exist.**`,
  "Emails use the reserved `.test` domain (RFC 2606), so none of them can ever be routed, and company",
  "websites resolve nowhere for the same reason.",
  "",
  "Read it for COHERENCE, not volume: the title climbs across the career, the skills belong to the",
  "field, the degree leads to the job, school ends before work starts, and the industry on the profile",
  "is the industry of the employer. Those agreements are what make a query written against this data",
  "behave the way it would against a real corpus.",
  "",
];
for (const m of chosen) {
  const co = m.currentCompanyId ? companyById.get(m.currentCompanyId) : null;
  sample.push(`---`, "", `## ${m.name}${m.pronouns ? ` (${m.pronouns})` : ""}`, "");
  sample.push(`**${m.headline}** · ${m.location}, ${m.country} · ${m.industry}`, "");
  sample.push(`> ${m.about}`, "");
  sample.push(`| field | value |`, `|---|---|`);
  sample.push(`| id | \`${m.id}\` |`);
  sample.push(`| profile | \`/in/${m.slug}\` |`);
  sample.push(`| email | ${m.email} |`);
  sample.push(`| track | ${m.track} |`);
  sample.push(`| experience | ${m.yearsExperience} years |`);
  sample.push(`| current company | ${co ? `${co.name} (${co.industry}, ${co.size} staff, ${co.headquarters})` : "between roles"} |`);
  sample.push(`| languages | ${m.languages.join(", ")} |`);
  sample.push(`| open to work | ${m.openToWork ? "yes" : "no"} |`);
  sample.push(`| hiring | ${m.openToHire ? "yes" : "no"} |`);
  sample.push(`| connections | ${m.connectionCount.toLocaleString()} |`);
  sample.push(`| followers | ${m.followerCount.toLocaleString()} |`);
  sample.push(`| profile views | ${m.profileViews.toLocaleString()} |`);
  sample.push(`| joined | ${d(m.joinedAt)} |`);
  sample.push(`| last active | ${d(m.lastActiveAt)} |`);
  sample.push("");
  const ps = positions.get(m.id) ?? [];
  if (ps.length) {
    sample.push("**Experience**", "");
    for (const p of [...ps].reverse()) {
      sample.push(`- **${p.title}**, ${companyName.get(p.companyId)} · ${dur(p.startedAt, p.endedAt)} · ${p.employmentType}, ${p.workplaceType} · ${p.location}`);
    }
    sample.push("");
  }
  const es = educations.get(m.id) ?? [];
  if (es.length) {
    sample.push("**Education**", "");
    for (const e of [...es].reverse()) sample.push(`- ${e.degree} ${e.field}, ${e.school} · ${d(e.startedAt)} to ${d(e.endedAt)}`);
    sample.push("");
  }
  const ss = skills.get(m.id) ?? [];
  if (ss.length) {
    sample.push("**Skills**", "");
    sample.push([...ss].sort((a, b) => b.endorsements - a.endorsements).map((s) => `${s.skill} (${s.endorsements})`).join(" · "), "");
  }
  const cs = certs.get(m.id) ?? [];
  if (cs.length) {
    sample.push("**Licenses and certifications**", "");
    for (const c of cs) sample.push(`- ${c.name}, ${c.issuer} · \`${c.credentialId}\` · issued ${d(c.issuedAt)}${c.expiresAt ? `, expires ${d(c.expiresAt)}` : ", no expiry"}`);
    sample.push("");
  }
  const rs = (recs.get(m.id) ?? []).slice(0, 2);
  if (rs.length) {
    sample.push("**Recommendations**", "");
    for (const rec of rs) {
      const author = byId.get(rec.authorId);
      sample.push(`- "${rec.body}"`, `  — **${author ? author.name : rec.authorId}**${author ? `, ${author.currentTitle}` : ""}, ${rec.relationship} · ${d(rec.createdAt)}`);
    }
    sample.push("");
  }
}

// The other two tables a human should be able to check by eye.
sample.push("---", "", "## Five companies", "");
for (const c of net.companies.slice(0, 5)) {
  sample.push(`### ${c.name}`, "", `*${c.tagline}*`, "");
  sample.push(`| field | value |`, `|---|---|`);
  sample.push(`| id | \`${c.id}\` |`, `| page | \`/company/${c.slug}\` |`, `| website | ${c.website} |`);
  sample.push(`| industry | ${c.industry} |`, `| size band | ${c.size} |`, `| employees | ${c.employeeCount.toLocaleString()} |`);
  sample.push(`| headquarters | ${c.headquarters} |`, `| followers | ${c.followerCount.toLocaleString()} |`, `| founded | ${d(c.foundedAt)} |`, "");
}
sample.push("---", "", "## Five open jobs", "");
for (const j of net.jobs.slice(0, 5)) {
  const co = companyById.get(j.companyId);
  const poster = byId.get(j.postedById);
  sample.push(`### ${j.title} · ${co ? co.name : j.companyId}`, "", j.description, "");
  sample.push(`| field | value |`, `|---|---|`);
  sample.push(`| id | \`${j.id}\` |`, `| posted by | ${poster ? `${poster.name}, ${poster.currentTitle}` : j.postedById} |`);
  sample.push(`| location | ${j.location} · ${j.workplaceType} · ${j.employmentType} |`);
  sample.push(`| pay band | ${money(j.salaryMin, j.currency)} to ${money(j.salaryMax, j.currency)} |`);
  sample.push(`| skills | ${j.skills.join(", ")} |`);
  sample.push(`| posted | ${d(j.postedAt)} |`, `| applicants | ${j.applicantCount} |`, "");
}
writeFileSync(join(outDir, "SAMPLE.md"), sample.join("\n"));

const mb = (p) => (statSync(p).size / 1048576).toFixed(1);
const totalMb = written.reduce((a, [, , p]) => a + statSync(p).size, 0) / 1048576;
console.log(`generated + written in ${Date.now() - t0}ms → ${outDir}`);
for (const [t, count, p] of written) console.log(`  ${t.padEnd(16)} ${String(count).padStart(9)} rows  ${mb(p).padStart(6)} MB`);
// Sum the ROWS actually written. Summing socialStats would fold in shares and averages, which are not
// rows, and print a total with a decimal point in it.
const totalRows = written.reduce((a, [, count]) => a + count, 0);
console.log(`  ${"TOTAL".padEnd(16)} ${String(totalRows).padStart(9)} rows  ${totalMb.toFixed(1).padStart(6)} MB`);
console.log(`  plus SCHEMA.md and SAMPLE.md`);
console.log(`  graph: avg ${stats.avgConnections} connections, max ${stats.maxConnections}, ${(stats.belowMeanShare * 100).toFixed(1)}% below the mean`);
console.log(`  people: ${stats.uniqueNames.toLocaleString()} distinct names, ${stats.uniqueHeadlines.toLocaleString()} distinct headlines, ${(stats.activeLast30Share * 100).toFixed(1)}% active in the last 30 days`);
