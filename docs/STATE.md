# STATE — Competitor.inc (ground truth)

_Session memory. Read at the start of every session; update before finishing. Last updated: **2026-07-07** — audit + Gate-1 execution (WP-2 reviewer/QA gate + WP-3 hard spend cap shipped; see §5b)._

**Phase:** 0 — Company Zero. **Live:** `competitor-inc-zeta.vercel.app`. **Branch:** `main` @ `3815689` (pre-audit).
**Payments:** OFF by design (founder is F1 / no US work authorization yet — see risks).

---

## 1 · Secrets sweep (Hard Rule #1) — ✅ CLEAN
Scanned the working tree **and full git history** for key-literal patterns (OpenAI `sk-`, Anthropic `sk-ant-`,
Groq `gsk_`, Google `AIza`, GitHub `ghp_/gho_…`, Slack `xox…`, Polar `polar_`, JWTs `eyJ…`, PEM private keys).

- **Tracked env files:** only `.env.example` (no real `.env` committed). ✓
- **`.gitignore`:** `.env*` ignored, `!.env.example` allowed. ✓
- **Working tree:** zero matches in tracked files. ✓
- **Full history (all commits):** zero matches. ✓

**Verdict:** no secrets in the repo or its history — satisfies the Phase 0 DoD secrets bar. Real keys live in
Vercel/Supabase env only. **Caveat:** this was pattern-based (`gitleaks`/`trufflehog` are not installed). Recommend
installing one and running it in CI as belt-and-suspenders. No rotation needed (nothing found).

---

## 2 · Architecture map (what exists / runs / is stubbed)
Substantial, real codebase: **27 page routes · 26 API routes · 90 `lib/engine` modules · 69 test files (548 tests) · 25 SQL migrations.**
Stack: Next.js 16 · React 19 · TS strict · Tailwind v4 · Supabase (RLS) · multi-provider LLM · Vitest+fast-check · Vercel.

**Mapped to the MISSION §2 agent org:**

| MISSION agent | In the code today | Status |
|---|---|---|
| **Orchestrator (CEO)** | `Apex` role; `orchestrator.ts` (`decomposeGoal`), `supervisor.ts`, `agent-lifecycle.ts`, `task-queue.ts` | **Partial** — exists + tested, but flag-gated (`SUPERVISED_CYCLE`); default engine is the nightly `runShift`, not plan-first decomposition |
| **Product** | `provider.scoreIdea` (validation), `growth.ts` diagnosis | **Gap** — no dedicated Product agent authoring specs/roadmaps/acceptance criteria |
| **Engineering (builder/reviewer/QA)** | `generateSiteFiles` (builder → Gemini `BUILD_API_KEY`), `execution.buildOnGitHub`, `verifyProof` | **Partial** — real builder + verify-before-done, but **no independent reviewer/QA on the generated app** (single-pass) |
| **Growth (mktg+sales)** | `Pitch`/`Surge` roles, `distribution.ts`, `organic-shift.ts` (Organic Growth Engine), `growth.ts` (Revenue Loop) | **Good** — real drafts, approval-gated; conduct rules honored (no auto-send) |
| **Support** | `Guard` role, ChatOps chat (`/api/engine kind:chat` + Slack/Telegram) | **Partial** — replies only; no ticket/docs loop feeding Product |
| **Finance** | `wallet.ts` (`decideSpend`, caps), Gate-2 spend approvals, `billing`/Polar, trial credits | **Partial** — spend gating + credits exist; no invoicing/bookkeeping; caps are **app-level, not infra-level** |
| **Sentinel (sec/compliance)** | `policy.ts` (5 gates + kill switch), `office-house-architecture.auditShiftActivities`, `alerts.ts`, `/api/execute` `authorize()` | **Good** — server-enforced policy + audit + alerts + kill switch |

**Multi-tenancy:** data is per-user isolated via Supabase RLS (`auth.uid()`). NOT yet full per-instance isolation
(own codebase / secrets vault / immutable audit log) — that's Phase 1+, correctly out of Phase 0 scope.

**Consolidation state (recent):** ONE user-facing engine (`runShift`) surfaced on the dashboard; `/orchestrator`,
`/watch`, `/delegation` retired → redirect to `/dashboard`; crew = the live `CrewBox` (pixel, banter, Slack/Telegram
reflection). Build = `app` mode → real functional web app via Gemini, credible product-site fallback.

---

## 3 · Health check — ✅ GREEN
`npm run qa` = `tsc --noEmit` (clean) · `vitest run` (**548/548 pass, 69 files**) · `next build` (ok) · smoke (**SMOKE PASSED ✓**,
fuzz 60 payloads → zero 5xx). Deploys reversible (Vercel promote + `ship-prod.sh` refuses a dirty tree).

---

## 4 · Gap analysis vs the Phase 0 Definition of Done (ranked by risk)
DoD = (a) one Company Instance runs the full loop with agents; (b) owner touches only Gate 1 + Gate 2 for 30 days;
(c) real product, real users, ≥1 real payment; (d) zero secrets, tests green, reversible deploys.

