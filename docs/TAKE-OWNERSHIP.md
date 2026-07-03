> ⚠️ **PARTIALLY STALE (2026-07-03).** The Supabase step says run only `0001_init.sql` — there are now **14 migrations (0001–0014)**; run ALL in filename order. (The ROOMIE_*→MODEL_* correction below already landed.) Canonical setup: [AUTH-SETUP.md](AUTH-SETUP.md).

# Take full ownership — the solo-founder runbook

> Goal: **you own every account and asset**, end to end, with zero dependency on anyone else. Your friend
> (if he stays) is a **collaborator** who works via PRs you approve — never an owner. This is the checklist
> to stand the whole stack up under *your* accounts. ~30–45 min, mostly $0. Deeper deploy detail:
> [`../launch/runbook.md`](../launch/runbook.md); Supabase detail: [`SUPABASE-SETUP.md`](SUPABASE-SETUP.md).

The principle: **own the accounts, hold the secrets, control the merge + deploy buttons.** That *is*
ownership in practice. The code already lives in your repo (`TanmaySangam18/competitor-inc`, `main` =
the consolidated line). Everything below puts the *infrastructure* under you too.

## 1 · GitHub (the source of truth) ✅ mostly done
- [ ] Confirm **you're the owner** of `TanmaySangam18/competitor-inc` (you are). `main` is the consolidated
      codebase. Repo → Settings → make sure only *you* are an Admin.
- [ ] If a teammate contributes: add them as a **Collaborator** (Settings → Collaborators), *not* an owner.
      Optionally protect `main` (Settings → Branches → require PRs) so changes land only via your review.

## 2 · Vercel — deploy under YOUR account (≈5 min, free)
1. [ ] Sign up at **vercel.com** with **your GitHub**.
2. [ ] **Add New → Project → Import** `TanmaySangam18/competitor-inc` → **Deploy** (framework auto-detects Next.js).
3. [ ] Project → **Settings → Git**: Production Branch = **`main`**, auto-deploy on. (Now every push to `main` ships.)
4. [ ] You'll get a `…vercel.app` URL immediately. (His `competitor-inc.vercel.app` stays his — yours is separate.)
5. [ ] Set env vars (next section) → **Redeploy**.

## 3 · Supabase — your project (≈10 min, free)
1. [ ] Create a **new project** at **supabase.com** under your account.
2. [ ] SQL Editor → paste + run **`supabase/migrations/0001_init.sql`** (recreates the schema; pre-launch = no data to lose).
3. [ ] Confirm **Row-Level Security is ON** for the tables (the migration sets it; verify in Table Editor).
4. [ ] **Authentication → Providers:** enable Email (magic link) + Google + GitHub (paste each OAuth client id/secret);
       add `https://YOURDOMAIN/dashboard` as a redirect URL.
5. [ ] Settings → API: copy the **Project URL**, the **anon key** (public), and the **service_role key** (SECRET — server only).

## 4 · Env vars — set these in Vercel (Project → Settings → Environment Variables)
Source of truth is **`.env.example`**. Must-set vs optional:

**Set now (auth + persistence):**
- `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public)
- `SUPABASE_SERVICE_ROLE_KEY` 🔒 (secret — never client-side) · `CRON_SECRET` 🔒 (any random string)
- `NEXT_PUBLIC_FOUNDER_EMAILS` = `sangam.d@northeastern.edu,tanmaysangam018@gmail.com` (House access)
- `NEXT_PUBLIC_SITE_URL` = your domain (for link previews)
- `NEXT_PUBLIC_OPERATE` = `0` for the lean launch surface (set later to re-enable the Operate tab)

**Model (pick one when you want real AI; leave unset = simulated):**
- `MODEL_PROVIDER=openai-compatible` + `MODEL_BASE_URL` + `MODEL_API_KEY` (free tier: **NVIDIA NIM**
  `https://integrate.api.nvidia.com/v1` or **Groq**) — or `MODEL_PROVIDER=anthropic` + `ANTHROPIC_API_KEY`
  (your Claude-for-Startups credits). `MODEL_ID` / `MODEL_CHEAP` set the models (defaults: Opus 4.8 /
  Haiku 4.5). ⚠️ An earlier version of this doc said `ROOMIE_*` — the code reads **`MODEL_*` only**;
  `ROOMIE_*` vars configure nothing.

**Gated real-execution (each OFF until you add its key — turn on only when ready):**
- `GITHUB_TOKEN` (Forge builds) · `RESEND_API_KEY`+`RESEND_FROM` (email) · `STRIPE_SECRET_KEY`+`STRIPE_PRICE_ID`
  (payments — you keep 100%) · `ADS_WEBHOOK_URL` (ads, your account) · `BLUESKY_HANDLE`+`BLUESKY_APP_PASSWORD` 🔒
  (free posting) · `NEXT_PUBLIC_CHECKOUT_URL` (Founding checkout).

🔒 = secret. The app runs fully simulated with none set, so deploy first, add keys as you light each feature up.

## 5 · Domain (≈$12, optional but do it before launch)
- [ ] Buy a domain (Porkbun / Namecheap) → Vercel → Project → **Settings → Domains** → add it → follow DNS steps.
- [ ] Set `NEXT_PUBLIC_SITE_URL` to it + the Supabase auth redirect to `https://yourdomain/dashboard`.

## 6 · Other accounts (as you enable features — all under YOU)
Anthropic Console (model + your startup credits) · Resend (email) · **Stripe** (payments — your account, 100%
yours) · Bluesky app-password · an ad account (your budget). Create each under your own login; put the keys
in Vercel env. Never share them.

## 7 · Legal ownership (the part that isn't code)
- [ ] **Contributor IP Assignment** — if your friend contributed (he did), get a one-page agreement signed:
      he assigns IP in his contributions to you/the company, confirms he's a volunteer contributor (no equity),
      and carries no liability. **The one item that needs him — do it before he's fully out.**
- [ ] **Incorporate** + sign a founder IP assignment (your work → the company); you hold 100% equity.
- [ ] Use **Northeastern IDEA's free legal** (you're applying anyway) or a template (Stripe Atlas / Clerky / YC).

## 8 · Verify (after deploy)
- [ ] Your `…vercel.app` (or domain) loads the landing.
- [ ] `GET /api/engine` returns capabilities (model true once a model key is set; the rest false until keyed).
- [ ] `/playbooks` loads; `/house` is **gated** (sign-in required on the live URL — confirm a stranger can't open it).
- [ ] Sign in with a founder email → the House unlocks for you.

## You now own the entire stack
Repo (yours) · deploy (your Vercel) · data + auth (your Supabase) · domain (yours) · every integration key
(yours) · the merge + deploy buttons (yours). No single point of dependency on anyone else.
