# Vercel Marketplace review — build vs. borrow vs. already-have (2026-07-07)

_Grounded in the LIVE catalog (`vercel integration discover`, 2026-07-07) and competitor.inc's actual stack.
Governing constraint: our model is **$0 / free-tier / own-your-keys / no lock-in** (F1, pre-revenue) — that's
both a cost reality and a **brand moat** ("you own your code + keys"). So every "adopt" must clear a higher
bar than usual: it has to fill a REAL gap without adding meaningful cost or lock-in._

## TL;DR
We already cover ~90% of the core functional areas with free/own-key choices. The Marketplace's genuinely
additive value for us is **narrow and mostly deferred**: error tracking now (Sentry), and a durable job
queue/workflow engine (Inngest or Upstash QStash) + distributed cache (Upstash Redis) when we outgrow the
single serial cron (Phase 1→2). Almost everything else would either duplicate what we have or add cost/lock-in
that cuts against the moat. **Do not rip-and-replace; adopt 1 thing now (Sentry) and pre-select the Phase-2
queue.**

## What we already have (the baseline the marketplace must beat)
| Area | Current (free/own-key) |
|---|---|
| DB + Auth + Realtime + Storage + Vector | **Supabase** (Postgres, RLS, OAuth, Realtime [migration 0024], Storage, pgvector) |
| Payments | **Polar** (Merchant-of-Record, free, GitHub login; handles tax) — off until work-auth |
| AI / models | Multi-provider routing (Groq/OpenAI-compat, **Gemini** for builds, Anthropic, BYOK) + per-agent tiers |
| Builds / CI | **GitHub Actions + GitHub Pages** (free) + Gemini codegen |
| Email | **Resend** (notifications, digests) |
| Analytics | **First-party pixel** + funnel + revenue_events + scorecard (own the data = honesty moat) |
| Observability | Home-grown `observability.ts` traces + `alerts.ts` (thin) |
| Rate limiting | In-memory `ratelimit.ts` (per-instance only — a real gap at scale) |
| Feature flags | `NEXT_PUBLIC_*` env flags (ad-hoc) |
| Background work | **One Vercel cron** (daily, serial over companies — the known scale ceiling) |

---

## 1. Categorized inventory (live catalog → our lens)

### Databases / Storage
Catalog: Supabase, Neon, Prisma Postgres, Convex, Nile, Turso (SQLite), MotherDuck, AWS Aurora PG/DSQL/DynamoDB/OpenSearch, Redis, Upstash (KV/Vector/Search).
- **Verdict: HAVE (keep Supabase).** We just built server-authoritative state + Realtime on Supabase; switching to Neon/Convex/Turso throws that away and adds lock-in. Convex's "reactive DB" overlaps what we just implemented — no reason to migrate. pgvector already covers vector/memory (skip Upstash Vector).

### Auth
Catalog: Auth0, Clerk, Descope (User Auth [free], MCP Auth).
- **Verdict: HAVE (keep Supabase Auth).** Clerk has nicer DX but adds per-MAU cost + lock-in against the "own your keys" brand. **One watch item:** *Descope MCP Auth* is relevant IF we expose the setup-MCP server publicly (adds OAuth to a remote MCP) — revisit only then.

### Payments
Catalog: Stripe, (LemonSqueezy).
- **Verdict: HAVE (keep Polar).** Polar is Merchant-of-Record (tax/compliance handled), free, no merchant KYC — the right fit for an F1 founder. Stripe needs KYC/tax nexus work we've deliberately deferred. No change.