| # | Gap | Risk | Owner |
|---|---|---|---|
| R1 | **(c) No real payment possible — founder is F1 / no US work auth.** Checkout is OFF by law, so the DoD's "≥1 real payment" cannot complete until OPT/EAD. | **HIGH (blocks DoD)** | Founder (legal) — not code |
| R2 | **Build ceiling:** only **web-app** ideas build for real (Gemini); native / camera / ML / full-stack-backend do not. "Any software business" over-promises vs reality. | **HIGH** | Code — scope Company Zero to a web-app idea |
| R3 | **Gate model mismatch:** MISSION wants **plan-first Gate 1** + money caps **below the prompt (infra level)**; today it's per-action approval + **app-level** wallet caps. A bug/injection could in principle exceed caps. (Live risk ≈ 0 now — payments off.) | **MED** | Code |
| R4 | **No reviewer/QA on generated app code** (single-pass build). This is exactly what produced the "Coming Soon" page a user saw — a broken artifact can reach a customer. | **MED** | Code |
| R5 | **Client-authoritative state** (localStorage) with best-effort DB sync → data-loss / cross-device drift. | **MED** | Code |
| R6 | **Pending prod migrations** (`LAUNCH_BUNDLE_0021-0022.sql` incl `0023` chatops) not confirmed applied → ChatOps reflection + per-user caps + cycle history fail-soft to nothing. | **LOW-MED** | Founder (paste in Supabase) |
| R7 | **Dogfood gap:** competitor.inc itself hasn't run its own full loop for 30 days on gates-only. | **LOW** | Code + time |

**Done in the DoD already:** (d) zero secrets ✓, tests green ✓, reversible deploys ✓.

---

## 5 · GATE 1 BRIEF — the 3 work packages proposed next (awaiting owner approval)
The single hardest DoD item (R1, a real payment) is **founder/legal-gated**, not code — it unblocks with OPT/EAD.
So the code work below makes Company Zero's loop **reliable and honest** so it completes the DoD the day work-auth lands.

### WP-1 · Prove the loop end-to-end on ONE web-app idea (de-risk R2)
- **Objective:** run a real web-app-shaped idea through validate → build (Gemini) → deploy → verify the deployed app actually *works*, and confirm a growth shift produces real drafts. One clean, evidenced end-to-end pass.
- **Steps:** pick a web-app idea; run the real build; fetch the deployed URL and inspect it renders + is interactive (no console errors); run one shift; confirm drafts land in the Approval Inbox; write the result to STATE.
- **Risks:** Gemini output quality; GitHub Pages propagation lag; `BUILD_API_KEY` must be set on prod.
- **Rollback:** none needed — read-mostly; a bad build simply isn't promoted.

### WP-2 · Add an independent reviewer/QA gate on generated app code (fix R4)
- **Objective:** no built artifact is labelled "live" until a second pass verifies it (valid HTML/JS, renders, no obvious runtime errors); on failure, fall back to the credible site + say so honestly.
- **Steps:** post-`generateSiteFiles`, run structural checks (parse, required tags, no truncated JSON) + an optional headless render check; gate the "live" label on the result; add tests.
- **Risks:** added build latency; false negatives blocking a good build. Mitigate with a permissive-but-honest threshold + a flag.
- **Rollback:** feature-flag; revert to current single-pass build.

### WP-3 · Move the money cap below the prompt + confirm migrations (fix R3 + R6)
- **Objective:** make Gate 2 enforceable at the payments/infra layer (a hard cap Polar/infra enforces, so no agent error can exceed it *even in principle*), and apply the pending migrations so platform state is consistent. Payments stay OFF throughout — this is prep for the day they turn on.
- **Steps:** document the Polar-level spend cap + wire the config; keep `NEXT_PUBLIC_CHECKOUT_URL` unset; paste `LAUNCH_BUNDLE_0021-0022.sql` in Supabase; verify.
- **Risks:** real activation still gated on work-auth (this is preparation, not go-live). Migration paste is founder-gated.
- **Rollback:** config-only; migrations are idempotent.

**→ Gate 1 APPROVED 2026-07-07. Execution status below.**

### 5b · Executed post-approval (2026-07-07) — evidence
- **WP-2 — Reviewer/QA gate on generated code: ✅ DONE + tested.** New `lib/engine/site-review.ts`
  (`reviewGeneratedSite`) wired into `generateSiteFiles` — a build is rejected (→ falls back to the credible
  product site) if it's not real HTML, is truncated, references a missing local script, or (app mode) has no
  JS / is a "coming soon" placeholder. 9 unit tests (`site-review.test.ts`). This closes R4.
