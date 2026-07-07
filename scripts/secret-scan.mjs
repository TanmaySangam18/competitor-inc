#!/usr/bin/env node
// Automated secret detection — so "every deploy includes secret detection" (VISION §Security) is enforced,
// not manual. Zero-dependency, grep-based; scans tracked files in the working tree. On a hit it prints the
// FILE and the pattern NAME, never the secret value, then exits non-zero to block the deploy. A proper
// gitleaks/trufflehog full-history scan in CI is the belt-and-suspenders complement (see docs/STATE.md).
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const PATTERNS = [
  ["Anthropic key", /sk-ant-[A-Za-z0-9_-]{16,}/],
  ["OpenAI key", /sk-[A-Za-z0-9]{24,}/],
  ["Groq key", /gsk_[A-Za-z0-9]{20,}/],
  ["Google API key", /AIza[0-9A-Za-z_-]{30,}/],
  ["GitHub token", /gh[pousr]_[0-9A-Za-z]{30,}/],
  ["Slack token", /xox[baprs]-[0-9A-Za-z-]{12,}/],
  ["Polar token", /polar_[A-Za-z0-9_]{16,}/],
  ["JWT (e.g. Supabase service key)", /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/],
  ["PEM private key", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
];
// Skip build output, binaries, lockfiles, and the placeholder env template.
const SKIP = /(^|\/)(node_modules|\.next|\.git)\/|\.(png|jpg|jpeg|gif|webp|ico|svg|woff2?|ttf|lock)$|(^|\/)\.env\.example$/;

let files = [];
try {
  files = execSync("git ls-files", { encoding: "utf8" }).split("\n").filter((f) => f && !SKIP.test(f));
} catch {
  console.error("✗ secret-scan: could not list git files"); process.exit(1);
}

let hits = 0;
for (const f of files) {
  let text;
  try { text = readFileSync(f, "utf8"); } catch { continue; }
  for (const [name, re] of PATTERNS) {
    if (re.test(text)) { console.error(`  ✗ possible ${name} in ${f}`); hits++; }
  }
}

if (hits > 0) {
  console.error(`\n✗ secret-scan: ${hits} possible secret(s) in tracked files — do NOT deploy. Move them to an env var / vault, then rotate the exposed key.`);
  process.exit(1);
}
console.log("✓ secret-scan: no key-literals in tracked files");