### Background jobs / workflows / durable execution — **the real gap**
Catalog: **Inngest** (workflows), **Upstash QStash/Workflow** (serverless message queue + durable steps).
- Our `/api/cron` loops all companies **serially** once/day and times out at ~2 companies (Vercel 60s). For the multi-company control plane + long-horizon autonomy, we need a **queue + durable, retryable, fan-out workflows**.
- **Verdict: ADOPT at Phase 2 (highest strategic value).** Inngest (durable step functions, retries, per-company fan-out, generous free tier) is the strongest fit and maps directly to "one job per company, checkpointed, backpressured." Upstash QStash is the lighter-weight alternative (HTTP queue + schedules). Pre-select Inngest now; wire it when we go multi-tenant. Vercel's own **Workflow DevKit (WDK)** is a code-native alternative worth comparing at that point.

### Caching / rate limiting
Catalog: **Upstash Redis/KV**, Redis (official).
- Our in-memory rate limiter doesn't hold across serverless instances (each cold start = fresh counter) — a correctness gap the moment traffic matters.
- **Verdict: ADOPT (Phase 1, small).** Upstash Redis (free tier, per-request, serverless-native) for distributed rate-limiting + hot caches. Low effort, real fix.

### Observability / error tracking / monitoring — **adopt now**
Catalog: **Sentry**, Rollbar, Dash0, Kubiks, **Checkly** (synthetic/uptime), Braintrust (AI evals).
- Our home-grown traces don't capture client-side errors, stack traces, or release health.
- **Verdict: ADOPT Sentry NOW.** Free tier, ~1 hr to wire (Marketplace auto-provisions env + log/trace drains), immediate prod-error visibility. **Checkly** (uptime ping on the app + cron) is a cheap nice-to-have next. **Braintrust** becomes relevant once we systematically eval agent/build quality (Phase 1+).

