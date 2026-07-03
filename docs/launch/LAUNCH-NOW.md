> ⚠️ **STALE (2026-07-03).** Says run "the 5 migrations" (0001→0005) — there are now **14 (0001–0014)**, and billing is live on **Polar**. Canonical: [../NEXT-BLOCKS.md](../NEXT-BLOCKS.md) + [../AUTH-SETUP.md](../AUTH-SETUP.md).

# Launch checklist — what's left (self-marketing strategy)

Goal: go **live + measurable** so you can market it yourself, gather real numbers, *then* apply/raise.
Current state: all 9 blocks built + QA-green; your own Vercel deploy is live in **simulated mode** at
**https://competitor-inc-zeta.vercel.app** (no keys yet → signups are NOT being captured).

## ✅ Already done
- [x] Product code — all 9 blocks, QA-green (branch `build-to-keys`, PR #2)
- [x] Your own live Vercel deploy (sim mode), on your account, surprise-launch-safe (crawlers blocked)

## 🔴 MUST-DO to be "live + measurable" (your action, ~20 min, $0)
Without this, marketing drives traffic but every signup vanishes (localStorage only).
- [ ] **1. Create a free Supabase project** ([supabase.com](https://supabase.com))
- [ ] **2. Run the 5 migrations in order** in the SQL editor: `0001_init` → `0002_feedback` → `0003_waitlist` → `0004_demand_test` → `0005_agent_memory` (in `~/competitor-inc/supabase/migrations/`)
- [ ] **3. Add Vercel env vars** (project → Settings → Environment Variables):
  - `NEXT_PUBLIC_SUPABASE_URL` (public)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public)
  - `SUPABASE_SERVICE_ROLE_KEY` — **god-mode secret; dashboard only, never chat/git**
  - *(optional)* `METRICS_SECRET` = long random string → unlocks `/house/board`
- [ ] **4. Redeploy + verify** (ping me — I'll run `vercel deploy --prod` and confirm a test signup persists)
- → Lights up: **waitlist capture + referrals, demand tests, real auth, the KPI board**

## 🟡 Optional now — defer to stay at $0 / preserve the surprise
- [ ] Model key for **real AI** (`MODEL_PROVIDER=anthropic` + `ANTHROPIC_API_KEY`) — add when you want the live demo to reason; not needed for a waitlist-first push
- [ ] Custom domain (~$12, e.g. competitor.inc) — the Vercel URL works fine for now
- [ ] **Keep `NEXT_PUBLIC_SITE_PUBLIC` OFF** — stays out of search; you market by sharing the link directly. Flip only at the real public launch.

## 🟢 Before you APPLY / RAISE (not blockers to start marketing)
- [ ] Friend's (Srikar / `Srikarmk`) **IP assignment** signed → clean 100% ownership
- [ ] **Real traction numbers** from the board (waitlist, demand-test conversion, PMF) → the proof you apply/raise with
- [ ] **Founder video** (3–4 min, outline already drafted in TOA-application-filled.md)
- [ ] Housekeeping: merge `build-to-keys` → `main` when ready (source-of-truth)

## ▶ Then — market it yourself
Once it's capturing signups, I'll give you a concrete **self-marketing plan for the first-time-founder
niche** (the channels, the honesty-reveal angle, what to post) and we track it on the board against the
2,000-waitlist line. When the numbers are real, that's when TOA / a raise makes sense — with proof.
