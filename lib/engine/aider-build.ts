import "server-only";

// FREE full-app build muscle — the $0 alternative to OpenHands Cloud. Instead of paying for a sandbox +
// tokens, we borrow GitHub's own free compute: the engine creates a repo, commits an Aider build workflow
// + the goal prompt, and triggers it via workflow_dispatch (using the founder's GitHub token we already
// have). The GitHub Action runs Aider (MIT) headless against a FREE model API (Groq/Cerebras/etc., the key
// lives as the repo secret LLM_API_KEY the founder sets), writes a real multi-file app, pushes to main, and
// GitHub Pages serves it. $0 end-to-end (public repo = unlimited Actions minutes). Slots into the SAME
// makeBuildExecute seam as build-github/openhands — no new abstraction. See docs/FREE-FULLAPP-BUILDS.md.
//
// Honest limits: free model tiers rate-limit (great for small apps / low volume); committing a workflow
// file needs the token to carry the `workflow` scope (a 403 here → the build task fails honestly and the
// caller falls back). The build runs async in Actions (~2–4 min); we return the canonical Pages URL, which
// resolves when the run finishes — the same honest posture buildOnGitHub already uses for Pages.

import { makeBuildExecute } from "./build-executor";
import type { ExecuteFn } from "./supervisor";
import type { Connections } from "@/lib/core/types";

// Minimal fetch shape so tests can inject a fake without a live network.
export type FetchLike = (
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string },
) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

// Default free model — Groq's Llama 3.3 70B (fast, 1,000 req/day free). Override with FREE_BUILD_MODEL
// (any Aider model string, e.g. "cerebras/llama-3.3-70b" or "openrouter/qwen/qwen3-coder:free").
const FREE_MODEL = process.env.FREE_BUILD_MODEL || "groq/llama-3.3-70b-versatile";
// Which provider env var Aider reads inside the Action. Groq → GROQ_API_KEY; the founder maps their FREE
// key to this via the repo secret. Override with FREE_BUILD_KEY_ENV to match another provider.
const KEY_ENV = process.env.FREE_BUILD_KEY_ENV || "GROQ_API_KEY";

function repoName(goal: string): string {
  const base = goal.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "app";
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}

// The instruction Aider builds from (committed as PROMPT.md, fed via --message-file).
export function promptFile(goal: string): string {
  return [
    `Build a small, polished, fully-working single-page web app for this goal:`,
    ``,
    goal,
    ``,
    `Constraints:`,
    `- Plain HTML/CSS/JS, no build step. Put code in exactly: index.html, app.js, styles.css.`,
    `- Fully interactive and useful; persist user state in localStorage.`,
    `- No external network calls, no frameworks, no console errors.`,
    `- Clean, modern, responsive UI.`,
  ].join("\n");
}

// The GitHub Actions workflow that does the build for free. Uses the repo's default GITHUB_TOKEN (with
// contents:write) to push — no extra PAT needed inside the Action. The only secret is the FREE model key.
export function buildWorkflowYaml(model = FREE_MODEL, keyEnv = KEY_ENV): string {
  return `name: build-app
on:
  workflow_dispatch: {}
permissions:
  contents: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - name: Install Aider
        run: python -m pip install --upgrade pip && pip install aider-chat
      - name: Build the app with Aider (free model)
        env:
          ${keyEnv}: \${{ secrets.LLM_API_KEY }}
        run: |
          aider --yes --model ${model} --message-file PROMPT.md index.html app.js styles.css
      - name: Publish (GitHub Pages serves the default branch)
        run: |
          git config user.name "competitor-bot"
          git config user.email "actions@users.noreply.github.com"
          git add -A
          git commit -m "build: app from prompt" || echo "nothing to commit"
          git push
`;
}

const PLACEHOLDER_HTML =
  "<!doctype html><meta charset=utf-8><title>Building…</title>" +
  "<body style=\"font-family:system-ui;padding:3rem;max-width:40rem;margin:auto\">" +
  "<h1>Your app is being built</h1><p>An agent is generating this app now — refresh in a few minutes.</p>";

// The core sequence, with an injectable fetch so it's unit-testable with zero network:
// create repo → commit (workflow + prompt + placeholder) → enable Pages → dispatch the workflow →
// return the canonical Pages URL (resolves once the Action finishes). Returns null on any hard failure
// (e.g. a 403 committing the workflow = the token lacks `workflow` scope) so the caller degrades honestly.
export async function dispatchAiderBuild(opts: {
  goal: string;
  token: string;
  fetchImpl?: FetchLike;
  model?: string;
}): Promise<{ url: string } | null> {
  const fetchImpl = opts.fetchImpl ?? (globalThis.fetch as unknown as FetchLike);
  const headers = {
    authorization: `Bearer ${opts.token}`,
    accept: "application/vnd.github+json",
    "content-type": "application/json",
  };
  try {
    const repo = repoName(opts.goal);
    const create = await fetchImpl("https://api.github.com/user/repos", {
      method: "POST",
      headers,
      body: JSON.stringify({ name: repo, description: opts.goal.slice(0, 120), private: false, auto_init: true }),
    });
    if (!create.ok) return null;
    const meta = (await create.json().catch(() => ({}))) as { full_name?: string };
    const fullName = meta.full_name;
    const owner = fullName?.split("/")[0];
    if (!fullName || !owner) return null;

    const files: Record<string, string> = {
      ".github/workflows/build-app.yml": buildWorkflowYaml(opts.model ?? FREE_MODEL),
      "PROMPT.md": promptFile(opts.goal),
      "index.html": PLACEHOLDER_HTML,
    };
    for (const [path, content] of Object.entries(files)) {
      const put = await fetchImpl(`https://api.github.com/repos/${fullName}/contents/${encodeURIComponent(path)}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ message: `chore: add ${path}`, content: Buffer.from(content, "utf8").toString("base64") }),
      });
      if (!put.ok) return null; // 403 on the workflow file ⇒ token missing `workflow` scope
    }

    // Enable Pages (source = main root). Best-effort; 409 = already enabled.
    await fetchImpl(`https://api.github.com/repos/${fullName}/pages`, {
      method: "POST",
      headers,
      body: JSON.stringify({ source: { branch: "main", path: "/" } }),
    }).catch(() => undefined);

    // Trigger the build. Requires the workflow to already be on the default branch (it is — just committed).
    const disp = await fetchImpl(`https://api.github.com/repos/${fullName}/actions/workflows/build-app.yml/dispatches`, {
      method: "POST",
      headers,
      body: JSON.stringify({ ref: "main" }),
    });
    if (!disp.ok) return null;

    return { url: `https://${owner}.github.io/${repo}/` };
  } catch {
    return null;
  }
}

// True when we have a GitHub token to build with. (The FREE model key lives as the repo secret the founder
// sets — not in our env — so we can't check it here; gating is on the token + the FREE_BUILDS flag.)
export function aiderActionsConfigured(conn?: Connections): boolean {
  return !!(conn?.githubToken || process.env.GITHUB_TOKEN);
}

// Returns a build-capable ExecuteFn using the free GitHub-Actions + Aider path, or null when no token.
export function aiderBuildExecutor(conn?: Connections): ExecuteFn | null {
  const token = conn?.githubToken || process.env.GITHUB_TOKEN;
  if (!token) return null;
  return makeBuildExecute({
    build: async (goal) => dispatchAiderBuild({ goal, token }),
    verifyUrl: (u) => /^https:\/\/\S+$/.test(u),
  });
}
