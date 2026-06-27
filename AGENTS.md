# AGENTS.md — working in competitor.inc

A legible index for any AI agent (or human) working this repo. Following the loop-engineering principle that
an agent-ready codebase is **legible · executable · verifiable**. Keep this file ~100 lines and current.

## What this is
competitor.inc — the honest AI co-founder: it **validates a startup idea before building it**, then runs the
company with an agent crew the founder **approves**. Wedge: proof-first (Glass Box), human-in-control
(Approval Inbox), verify-before-done, **0% revenue share**. Niche: **first-time / student founders**.
Next.js 16 (App Router) · TypeScript (strict) · Tailwind v4 · framer-motion · three.js.

## The verifier (run this — it's how "done" is judged)
```
npm run qa     # tsc --noEmit && vitest run && next build && node scripts/smoke.mjs
```
Must end with `SMOKE PASSED ✓`. This is the single source of truth for "does it work." Don't mark work done
without it green. (Loop-engineering rule: never let an agent grade its own work — `npm run qa` is the
independent verifier.)

## Map
- `lib/engine/` — the engine:
  - `types.ts` — domain types + the `AGENTS` map (each agent's name/label/blurb/playbook/responsibilities/icp/objections).
  - `provider.ts` — offline **simulated** provider (default, $0). `server.ts` — real model routing (Anthropic / AI Gateway / OpenAI-compatible / BYOK) + validate/chat/shift.
  - `execution.ts` — the **gated execution layer**: `capabilities()` (which integrations are on) + `runAction()` (build/deploy/email/ads/payments/bluesky) + `verifyProof()` (verify-before-done).
  - `crew.ts` — `generateCrew(idea)` dynamic per-company specialists. `memory.ts` — pgvector agent memory. `observability.ts` — gated trace wrapper. `refcode.ts` — referral code.
  - `playbooks.ts` — the public `/playbooks` registry (methodology, neutral voice). `delegation.ts` — 3D office data. `config.ts` — per-agent scope/soul + BYOK. `db.ts`/`sync.ts` — Supabase mappers + write-through.
- `app/` — routes: `page.tsx` (landing) · `dashboard` · `join` · `t/[slug]` (demand test) · `house` (+`house/board`) · `playbooks` · `delegation` · `api/{engine,execute,cron,waitlist,demand,metrics}` · `sitemap.ts`/`robots.ts`.
- `supabase/migrations/` — `0001_init` → `0005_agent_memory` (run in order in the Supabase SQL editor).
- `scripts/smoke.mjs` — E2E route sweep + API fuzz (port 3041). `docs/` — strategy + intel + plans.

## Hard rules (do not weaken these for "more autonomy")
1. **Everything is gated.** Each integration is OFF until its env key is set; with none set the app runs fully
   **simulated**. Nothing live runs without the founder's credentials. See `.env.example` (provider vars are
   `MODEL_*`, not `ROOMIE_*`).
2. **Consequential actions need approval.** Spend, outreach, public posts, deploys, deletes → drafted and
   queued to the **Approval Inbox** → `/api/execute`. Never auto-ship them; never claim something shipped that didn't.
3. **Verify before done.** Mark work done only after a real check (`verifyProof()` / `npm run qa`).
4. **Honesty.** No fake metrics, no invented quotes/stats, no implying a named person endorses us. The
   validation gate is an "AI estimate" until a real demand test runs.

## Conventions
- Match surrounding style; keep changes minimal + tested. Add/extend a vitest test when you change engine logic.
- New gated capability → add to `capabilities()` + `runAction()` + `.env.example`, default OFF, fail-soft.
- Work happens on branch **`build-to-keys`** (PR #2) until the founder merges to `main`.
- Public `/playbooks` = neutral founder resource (methodology only); never "how we built competitor.inc."

## Going live (founder action — Block 0)
See `docs/GO-LIVE.md`: create Vercel + Supabase, run the 5 migrations, paste env vars (incl. one model key),
deploy. Live (founder's own) demo: `competitor-inc-zeta.vercel.app` (simulated mode).
