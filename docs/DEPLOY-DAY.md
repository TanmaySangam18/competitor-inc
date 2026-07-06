# DEPLOY DAY — ship the latest + flip freemium + launch

_Prod is already live but STALE. This is the incremental "push the newest build + turn on freemium +
start posting" runbook — NOT first-time setup (that's `docs/GO-LIVE.md`). ~15 min of your time; everything
is built + QA-green. F1-safe: this ships a free **waitlist**, not charging._

**Order matters:** env vars go in BEFORE the deploy — the `NEXT_PUBLIC_*` flags are baked in at build time.

---

### 1 · Log in to Vercel (one time)
```bash
npm i -g vercel      # skip if installed
vercel login         # account: projecttattva1@gmail.com
```

### 2 · Set 3 env vars in Vercel → Settings → Environment Variables → **Production**
Add as **plaintext, NOT "Sensitive"** (⚠️ Sensitive vars don't inline into `NEXT_PUBLIC_*` on the client):

| Variable | Value | Turns on |
|---|---|---|
| `NEXT_PUBLIC_WAITLIST_GATE` | `1` | Freemium flow + server-enforced premium gate |
| `NEXT_PUBLIC_SITE_PUBLIC` | `1` | Search crawling (SEO/playbooks can rank) |
| `CRON_SECRET` | any long random string | Nightly crew heartbeat (runs 07:00 UTC) |

**Keep ABSENT (F1-safe):** `NEXT_PUBLIC_CHECKOUT_URL`, `NEXT_PUBLIC_CHECKOUT_URL_FOUNDER`,
`NEXT_PUBLIC_CHECKOUT_URL_SPRINT`. While unset, `billingLive()` is false → no charge path exists.
(Day OPT/EAD lands: add `NEXT_PUBLIC_CHECKOUT_URL` → checkout flips live automatically.)

### 3 · Apply DB migrations (one paste)
Supabase → **SQL editor** → paste the whole file → **Run**. Idempotent, safe if already applied:
```
supabase/migrations/LAUNCH_BUNDLE_0021-0022.sql
```

### 4 · Deploy (one command)
```bash
cd ~/competitor-inc
git status            # working tree should be clean — npm run ship deploys git HEAD
npm run ship          # runs full QA gate, then deploys prod (seat-block workaround baked in)
```

### 5 · Verify on the live URL (2 min)
_(prod = whatever `.vercel/project.json` points to; last known: competitor-inc-zeta.vercel.app)_
1. Run the **hero demo** → get a verdict.
2. Sign in → create a company → the **reverse-trial / waitlist gate** appears after the preview.
   *(If it doesn't, the flag was saved "Sensitive" — fix to plaintext + redeploy.)*
3. Confirm **no pay/checkout button** anywhere (F1 check).
4. `/house/board` → **Landing Funnel** logs `landed → ran demo`.

### 6 · Launch the distribution (only you can hit "post")
Open [`docs/LAUNCH-KIT.md`](LAUNCH-KIT.md) — **one channel per day**, don't blast at once:

| Day | Channel |
|---|---|
| 1 | Show HN (warmest) |
| 2 | Reddit r/SideProject |
| 3 | X launch thread |
| 4 | Product Hunt |
| 5 | LinkedIn (adapt the X thread) |

Reply to every comment the first 2–3 hours. Send the live links back to me — the build-in-public loop can
cite real milestones (real only, on competitor.inc's own accounts).

---

**Rollback if needed:** Vercel → Deployments → previous READY prod deploy → ⋯ → **Promote to Production**.

**What goes live:** freemium (reverse-trial + waitlist + 1-free-company) · "Your team" crash fix ·
server-enforced premium gate · Organic Growth Engine running nightly (drafts → your desk) · SEO crawling ·
nightly crew heartbeat. The **TTFPO** clock starts the moment your first real user creates their company.
