# Free full-app builds ($0) — GitHub Actions + Aider + a free model

_Real multi-file app builds for **$0**, by borrowing GitHub's own free compute instead of paying for
OpenHands Cloud + a host + tokens. Playbooks: zero-budget-compute · borrow-not-build. Wired 2026-07-05
into the existing `makeBuildExecute` seam (`lib/engine/aider-build.ts`), behind the `FREE_BUILDS` flag._

## How it works
1. The engine (`/api/engine` goal-run with build-for-real) creates a GitHub repo using the founder's token.
2. It commits an **Aider build workflow** (`.github/workflows/build-app.yml`) + the goal (`PROMPT.md`) + a placeholder.
3. It enables GitHub Pages and triggers the workflow via `workflow_dispatch`.
4. The **GitHub Action** installs Aider (MIT), runs it headless against a **free model API**, writes
   `index.html`/`app.js`/`styles.css`, and pushes to `main` — GitHub Pages serves the live app.
5. The engine returns the canonical Pages URL (resolves when the run finishes, ~2–4 min).

**Why $0:** GitHub Actions is free + unlimited on public repos (2,000 min/mo on a private Free-plan repo);
Aider is MIT; the model runs on a free API tier. No paid sandbox, no host, no paid tokens.

## One-time setup (founder — ~3 minutes)
1. **Get a FREE model key** (pick one):
   - Groq — [console.groq.com](https://console.groq.com) (default; 1,000 req/day, fast)
   - Cerebras — [cloud.cerebras.ai](https://cloud.cerebras.ai) (1M tokens/day)
   - OpenRouter — [openrouter.ai](https://openrouter.ai) (`qwen/qwen3-coder:free`, 1M context, 200/day)
2. **Add it as a repo secret named `LLM_API_KEY`** on the repo(s) builds run in (or org-level secret so
   every new build repo inherits it). GitHub → repo/org → Settings → Secrets and variables → Actions.
3. **Token scope:** the `GITHUB_TOKEN` the engine uses must include **`repo` + `workflow`** (committing a
   workflow file needs `workflow`). A classic PAT with `repo` usually includes it; fine-grained PATs need
   "Workflows: read and write". Without it, the workflow-file commit 403s and the build fails honestly.
4. **Turn it on:** set `FREE_BUILDS=1` in the engine env (Vercel). Optional overrides:
   - `FREE_BUILD_MODEL` — Aider model string (default `groq/llama-3.3-70b-versatile`; e.g.
     `cerebras/llama-3.3-70b`, `openrouter/qwen/qwen3-coder:free`).
   - `FREE_BUILD_KEY_ENV` — the provider env var Aider reads inside the Action (default `GROQ_API_KEY`;
     use `CEREBRAS_API_KEY` / `OPENROUTER_API_KEY` to match your provider).

## Verify (proof)
Run a goal with build-for-real. The engine returns `mode: "aider-actions"` and a `https://<owner>.github.io/<repo>/`
URL; the repo's **Actions** tab shows the `build-app` run; when it finishes the URL serves the real app.

## Honest limits
- Free model tiers rate-limit → great for small apps + low volume (proving it, first customers), not high
  throughput. Cerebras (1M tok/day) or OpenRouter's 1M-context model are the most build-friendly.
- Actions is unlimited only on **public** repos (private = 2,000 min/mo on Free).
- Build quality tracks the free model — smaller/faster models make simpler apps. Swap `FREE_BUILD_MODEL`
  up (or to a paid key) when you want more.
- Not used unless `FREE_BUILDS=1`; when off, builds use OpenHands (if set) or the static builder — no
  behavior change. See the [free build stack memory] for the research + alternatives.
