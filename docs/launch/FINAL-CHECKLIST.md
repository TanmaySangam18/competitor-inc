# competitor.inc — FINAL master checklist (2026-06-26)

Single source of truth. **[YOU]** = your action · **[ME]** = I do it · **[DECIDE]** = your call.

---

## A. ✅ DONE (the foundation — built, QA-green, pushed)
- [x] All product code — **9 blocks** on branch `build-to-keys` (PR #2), QA-green at every commit
  - waitlist+referral capture · behavioral conversion pass · real demand-test · dynamic per-company crew ·
    pgvector agent memory · evals/observability · SEO surface · GO-LIVE checklist · founder KPI board
- [x] **Your own live deploy** (your Vercel account, sim mode): **https://competitor-inc-zeta.vercel.app** — crawlers blocked (surprise-launch safe)
- [x] **11 public playbooks** in the tab (incl. human-decision set + Rory Sutherland psycho-logic)
- [x] Strategy docs: GROWTH-MODEL · VOC-RESEARCH · USER-RESEARCH-PLAN · GO-LIVE · LAUNCH-NOW · PLAN-framework-roster · PLAN-deep-tech-autonomy · TOA-application-filled

## B. 🔴 TO GO LIVE + MEASURABLE (critical path — do this to start marketing)
*Without it, marketing drives traffic but signups vanish (localStorage only).*
- [ ] **[YOU]** Create a free **Supabase** project
- [ ] **[YOU]** Run migrations `0001 → 0005` in order (SQL editor)
- [ ] **[YOU]** Add Vercel env vars (dashboard): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` *(secret — dashboard only)*, optional `METRICS_SECRET`
- [ ] **[ME]** Redeploy + verify a test signup persists end-to-end
- → unlocks: **signup capture, referrals, demand tests, auth, KPI board**

## C. 🟡 OPTIONAL NOW — defer (stay $0 / keep the surprise)
- [ ] **[DECIDE]** Model key for **real AI** (`MODEL_PROVIDER=anthropic` + `ANTHROPIC_API_KEY`) — add when you want the demo to reason; not needed for a waitlist-first push
- [ ] **[DECIDE]** Custom domain (~$12) — Vercel URL works for now
- [ ] Keep `NEXT_PUBLIC_SITE_PUBLIC` **OFF** — market by sharing the link; flip only at the real public launch

## D. 🟢 BEFORE YOU APPLY / RAISE (not blockers to start marketing)
- [ ] **[YOU]** Friend's (Srikar / `Srikarmk`) **IP assignment** signed → clean 100% ownership
- [ ] Real **traction numbers** from the board → the proof you apply/raise with
- [ ] **[YOU]** Founder **video** (3–4 min; outline in TOA-application-filled.md)
- [ ] **[ME]** Housekeeping: merge `build-to-keys` → `main` when you say so

## E. ⚖️ DECISIONS PENDING (yours)
- [ ] **TOA application** — paused by you (apply later with traction). Filled draft is in Downloads + repo.
- [ ] **Enterprise vs prosumer framing** (only matters when you apply to enterprise programs like TOA)
- [ ] **Launch shape:** waitlist-first ($0, capture demand) **vs** full real-AI launch (needs model key)
- [ ] **Next focus:** (i) Supabase + start marketing · (ii) seed the framework-roster · (iii) something else

## F. ▶ FUTURE BUILDS (mine, mostly post-keys)
- [ ] Self-marketing plan for the first-time-founder niche (the "AI that tells you *not* to build" hook)
- [ ] In-product **PMF survey capture** → makes the board's PMF score live (the 40% line)
- [ ] **Framework roster** (PLAN-framework-roster.md) — agents draw on a growing library of documented frameworks
- [ ] ChatOps ("text-your-agents") on Telegram (free) · the real demand-test traffic loop · the outcome-learning moat

---
**Live link:** https://competitor-inc-zeta.vercel.app · **Branch/PR:** build-to-keys / #2 ·
**Friend's STALE link (not yours):** competitor-inc.vercel.app
