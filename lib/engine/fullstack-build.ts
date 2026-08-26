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
import { architectKnowledge } from "./architect-knowledge";
import { setRepoSecret } from "./github-secrets";
import type { ExecuteFn } from "./supervisor";
import type { Connections } from "@/lib/core/types";
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
export function fullstackPromptFile(goal: string, opts: { recall?: string; suiteRecall?: string; wall?: string } = {}): string {
  const recall = opts.recall?.trim();
  const suiteRecall = opts.suiteRecall?.trim();
  const wall = opts.wall?.trim();
  return [
    // S4: when the customer already runs a suite, the agent is told to REUSE the shared substrate (one
    // sign-on, shared data, conventions) FIRST of all — so a new product joins the suite, not stands alone.
    ...(suiteRecall ? [suiteRecall, ""] : []),
    // P1: when this product has memory, the agent is told it is CONTINUING it (architecture + prior ADRs)
    // BEFORE anything else — so it extends the product instead of rebuilding it. Empty on a first build.
    ...(recall ? [recall, ""] : []),
    // P3: on a CHANGE, the regression wall rides with the recall — the guarantees already on record that
    // this change must not break (derived from the same memory, so it can never drift out of sync).
    ...(wall ? [wall, ""] : []),
    architectKnowledge(), // P0: every build starts on the public frontier — grounding, isolation, verify, adopt.
    ``,
    `Implement a small but REAL, working full-stack web app in this Next.js (App Router, TypeScript, Tailwind CSS) project for:`,
    ``,
    goal,
    ``,
    `Requirements:`,
    `- A polished UI in app/page.tsx (a client component) with the core create/list/delete flow.`,
    `- A REAL backend API route at app/api/items/route.ts (GET + POST) — no mock data.`,
    // WHY NO SUPABASE BRANCH: this used to say "if SUPABASE_URL exists use Supabase, otherwise use an
    // in-memory store". The agent wrote the Supabase import unconditionally and @supabase/supabase-js is
    // not in the scaffold's package.json, so `next build` failed with "Module not found" AFTER Aider had
    // done all its work. A conditional the agent cannot verify is a conditional it will get wrong.
    `- Persist data in a simple typed in-memory store inside the API route, so it runs with zero config.`,
    ``,
    `DEPENDENCIES, AND THIS IS THE HARDEST RULE HERE:`,
    `- DO NOT add, import, or require ANY package that is not already in package.json. Not one.`,
    `- If you catch yourself typing an import for a package you have not seen in package.json, write the`,
    `  code without it instead. Node's standard library and what is already installed are enough.`,
    `- An import of a package that is not installed does not fail when you write it. It fails at`,
    `  \`next build\`, after all your work is done, and the whole build is thrown away. This single`,
    `  mistake is the most common way these builds die.`,
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
    ...(impliesSaaS(goal) ? ["", saasBrief()] : []),
    ...(impliesPlatform(goal) ? ["", platformBrief()] : []),
    ...(impliesAiFeature(goal) ? ["", aiFeatureBrief()] : []),
  ].join("\n");
}

// S5 (Platform-class rung). Detect when the product is meant for OTHERS to build on — a public/versioned
// API, developer integrations, webhooks, an SDK. Conservative: a false positive only adds an API surface.
export function impliesPlatform(goal: string): boolean {
  return /\b(public api|rest api|api[- ]?first|developer|integrat|webhook|third[- ]?part|build on (it|top)|platform|sdk|api key|api access|open ?api)\b/i.test(goal);
}

// The additive brief for a PLATFORM-CLASS product — the S5 shape: a stable, versioned, documented API a
// THIRD PARTY can integrate against (the customer's own "Graph"). The contract is what makes it trustworthy
// to build on: versioning that doesn't break, keys distinct from user login, machine-readable docs.
export function platformBrief(): string {
  return [
    `PLATFORM API (this product is meant for OTHERS to build on — a public, versioned API):`,
    `- Expose a VERSIONED public REST API under app/api/v1/ with STABLE, documented contracts. v1 must never`,
    `  break — additive changes only; a breaking change is a new version, never a mutation of v1.`,
    `- THIRD-PARTY AUTH via API KEYS, distinct from user login (app/api/keys/route.ts to mint/list/revoke a`,
    `  key). A machine caller authenticates with its key (Authorization: Bearer), NEVER a user session cookie.`,
    `  Keys are scoped to their owner's data and revocable; store only a HASH of each key, never the plaintext.`,
    `- MACHINE-READABLE DOCS: serve an OpenAPI 3 spec at a stable path (app/openapi.json or app/api/openapi)`,
    `  describing every v1 endpoint, so an integrator can discover the API without reading source.`,
    `- Rate-limit per key; return clear, typed JSON errors (never a bare 500); fail closed (401/403) on a`,
    `  missing or revoked key. Every read stays scoped to the key's owner — one tenant's key can never reach`,
    `  another tenant's data.`,
  ].join("\n");
}

