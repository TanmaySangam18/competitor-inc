#!/usr/bin/env node
// DEBT-ZERO Phase 0 — the inventory + reachability graph (docs/DEBT-ZERO-PLAN.md).
// Evidence, not vibes: walks every source file, parses its imports, builds the graph, BFS-es from the
// REAL entry points (App Router files, proxy, CLI, package scripts), and classifies every file:
//   entry · reachable · test-only (only tests import it) · UNREACHABLE (kill candidate)
// Output: docs/audit/INVENTORY.md (human) + docs/audit/inventory.json (machine, for the kill phase).
// Usage: node scripts/audit-inventory.mjs
import { readdirSync, readFileSync, statSync, mkdirSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

const ROOT = process.cwd();
// coworker/ is a VENDORED companion app (own workspace, own aliases) — audited as one unit, not per-file.
const SRC_DIRS = ["app", "bin", "components", "launch", "lib", "p", "scripts", "test"];
const EXTS = [".ts", ".tsx", ".mjs", ".js", ".jsx"];
// NOTE: never put "build"/"dist" here — app/build/ is a real route (this exact bug shipped once);
// Next.js outputs to .next, so there are no build-output dirs to skip in this repo.
const SKIP_DIRS = new Set(["node_modules", ".git", ".next"]);

// ── 1 · collect files ─────────────────────────────────────────────────────────
const files = [];
function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = path.join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) { if (!SKIP_DIRS.has(e)) walk(p); continue; }
    if (EXTS.some((x) => e.endsWith(x))) files.push(path.relative(ROOT, p));
  }
}
for (const d of SRC_DIRS) { try { walk(path.join(ROOT, d)); } catch { /* dir may not exist */ } }
// root-level source files (proxy.ts, next.config.ts, …)
for (const e of readdirSync(ROOT)) {
  if (EXTS.some((x) => e.endsWith(x)) && statSync(path.join(ROOT, e)).isFile()) files.push(e);
}
const fileSet = new Set(files);

// ── 2 · parse imports → edges ─────────────────────────────────────────────────
const IMPORT_RE = /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|require\s*\(\s*['"]([^'"]+)['"]\s*\)|import\s+['"]([^'"]+)['"]/g;
function resolveSpec(fromFile, spec) {
  if (!spec.startsWith("@/") && !spec.startsWith(".")) return null; // external package
  const base = spec.startsWith("@/") ? spec.slice(2) : path.join(path.dirname(fromFile), spec);
  const norm = path.normalize(base);
  const jsAsTs = norm.replace(/\.js$/, ""); // TS-ESM style: `./x.js` names `./x.ts` — map before trying
  const tries = [norm, ...EXTS.map((x) => jsAsTs + x), ...EXTS.map((x) => path.join(norm, "index" + x))];
  for (const t of tries) if (fileSet.has(t)) return t;
  return norm.endsWith(".css") ? null : undefined; // css = fine; undefined = unresolved (reported)
}
const importsOf = new Map(); // file → Set(resolved files)
const importedBy = new Map(); // file → Set(files that import it)
const unresolved = [];
for (const f of files) {
  const src = readFileSync(path.join(ROOT, f), "utf8");
  const out = new Set();
  for (const m of src.matchAll(IMPORT_RE)) {
    const spec = m[1] ?? m[2] ?? m[3] ?? m[4];
    if (!spec) continue;
    const r = resolveSpec(f, spec);
    if (r === undefined) unresolved.push(`${f} → ${spec}`);
    else if (r) { out.add(r); (importedBy.get(r) ?? importedBy.set(r, new Set()).get(r)).add(f); }
  }
  importsOf.set(f, out);
}

// ── 3 · entry points ─────────────────────────────────────────────────────────
const NEXT_SPECIAL = /^app\/.*(page|layout|route|error|loading|not-found|template|default|global-error|opengraph-image|icon|apple-icon|sitemap|robots|manifest)\.(ts|tsx)$|^(instrumentation(-client)?|mdx-components)\.(ts|tsx)$/;
const isTest = (f) => /\.test\.(ts|tsx|mjs)$/.test(f) || f.startsWith("test/");
const isScript = (f) => f.startsWith("scripts/") || f.startsWith("bin/");
const isConfig = (f) => /^(next\.config|tailwind\.config|postcss\.config|vitest\.config|eslint\.config|instrumentation|proxy|middleware)\./.test(f);
const entries = files.filter((f) => NEXT_SPECIAL.test(f) || isScript(f) || isConfig(f));

// ── 4 · reachability (BFS), twice: with and without tests as roots ───────────
function reach(roots) {
  const seen = new Set(roots);
  const q = [...roots];
  while (q.length) { for (const n of importsOf.get(q.shift()) ?? []) if (!seen.has(n)) { seen.add(n); q.push(n); } }
  return seen;
}
const live = reach(entries);
const liveOrTested = reach([...entries, ...files.filter(isTest)]);

// ── 5 · git age (one pass) ────────────────────────────────────────────────────
const age = new Map();
try {
  const log = execSync("git log --pretty=format:C%cs --name-only", { maxBuffer: 64 * 1024 * 1024 }).toString();
  let cur = "";
  for (const line of log.split("\n")) {
    if (line.startsWith("C")) cur = line.slice(1);
    else if (line && !age.has(line)) age.set(line, cur);
  }
} catch { /* no git — ages stay unknown */ }

// ── 6 · classify + report ─────────────────────────────────────────────────────
const rows = files.filter((f) => !isTest(f) && !f.endsWith(".d.ts")).map((f) => ({
  file: f,
  cls: entries.includes(f) ? "entry" : live.has(f) ? "reachable" : liveOrTested.has(f) ? "TEST-ONLY" : "UNREACHABLE",
  importers: importedBy.get(f)?.size ?? 0,
  last: age.get(f) ?? "?",
}));
const by = (c) => rows.filter((r) => r.cls === c).sort((a, b) => a.file.localeCompare(b.file));
const dead = by("UNREACHABLE"), testOnly = by("TEST-ONLY");
const table = (rs) => ["| file | importers | last commit |", "|---|---|---|", ...rs.map((r) => `| ${r.file} | ${r.importers} | ${r.last} |`)].join("\n");

mkdirSync(path.join(ROOT, "docs/audit"), { recursive: true });
writeFileSync(path.join(ROOT, "docs/audit/inventory.json"), JSON.stringify({ generated: new Date().toISOString(), rows, unresolved }, null, 1));
writeFileSync(path.join(ROOT, "docs/audit/INVENTORY.md"), `# Repo inventory — Debt-Zero Phase 0 (generated ${new Date().toISOString().slice(0, 10)} by scripts/audit-inventory.mjs)

Totals: **${files.length}** source files · **${entries.length}** entry points · **${by("reachable").length}** reachable · **${testOnly.length}** test-only · **${dead.length}** UNREACHABLE.

## UNREACHABLE from any entry point — kill candidates (Phase 1)
${table(dead)}

## Reachable ONLY from tests — kill candidates (the test dies with the subject)
${table(testOnly)}

## Unresolved imports (specifier didn't resolve to a repo file — usually a stale path)
${unresolved.length ? unresolved.map((u) => `- ${u}`).join("\n") : "- none"}
`);
console.log(`inventory: ${files.length} files · ${entries.length} entries · ${dead.length} unreachable · ${testOnly.length} test-only · ${unresolved.length} unresolved imports`);
console.log("→ docs/audit/INVENTORY.md + inventory.json");
