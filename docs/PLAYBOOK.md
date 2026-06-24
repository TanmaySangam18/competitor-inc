# The competitor.inc Playbook — "Quiet Build, Loud Launch"

> The master plan, synthesized from all the research (decode, new-game, sprint, money, launch).
> **I build the whole product in stealth by D-Day (June 28, 2026). You do one thing: hand your
> techie friend the runbook in §7 and he puts it on the web — the first time the world hears about
> competitor.inc.** Detailed backing docs: `THE-NEW-GAME.md`, `SPRINT-AND-STRESS-TEST.md`,
> `MONEY-PLAN.md`, `LAUNCH-PLAYBOOK.md`, `POLSIA-PLAYBOOK-DECODE.md`.

---

## 0. The bet (TL;DR)
- **What:** *"Prove it before you build it."* competitor.inc validates your idea — and tells you the
  honest truth, even "don't build this" — **before** building the winner. You stay the founder.
- **Contrarian truth:** building is now a commodity (AI did that); **knowing what to build and
  trusting it is scarce.** We sell certainty + trust, not autonomy.
- **Go / no-go:** **~$10K in month 2 → take it ahead; else kill it.** <$100 at risk. (Validation-first,
  applied to ourselves.)

## 1. Positioning — the new game (Blue Ocean + the Chesky lens)
- Reframe the category: not *"AI that runs your company"* → **"AI that proves your company."**
- **Be the trust-rebuild** the category skips (Polsia = Airbnb *before* the trust rebuild; 2.1★).
  Obsess the experience (11-star), not the spectacle.
- **Counter-position:** they go *"AI controls the capital, humans serve the AI."* We go **"you're
  the founder — you own the equity, data, and decisions; Roomie's your companion."**

## 2. Why it survives Polsia (7 Powers — the defensibility)
- **Counter-Positioning:** they *won't* genuinely adopt validate-first — it suppresses the **ad-spend
  margin** that is their stated future model, and it's off-brand vs autonomy/spectacle. A copied
  button ≠ a re-centered business.
- **Moats we *build*:** a **data** edge (what signals predict real demand, compounding per run), a
  **network/community** edge (the "Roomie-validated" board), and **brand** ("the honest one" in a
  space whose own discourse is "is it slop?").

## 3. The product to ship by D-Day (definition of done)
**Already built this session** (✅ on GitHub, `next build` clean, 22 tests): landing, multi-company
dashboard (Operations/History/Chat), agent loop + Glass Box + Approval Inbox, streaming chat,
settings (soul.md/agents.md), public `/live`, Supabase-ready auth/persistence, cron, a11y/tests.

