> ⚠️ **SUPERSEDED (2026-07-03).** Says run migrations `0001 → 0005` — there are now **14 (0001–0014)**, and billing is live on **Polar**. Canonical: [../NEXT-BLOCKS.md](../NEXT-BLOCKS.md) + [../AUTH-SETUP.md](../AUTH-SETUP.md).

# competitor.inc — FINAL master checklist (updated 2026-06-26)

Single source of truth. **[YOU]** = your action · **[ME]** = I do it · **[DECIDE]** = your call.

---

## A. ✅ DONE (foundation — built, QA-green, pushed to `build-to-keys` / PR #2)
- [x] All product code — **9 blocks** (waitlist+referral · behavioral pass · real demand-test · dynamic crew · pgvector memory · evals · SEO · GO-LIVE · founder KPI board)
- [x] **Your own live deploy** (your Vercel, sim mode, crawlers blocked): **https://competitor-inc-zeta.vercel.app**
- [x] **14 public playbooks** (incl. human-decision set, psycho-logic, demand-is-the-bottleneck)
- [x] **Agents' job descriptions upgraded** — responsibilities / ICP / objections + restated GTM methods (Pitch/Surge) + an independent-verifier duty (Apex/Guard, loop-engineering); root `AGENTS.md`
- [x] **Intel + strategy library:** GROWTH-MODEL · VOC-RESEARCH · USER-RESEARCH-PLAN · sam-blond-profile · monaco-profile · loop-engineering · free-ai-stack · PLAN-framework-roster · PLAN-deep-tech-autonomy · GO-LIVE · LAUNCH-NOW · TOA-application(-filled)

## B. 🔴 TO GO LIVE + MEASURABLE (the critical path — still #1)
*Without this, marketing drives traffic but signups vanish (localStorage only).*
- [ ] **[YOU]** Create free **Supabase** project
- [ ] **[YOU]** Run migrations `0001 → 0005` (in order)
- [ ] **[YOU]** Add Vercel env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` *(secret — dashboard only)*, optional `METRICS_SECRET`
- [ ] **[ME]** Redeploy + verify a test signup persists end-to-end
→ unlocks signup capture, referrals, demand tests, auth, the KPI board

## C. 🟡 OPTIONAL NOW — defer (stay $0 / keep the surprise)
- [ ] **[DECIDE]** Real AI: a model key (`MODEL_PROVIDER=anthropic` + `ANTHROPIC_API_KEY`) **or** a free provider (Groq/Cerebras/OpenRouter) — add when you want the demo to reason; not needed for a waitlist-first push
- [ ] **[DECIDE]** Custom domain (~$12)
- [ ] Keep `NEXT_PUBLIC_SITE_PUBLIC` **off** — share the link; don't get indexed until the real launch

## D. 🟢 BEFORE YOU APPLY / RAISE (not blockers to start marketing)
- [ ] **[YOU]** Friend's (Srikar / `Srikarmk`) **IP assignment** signed → 100% ownership
- [ ] Real **traction numbers** from the board → your proof
- [ ] **[YOU]** Founder **video** (3–4 min; outline in TOA-application-filled.md)
- [ ] **TOA application** — fully drafted, **paused on purpose** (apply later, with traction)
- [ ] **[ME]** Merge `build-to-keys` → `main` when you say so

## E. ⚖️ DECISIONS PENDING (yours)
- **Launch shape:** waitlist-first ($0, capture demand) **vs** full real-AI launch (needs a model key)
- **Next focus:** (i) do the Supabase step + start marketing · (ii) build the self-marketing plan · (iii) something else

## F. ▶ FUTURE BUILDS (mine, mostly post-keys)
- Self-marketing plan for the niche (demand-first, founder-led — the "AI that tells you *not* to build" hook)
- In-product **PMF survey** → makes the board's PMF score live (the 40% line)
- **Framework roster** (agents cite documented frameworks) · **JD-mining pipeline** · compounding "signals" multi-loop · Telegram ChatOps · real demand-test traffic loop · the outcome-learning moat

---
**Live link (yours):** https://competitor-inc-zeta.vercel.app · **Branch/PR:** build-to-keys / #2 ·
**Friend's STALE link (not yours):** competitor-inc.vercel.app · **Watch:** Monaco ($85M, real ARR) + Polsia (1.8★)
