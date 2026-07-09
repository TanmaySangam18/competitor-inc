// Ship preflight (de-landmine). `npm run ship` deploys `git archive HEAD` — TRACKED files only. So an
// UNTRACKED source file that tracked code imports passes local `npm run qa` (working tree) but VANISHES
// from the deployed archive → prod breaks. This guard fails the ship if any tracked file imports an
// untracked one, via the project's `@/` path alias (the form used throughout the repo).
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const SRC = /\.(ts|tsx|js|jsx|mjs)$/;
const sh = (c) => execSync(c, { encoding: "utf8" }).split("\n").map((s) => s.trim()).filter(Boolean);

const untracked = sh("git ls-files --others --exclude-standard").filter((f) => SRC.test(f));
if (untracked.length === 0) {
  console.log("✓ de-landmine: no untracked source files");
  process.exit(0);
}
// The `@/`-alias specifier a tracked file would use to import each untracked module (ext + /index stripped).
const aliases = untracked.map((f) => "@/" + f.replace(SRC, "").replace(/\/index$/, ""));
const tracked = sh("git ls-files").filter((f) => SRC.test(f));

const offenders = [];
for (const t of tracked) {
  let src = "";
  try { src = readFileSync(t, "utf8"); } catch { continue; }
  aliases.forEach((a, i) => {
    if (src.includes(a)) offenders.push(`  ${t}  →  imports UNTRACKED  ${untracked[i]}`);
  });
}
if (offenders.length) {
  console.error("✗ de-landmine: tracked code imports untracked files that would VANISH from the archive deploy:");
  console.error(offenders.join("\n"));
  console.error("Fix: commit those files (or remove the import) before shipping.");
  process.exit(1);
}
console.log(`✓ de-landmine: ${untracked.length} untracked source file(s), none imported by tracked code`);