- **WP-3 — Money cap below the prompt: ✅ DONE + tested.** New `lib/engine/spend-cap.ts`
  (`hardSpendCapCents`/`overHardCap`), enforced in the `runAction("spend")` executor BEFORE any external
  call — independent of any agent proposal/approval. **Default 0 ⇒ no real money can move** (matches
  payments-off). Raise via `HARD_SPEND_CAP_CENTS`. 3 unit tests + execution tests updated. Partially closes
  R3 (outbound spend; a Polar-level cap still wanted when payments turn on).
- **WP-1 — Prove the loop end-to-end: ◑ PARTIAL.** The automatable part is done (the build→review gate is
  tested; the loop wiring is sound and QA-green). The **keyed real-build run is founder-gated**: it needs
  `BUILD_API_KEY` (free Gemini) set on prod, then one founder-triggered build to verify a real, deployed,
  working web app. Exact 60-sec check: create a web-app-shaped company → Build → open the built URL → confirm
  it's interactive (not the fallback site).
- **QA:** `tsc` clean · **561 tests pass (71 files)** · `next build` ok · **SMOKE PASSED**.

### 5c · Next real decisions (founder-gated — not code)
1. Set **`BUILD_API_KEY`** on prod → then trigger one build so WP-1 can be verified end-to-end.
2. Paste **`supabase/migrations/LAUNCH_BUNDLE_0021-0022.sql`** (incl `0023`) in Supabase (R6).
3. **Work authorization (OPT/EAD)** — the only thing blocking the Phase 0 DoD's "≥1 real payment" (R1).

### 5d · Reliability + safety hardening (2026-07-07, continued autonomously)
Vision installed as canonical (`docs/VISION.md`, cross-linked in CLAUDE.md/MISSION.md). Then, prioritizing
correctness/reliability/safety over scale (per the Final Objective), shipped:
- **Automated secret detection on every deploy** — `scripts/secret-scan.mjs` is step 0 of `ship-prod.sh`
  (blocks deploy on a hit; prints file+pattern, never the value). `npm run scan`. Makes VISION §Security's
  "every deploy includes secret detection" real, not manual.
- **Build self-repair loop** — `generateSiteFiles` now does generate → QA-review → on failure, retry ONCE
  with the reviewer's exact issues fed back → accept first passing build, else credible fallback (≤2
  attempts, cost-bounded). Turns single-pass builds into *reliable* ones. **Closes R4.**
- **R5 CLOSED — data-preserving reconcile** — `sync.mergeSyncState` unions local ∪ cloud by id (excludes
  tombstones; more-progress wins; lists merged+deduped), wired into `overlayFromDb`. A locally-created,
  not-yet-synced company can no longer be destroyed by a cloud snapshot. +6 tests.
- **State now:** 566 tests green, build clean, smoke + secret-scan pass, deployed. **Risks R4+R5 closed;
  R3 partial; R1/R6 remain founder-gated.** Scale infra (Phase 1+) intentionally NOT built.

### 5e · Autonomous CTO mode + locked invariants (2026-07-07)
- **Working mode:** CLAUDE.md "How to work" now encodes **Autonomous CTO execution** — decide + build,
  stop only at the defined conditions (vision change / legal / real money / irreversible / undiscoverable /
  Gate 1-2). Future sessions won't revert to asking on routine technical choices.
- **Secret scanner is now itself tested:** patterns extracted to `scripts/secret-patterns.mjs` (shared by
  the deploy gate + tests). Proven to catch planted key-shaped secrets and ignore prose/env-var names.
- **Mission-invariants contract:** `lib/engine/mission-invariants.test.ts` locks the non-negotiables in one
  place — Gate-2 money cap ($0 default blocks all spend), no broken/"coming soon" artifact ships, company
  isolation / no-loss reconcile, honesty ($0 drafted-shift costs), secret detection works. **573 tests green.**
- **Verify-before-done on builds:** `verifySiteLive()` (bounded retry, injectable/tested) wired into
  `buildOnGitHub` — a build ships a clickable "live" receipt only if the URL actually resolves; an
  unconfirmed (propagating) one is honestly labelled "deploying," never a 404 link. **576 tests green.**

### 5f · Phase-0 reliability arc — status
The Phase-0 control plane is now hardened across: secret hygiene (scan on every deploy), build QA +
self-repair, verify-before-done, data-loss-proof reconcile, money capped below the prompt, and a locked
invariants contract. **Remaining outcome-movement is FOUNDER-GATED** (set `BUILD_API_KEY` → verify a real
keyed build; paste `LAUNCH_BUNDLE_0021-0022.sql`; work-auth → first real payment). Further net-new code
should stay Phase-0-reliability (no Phase-1 scale infra) until those unlock and one company runs the full
loop for real. Guard against over-engineering — build only what moves a real outcome.

---

## 6 · Open risks / unknowns to resolve
- R1 (work auth) has no code fix — track OPT/EAD status; everything else is built so one env flip activates revenue.
- Whether Gemini (`BUILD_API_KEY`) is set on prod yet — unverified from here; WP-1 confirms it.
- A proper `gitleaks`/`trufflehog` CI scan should replace the pattern-based sweep above.
