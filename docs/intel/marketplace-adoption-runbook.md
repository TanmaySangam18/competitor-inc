# Marketplace adoption runbook (2026-07-07)

_Pairs with `vercel-marketplace-review.md`. Provisioning each integration = creating a vendor account + OAuth
(`vercel integration add <slug>`) — a FOUNDER action (the agent can't create accounts / authorize OAuth).
Once provisioned, the agent wires + verifies the code. Ordered by trigger, not all-at-once._

## ✅ Sentry — error tracking (code SHIPPED, fail-soft; just provision)
The SDK is already wired and inert (`sentry.{server,edge}.config.ts`, `instrumentation.ts`,
`instrumentation-client.ts`, `withSentryConfig` in `next.config.ts`) — it does nothing until a DSN exists.
**To turn it on:**
1. `vercel integration add sentry` (creates/links the Sentry account, provisions `SENTRY_DSN` +
   `NEXT_PUBLIC_SENTRY_DSN`; optionally `SENTRY_AUTH_TOKEN` for source-map upload).
2. Redeploy. Errors + traces start flowing to sentry.io. No code changes needed.
_Cost: free tier (5k errors/mo). Effort now: 0 (done). Effort to activate: ~5 min, yours._

## Phase 1 — when real traffic arrives

### Upstash Redis — distributed rate limiting + cache
*Trigger:* public endpoints (waitlist/probe/track) seeing enough traffic that per-instance in-memory limits
(`lib/engine/ratelimit.ts`, resets every cold start) are inaccurate.
1. `vercel integration add upstash` → provisions `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`.
2. Agent work (on provisioning): `npm i @upstash/ratelimit @upstash/redis`; add an **async** `checkRateLimit()`
   that uses Upstash when env is set, else falls back to today's in-memory `rateLimited`; convert the ~10 route
   call-sites (`app/api/**`) to `await` it. Fail-soft: no env → current behavior, unchanged.
_Cost: free tier (10k cmd/day). Effort: ~half a day (the async ripple across routes)._

## Phase 2 — when the multi-company control plane is built (NOT before)

### Inngest — durable per-company workflows / job queue  ⭐ the big one
*Trigger:* the serial daily cron (`app/api/cron/route.ts`) can no longer finish all companies within Vercel's
timeout (~2 companies today) — i.e. we're running many companies.
1. `vercel integration add inngest` → provisions `INNGEST_EVENT_KEY` + `INNGEST_SIGNING_KEY`.
2. Agent work: `npm i inngest`; add `/api/inngest` serve route; convert the cron from a serial loop into
   **fan-out**: emit one `company/shift.requested` event per operating company; an Inngest function runs each
   shift as a durable, retryable, checkpointed step. Keeps `runShift` unchanged (it already needs only DB state).
   Compare against **Vercel Workflow DevKit** (code-native, no vendor) at that point.
_Cost: free tier (generous). Effort: 1–2 days. **Do not build before one company works** (sequencing discipline)._

## Selective — when agents need the capability

### Firecrawl / Parallel — real web data for research/growth agents
*Trigger:* growth/market-research agents need to read the live web (competitor pages, trends) beyond our
current thin crawling.
1. `vercel integration add firecrawl` (or `parallel`) → provisions the API key.
2. Agent work: a `lib/engine/webdata.ts` executor behind the policy gate (like our other executors);
   fail-soft/disabled without the key. Feed results into the organic-growth + demand modules.
_Cost: usage-based (watch it). Effort: ~half a day._

### Vercel Flags SDK — proper feature flags (optional, low priority)
Replaces ad-hoc `NEXT_PUBLIC_*` flags with code-native targeting + kill-switches. Free, no account.
`npm i flags`; migrate flags incrementally. Do only if flag management starts to hurt.

## Explicitly NOT adopting (see review for rationale)
Convex/Neon/Turso (undo Supabase realtime work) · Clerk/Auth0 (lock-in vs Supabase auth) · Stripe (KYC/tax vs
Polar MoR) · Browserbase/Kernel (against our OAuth-not-takeover design) · PostHog-as-analytics (first-party
data is a moat) · Sanity/Mux/Shopify/search (no need yet).

## The moat — build, never buy
Governance (policy/wallet/Approval Inbox/two-gates) · validation verdict · Revenue Loop · crew/Glass Box ·
verify-before-done · server-authoritative reconcile. No marketplace sells "governed autonomy."