### Feature flags / experimentation
Catalog: **Statsig**, **GrowthBook** (OSS), **PostHog** (flags + analytics + A/B).
- **Verdict: EXTEND (low priority).** Prefer the **Vercel Flags SDK** (free, code-native) over our env-var flags for real targeting/kill-switches. Keep our own `growth_experiments`/Revenue-Loop A/B (it's a moat). PostHog is tempting (flags + product analytics + session replay, free tier) but would compete with our first-party analytics — only consider if we want session replay.

### Analytics
Catalog: PostHog; (Vercel Web Analytics is native, not a marketplace item).
- **Verdict: HAVE (keep first-party).** Owning the attribution data is a differentiator + honesty-brand asset. Optionally add Vercel Web Analytics for basic traffic. Don't replace the first-party pixel.

### AI / agent capability
Catalog: Deep Infra (models), Chatbase (chatbot), **Parallel** + **Firecrawl** (web search/data for agents), Browserbase/Kernel (browser infra), Autonoma (AI UI testing), CodeRabbit/cubic/Sourcery/Corridor (AI code review/security).
- Models: **HAVE** (own multi-provider routing + BYOK). *Optional:* Vercel **AI Gateway** for managed failover/cost-tracking — only if we want to offload routing; we already have it.
- Web research: **ADOPT selectively (Phase 1+).** Firecrawl/Parallel give growth/research agents real web data (vs. our limited crawling). Additive capability; watch cost.
- Browser infra (Browserbase/Kernel): **SKIP** — conflicts with our design (we chose scoped OAuth/API tokens over browser-session takeover, see onboarding-auth decision).
- AI code review (CodeRabbit/cubic): **Optional dev-tooling** for our own PRs, not the product. Nice-to-have; we have the QA gate.

### CMS / Search / Video / Commerce
Catalog: Sanity (CMS), Upstash Search/Mixedbread/OpenSearch, Mux (video), Shopify.
- **Verdict: SKIP.** Content is file-based (playbooks/blog); data is too small to need search; no video/commerce need. Revisit search only if content volume explodes.

### Email (agent-native)
Catalog: Resend (we use), **AgentMail** (programmatic inboxes for agents).
- **Verdict: HAVE (keep Resend).** *Watch:* AgentMail could give each autonomous company its own send/receive inbox identity later — defer (cost + not needed pre-scale).

---

## 2. Comparison — marketplace vs. in-house (the decisions that matter)

| Capability | Marketplace option | Build in-house effort | Maintenance | Lock-in/cost risk | **Recommendation** |
|---|---|---|---|---|---|
| Error tracking | Sentry (free tier) | Med (we'd reinvent poorly) | Low (managed) | Low (free tier; portable) | **Adopt now** |
| Durable job queue / workflows | Inngest / Upstash QStash | **High** (queue + retries + checkpointing is hard) | High if self-built | Low–Med (free tiers; standard patterns) | **Adopt Phase 2** |
| Distributed rate-limit / cache | Upstash Redis | Med (correct cross-instance is fiddly) | Med | Low (free tier) | **Adopt Phase 1** |
| Feature flags | Vercel Flags SDK | Low (we have env flags) | Low | None (code-native) | **Extend, low priority** |
| Web data for agents | Firecrawl / Parallel | High (crawling/anti-bot is a slog) | High | Med (usage cost) | **Adopt selectively** |
| DB/Auth/Realtime | Supabase (have) / Neon / Convex / Clerk | — (already built) | — | Migration cost + lock-in | **Keep Supabase** |
| Payments | Polar (have) / Stripe | — | — | Stripe KYC/tax burden | **Keep Polar** |
| Analytics | First-party (have) / PostHog | — | — | Lose data-ownership moat | **Keep first-party** |
| Governance / validation / revenue-loop / crew | **none exists** | This IS the product | — | — | **Build (the moat)** |

## 3. Recommended stack (maximize reuse, protect the moat)
- **Keep (owned/free):** Supabase (DB/auth/realtime/storage/vector), Polar (payments), Resend (email), first-party analytics, multi-provider AI routing + BYOK, GitHub Actions/Pages builds.
- **Adopt now (free tier, low effort):** **Sentry** (error tracking).
- **Adopt Phase 1:** **Upstash Redis** (distributed rate-limit/cache); optionally **Checkly** (uptime).
- **Adopt Phase 2 (multi-tenant control plane):** **Inngest** (durable per-company workflows/queue) — the answer to the serial-cron ceiling; compare vs. Vercel Workflow DevKit at that point.
- **Adopt selectively:** **Firecrawl/Parallel** for agent web-research; **Vercel Flags SDK** for real flags.
- **Skip:** Convex/Neon/Turso (would undo Supabase work), Clerk/Auth0 (lock-in vs Supabase auth), Stripe (KYC burden vs Polar), Browserbase/Kernel (against our OAuth-not-takeover design), Sanity/Mux/Shopify/search (no need yet).

## 4. Features that genuinely require custom implementation (no marketplace equivalent — the moat)
1. **The governance spine** — policy engine (5 gates), wallet, Approval Inbox, two-gates (approve plan / approve payment), hard spend cap. *No one sells "governed autonomy."*
2. **Validation gate / honest demand verdict** — the "prove-it-before-you-build-it" bookend.
3. **Revenue Loop** — verifiable outcome/attribution with anti-fabrication invariants.
4. **The crew/orchestration engine + Glass Box** — dynamic crew, sub-agents, ChatOps, live activity log.
5. **verify-before-done, secret-scan, mission-invariants, server-authoritative reconcile** — the reliability/trust layer.
6. **The "own an AI-run software company" product itself** — the whole thesis. Marketplace fills plumbing; it does not build the company.

## 5. Rationale (one line each)
- **Bias to keep what we have:** every adopted managed service adds cost + lock-in, which directly erodes our "own your code/keys, $0, no lock-in" positioning — so the bar to adopt is high.
- **Adopt only where there's a REAL gap a free tier fills cheaply:** error visibility (Sentry), cross-instance rate-limit (Upstash), and — the big one — durable multi-company workflows (Inngest) when the serial cron dies at scale.
- **Never outsource the moat:** governance, validation, verifiable revenue, and the crew are the product; there is nothing to buy.
- **Sequencing discipline holds:** adopt the queue/cache only when Phase 1→2 makes them necessary; don't add dependencies before one company works for real.
