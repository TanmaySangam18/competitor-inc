# competitor.inc — Master Build Plan (LOCKED 2026-06-29)

Single source of truth. Execute top-to-bottom. Every output names its playbook. Pause only where the
founder's accounts/keys are required. Status: [ ] todo · [~] in progress · [x] done.

## Phase 0 — Fix what's broken + honesty (days)
*Positioning (Verifiable) + Hick's Law + Autonomy Audit (honesty). Source: live QA + revenue-run memory.*
- [x] 0.1 Mobile header — hamburger menu + compact CTA; links + sign-in reachable on mobile (dpl_…4vruuh8qf)
- [x] 0.2 `/live` honesty — reframed "public real-time every company" → honest "your workspace · Glass Box"
- [x] 0.3 Kill simulated fake links — sim shift proof → metric; demo product no longer fakes a live URL
- [x] 0.4 Marketing-copy leak — blitz + launch posts now market the CUSTOMER's product, not competitor.inc's
- [~] 0.5 Polish — branded contact email DEFERRED to launch (needs custom domain, Phase 1.7); framing/labels minor

## Phase 1 — Be live, trusted, findable (the compete window)
*Distribution-for-first-time-founders + 7 Powers (speed) + PDR §2/§4.*
- [x] 1.1 E · "It knows me" enrichment — consent-first self-only (Gravatar+GitHub), confirm/remove, fail-soft (dpl_…f0kcnlaue)
- [x] 1.2 B3 · Onboarding spine — aha path already minimal (idea→verdict→build, verified); advanced now revealed contextually (1.3)
- [x] 1.3 B1+B2 · Anti-crowding — autonomous-marketing card collapsed behind "Advanced" disclosure (Hick's Law) (dpl_…hzq91egf3)
- [x] 1.4 D · SEO engine — JSON-LD Article + OG + canonical on playbooks; sitemap canonical domain fixed (dpl_…hzq91egf3)
- [x] 1.5 Compliance wire-in — CAN-SPAM footer (sender identity + opt-out) appended in the live send path (dpl_…9scf1yte8)
- [ ] 1.6 Billing live — LemonSqueezy product + webhook + checkout ⛔ FOUNDER ACCOUNT GATE
- [ ] 1.7 LAUNCH — custom domain, flip SITE_PUBLIC/robots, GO-LIVE checklist ⛔ FOUNDER ACCOUNT/DOMAIN GATE

## Phase 2 — "Every inch": the autonomous builder (the moat)
*PDR §6 + agent-architecture-roadmap (Claude Agent SDK) + Operating Policy + Autonomy Audit (L3 never L4).*
- [x] 2.1 Rationale Stream — Activity.rationale + rationaleFor() (principle-grounded); expandable "Why?" in the Glass Box = first Education view (dpl_…nbnqlcdji)
- [~] 2.2 A1 · Real coding agent (Forge v2) — model AUTHORS a multi-file site (single-shot callModel + defensive parse + fallback). HONEST: this is NOT the Claude Agent SDK agentic loop (generate→build→read-errors→fix→repeat with tool use). That = v2: needs @anthropic-ai/claude-agent-sdk + an Anthropic key + a sandbox. (dpl_…r2br8a4ut)
- [x] 2.3 A2 · Host-by-default — every build auto-deploys to a live GitHub Pages URL per company (backend isolation + cost guardrails = v2)
- [ ] 2.4 One-click connect + eject (OAuth Vercel/Supabase/GitHub)
- [x] 2.5 A3 · Nightly operator — governApprovals() runs every shift's proposals through decide() (drops BLOCKed); wired into runShift = cron + live (dpl_…lz8a3wc16)
- [~] 2.6 A4 · Memory read-back DONE — recall() (semantic + recent-fallback) wired into the nightly loop (dpl_…of0sitzvq). HONEST: a real BKG (per-company entity/relationship graph) is NOT built — that's v2.
- [x] 2.7 Two views — Customer-Education (2.1 "Why?") + Founder Coach (coachFor() grounded in live numbers, one metric/stage) (dpl_…a673u8amw)
- [x] 2.8 Import on-ramp — /api/import audits a real project from its URL (SSRF-guarded, model diagnosis); read-only public audit, operating gated on ownership; prod-verified (dpl_…6o7y2y329)

## Phase 3 — Scale the wedge + harden + run for revenue
*Positioning (proof board) + Operating Policy (observability) + Revenue-Run + GTM-niche.*
- [ ] 3.1 Public proof board — dogfood receipts + consent-gated customer cards (Ring 2)
- [x] 3.2 Metrics instrumentation — cost-per-PPU (net ledger spend ÷ PPU) + forward 14-day retention on the board, fail-soft; promote-on-evidence = promotionEligible() pure fn (night-counter store = v2) (dpl_…aoe68y03z)
- [x] 3.3 Hardening — middleware.ts session refresh + cron failure-spike alert + BYOK shape validation (validateByok, defense-in-depth before the SSRF guard, surfaced in settings) + money/cron route tests (cron fail-closed: 401 unauth + 401 wrong-bearer in smoke) (dpl_…rdh9wyd7).
- [ ] 3.4 ChatOps — Telegram interactive approvals, WhatsApp later
- [x] 3.5 Per-agent model routing — already implemented: modelForAgent() (STRONG_ROLES→MODEL_ID, others→MODEL_CHEAP) + BYOK-first in callModel; set MODEL_ID=opus / MODEL_CHEAP=haiku via env
- [x] 3.6 More playbooks — "Follow-up that closes" + "Referrals that compound" (elite tier); auto-indexed + sitemap + JSON-LD (dpl_…aoe68y03z)
- [ ] 3.7 GTM Lead Desk — warm/opted-in only, no auto-send (after first paying users)
- [ ] 3.8 Success-story post @ ~$10K MRR — the validation lands

## Cross-check vs the ORIGINAL docs/ROADMAP.md (honest gaps found 2026-06-29)
The 28-block plan captured most of the pre-plan backlog, but the cross-check surfaced misses + over-marks:
- ✅ **Block E — Pitch/Surge boundary sharpen DONE** (copy): Pitch = pre-launch demand ("finds the one channel that converts and gets you to launch"); Surge = post-launch growth loops (referrals/retention/flywheel) (dpl_…rdh9wyd7).
- ✅ **Block F leftovers DONE:** proof-type tagging (lib/engine/proof.ts classifyProof — label + ring axis, shown on the proof ledger) · BYOK shape validation (config.validateByok) · Founding seats-left counter (lib/engine/seats.ts seatsRemaining — a REAL cap, never a fake countdown; shown on the Billing card) · money/cron route tests (cron smoke 401×2) (dpl_…rdh9wyd7).
- ✅ **Block C playbooks DONE (4/4):** added "Keep customers, then grow them" (renewals/expansion, NRR) + "Price on value" (pricing & negotiation, Monetizing Innovation) — auto-indexed + sitemap + JSON-LD + smoke (dpl_…rdh9wyd7).
- **2.2 Forge: model-generator, NOT the Claude Agent SDK agentic loop** (v2: Anthropic key + sandbox).
- **2.6 BKG: only memory read-back built; real entity-graph BKG not built** (v2).
- **2.3 host-by-default: only deploy→live-URL (Pages); per-tenant isolation + cost guardrails (B1.1/B1.3) not built** (v2).
- ✅ **2.8 import ownership-verification DONE** — lib/engine/ownership.ts (per-(user,host) HMAC token, DNS-TXT + well-known-file probes, fail-soft) + self-only /api/import/verify (a guest gets no token); gates OPERATING an imported project, reading stays open. Tests + smoke green (dpl_…nzt84).
- ✅ **Autonomy Audit re-score DONE** (founder un-held it) — docs/AUTONOMY-AUDIT.md: composite ~1.3→~2.7/4; the 2026-06-28 critical finding (execute had no server-side auth) is CLOSED by the keystone+policy floor. Honest framing: still supervised L2–3 by design (never L4); safety moved from "no path exists" to "path is server-enforced + bounded." Per-system v2 upgrades listed (dpl_…nzt84).
- ✅ **BKG entity graph DONE** — lib/engine/bkg.ts (pure, derived ON-READ from a company's own activity history — channels/assets/metrics/decisions + co-occurrence edges, ranked by mentions, no new table). summarizeGraph() now feeds the nightly cron context alongside recall() = the structured half of the learning loop. Tests green (dpl_…tbskn). Model-backed extraction = future enrichment.
- ✅ **Per-tenant hosting contract DONE** — lib/engine/hosting.ts (typed HostingProvider + isolationContract + tenantNamespace/namespacedResource); buildOnGitHub now namespaces every repo per-tenant (HMAC of companyId/ownerEmail) so two founders building the same idea can't collide + re-runs are idempotent; bare-slug fallback offline. companyId threaded /api/execute → runAction. Tests green (dpl_…tbskn).
- **Office vs House two-layer: SPECCED, partially realized, v2.** Today /house (founder control layer) + /dashboard (the company "Office") already split it; the full two-layer refactor is designed in docs/PLAN-two-layer-and-chatops.md. Not shipping a stub — it's a post-launch refactor.
- **SDK real coding agent (agentic loop): SPECCED, INFRA-GATED, v2.** Forge v2 (single-shot generate→fallback) ships today; the generate→build→read-errors→fix loop needs @anthropic-ai/claude-agent-sdk + an Anthropic key + a sandbox RUNTIME I cannot provision. Designed in PLAN-two-layer-and-chatops.md + PLAN-deep-tech-autonomy.md. Honest call: no dormant non-functional stub — build it when the key + sandbox exist.

## Deeper cross-check — MORE gaps (founder pushed "what else did you miss", 2026-06-29)
**Compliance/legal:**
- ✅ DONE — Privacy policy now discloses self-enrichment (sources/purpose/opt-out) (dpl_…hs3e2jt9n).
- ✅ DONE — Consent microcopy now on /signup too (AuthPanel signup mode: agree-to-Terms/Privacy + "we'll only email you about your account") (dpl_…38d6j).

**Governance (real):**
- ✅ DONE — Daily/monthly spend caps now enforced via lib/engine/spendguard.ts (best-effort in-memory accumulator + recordSpend on real spend), wired into /api/execute; per-transaction cap already hard. Durable DB spend_log = v2 (dpl_…hs3e2jt9n).

**Positioning/content:**
- ✅ DONE — hero now leads with "Verifiable. Governed." + the 3 messaging pillars (dpl_…yvio65358).
- ✅ DONE — "honesty wedge" playbook reframed to a user lesson ("Out-position a funded rival"), self-pitch removed (dpl_…yvio65358).
- Footer personal Gmail = gated on the custom domain (branded email); personal LinkedIn = founder's choice. (cleanup #5, pending domain)

**Test coverage (charter = continuous QA):**
- ✅ DONE — unit tests added for all new fns (rationale, coach, importer/fetchSiteText, enrich, governApprovals, generateSiteFiles, auditSite) + spendguard; 172 tests total (was 139) (dpl_…i33ws6xa2).
- ✅ DONE — smoke checks for /api/enrich, /api/import (SSRF-blocked, network-free), /api/proof (dpl_…i33ws6xa2).

**Product completeness:**
- ✅ DONE — Enrichment now show→**correct/edit**→confirm, plus a REAL delete: DELETE /api/enrich (self-only, fail-soft) purges any server copy + a permanent local suppression so we never enrich again. Honest: enrichment is computed live, never stored, so DELETE confirms "nothing stored" today; cross-device suppression = privacy_prefs table (v2) (dpl_…38d6j).
- ✅ PATH VERIFIED (code) — first-real-receipt is wired end-to-end + internally consistent: approve → /api/execute (policy floor + approval keystone) → real executor returns {proof} → appendRealResult writes an activity tagged "real ✓" + proof → /api/proof filters real + re-verifies (HEAD/SHA) + classifyProof tag + redacts → ledger renders live/archived. ⛔ FOUNDER-ONLY to actually RUN: needs a signed-in founder (Supabase session) with live keys (GITHUB_TOKEN / Resend / LemonSqueezy) approving one real action. Cannot be faked — an empty board is the honest state until then.
