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

// The coding model Aider runs inside the Action. Default = Claude Sonnet (founder decision 2026-07-09):
// one-shot full-app generation needs a real coding brain — the free llama shipped blank scaffolds. The key
// env var Aider reads (FS_KEY_ENV) is mapped to the LLM_API_KEY repo secret in the workflow, so the ONLY
// thing to provision is that one secret = an Anthropic key. Override both for DeepSeek/free/etc.
//   free fallback:  FULLSTACK_BUILD_MODEL=groq/llama-3.3-70b-versatile  FULLSTACK_BUILD_KEY_ENV=GROQ_API_KEY
//   if litellm rejects the model string: FULLSTACK_BUILD_MODEL=anthropic/claude-3-5-sonnet-20241022
const FS_MODEL = process.env.FULLSTACK_BUILD_MODEL || "anthropic/claude-sonnet-5";
const FS_KEY_ENV = process.env.FULLSTACK_BUILD_KEY_ENV || "ANTHROPIC_API_KEY";

function repoName(goal: string): string {
  const base = goal.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "app";
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}

// What Aider implements (committed as PROMPT.md). Full-stack: a Next.js page + a real API route + persistence.
export function fullstackPromptFile(goal: string): string {
  return [
    `Implement a small but REAL, working full-stack web app in this Next.js (App Router, TypeScript, Tailwind CSS) project for:`,
    ``,
    goal,
    ``,
    `Requirements:`,
    `- A polished UI in app/page.tsx (a client component) with the core create/list/delete flow.`,
    `- A REAL backend API route at app/api/items/route.ts (GET + POST) — no mock data.`,
    `- Persist data. If SUPABASE_URL + SUPABASE_ANON_KEY env vars exist use Supabase; otherwise use an`,
    `  in-memory store in the route so it runs with zero config. Keep it typed and simple.`,
    `- Clean, responsive, no console errors. It must build with \`next build\` and run on Vercel.`,
    `- CODE MUST COMPILE: correct TypeScript types (no \`any\`-that-breaks), no unused imports/vars, only`,
    `  stable Next.js 16 App Router APIs. Prefer simple, standard patterns over clever ones.`,
    ``,
    `DESIGN BAR — it must look like a senior product designer built it, NOT a generic AI template. Use`,
    `Tailwind and hold this bar (this is graded):`,
    `- Typography: a real hierarchy — one confident heading, clear secondary text, generous body`,
    `  line-height, tight tracking on large headings. Two weights only (normal + semibold).`,
    `- Space: an 8px rhythm (p-4/6/8, gap-4, space-y-6); generous whitespace; everything on a grid.`,
    `- Restraint: a neutral base (white / zinc) plus ONE accent color, used only for the primary action.`,
    `  No rainbow of colors, no heavy borders everywhere.`,
    `- Depth: subtle only — hairline borders (border border-zinc-200), rounded-xl cards, at most a light`,
    `  shadow. No decorative gradients, no neon, no emoji used as UI.`,
    `- Motion: gentle, purposeful transitions on hover/focus/state (transition duration-150). Never gratuitous.`,
    `- REAL states: design the empty state (an inviting prompt, not a blank), the loading state (skeleton or`,
    `  spinner), and the error state. They are part of the product, not afterthoughts.`,
    `- Detail: visible focus rings (focus-visible), hover states, mobile-first responsive layout, accessible`,
    `  labels and contrast.`,
    `- Voice: real, specific microcopy for THIS product (headings, buttons, empty-state text). Never lorem`,
    `  ipsum, never "get started by editing".`,
    `Aim for the calm, content-first polish of Linear / Stripe / Apple — clarity and restraint over decoration.`,
  ].join("\n");
}

