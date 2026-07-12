# The Founder 2% — account signups checklist

These are the ONLY things I can't do (they need your identity + card). I build all the code that binds to
them; you create the accounts and hand me the keys when I reach each block. Nothing here charges beyond a
trial without you clicking. **Do the three "START NOW" ones first — they have multi-day lead times that will
otherwise block me.** Everything else you can do the day I ask.

Give me each value by pasting it as an env var (I'll tell you the exact name), or set it in Vercel yourself
— your call. NEVER paste a secret into a public place; DM/secret-field only.

---

## ⏱️ START NOW — these have lead times (do them before I finish the keyless blocks)

### 1. Anthropic API + Claude for Startups  — the agents' brain (Block 5, but apply TODAY)
- Create an API account at console.anthropic.com → **Billing → add card** (pay-as-you-go).
- Apply to **Claude for Startups** (credits, $25k–$100k) — this is an APPLICATION with a review wait, so
  starting today matters. Search "Claude for Startups apply."
- Give me: `ANTHROPIC_API_KEY` (starts `sk-ant-…`).
- Cost: usage-based; credits cover early months if approved.

### 2. A fresh sending domain + cold-email infra  — needs 2–3 WEEKS of warmup (Block 3)
- Buy a **secondary domain** (not your main one — protects your primary from any deliverability hit).
  E.g. `competitorinc-mail.com`. Registrar: Namecheap/Cloudflare.
- Sign up for **Instantly.ai** (or Smartlead) → connect the new domain → set up SPF/DKIM/DMARC (the tool
  walks you through it) → **turn on warmup and let it run ~2–3 weeks**. This clock is why it's "start now."
- Give me (when I reach Block 3): `INSTANTLY_API_KEY` (or `SMARTLEAD_API_KEY`) + the sending domain.
- Cost: domain ~$10/yr; Instantly ~$37–97/mo (has a trial).

### 3. Twilio  — agent phone identities; number provisioning + A2P registration can take days (Block 2)
- Sign up at twilio.com → verify → buy 1 number to start (each outward-facing agent gets one later).
- Start **A2P 10DLC brand/campaign registration** immediately (US SMS compliance — carrier review takes
  days to a couple weeks; without it, SMS is throttled/blocked).
- Give me: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and your first `TWILIO_NUMBER`.
- Cost: ~$1.15/number/mo + per-message/minute usage; trial credit to start.

---

## 🔜 When I ask (no lead time — same-day is fine)

### 4. Slack  — the team room + agent identities (Block 2)
- Create a Slack workspace for the company. Create a Slack **app** (api.slack.com/apps) → enable a bot →
  scopes `chat:write`, `channels:manage`, `users:read` → install to the workspace.
- Give me: `SLACK_BOT_TOKEN` (`xoxb-…`) and `SLACK_APP_TOKEN` (`xapp-…`, if we use Socket Mode).
- Cost: free tier works to start; Pro ~$9/seat (bots are free).

### 5. WhatsApp Business (founder 1:1 updates + approvals) (Block 2)
- Easiest path: it rides on **Twilio** (#3) via the WhatsApp sender — so likely no separate signup, just
  enabling the WhatsApp sender on your Twilio number and confirming your own number to receive.
- Give me: your WhatsApp number to receive briefings. (Reminder: no group chats on WA — Slack is the room.)

### 6. Leads + enrichment (Block 3) — UPDATED 2026-07-12 after API research
- **Explee** (explee.com) — DECIDED over Clay/Apollo: NL semantic search as an API primitive (our fuzzy
  ICPs like "boutique software agencies" work natively), public OpenAPI, 10k req/hr, per-credit billing.
  Free tier (500 credits) → Starter $49/mo. Apollo's API needs ~$357/mo (3-seat Org plan) — skip.
  Clay $185/mo — skip. We use Explee for SEARCH + ENRICH + DEDUP only; sending stays on OUR rail
  (never their AutoGTM mailboxes — breaks named-AI disclosure).
- Give me: `EXPLEE_API_KEY` (from explee.com/api-keys after you create the account).
- Cost: $0 to start, $49/mo when we outgrow free credits.

### 6b. Competitive-selling rail (Block 3) — NEW 2026-07-12
- **Firecrawl** (firecrawl.dev) — weekly competitor-site watch → auto battlecards. Free tier first,
  Hobby $16/mo later. Give me: `FIRECRAWL_API_KEY`.
- **Cal.com** — free tier; create the account, I create event types + booking links + webhooks via API.
  Give me: `CALCOM_API_KEY`.
- **Gmail sending — the one structural item:** consumer @gmail.com breaks autonomy (test-mode OAuth
  tokens die every 7 days). The fix: **Google Workspace on your own domain** + an INTERNAL OAuth app
  with only the `gmail.send` scope (no Google verification needed, tokens don't expire). Then:
  SPF + DKIM + DMARC records on the domain, and enroll it in Google Postmaster Tools.
- Sending rails regardless of volume: one-click unsubscribe, CAN-SPAM footer w/ physical address,
  warm-up at tens/day, auto-halt gate on spam complaints. Workspace trial caps sends at 500/day
  until ~$100 has been paid — fine at our volumes.

### 7. Vapi  — the voice agent for booked/inbound calls only (Block 3)
- Sign up at vapi.ai → connect your Twilio number.
- Give me: `VAPI_API_KEY`.
- Cost: per-minute; trial credit.

### 8. Attio  — the CRM the sales team drives (Block 3)
- Sign up at attio.com → create a workspace → generate an API key.
- Give me: `ATTIO_API_KEY`.
- Cost: trial; ~$34/seat.

### 9. Temporal Cloud  — runs the company with your laptop shut (Block 5)
- Sign up at temporal.io → create a namespace → download the client cert/key (mTLS).
- Give me: `TEMPORAL_ADDRESS`, `TEMPORAL_NAMESPACE`, `TEMPORAL_CLIENT_CERT`, `TEMPORAL_CLIENT_KEY`.
- Cost: usage-based; free credits to start.
- (If setup is heavy, I can run the durable loop on the existing Vercel Cron first and move to Temporal later.)

### 10. Payments + licensing (Block 4)
- **Polar** stays as merchant-of-record for OUR OWN subscription billing (already wired) — separate concern.
- **Stripe Connect** (NEW 2026-07-12, task #78 — the money-layer moat): so the products our org builds
  SHIP already able to transact, with funds flowing to the CUSTOMER's own connected account (we orchestrate,
  never hold the money). Code scaffolded + tested (fail-closed without keys). To turn it on:
  - Create a **Stripe platform account** → enable Connect (Standard accounts).
  - Give me: `STRIPE_SECRET_KEY` (sk_...) + `STRIPE_WEBHOOK_SECRET` (whsec_..., from a webhook endpoint
    pointed at `/api/payments/stripe`). Non-sensitive success/refresh URLs I set myself.
- For software licensing (later): **Keygen** (keygen.sh) → `KEYGEN_API_TOKEN`.
- Note: refunds/payouts/transfers stay founder-approved (the money-movement floor) — I never move money.

### 11. Telemetry for the funding pack (Block 5)
- **LangSmith** (smith.langchain.com) or **Langfuse** — agent tracing. Plus **Sentry** for errors
  (`vercel integration add sentry` auto-sets it).
- Give me: `LANGSMITH_API_KEY` (or `LANGFUSE_PUBLIC_KEY` + `LANGFUSE_SECRET_KEY`).
- Cost: free tiers to start.

### 12. Infra upgrades (only if/when we outgrow free) (any block)
- **Vercel Pro** (~$20/mo) + **Supabase Pro** (~$25/mo) if usage crosses the free limits. Not urgent.

---

## What I do NOT need (and will not ask for)
- Your bank login, card numbers, SSN, or passwords — ever. Only API keys/tokens the services issue.
- Anything that moves money on its own — refunds, payouts, and signatures stay gated to you.

## How this maps to the build
- Block 1 (autopilot flip) + Block 6 (org UI) + Block 7 (proof scaffold): **keyless — I build now.**
- Block 2 needs: Slack (#4), Twilio (#3), WhatsApp (#5).
- Block 3 needs: domain+Instantly (#2), Clay/Apollo (#6), Vapi (#7), Attio (#8).
- Block 4 needs: Keygen/Stripe (#10).
- Block 5 needs: Anthropic (#1), Temporal (#9), telemetry (#11).

**Total when everything's live: ≈ $700–1,200/mo + model tokens. Month one runs mostly on free trials.**