**Remaining build (the pivot + launch surface):**
1. **Reposition** everything to *"Prove it before you build it."*
2. **Real Validation Gate** — multiple experiment types (landing+waitlist, fake-door, ad smoke-test
   on the *user's* budget), an **evidence-backed verdict** incl. honest "kill."
3. **Build-the-winner** path → a real deployed artifact (proof-of-work).
4. **Cost model = BYOK + free-tier routing** (≈$0 marginal). Free tier to validate.
5. **Launch surface** — teaser **waitlist + referral skip-the-line** + capped **Founding Members ($99)**.

## 4. The build plan — execution blocks (Shape Up, re-clocked to *my* work-units)
I build this; I don't work in human days. The plan is an ordered set of **build-blocks** — each a
coherent slice I finish **and verify** (build + tests + live preview) before the next. They run
back-to-back, so the product is **launch-ready well before June 28** — that date becomes the chosen
*launch day* (buffer, not pressure). What actually gates pace is **your 3 quick checkpoints + the
friend's deploy**, not my building.

| # | Block | I build & verify | Needs you? |
|---|---|---|---|
| 1 | Reposition + brand | "Prove it before you build it" landing + `soul.md`; real logo via `canvas-design`; premium design system (type, motion, bespoke SVG) | 👀 react to the look |
| 2 | Validation engine (hero) | BYOK + free-tier routing; multi-experiment Validation Gate + evidence-backed verdict (incl. honest "kill") | — |
| 3 | Build-the-winner + trust | post-validation real artifact; Glass Box, export, "Roomie-validated" board (repurpose `/live`) | — |
| 4 | Persistence + guardrails | Supabase auth/multi-company (live-ready, verified in fallback); free-tier usage caps | — (friend adds keys) |
| 5 | Pricing + launch surface | Free / $39 Pro / $99 Founding (capped) + referral waitlist; Merchant-of-Record checkout wired | 💳 set up payouts (~20 min, before first sale) |
| 6 | Launch assets (`launch/`) | demo script, Show HN/PH/X copy, "Polsia-refugee" DM script, OG images, finalized runbook | 👀 approve copy + pick handle |
| 7 | Harden + dry-run + handoff | a11y/perf, more tests, $10K tracker; runbook dry-run; tag a release; push | — |

**D-Day:** you hand your friend the repo + runbook → 8 steps → live → you both hit publish.

**The only things gated on you (everything else is mine):** ① react to the Block 1 look ② approve
Block 6 launch copy + handle ③ set up payouts before the first sale.

**No-gos (build to the seam, don't fake):** real ad *spend*, real payments capture, mass email,
enterprise/SSO, the fund layer. **Circuit breaker:** if a slice balloons, cut it — never move the launch.

### 4.1 Quality regimen — the "1000 cycles" (pseudo-D-day June 20)
**Two dates:** **June 20 = pseudo-D-day** (feature-complete + first fully-green QA). **June 28 =
launch.** The 8-day gap is a dedicated **hardening window** — that's where the "check every inch"
cycles happen, with zero feature pressure.

*Honest translation of "1000 cycles":* I can't run 1000 *manual* passes — but I build an **automated
harness** that runs hundreds of assertions every pass, and I run it after **every** change and
repeatedly through the buffer until defects hit zero.

- **The automation — `npm run qa`** (run after EVERY block; never advance on red). Implements the
  **Testing Trophy** (static → unit → integration → e2e) + **property/fuzz** (fast-check / QuickCheck lineage):
  - **static:** `tsc --noEmit`
  - **unit + integration:** `vitest` (example tests across engine / API / route handlers)
  - **property / fuzz:** `fast-check` — ~2,200 generated inputs hammer validate/shift/slug/name
    invariants (no negative spend, approvals never auto-resolve, deterministic, never empty/throw)
  - **build:** `next build`
  - **e2e smoke:** `scripts/smoke.mjs` boots the production server, sweeps every route + API, and
    throws 60 garbage payloads at the API asserting **zero 5xx**
- **Still-manual visual layer:** the Claude-Preview MCP sweep (routes × states × breakpoints × dark) per block.
- **The "every inch" sweep matrix** (run each hardening cycle): **routes** (every page + API +
  not-found/error) × **states** (empty · loading · error/offline-fallback · populated · edge:
  long/blank/special-char input, 0 nights, many companies) × **breakpoints** (375/768/1280) × **dark
  mode**. Each sweep checks: 0 console errors, handled network failures, a11y (keyboard/focus/contrast/
  reduced-motion), perf (Lighthouse/CWV), and data integrity (ledger, persistence/migration,
  multi-company isolation, undo/refund, $10K tracker).
- **Runbook dry-run** (clone → install → `verify` → start) repeated until flawless.

**Cadence:** Blocks 1–7 land by **June 20**, each ending green on `verify`. June 20–28 = loop the
sweep matrix + e2e, fixing everything found, until it's airtight. Then launch.

## 5. Money model (<$100 to run; $10K-or-kill)
- **Cost:** BYOK + free model tiers + Vercel/Supabase free + Merchant-of-Record payments → **~$32–62 total**, ~**$0 marginal/user**.
- **Pricing:** Free (validate, BYOK) · **Pro $39/mo** · **Founding $99 one-time** (launch, ~150 seats).
- **$10K path:** Founding-led (≈100 × $99) + Pro + validation packs. **Distribution is the bottleneck, not cost.**

## 6. The launch — Big-Bang Surprise (Dropbox + Robinhood + Superhuman; Cluely caution)
- **Asset:** a 60s demo — *"the AI that tells you NOT to build it"* (contrarian = self-spreading).
- **Drop (all at once, D-Day):** Show HN + Product Hunt + an X launch thread + Indie Hackers + r/SaaS/r/Entrepreneur.
- **Mechanic:** capped Founding scarcity (Superhuman) + referral skip-the-line (Robinhood/Dropbox).
- **DM gold:** harvest **Polsia's 1-star reviewers + "is it a scam" threads** — a by-name list of your ICP.
- **Caution (Cluely's fall):** virality must land on *retaining* substance — that's our validation/trust core.

## 7. ⭐ THE TECHIE-FRIEND RUNBOOK (the only thing you do)
Everything below will be **ready in the repo before D-Day** (env template, DB migration, and a
`launch/` folder with all copy). Your friend runs this top-to-bottom in ~30–45 min:

```bash
# 1. Get the code
git clone https://github.com/TanmaySangam18/competitor-inc
cd competitor-inc && npm install

# 2. Make it run (verify locally)
cp .env.example .env.local        # BYOK default → no model key needed to boot
npm run build && npm start        # confirm it builds + runs on localhost:3000
```
3. **Create free accounts:** a **Vercel** project (Hobby = $0) and a **Supabase** project ($0).
4. **Run the DB migration:** paste `supabase/migrations/0001_init.sql` into Supabase's SQL editor → Run.
5. **Set env vars in Vercel:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   (optional: `ANTHROPIC_API_KEY` + `MODEL_PROVIDER=anthropic`, `CRON_SECRET`).
6. **Deploy:** connect the GitHub repo in Vercel → **Deploy** (or `vercel --prod`).
7. **Domain:** buy one (~$12, Porkbun) → point it at Vercel.
8. **Go loud:** publish the prepared posts in `launch/` (Show HN, Product Hunt, X thread) and fire
   the DM list. **competitor.inc is live — the web meets it for the first time.**

> Net: you call your friend, send him this file + the repo link. He does 8 steps. Done.

## 8. D-Day checklist (definition of done)
- [ ] Product: validation hero + real experiments + build-the-winner + Glass Box + BYOK + Founding/waitlist
- [ ] Deploys clean on Vercel · Supabase live · domain ready
- [ ] `launch/` assets done: demo clip script, Show HN / PH / X copy, "Polsia-refugee" DM script
- [ ] Runbook dry-run passes · $10K tracker instrumented

---

**Bottom line:** I build a launch-ready, deployed, repositioned competitor.inc by June 28 with a `launch/`
folder and an 8-step runbook. You make one call. Your friend pushes it live. Then the market — not a
build-in-public diary — tells us in 8 weeks whether it's a $10K business or a clean, cheap kill.

### Decisions baked in (veto now, before I build to them)
- Name **competitor.inc**, tagline **"Prove it before you build it."**
- Pricing: Free / **$39 Pro** / **$99 Founding** (~150 seats).
- Hook: **"the AI that tells you not to build it."**
- Cost model: **BYOK + free tiers** (you never pay for inference).
If any of those are wrong, say so; otherwise I start executing the build.