// S3 (Real SaaS rung). Detect when the product wants accounts / auth / a multi-page product — the shape
// S3 is about (built across sessions, iterated by the Change Desk). Conservative: a false positive only
// adds auth + a couple of pages to the brief.
export function impliesSaaS(goal: string): boolean {
  return /\b(saas|sign[- ]?up|sign[- ]?in|log[- ]?in|login|accounts?|authentication|user accounts?|dashboard|admin panel|roles?|permissions?|multi[- ]?user|members? area|portal|subscriptions?|multi[- ]?page|multi[- ]?tenant)\b/i.test(goal);
}

// The additive brief for a REAL SaaS: auth + a protected multi-page product + per-user data isolation.
// The isolation contract is the SAME one the proving grounds enforce — one account can never read
// another's rows — because that is what makes a real product trustworthy, and it is graded.
export function saasBrief(): string {
  return [
    `REAL SAAS (this product asked for accounts / auth / a multi-page product):`,
    `- AUTH: sign up + log in. Use Supabase Auth when SUPABASE_URL + SUPABASE_ANON_KEY exist (email+password`,
    `  is fine); otherwise a minimal signed session cookie so it still runs zero-config. NEVER store plaintext`,
    `  passwords and NEVER roll custom crypto — use the platform/library primitives.`,
    `- MULTIPLE REAL ROUTES: a public landing (app/page.tsx), a DEDICATED sign-up page (app/signup/page.tsx —`,
    `  a stranger must be able to create an account there; link it from the landing and from login), a log-in`,
    `  page (app/login/page.tsx), and a PROTECTED area (app/dashboard/page.tsx) that redirects to login when`,
    `  signed out.`,
    `- PER-USER DATA (graded isolation): every row carries an owner; every query filters to the CURRENT user`,
    `  so one account can never read another's rows (Supabase RLS on auth.uid when configured; an explicit`,
    `  owner check otherwise).`,
    `- The API (app/api/items/route.ts) REQUIRES an authenticated user and scopes reads/writes to them; it`,
    `  fails closed (401) for anyone signed out.`,
    `- Keep it coherent + typed; it must \`next build\` and run on Vercel. Hold the same design bar on every page.`,
  ].join("\n");
}

// R10 (S2 rung — "a copilot for MY business," honestly scoped). Detect when the requested product wants an
// assistant/chat/"answer questions about my data" capability. Conservative on purpose: a false positive
// bloats the brief with a chat feature nobody asked for, so match only clear intent.
export function impliesAiFeature(goal: string): boolean {
  return /\b(co-?pilot|assistant|chat\s?bot|chat\b|ask (it|questions?)|answer(s|ing)? (questions?|about)|q ?& ?a|knowledge base|natural language|summar(y|ise|ize)|search (my|through) )/i.test(goal);
}

// The additive brief for a GROUNDED AI feature. It builds the SAME contract the Synthetic Proving Ground
// enforces (lib/sim/proving-ground.ts): retrieve over the app's OWN data, cite the records, abstain when
// nothing matches — never hallucinate. No cross-user leakage. This is the honest S2 capability: a mini
// copilot grounded on the customer's data, not a general chatbot pretending to know things.
export function aiFeatureBrief(): string {
  return [
    `AI FEATURE (this product asked for an assistant / chat / "answer questions about my data"):`,
    `- Add a REAL grounded chat endpoint at app/api/chat/route.ts (POST { question: string }).`,
    `- It MUST answer ONLY from the data this app itself stores (the items in /api/items) — RETRIEVE the`,
    `  relevant records first, then answer from them, and INCLUDE the specific records/ids you used as`,
    `  citations in the response. This is retrieval-grounded, not the model's open-world memory.`,
    `- If no stored record is relevant to the question, return a clear "I don't have a record about that"`,
    `  answer with an empty citations array. NEVER fabricate an answer — a confident wrong answer is failure.`,
    `- Scope every retrieval to the current user/workspace; a question must never surface another user's data.`,
    `- If an LLM key (e.g. ANTHROPIC_API_KEY / OPENAI_API_KEY) is present in env, use it to phrase the answer`,
    `  FROM the retrieved records only; if absent, return a deterministic extractive answer built from the`,
    `  matched records (still grounded + cited). Either way the answer is backed by real stored data.`,
    `- Add a small chat panel in app/page.tsx: a question input, the grounded answer, and its citations shown`,
    `  as links/chips to the underlying records. Design it to the same bar as the rest of the UI.`,
  ].join("\n");
}

