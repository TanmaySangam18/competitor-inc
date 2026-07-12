# competitor.inc — Roadmap to $10k (from 2026-07-12)

**North Star:** collected/SETTLED revenue ≥ **$10,000** in a trailing-30-day window by **Day 60**, ≥60% repeatable.
**The arc:** Build (✅ done) → **Sell** (now) → **Collect** ($10k). We can build+run software; the gap is customers + money.

## Done — the foundation
Capability ladder S1–S3 (agent org builds→deploys→runs real SaaS) · pillars P1–P4 (product memory, parallel eng, verification wall, substrate) · governance (policy engine, spend caps, kill switch, audit trail) · **teal one-page cockpit** (no-scroll, sidebar IA, real job titles, stats pie) · **Stripe Connect scaffold** · playbook adopted (docs/PRODUCT-PLAYBOOK.md) · all vendor research settled (Explee, Firecrawl, Gmail, Cal.com, anything.com, domains, cs249r).

## What's left — priority order toward the $10k

| # | Brick | Serves goal | Status | What's left | Your 2% (blocker) | Priority |
|---|---|---|---|---|---|---|
| — | **Sign the mandate** | unlocks autonomy + S3 recall proof | waiting on you | sign in /dashboard → Consent Rails; then I fire a change + prove cross-session recall | **sign** | P0 gate |
| 74 | **Sales stack** (find → book → sell) | get customers | scaffolds pending | booking sensor (Cal) + competitor battlecards + governed outreach rail; then live | Cal key or VPS · Workspace+DNS · Explee key · (Firecrawl key) | **P0** |
| 78 | **Stripe Connect go-live** | verifiable revenue (built products transact) | scaffold shipped ✅ | onboarding route + dashboard "connect" + pipeline provisioning + policy gate | Stripe platform acct + `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` | **P0** |
| 56 | **Revenue Rails** (Polar checkout for OUR subs) | collect our subscription $ | pending | founder creates Polar products + sets checkout URL | Polar products + `NEXT_PUBLIC_CHECKOUT_URL*` + `POLAR_WEBHOOK_SECRET` | **P0** |
| — | **/signup + a real stranger** | converts capability → revenue | pending | standalone signup route; a non-founder transacts | — | **P0** |
| 73 | **Explee lead sourcing** | fill the pipeline | pending | build ICP index (crawl4ai + pgvector) + buy last-mile contact verify | Explee key | P1 |
| 79 | **Customer subdomains** (Vercel for Platforms) | "it's really live" wow | pending | middleware tenant router + per-product subdomain + custom-domain attach (Domains API) | move `competitor.inc` NS to Vercel + add wildcard | P1 |
| 72 | **Deliberation engine + Meetings** | experience depth (real agent debate → Decision Records) | pending | bounded-round LLM debate, transcript-first, retire scripted banter | (model key) | P2 |
| 76 | **AI SEO pipeline** | inbound growth | pending | SERP research → 1 pillar + 15 subtopic briefs → drafts (honesty-gated) → publish → attribution | Firecrawl key | P2 |
| 75 | **cs249r knowledge intake** | agent engineering quality | verdict done (NC-licensed) | ORIGINAL distillations into architect-knowledge (never ingest prose) | (optional: email Harvard for license) | P3 |
| — | **Claude PR Reviewer** (this repo) | code-quality guard | added ✅ | push repo + set `ANTHROPIC_API_KEY` secret | push + secret | done-ish |

## Deferred (revenue-gated, per charter)
Enterprise trust stack (SOC2/ISO), platform/public API (S5), self-hosting off Vercel (Coolify/Dokploy — only once Vercel cost/limits bite), mobile/App-Store, AI-media gen, integrations marketplace. Don't chase parity.

## The honest read
Machine ≈built; **goal ≈10–15%** ($0 collected, 0 paying customers). Everything above "Deferred" exists to move one number: settled revenue. The two P0 gates only you can clear — **sign the mandate** and **connect the money rails (Stripe/Polar keys)** — are what turn shipped capability into the first dollar.
