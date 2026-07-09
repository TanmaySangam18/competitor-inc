import "server-only";

// The REAL executor, wired with live deps — shared by the goal API + the cron durable driver so there's
// ONE definition of "what each agent actually does." The CEO/other roles use the real model (runChat,
// which falls back to a simulated reply with no key), Engineering dispatches the real full-stack build,
// Support HEAD-verifies the artifact. makeRealExecutor stays pure (deps injected here) → no import cycle.

import { runChat } from "./server";
import { dispatchFullstackBuild } from "./fullstack-build";
import { verifyProof } from "./execution";
import { makeRealExecutor } from "./orchestrator";
import type { ExecuteFn } from "./supervisor";
import type { ByokConfig } from "./types";

export function serverRealExecutor(opts: { token?: string; byok?: ByokConfig; soul?: string }): ExecuteFn {
  const co = (goal: string) => ({ name: "the product", idea: goal });
  return makeRealExecutor({
    plan: async (g) =>
      (await runChat(co(g), "Write a concise product spec: scope, the core user flow, and the data it stores. Plain text, no preamble.", opts.soul, opts.byok, "ceo")).slice(0, 2000),
    build: async (g) => {
      if (!opts.token) return null; // no repo/workflow token → fall back honestly (task fails, not fabricated)
      const r = await dispatchFullstackBuild({ goal: g, token: opts.token });
      return "repo" in r ? { repo: r.repo, note: `full-stack app building — repo ${r.url}, deploying to Vercel` } : null;
    },
    verify: async (u) => verifyProof({ kind: "url", value: u }),
    draft: async (role, g) =>
      (await runChat(co(g), `Draft the ${role} deliverable for this product. Plain text, no preamble.`, opts.soul, opts.byok, role)).slice(0, 1500),
  });
}
