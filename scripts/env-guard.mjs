#!/usr/bin/env node
// ENV-GUARD (Block 5) — catches the Vercel inlining trap at the point of introduction.
//
// The footgun (bit us once already): a NEXT_PUBLIC_* var marked "Sensitive" on Vercel is NOT inlined
// into the client bundle — the server sees it, the browser doesn't, and a flag/paywall looks on while
// being silently off client-side. We can't read Vercel's Sensitive bit from here, so the guard enforces
// the workflow rule instead:
//   1. Every NEXT_PUBLIC_* referenced in source must be DOCUMENTED in .env.example — a new public var
//      can't slip in unreviewed.
//   2. The full manifest prints on every QA run with the rule attached, so the "non-Sensitive on
//      Vercel" requirement is seen every time someone ships.
// Fails the QA gate on undocumented vars; prints the manifest otherwise.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["app", "components", "lib", "proxy.ts", "next.config.ts"];
const SKIP = new Set(["node_modules", ".next", ".git", "public"]);
const RE = /NEXT_PUBLIC_[A-Z0-9_]+/g;

function* walk(p) {
  const st = statSync(p, { throwIfNoEntry: false });
  if (!st) return;
  if (st.isFile()) {
    if (/\.(ts|tsx|js|mjs)$/.test(p)) yield p;
    return;
  }
  for (const name of readdirSync(p)) {
    if (SKIP.has(name)) continue;
    yield* walk(join(p, name));
  }
}

const used = new Map(); // var -> first file seen
for (const dir of SCAN_DIRS) {
  for (const f of walk(join(ROOT, dir))) {
    const src = readFileSync(f, "utf8");
    for (const m of src.match(RE) ?? []) if (!used.has(m)) used.set(m, f.replace(ROOT + "/", ""));
  }
}

let documented = new Set();
try {
  documented = new Set(readFileSync(join(ROOT, ".env.example"), "utf8").match(RE) ?? []);
} catch {
  console.error("env-guard: .env.example missing — the public-var manifest has no home");
  process.exit(1);
}

const undocumentedVars = [...used.keys()].filter((v) => !documented.has(v)).sort();

console.log("── env-guard: NEXT_PUBLIC_* manifest ──────────────────────────────");
console.log("RULE: every var below must be NON-Sensitive on Vercel (Sensitive ⇒ NOT inlined to the client");
console.log("bundle ⇒ silently off in the browser while looking on server-side).");
for (const v of [...used.keys()].sort()) {
  console.log(`  ${documented.has(v) ? "✓" : "✗ UNDOCUMENTED"}  ${v}  (${used.get(v)})`);
}
if (undocumentedVars.length) {
  console.error(`\n✗ env-guard: ${undocumentedVars.length} public var(s) not documented in .env.example: ${undocumentedVars.join(", ")}`);
  console.error("  Add each to .env.example with a comment — that review moment is the guard.");
  process.exit(1);
}
console.log(`✓ env-guard: ${used.size} public vars, all documented`);
