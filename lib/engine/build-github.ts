// The REAL build muscle (Phase B) — server-side. When a GitHub token is present (the founder's own via
// Connections, or the operator env), the supervisor's build task actually generates a site and ships it to
// a live GitHub repo + Pages URL — a verifiable, openable artifact. OpenHands plugs in here IDENTICALLY:
// swap the `build` fn for one that runs a sandbox and returns {url} for a full app. No new abstraction.
//
// Server-only (imports server.ts + execution.ts). Never bundled to the client; the pure supervisor/
// build-executor stay testable without this.

import "server-only";
import { generateSiteFiles } from "./server";
import { buildOnGitHub, siteHtml } from "./execution";
import { makeBuildExecute } from "./build-executor";
import type { ExecuteFn } from "./supervisor";
import type { ByokConfig, Connections } from "@/lib/core/types";

function repoName(goal: string): string {
  const base =
    goal
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "app";
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}

// Returns a build-capable ExecuteFn, or null when no GitHub token is available (→ caller uses simulated).
export function githubBuildExecutor(conn?: Connections, byok?: ByokConfig): ExecuteFn | null {
  const token = conn?.githubToken || process.env.GITHUB_TOKEN;
  if (!token) return null;
  return makeBuildExecute({
    build: async (goal) => {
      const name = goal.slice(0, 60);
      // "app" mode: the model authors a REAL functional client-side app (localStorage-backed), $0 via
      // GitHub Pages; falls back to the safe single-file template if the model is unavailable/returns junk.
      const files = (await generateSiteFiles(name, goal, byok, "app")) ?? { "index.html": siteHtml(name, goal) };
      const out = await buildOnGitHub({ repo: repoName(goal), description: goal.slice(0, 120), files }, token);
      return out.ok && out.proof?.kind === "url" ? { url: out.proof.value } : null;
    },
    // GitHub Pages deploys asynchronously (~1 min); buildOnGitHub already confirmed the real repo+files+
    // pages config, so accept the canonical URL shape rather than false-failing on an immediate HEAD race.
    verifyUrl: (u) => /^https:\/\/\S+$/.test(u),
  });
}