// The Actions workflow: scaffold Next → Aider implements → deploy to Vercel (production). Best-effort;
// Slice 2 iterates it against real runs. The repo's default GITHUB_TOKEN pushes; the only secrets are the
// free model key (LLM_API_KEY) and VERCEL_TOKEN.
export function buildFullstackWorkflowYaml(model = FS_MODEL, keyEnv = FS_KEY_ENV, opts: { withChat?: boolean; withSaas?: boolean; withPlatform?: boolean } = {}): string {
  // The files Aider is allowed to edit. The base (page + items) is byte-identical to before; a grounded AI
  // feature (R10) adds the chat route; a real SaaS (S3) adds the auth route + the login/dashboard pages.
  const fileSet = ["app/page.tsx", "app/api/items/route.ts"];
  if (opts.withSaas) fileSet.push("app/signup/page.tsx", "app/login/page.tsx", "app/dashboard/page.tsx", "app/api/auth/route.ts");
  if (opts.withPlatform) fileSet.push("app/api/v1/items/route.ts", "app/api/keys/route.ts", "app/openapi.json");
  if (opts.withChat) fileSet.push("app/api/chat/route.ts");
  const files = fileSet.join(" ");
  // P2 (seed): a structural review that verifies a GROUNDED build actually implements the cite-or-abstain +
  // isolation contract — not just that the brief asked for it. Only on AI-feature builds (so it doesn't tax
  // every build), same snapshot-revert-on-break discipline as the Design-Lead gate (never ship broken).
  const architectReview = opts.withChat
    ? `
      - name: Architect review — grounding correctness (P2; only when the product has an AI feature)
        working-directory: \${{ github.event.repository.name }}
        env:
          ${keyEnv}: \${{ secrets.LLM_API_KEY }}
        run: |
          set +e
          SETTINGS="$GITHUB_WORKSPACE/aider.settings.yml"
          printf '%s\\n' "- name: ${model}" "  use_temperature: false" "  edit_format: whole" > "$SETTINGS"
          git config user.name "competitor-bot" && git config user.email "actions@users.noreply.github.com"
          git add -A && git commit -m "wip: pre-architect-review snapshot [skip ci]" > /dev/null 2>&1 || true
          SNAPA=$(git rev-parse HEAD)
          aider --yes --model ${model} --model-settings-file "$SETTINGS" --message "You are the ARCHITECT reviewing app/api/chat/route.ts before it ships. This is a GROUNDED assistant — grade it hard against this contract and EDIT the code to satisfy every point (or leave it if it already does): (1) it RETRIEVES from the app's own stored data (the items in /api/items) and answers ONLY from what it retrieved; (2) it returns the specific records/ids it used as CITATIONS; (3) when nothing relevant is found it returns a clear 'no matching record' answer with an EMPTY citations array — it must NEVER fabricate an answer; (4) every read is scoped to the current user/workspace so one user can never see another's data; (5) inputs are validated and it fails closed (4xx) on bad input, never a 500. Keep the response JSON shape stable and all functionality working." app/api/chat/route.ts app/api/items/route.ts 2>&1 | tee -a ../aider.log
          if npm run build > ../build.log 2>&1; then
            echo "architect review: build still green — shipping the reviewed logic"
          else
            echo "architect review broke the build — reverting to the pre-review snapshot (never ship broken)"
            git reset --hard "$SNAPA" > /dev/null 2>&1
            git clean -fd app > /dev/null 2>&1
            npm run build > ../build.log 2>&1 || { echo "revert failed to build — impossible state, failing honestly"; exit 1; }
          fi`
    : "";
  // S3's live floor (the regression wall's runtime half, only on SaaS builds): the deployed app must let a
  // stranger reach signup + login, and the data API must FAIL CLOSED signed out. A deploy that misses the
  // floor is not surfaced as a URL — same honesty rule as the scaffold gate (no half-SaaS links).
  const saasSmoke = opts.withSaas
    ? `
          FINAL_URL=$(cat ../deploy-url.txt 2>/dev/null)
          if [ -n "$FINAL_URL" ]; then
            SU=$(curl -s -o /dev/null -w "%{http_code}" "$FINAL_URL/signup" 2>/dev/null || echo "000")
            LI=$(curl -s -o /dev/null -w "%{http_code}" "$FINAL_URL/login" 2>/dev/null || echo "000")
            IT=$(curl -s -o /dev/null -w "%{http_code}" "$FINAL_URL/api/items" 2>/dev/null || echo "000")
            echo "saas floor smoke: /signup=$SU /login=$LI /api/items(signed-out)=$IT"
            SAAS_OK=1
            [ "$SU" = "200" ] || { echo "SAAS FLOOR FAIL: /signup must serve — a stranger signs up there"; SAAS_OK=0; }
            [ "$LI" = "200" ] || { echo "SAAS FLOOR FAIL: /login must serve"; SAAS_OK=0; }
            case "$IT" in 401|403|302|307) : ;; *) echo "SAAS FLOOR FAIL: /api/items must fail closed signed-out (got $IT)"; SAAS_OK=0 ;; esac
            [ "$SAAS_OK" = "1" ] && echo "saas floor holds" || { echo "SaaS floor NOT met — withholding the URL (honest: no half-SaaS link)"; : > ../deploy-url.txt; }
          fi`
    : "";
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
          aider --yes --model ${model} --model-settings-file "$SETTINGS" --message-file ../PROMPT.md ${files} 2>&1 | tee -a ../aider.log
          for i in 1 2 3 4; do
            if npm run build > ../build.log 2>&1; then
              # A clean build is NOT enough — the default starter also builds. Require the REAL feature.
              if ! SCAFFOLD; then echo "build passed + real feature implemented (attempt $i)"; exit 0; fi
              echo "builds, but app/page.tsx is STILL the default scaffold — forcing a real implementation (attempt $i)"
              aider --yes --model ${model} --model-settings-file "$SETTINGS" --message "You left the DEFAULT Next.js starter in app/page.tsx. Replace it ENTIRELY with the real, working UI for the product described in PROMPT.md, and implement a real GET+POST handler in app/api/items/route.ts. No starter boilerplate, no 'get started by editing' text." ${files} 2>&1 | tee -a ../aider.log
              continue
            fi
            echo "build failed (attempt $i) — feeding the error back to the agent to self-repair"
            ERR=$(tail -60 ../build.log)
            aider --yes --model ${model} --model-settings-file "$SETTINGS" --message "The Next.js production build failed. Fix ALL build, type, and lint errors so 'npm run build' passes cleanly. Do not remove features. Build output:
          $ERR" ${files} 2>&1 | tee -a ../aider.log
          done
          # Honest final gate: NEVER ship the blank starter as "the product". If it still builds only as the
          # scaffold (or won't build), FAIL — deploy-url stays empty, and the product stays honestly "building".
          if npm run build > ../build.log 2>&1 && ! SCAFFOLD; then echo "final gate: real feature present"; exit 0; fi
          echo "agent could not produce a REAL feature (still scaffold / not building) — failing honestly, no blank deploy"; exit 1
      - name: Design-Lead review — the craft gate (Phase 7; grade the UI, close every gap)
        working-directory: \${{ github.event.repository.name }}
        env:
          ${keyEnv}: \${{ secrets.LLM_API_KEY }}
        run: |
          set +e
          SETTINGS="$GITHUB_WORKSPACE/aider.settings.yml"
          printf '%s\\n' "- name: ${model}" "  use_temperature: false" "  edit_format: whole" > "$SETTINGS"
          # Snapshot the KNOWN-GOOD state first — the review pass can improve the app but NEVER break it.
          # Aider auto-commits its edits, so pin the snapshot SHA and hard-reset to IT on failure (a bare
          # reset to HEAD would keep the broken review commit).
          git config user.name "competitor-bot" && git config user.email "actions@users.noreply.github.com"
          git add -A && git commit -m "wip: pre-design-review snapshot [skip ci]" > /dev/null 2>&1 || true
          SNAP=$(git rev-parse HEAD)
          aider --yes --model ${model} --model-settings-file "$SETTINGS" --message "You are the DESIGN LEAD doing the final review of app/page.tsx before it ships to a paying customer. Grade it hard against this rubric, then EDIT the code to close every gap (or leave it untouched if it already meets the bar): (1) real type hierarchy — one confident heading, muted secondary text, tight tracking on large type, two weights max; (2) 8px spacing rhythm and generous whitespace; (3) restraint — neutral base + exactly ONE accent color on the primary action; (4) subtle depth — hairline borders, rounded-xl, no gradients/neon/emoji-as-UI; (5) purposeful hover/focus/transition states; (6) REAL empty, loading, and error states with product-specific copy; (7) visible focus-visible rings + mobile-first responsive; (8) specific microcopy for THIS product, no placeholder text. Keep all functionality working — do not remove or rename the API calls." app/page.tsx app/globals.css 2>&1 | tee -a ../aider.log
          if npm run build > ../build.log 2>&1; then
            echo "design review pass: build still green — shipping the reviewed UI"
          else
            echo "design review broke the build — reverting to the pre-review snapshot (never ship broken)"
            git reset --hard "$SNAP" > /dev/null 2>&1
            git clean -fd app > /dev/null 2>&1
            npm run build > ../build.log 2>&1 || { echo "revert failed to build — impossible state, failing honestly"; exit 1; }
          fi${architectReview}
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
            aider --yes --model ${model} --model-settings-file "$SETTINGS" --message "The DEPLOYED app at runtime returned HTTP $SMOKE_CODE, empty HTML, or is STILL the default Next.js starter. Implement the REAL homepage for the product in PROMPT.md plus a working GET+POST /api/items — no starter boilerplate, no 'get started by editing' text. Response start: $ERR" ${files} 2>&1 | tee -a ../aider.log
            npm run build || true
            URL2=$(vercel deploy --prod --yes --token "$VT" 2>&1 | grep -oE "https://[a-z0-9.-]+\.vercel\.app" | tail -1)
            [ -n "$URL2" ] && echo "$URL2" > ../deploy-url.txt
            sleep 20
            SERVES_REAL "$(cat ../deploy-url.txt)" && echo "post-repair smoke OK (HTTP $SMOKE_CODE)" || echo "post-repair runtime smoke still failing (HTTP $SMOKE_CODE)"
          fi
          # Only publish a deploy-url the app actually SERVES as a REAL page — else blank it so we never surface a
          # dead OR blank-scaffold link (the honesty floor: no proof we can't stand behind).
          echo "$SMOKE_CODE" > ../smoke-code.txt
          SERVES_REAL "$(cat ../deploy-url.txt 2>/dev/null)" || { echo "runtime not a real page — withholding the URL (honest: no dead/blank link)"; : > ../deploy-url.txt; }${saasSmoke}
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
  recall?: string; // P1: product-memory recall brief (present on a CHANGE to an existing product)
  suiteRecall?: string; // S4: suite recall (present when the owner already runs other products — reuse the substrate)
  wall?: string; // P3: the regression wall brief (present on a CHANGE — prior guarantees the change must keep)
}): Promise<{ url: string; repo: string } | { error: string }> {
  const fetchImpl = opts.fetchImpl ?? (globalThis.fetch as unknown as FetchLike);
  const headers = {
    authorization: `Bearer ${opts.token}`,
    accept: "application/vnd.github+json",
    "content-type": "application/json",
  };
  try {
    // A build with no model key yields nothing but an orphan repo + a cryptic auth failure deep in the
    // Action log (litellm "x-api-key header is required"). Fail fast + honestly BEFORE creating anything.
    // NOTE (learned the hard way): Vercel "Sensitive" env vars resolve only at runtime on the server —
    // `vercel env pull` returns them EMPTY — so this build must be triggered server-side, not via pulled creds.
    const llmKey = (process.env.FULLSTACK_ANTHROPIC_KEY || process.env.FULLSTACK_LLM_API_KEY || "").trim();
    if (!llmKey) {
      return { error: "no build model key — set a non-empty FULLSTACK_ANTHROPIC_KEY in the environment that RUNS the build. (Vercel 'Sensitive' vars don't survive `env pull`; trigger the build server-side.)" };
    }
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
    const vercelToken = process.env.FULLSTACK_VERCEL_TOKEN;
    await setRepoSecret(fetchImpl, opts.token, fullName, "LLM_API_KEY", llmKey); // guaranteed non-empty (gated above)
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
    const wf = await commitFile(
      ".github/workflows/build-fullstack.yml",
      buildFullstackWorkflowYaml(opts.model ?? FS_MODEL, FS_KEY_ENV, { withChat: impliesAiFeature(opts.goal), withSaas: impliesSaaS(opts.goal), withPlatform: impliesPlatform(opts.goal) }),
    );
    if (!wf.ok) return { error: `commit workflow → HTTP ${wf.status}${wf.status === 403 ? " — the token needs the 'workflow' scope" : ""}` };
    if (!opts.fetchImpl) await new Promise((r) => setTimeout(r, 3000));
    const pr = await commitFile("PROMPT.md", fullstackPromptFile(opts.goal, { recall: opts.recall, suiteRecall: opts.suiteRecall, wall: opts.wall }));
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