// The Actions workflow: scaffold Next → Aider implements → deploy to Vercel (production). Best-effort;
// Slice 2 iterates it against real runs. The repo's default GITHUB_TOKEN pushes; the only secrets are the
// free model key (LLM_API_KEY) and VERCEL_TOKEN.
export function buildFullstackWorkflowYaml(model = FS_MODEL, keyEnv = FS_KEY_ENV): string {
  return `name: build-fullstack
on:
  push:
    branches: ["main"]
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
        run: npx --yes create-next-app@latest "\${{ github.event.repository.name }}" --ts --app --no-eslint --use-npm --tailwind --no-src-dir --import-alias "@/*" --yes
      - name: Relax the build to transpile-only (agent code must RUN, not pass strict lint/types)
        working-directory: \${{ github.event.repository.name }}
        run: |
          printf 'const nextConfig = { eslint: { ignoreDuringBuilds: true }, typescript: { ignoreBuildErrors: true } };\\nexport default nextConfig;\\n' > next.config.ts
      - name: Install Aider
        run: python -m pip install --upgrade pip && pip install aider-chat
      - name: Implement + self-repair until it builds (free model)
        working-directory: \${{ github.event.repository.name }}
        env:
          ${keyEnv}: \${{ secrets.LLM_API_KEY }}
        run: |
          set +e
          # Claude Sonnet 5 REJECTS the 'temperature' param litellm sends by default → without this, EVERY
          # Aider edit fails with a 400 (invalid_request_error) and nothing is implemented. A model-settings
          # file with use_temperature:false tells Aider to omit it.
          SETTINGS="$GITHUB_WORKSPACE/aider.settings.yml"
          printf '%s\\n' "- name: ${model}" "  use_temperature: false" "  edit_format: whole" > "$SETTINGS"
          # SCAFFOLD = the app is still the untouched Next.js starter (the agent didn't implement the feature).
          SCAFFOLD() { grep -qiE "edit the page\.tsx|To get started, edit|Get started by editing" app/page.tsx; }
          aider --yes --model ${model} --model-settings-file "$SETTINGS" --message-file ../PROMPT.md app/page.tsx app/api/items/route.ts 2>&1 | tee -a ../aider.log
          for i in 1 2 3 4; do
            if npm run build > ../build.log 2>&1; then
              # A clean build is NOT enough — the default starter also builds. Require the REAL feature.
              if ! SCAFFOLD; then echo "build passed + real feature implemented (attempt $i)"; exit 0; fi
              echo "builds, but app/page.tsx is STILL the default scaffold — forcing a real implementation (attempt $i)"
              aider --yes --model ${model} --model-settings-file "$SETTINGS" --message "You left the DEFAULT Next.js starter in app/page.tsx. Replace it ENTIRELY with the real, working UI for the product described in PROMPT.md, and implement a real GET+POST handler in app/api/items/route.ts. No starter boilerplate, no 'get started by editing' text." app/page.tsx app/api/items/route.ts 2>&1 | tee -a ../aider.log
              continue
            fi
            echo "build failed (attempt $i) — feeding the error back to the agent to self-repair"
            ERR=$(tail -60 ../build.log)
            aider --yes --model ${model} --model-settings-file "$SETTINGS" --message "The Next.js production build failed. Fix ALL build, type, and lint errors so 'npm run build' passes cleanly. Do not remove features. Build output:
          $ERR" app/page.tsx app/api/items/route.ts 2>&1 | tee -a ../aider.log
          done
          # Honest final gate: NEVER ship the blank starter as "the product". If it still builds only as the
          # scaffold (or won't build), FAIL — deploy-url stays empty, and the product stays honestly "building".
          if npm run build > ../build.log 2>&1 && ! SCAFFOLD; then echo "final gate: real feature present"; exit 0; fi
          echo "agent could not produce a REAL feature (still scaffold / not building) — failing honestly, no blank deploy"; exit 1
      - name: Deploy to Vercel + make it public
        working-directory: \${{ github.event.repository.name }}
        env:
          VT: \${{ secrets.VERCEL_TOKEN }}
          PROJECT: \${{ github.event.repository.name }}
        run: |
          npm i -g vercel
          URL=$(vercel deploy --prod --yes --token "$VT" 2>&1 | grep -oE "https://[a-z0-9.-]+\.vercel\.app" | tail -1)
          echo "deployed: $URL"
          echo "$URL" > ../deploy-url.txt
          # Disable Vercel Deployment Protection so the app is publicly viewable (no SSO wall) — automatically.
          TEAM=$(curl -s -H "Authorization: Bearer $VT" "https://api.vercel.com/v2/teams" | python3 -c "import sys,json;t=(json.load(sys.stdin).get('teams') or []);print(t[0]['id'] if t else '')" 2>/dev/null || echo "")
          Q=""; [ -n "$TEAM" ] && Q="?teamId=$TEAM"
          curl -s -X PATCH "https://api.vercel.com/v9/projects/$PROJECT$Q" -H "Authorization: Bearer $VT" -H "Content-Type: application/json" -d '{"ssoProtection":null}' > /dev/null 2>&1 || true
      - name: Functional smoke — the app must RESPOND at runtime, not just build (Phase 5)
        working-directory: \${{ github.event.repository.name }}
        env:
          ${keyEnv}: \${{ secrets.LLM_API_KEY }}
          VT: \${{ secrets.VERCEL_TOKEN }}
        run: |
          URL=$(cat ../deploy-url.txt 2>/dev/null)
          if [ -z "$URL" ]; then echo "no deploy url — skipping smoke"; exit 0; fi
          # Same Aider temperature fix as the implement step (Claude Sonnet 5 rejects the 'temperature' param).
          SETTINGS="$GITHUB_WORKSPACE/aider.settings.yml"
          printf '%s\\n' "- name: ${model}" "  use_temperature: false" "  edit_format: whole" > "$SETTINGS"
          # A REAL serve = HTTP 200 AND a body AND NOT the Next.js starter page. Sets SMOKE_CODE. $1 = url.
          SERVES_REAL() {
            SMOKE_CODE=$(curl -s -o /tmp/smoke.html -w "%{http_code}" "$1" 2>/dev/null || echo "000")
            [ "$SMOKE_CODE" = "200" ] && grep -qi "<body" /tmp/smoke.html && ! grep -qiE "get started by editing|to get started, edit|edit the page\.tsx" /tmp/smoke.html
          }
          sleep 25
          if SERVES_REAL "$URL"; then
            echo "runtime smoke OK: $URL -> HTTP $SMOKE_CODE (real page, not the starter)"
          else
            echo "the deployed app does NOT serve a real page (HTTP $SMOKE_CODE / empty / still the starter) — one functional repair pass"
            ERR=$(head -c 800 /tmp/smoke.html)
            aider --yes --model ${model} --model-settings-file "$SETTINGS" --message "The DEPLOYED app at runtime returned HTTP $SMOKE_CODE, empty HTML, or is STILL the default Next.js starter. Implement the REAL homepage for the product in PROMPT.md plus a working GET+POST /api/items — no starter boilerplate, no 'get started by editing' text. Response start: $ERR" app/page.tsx app/api/items/route.ts 2>&1 | tee -a ../aider.log
            npm run build || true
            URL2=$(vercel deploy --prod --yes --token "$VT" 2>&1 | grep -oE "https://[a-z0-9.-]+\.vercel\.app" | tail -1)
            [ -n "$URL2" ] && echo "$URL2" > ../deploy-url.txt
            sleep 20
            SERVES_REAL "$(cat ../deploy-url.txt)" && echo "post-repair smoke OK (HTTP $SMOKE_CODE)" || echo "post-repair runtime smoke still failing (HTTP $SMOKE_CODE)"
          fi
          # Only publish a deploy-url the app actually SERVES as a REAL page — else blank it so we never surface a
          # dead OR blank-scaffold link (the honesty floor: no proof we can't stand behind).
          echo "$SMOKE_CODE" > ../smoke-code.txt
          SERVES_REAL "$(cat ../deploy-url.txt 2>/dev/null)" || { echo "runtime not a real page — withholding the URL (honest: no dead/blank link)"; : > ../deploy-url.txt; }
      - name: Commit source + deploy URL
        if: always()
        run: |
          git config user.name "competitor-bot"
          git config user.email "actions@users.noreply.github.com"
          git add -A
          git commit -m "build: full-stack app from prompt [skip ci]" || echo "nothing to commit"
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
    // The build-model key: prefer FULLSTACK_ANTHROPIC_KEY (the founder can create it fresh, since the legacy
    // FULLSTACK_LLM_API_KEY already holds the old Groq key). Injected as the repo's LLM_API_KEY secret, which
    // the workflow hands to Aider under FS_KEY_ENV (ANTHROPIC_API_KEY by default).
    const llmKey = process.env.FULLSTACK_ANTHROPIC_KEY || process.env.FULLSTACK_LLM_API_KEY;
    const vercelToken = process.env.FULLSTACK_VERCEL_TOKEN;
    if (llmKey) await setRepoSecret(fetchImpl, opts.token, fullName, "LLM_API_KEY", llmKey);
    if (vercelToken) await setRepoSecret(fetchImpl, opts.token, fullName, "VERCEL_TOKEN", vercelToken);

    // Commit the workflow FIRST, then PROMPT.md. The workflow runs `on: push`, so the SECOND commit
    // (PROMPT.md) fires the build — avoiding the workflow_dispatch-by-filename 404 (a brand-new workflow
    // isn't dispatchable for a few seconds). A short settle delay lets GitHub register the workflow before the
    // triggering push (real path only; tests inject a fetch and skip it).
    const commitFile = (path: string, content: string) =>
      fetchImpl(`https://api.github.com/repos/${fullName}/contents/${encodeURIComponent(path)}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ message: `chore: add ${path}`, content: Buffer.from(content, "utf8").toString("base64") }),
      });
    const wf = await commitFile(".github/workflows/build-fullstack.yml", buildFullstackWorkflowYaml(opts.model ?? FS_MODEL));
    if (!wf.ok) return { error: `commit workflow → HTTP ${wf.status}${wf.status === 403 ? " — the token needs the 'workflow' scope" : ""}` };
    if (!opts.fetchImpl) await new Promise((r) => setTimeout(r, 3000));
    const pr = await commitFile("PROMPT.md", fullstackPromptFile(opts.goal));
    if (!pr.ok) return { error: `commit PROMPT.md → HTTP ${pr.status}` };

    // The PROMPT.md push triggered the `on: push` build. Return the repo (always resolves) as the honest
    // "building" artifact; the live Vercel URL is captured + verified in Slice 2.
    return { url: meta.html_url ?? `https://github.com/${fullName}`, repo: fullName };
  } catch (e) {
    return { error: `network error: ${e instanceof Error ? e.message : "unknown"}` };
  }
}

