# Execution Backlog — AI exec team (live)

_Owner: the AI co-founder/exec team. This is a commitment list, not suggestions. Updated as work lands._
_Last updated: 2026-07-04._

## What I'm Owning Next (Not Asking — Doing) — priority order

1. **Weekly operating cadence** — run the growth/ops review; surface decisions + numbers proactively.
2. **Wallet persistence + `/api/wallet`** — parked until migration 0018 applied + a wallet funded.
3. **Agent spend-execution plumbing** — parked behind #2 and a first customer.

_Honest state: the product is launch-ready and the funnel is fully instrumented. Remaining internal
work is either polish that compounds only post-launch, or parked on founder launch actions. The single
highest-leverage move is the free-tier soft-launch (founder-gated). I keep the compounding, no-escalation
work moving in the meantime._

## Decisions made (as the exec team) — 2026-07-04
- **Social platforms (ROI-scoped, NOT all):** TIER 1 = X + Reddit + Hacker News + Product Hunt (where
  first-time/indie founders discover tools; the honest-AI-cofounder contrarian angle lands there).
  Auto-heartbeat = Bluesky + Mastodon (already wired, policy-checked, zero founder effort). Compounding
  = SEO/playbooks (mine). SKIP = TikTok / Instagram / Facebook / Threads (wrong audience+format for a
  B2B founder tool; content cost > ROI). Handle: @competitorinc. I prep profiles/bios/content; founder
  creates accounts (identity) + posts (their voice) = escalations.
