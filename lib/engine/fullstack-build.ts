import "server-only";

// FULL-STACK build muscle (#1 — closes the "web-apps-only" caveat). Same proven harness as aider-build.ts
// (create repo → commit an Actions workflow + prompt → workflow_dispatch on the founder's token), but the
// workflow scaffolds a **Next.js app (App Router + API routes)**, has Aider implement the feature against a
// FREE model, and **deploys to Vercel** (a real running backend) instead of static GitHub Pages. $0:
// Actions is free on public repos; Vercel's free tier hosts the backend; the model key is a free tier.
//
// Honest posture (Slice 1): this builds + unit-tests the HARNESS. Live runs are FOUNDER-GATED — they need a
// GitHub token with the `workflow` scope + two repo secrets: LLM_API_KEY (free model) and VERCEL_TOKEN. Until
// a run is verified, dispatch returns the REPO url (which always resolves) labelled "building" — never a
// guessed Vercel URL that might 404 (that would violate verify-before-done). Slice 2 captures + verifies the
// live Vercel URL. Flag-gated (FULLSTACK_BUILDS) + fail-soft: null → caller falls back to the static build.

import { makeBuildExecute } from "./build-executor";
import { setRepoSecret } from "./github-secrets";
import type { ExecuteFn } from "./supervisor";
import type { Connections } from "./types";
import type { FetchLike } from "./aider-build";

export const FULLSTACK_BUILDS = process.env.FULLSTACK_BUILDS === "1";

// Free coding model Aider runs inside the Action (override with FULLSTACK_BUILD_MODEL). Key env var Aider
// reads → mapped to the LLM_API_KEY repo secret (override with FULLSTACK_BUILD_KEY_ENV).
const FS_MODEL = process.env.FULLSTACK_BUILD_MODEL || "groq/llama-3.3-70b-versatile";
const FS_KEY_ENV = process.env.FULLSTACK_BUILD_KEY_ENV || "GROQ_API_KEY";

function repoName(goal: string): string {
  const base = goal.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "app";
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}

// What Aider implements (committed as PROMPT.md). Full-stack: a Next.js page + a real API route + persistence.
export function fullstackPromptFile(goal: string): string {
  return [
    `Implement a small but REAL, working full-stack web app in this Next.js (App Router, TypeScript) project for:`,
    ``,
    goal,
    ``,
    `Requirements:`,
    `- A polished UI in app/page.tsx (a client component) with the core create/list/delete flow.`,
    `- A REAL backend API route at app/api/items/route.ts (GET + POST) — no mock data.`,
    `- Persist data. If SUPABASE_URL + SUPABASE_ANON_KEY env vars exist use Supabase; otherwise use an`,
    `  in-memory store in the route so it runs with zero config. Keep it typed and simple.`,
    `- Clean, responsive, no console errors. It must build with \`next build\` and run on Vercel.`,
  ].join("\n");
}

// The Actions workflow: scaffold Next → Aider implements → deploy to Vercel (production). Best-effort;
// Slice 2 iterates it against real runs. The repo's default GITHUB_TOKEN pushes; the only secrets are the
// free model key (LLM_API_KEY) and VERCEL_TOKEN.
export function buildFullstackWorkflowYaml(model = FS_MODEL, keyEnv = FS_KEY_ENV): string {
  return `name: build-fullstack
on:
  workflow_dispatch: {}
permissions:
  contents: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - name: Scaffold Next.js (App Router + API routes)
        run: npx --yes create-next-app@latest web --ts --app --eslint --use-npm --no-tailwind --no-src-dir --import-alias "@/*" --yes
      - name: Install Aider
        run: python -m pip install --upgrade pip && pip install aider-chat
      - name: Implement the app (free model)
        working-directory: web
        env:
          ${keyEnv}: \${{ secrets.LLM_API_KEY }}
        run: aider --yes --model ${model} --message-file ../PROMPT.md app/page.tsx app/api/items/route.ts
      - name: Deploy to Vercel (production)
        working-directory: web
        run: |
          npm i -g vercel
          vercel deploy --prod --yes --token "\${{ secrets.VERCEL_TOKEN }}" | tail -1 > ../deploy-url.txt || echo "deploy failed" > ../deploy-url.txt
      - name: Commit source + deploy URL
        run: |
          git config user.name "competitor-bot"
          git config user.email "actions@users.noreply.github.com"
          git add -A
          git commit -m "build: full-stack app from prompt" || echo "nothing to commit"
          git push
`;
}