// Slice 2 (Phase 1): capture the LIVE Vercel URL the workflow deployed. The workflow writes it to
// `deploy-url.txt` in the repo and commits it at the end of the run (see buildFullstackWorkflowYaml).
// This reads that file via the contents API and returns the URL only if it's a real, well-formed Vercel
// URL — else null (build still running, failed, or file absent). The CALLER then HEAD-verifies it
// resolves before ever showing it as "live" (verify-before-done; never surface a guessed/404 URL).
// One-shot + injectable fetch → unit-testable with zero network; a build-status route polls it over time.
export async function fetchDeployedUrl(opts: { repo: string; token: string; fetchImpl?: FetchLike }): Promise<string | null> {
  const fetchImpl = opts.fetchImpl ?? (globalThis.fetch as unknown as FetchLike);
  try {
    const res = await fetchImpl(`https://api.github.com/repos/${opts.repo}/contents/deploy-url.txt`, {
      headers: { authorization: `Bearer ${opts.token}`, accept: "application/vnd.github+json" },
    });
    if (!res.ok) return null; // 404 = not committed yet (build in flight) or the run failed before deploy
    const j = (await res.json().catch(() => null)) as { content?: string } | null;
    if (!j?.content) return null;
    const url = Buffer.from(j.content, "base64").toString("utf8").trim();
    return /^https:\/\/[a-z0-9-]+(?:-[a-z0-9]+)*\.vercel\.app\/?$/.test(url) ? url : null;
  } catch {
    return null;
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