- **Happenstance.ai (network-search / warm-intro engine): INTEGRATE post-launch, don't build.**
  Founder-flagged as high customer value — and it is: it targets our customers' two hardest steps,
  finding real people to run validation interviews with, and warm intros to first customers/investors.
  Verdict: an optional, consent-gated **integration** of their REST API (they expose one + Claude/agent
  hooks), NOT a build (a contact-graph is off-moat, expensive, privacy-heavy; data sources are paid or
  ToS-restricted, so there's no clean OSS drop-in — integrate beats build). Same timing trigger as the
  Lead Desk (first paying users); it's the Lead Desk's *sourcing* layer. Guardrails unchanged: customer
  connects their OWN accounts via OAuth (least-privilege), explicit consent + a data-processing addendum
  (third-party contact data = a founder/legal item), no scraping, human approves every intro/outreach.
  Best first scope = validation-interview sourcing (more core to us than generic sales prospecting).
- **Paid ads + ad-creative tooling (Montage/etc.): DEFERRED.** Pre-OPT, pre-revenue, our own playbook
  is demand-first/organic before paid. Committing to a creative tool now is premature spend. Trigger to
  revisit: ≥ proven demand + budget; then AI generates/tests/iterates creative + landing variants on the
  pixel data, spending within the Wallet's `ads` budget + approval rules (exactly what the Wallet enables).

## Recently Shipped (rolling)
- In-app LIVE SITE PREVIEW + founding-member capture (2026-07-04, deployed + verified on prod).
  Reveal now renders the built site *inside* competitor via a sandboxed SSRF-guarded relay
  (/api/site-preview, frame-ancestors self, base-href rewrite) instead of a blurred decoy. Below it an
  adaptive CTA: checkout OFF (F1) → founding-member RESERVATION (reuses /api/interest, would-pay signal,
  founder ping + /house/board tally); checkout ON (post-EAD) → existing Polar pay CTA. **Checkout turned
  OFF in prod** (removed NEXT_PUBLIC_CHECKOUT_URL) so no charge path exists pre-EAD — re-add one var to
  go paid. Honest ceiling documented (preview = wow, not DRM).
- Agent specs enriched (workflow + success metrics) + chat routes to each agent's model tier (5cd734a).
- Agent-spec enrichment (borrowed template concept, NOT the roster): AgentSpec gains `workflow` +
  `successMetrics`; all 6 agents populated; fed into the delegation chat soul so each agent answers
  following its own process + bar; surfaced in the dashboard "Your team" card. AND made per-agent
  model routing true for CHAT — the addressed agent's role now threads delegation → /api/engine →
  runChat/streamChatReply → modelForAgent(role) (was hardcoded to ceo). Honest nuance: a single BYOK
  key with no tiers means every agent shares that one model (2026-07-04, QA green, pushed).
- GTM consolidated: Launch Kit + Ad Campaign merged into one doc (docs/LAUNCH-KIT.md). Standalone
  AD-CAMPAIGN.md removed (2026-07-04).
- Adopted the permanent OSS-Intelligence directive (docs/OSS-INTELLIGENCE-DIRECTIVE.md) as a standing
  build-vs-borrow lens; reviewed msitarzewski/agency-agents (borrow agent-def template + division
  taxonomy; do NOT import roster — post-launch, low-med). Automated OSS scanner = backlog build.
- Decision: onboarding uses OAuth/GitHub App scoped tokens, NOT browser-session takeover (security).
- Build-in-public auto-distribution: opt-in consent toggle (Company.shareInPublic, migration 0020) →
  cron posts a company's REAL verified milestone to competitor.inc's OWN Bluesky/Mastodon (never the
  customer's; never fabricated). The public stream is the platform's marketing (2026-07-04, deployed).
- Wallet spend lifecycle: requestSpend → approve/reject (the one-tap "approve option"), non-custodial
  (budget+policy+audit over the customer's own rails; competitor.inc never holds funds → not a money
  transmitter). Pure + tested (2026-07-04, deployed).
- Ownership decision recorded: customer connects their own GitHub/Vercel (their repo/cost) and funds
  their own wallet on their own rails; founder KYC is only for receiving subscription fees.
- Launch Kit (docs/LAUNCH-KIT.md): copy-paste Show HN / Product Hunt / Reddit / X posts (honest voice,
  no fake metrics) + the 3-action "flip to live" checklist → makes the free-tier soft-launch turnkey
  for the founder. Runbook updated to migrations 0016–0019 (2026-07-04).
- Playbook FAQs + FAQPage structured data on the 3 highest-intent playbooks (validate / zero-budget /
  distribution) — long-tail question intent + rich-results eligibility (2026-07-04, deployed).
- Signup-completion attribution: landing CTA marks a referral; SignupAttribution fires one real
  `signup` for `home` once auth completes (returning sign-ins never counted). Funnel now end-to-end
  (2026-07-04, deployed).
- Conversion instrumentation: `demo_cta` event on all landing CTAs (closes the demo→intent cliff) +
  /api/track returns every funnel stage + founder Landing-Funnel readout on /house/board with step
  conversion + biggest-drop callout. Needs migration 0019 (demo_cta type) (2026-07-04, deployed).
- Playbooks: contextual "Read next" internal linking + demo-first CTA (2026-07-04, deployed).
- Business Wallet: engine + 21 tests + schema (0018) + Settings UI + fail-safe cron spend gate
  (unfunded wallet blocks all real spend) (2026-07-04, deployed).
- SEO: unified canonical/OG domain via lib/site.ts; sitemap 18→38 URLs (2026-07-03, deployed).
- Honest undo (reversibility classifier) + performance-weighted budget allocation (2026-07-03).
- Office budget governance (Allocator + Enforcer) + Brain audit badges (2026-07-03).
- Bento landing, 2D delegation, Company Brain, Slack ChatOps, digest/scorecard schema (2026-07-03).

## The Only Things That Are Genuinely Yours (Real Escalations)
Everything else I plan, reason, and execute. These require YOUR authority:

1. **OPT / work authorization** — the paid-flip trigger. When it lands, tell me; I flip it same day.
2. **Payment processor + KYC for the Business Wallet** — real card funding and merchant/KYC
   (Polar/Stripe) legally require you. I build the whole wallet around it; you complete verification.
3. **One launch post in your name** — I can't publish as you. Kit is ready; you hit publish.
4. **`NEXT_PUBLIC_SITE_PUBLIC=1` + prod migrations** — env/DB actions on your account (I supply exact
   values/SQL; you paste — I can't run your prod DB blind).
5. **Any spend of your money** and **legal/compliance sign-off** (Terms changes, data-processing).
6. **Personal-preference calls** — brand name/voice finalations, pricing changes to your model.
