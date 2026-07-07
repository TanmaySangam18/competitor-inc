# Plan — Full-stack builds (#1: close the "web-apps-only" caveat)

## Context (why)
Today the crew ships **static** apps only: `generateSiteFiles` → HTML/CSS/JS → GitHub Pages, and even the
free Aider path (`aider-build.ts`) prompts for "plain HTML/CSS/JS, no build step." A real product needs a
**backend** (API routes + a database). This plan adds a full-stack build path — **Next.js (API routes) +
Supabase, deployed to Vercel** — reusing the proven, unit-tested harness shape from `aider-build.ts`
(create repo → commit workflow + prompt → `workflow_dispatch` → return URL). $0: GitHub Actions (free on
public repos) runs Aider with a **free** model key; Vercel free tier hosts the running backend.

## What already exists (so this is "extend," not "from scratch")
- `lib/engine/aider-build.ts` — repo-create → Actions workflow → Aider dispatch, injectable-fetch **unit-tested**.
- `lib/engine/openhands.ts` — OpenHands executor (gated on an OpenHands API).
- `/api/engine` already wires the executor priority (OpenHands → Aider → static) for supervised goal-runs.
- `makeBuildExecute` seam + `verify-before-done`.

## The honest gates (why this is multi-slice, not one commit)
1. **Hosting a backend ≠ GitHub Pages.** Full-stack needs a server → **Vercel** deploy in the workflow.
2. **Live verification is founder-gated:** needs a GitHub token with **`workflow`** scope + two **repo
   secrets** — `LLM_API_KEY` (free model, e.g. Groq) and `VERCEL_TOKEN` — set by the founder (or, later, the
   user via BYOK). I can build + unit-test the harness; I cannot run GitHub Actions / Vercel from here.
3. **Free model reliability:** small full-stack apps only at first; the QA-gate + self-repair wrap it.

## Slices
- **Slice 1 (build now — testable, flag-gated):** `lib/engine/fullstack-build.ts` — full-stack Next.js prompt +
  a Vercel-deploy Actions workflow + `dispatchFullstackBuild` (create repo → commit `web/` scaffold trigger +
  workflow + PROMPT → dispatch) + `fullstackBuildExecutor`. Flag `FULLSTACK_BUILDS`. Unit tests mirror
  `aider-build.test.ts` (dispatch sequence + workflow/prompt content, injectable fetch). Fail-soft: no token /
  flag off → returns null → caller falls back to the static build. **No behavior change when the flag is off.**
- **Slice 2 (founder-gated — live verification):** founder sets the `workflow`-scoped token + `LLM_API_KEY` +
  `VERCEL_TOKEN`; we run one real build, watch the Action + Vercel deploy, and iterate the workflow until a
  real Next.js+API app is live. Capture the actual Vercel prod URL + wire `verifySiteLive` on it.
- **Slice 3 (scale):** per-user BYOK Vercel + Supabase tokens (so each user's app deploys to *their* account),
  building on the BYOK nudge already shipped. Select full-stack vs static from the build UI.

## Files
- `lib/engine/fullstack-build.ts` (new) · `lib/engine/fullstack-build.test.ts` (new)
- `/api/engine` route — add `fullstackBuildExecutor` to the priority behind `FULLSTACK_BUILDS`.
- `.env.example` — `FULLSTACK_BUILDS`, `FULLSTACK_BUILD_MODEL`, + a note on the repo secrets (`LLM_API_KEY`,
  `VERCEL_TOKEN`).

## Verification
- `npm run qa` green (unit tests cover the dispatch sequence + yaml/prompt; flag-off path unchanged).
- Live E2E is Slice 2 (founder-gated). Until then the path is inert (flag off) and fail-soft.