// create repo → commit (workflow + prompt) → dispatch → return the REPO url (always resolves; the live Vercel
// URL is captured in Slice 2). Injectable fetch → unit-testable with zero network. null on any hard failure.
export async function dispatchFullstackBuild(opts: {
  goal: string;
  token: string;
  fetchImpl?: FetchLike;
  model?: string;
}): Promise<{ url: string; repo: string } | { error: string }> {
  const fetchImpl = opts.fetchImpl ?? (globalThis.fetch as unknown as FetchLike);
  const headers = {
    authorization: `Bearer ${opts.token}`,
    accept: "application/vnd.github+json",
    "content-type": "application/json",
  };
  try {
    const repo = repoName(opts.goal);
    // Create under a GitHub ORG when FULLSTACK_GH_ORG is set (inherits org secrets); else the user account
    // (per-repo secret injection below makes that work with zero org).
    const org = process.env.FULLSTACK_GH_ORG?.trim();
    const createUrl = org ? `https://api.github.com/orgs/${org}/repos` : "https://api.github.com/user/repos";
    const create = await fetchImpl(createUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ name: repo, description: opts.goal.slice(0, 120), private: false, auto_init: true }),
    });
    if (!create.ok) return { error: `create-repo → HTTP ${create.status} — the GITHUB_TOKEN can't create repos; use a classic PAT with the 'repo' scope${org ? ` (and access to org '${org}')` : ""}` };
    const meta = (await create.json().catch(() => ({}))) as { full_name?: string; html_url?: string };
    const fullName = meta.full_name;
    if (!fullName) return { error: "create-repo returned no repo name" };

    // Inject the Actions secrets the workflow needs, per-repo (no org required). Values live as the engine's
    // env (the founder sets them once on Vercel; later, per-user BYOK values). Best-effort: if a key isn't
    // configured the Action will just surface the missing secret honestly.
    const llmKey = process.env.FULLSTACK_LLM_API_KEY;
    const vercelToken = process.env.FULLSTACK_VERCEL_TOKEN;
    if (llmKey) await setRepoSecret(fetchImpl, opts.token, fullName, "LLM_API_KEY", llmKey);
    if (vercelToken) await setRepoSecret(fetchImpl, opts.token, fullName, "VERCEL_TOKEN", vercelToken);

    const files: Record<string, string> = {
      ".github/workflows/build-fullstack.yml": buildFullstackWorkflowYaml(opts.model ?? FS_MODEL),
      "PROMPT.md": fullstackPromptFile(opts.goal),
    };
    for (const [path, content] of Object.entries(files)) {
      const put = await fetchImpl(`https://api.github.com/repos/${fullName}/contents/${encodeURIComponent(path)}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ message: `chore: add ${path}`, content: Buffer.from(content, "utf8").toString("base64") }),
      });
      if (!put.ok) return { error: `commit ${path} → HTTP ${put.status}${put.status === 403 ? " — the token needs the 'workflow' scope to write .github/workflows" : ""}` };
    }

    const disp = await fetchImpl(`https://api.github.com/repos/${fullName}/actions/workflows/build-fullstack.yml/dispatches`, {
      method: "POST",
      headers,
      body: JSON.stringify({ ref: "main" }),
    });
    if (!disp.ok) return { error: `workflow-dispatch → HTTP ${disp.status}` };

    // Slice 1 returns the repo (always resolves) as the honest "building" artifact. The live Vercel URL is
    // captured + verified in Slice 2 — we never return a guessed URL that might 404.
    return { url: meta.html_url ?? `https://github.com/${fullName}`, repo: fullName };
  } catch (e) {
    return { error: `network error: ${e instanceof Error ? e.message : "unknown"}` };
  }
}

export function fullstackConfigured(conn?: Connections): boolean {
  return FULLSTACK_BUILDS && !!(conn?.githubToken || process.env.GITHUB_TOKEN);
}

// A build-capable ExecuteFn using the free Actions + Aider + Vercel full-stack path, or null when the flag is
// off / no token (→ caller falls back to the static build).
export function fullstackBuildExecutor(conn?: Connections): ExecuteFn | null {
  if (!FULLSTACK_BUILDS) return null;
  const token = conn?.githubToken || process.env.GITHUB_TOKEN;
  if (!token) return null;
  return makeBuildExecute({
    build: async (goal) => {
      const r = await dispatchFullstackBuild({ goal, token });
      return "url" in r ? { url: r.url } : null; // error result → null so the caller falls back to static
    },
    verifyUrl: (u) => /^https:\/\/\S+$/.test(u),
  });
}
