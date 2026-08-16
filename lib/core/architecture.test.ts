import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// ─────────────────────────────────────────────────────────────────────────────
// THE LAYERING RULE, ENFORCED BY CI RATHER THAN BY DISCIPLINE.
//
// `lib/core` is POLICY: may this happen, and is it true? `lib/engine` is MECHANISM: how does it happen?
// Policy must not depend on mechanism, or the rules become impossible to reason about in isolation and
// impossible to reuse.
//
// Before this was enforced, core imported engine TEN times and engine imported core twice, so the names
// implied the opposite of the real graph. Two files were misplaced: engine/types.ts held org vocabulary
// (AgentRole, AGENTS) and engine/policy.ts was the governance decision engine. Both moved to core, which
// took core -> engine from ten edges to one.
//
// The one remaining edge is deliberate and named below. lib/core/index.ts is a FACADE over the whole
// company OS, and a facade legitimately composes mechanism. What must never happen is a POLICY module
// reaching into mechanism, because that is the direction that makes the rules untestable on their own.
// ─────────────────────────────────────────────────────────────────────────────

/** The modules that decide whether something may happen. None of these may import lib/engine, ever. */
const POLICY_MODULES = [
  "killswitch.ts",
  "policy.ts",
  "audit.ts",
  "hard-stops.ts",
  "capabilities.ts",
  "connections.ts",
  "publish-gate.ts",
  "content-gate.ts",
  "separation.ts",
  "licenses.ts",
  "types.ts",
];

/**
 * The facade and its composition helpers, which are allowed to reach down into mechanism because
 * composing mechanism is their entire job. Every entry needs a reason, so the list cannot quietly grow.
 */
const FACADE_ALLOWED: Record<string, string> = {
  "index.ts": "the public API facade over the whole OS",
  "plan.ts": "turns a goal into an ordered task plan by composing engine/org-plan and engine/task-queue",
  "coordinate.ts": "closes the loop over plan + deliberate + govern",
  "health.ts": "reads across both layers to report system health",
};

const coreFiles = (): string[] =>
  readdirSync("lib/core").filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"));

const importsEngine = (file: string): string[] => {
  const src = readFileSync(join("lib/core", file), "utf8");
  return [...src.matchAll(/from\s+["'](@\/lib\/engine\/[^"']+)["']/g)].map((m) => m[1]);
};

describe("policy never depends on mechanism", () => {
  it("keeps every policy module free of lib/engine imports", () => {
    for (const f of POLICY_MODULES) {
      const deps = importsEngine(f);
      expect(deps, `${f} is a POLICY module and must not import lib/engine (found: ${deps.join(", ")})`).toEqual([]);
    }
  });

  it("names a reason for every core module that does reach into engine", () => {
    // A new core file that imports engine fails here until someone either removes the dependency or
    // writes down why it is a facade. That is the point: the exception list cannot grow silently.
    for (const f of coreFiles()) {
      if (importsEngine(f).length === 0) continue;
      expect(FACADE_ALLOWED[f], `lib/core/${f} imports lib/engine but is not a named facade module`).toBeTruthy();
    }
  });

  it("has no stale entries in the facade list", () => {
    const present = new Set(coreFiles());
    for (const f of Object.keys(FACADE_ALLOWED)) {
      expect(present.has(f), `${f} is listed as a facade but no longer exists`).toBe(true);
    }
  });

  it("keeps the dependency graph pointing the right way overall", () => {
    // The headline number. Engine leaning on core is correct and expected; core leaning on engine is the
    // thing that was backwards, and it should stay a rounding error rather than a pattern.
    const coreToEngine = coreFiles().filter((f) => importsEngine(f).length > 0).length;
    const engineFiles = readdirSync("lib/engine").filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"));
    const engineToCore = engineFiles.filter((f) =>
      /from\s+["']@\/lib\/core\//.test(readFileSync(join("lib/engine", f), "utf8")),
    ).length;

    expect(coreToEngine).toBeLessThanOrEqual(Object.keys(FACADE_ALLOWED).length);
    expect(engineToCore, "engine should lean on core, not the reverse").toBeGreaterThan(coreToEngine);
  });
});

describe("the moved files landed where the rule says they belong", () => {
  it("puts the org vocabulary and the governance engine in core", () => {
    const present = new Set(coreFiles());
    expect(present.has("types.ts"), "AgentRole is org vocabulary and belongs in core").toBe(true);
    expect(present.has("policy.ts"), "the governance decision engine belongs in core").toBe(true);
  });

  it("leaves nothing importing them from their old home", () => {
    const roots = ["lib/core", "lib/engine", "lib/org", "lib/loop", "lib/sim"];
    for (const root of roots) {
      for (const f of readdirSync(root).filter((x) => x.endsWith(".ts"))) {
        const src = readFileSync(join(root, f), "utf8");
        expect(src, `${root}/${f} still references the old path`).not.toMatch(/@\/lib\/engine\/(types|policy)["']/);
      }
    }
  });
});
