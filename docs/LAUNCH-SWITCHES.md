# Launch switches — the go-live runbook (verified against code 2026-07-08)

Every value below was read out of the actual code, not memory. You flip these; I can't touch your
dashboards or post as you. ~30 min in one sitting. **Since your keys are already set, start with §0 —
it's the cheap way to catch a wrong name before launch.**

---

## §0 — Verify the keys you already set (do this first)

Four things break silently if they're set wrong. Check these on Vercel:

1. **`MODEL_MID` and `MODEL_CHEAP` must be Groq model ids — not left blank.**
   The engine sends each agent *its tier's* model id (`server.ts`): strong→`MODEL_ID`,
   mid→`MODEL_MID` (defaults to `claude-sonnet-5`), cheap→`MODEL_CHEAP` (defaults to `claude-haiku-4-5`).
   `/sell` runs on the **growth agent = cheap tier**. If `MODEL_CHEAP` is unset, it sends
   `claude-haiku-4-5` to Groq → **400 → silent fallback to the generic template.** That's the exact
   "generic /sell" we saw. All three must be Groq ids (see §A).
2. **`NEXT_PUBLIC_SUPABASE_URL` + all `NEXT_PUBLIC_CHECKOUT_URL*` must be NON-sensitive on Vercel.**
   Sensitive `NEXT_PUBLIC_` vars don't inline into the client bundle (this bit us before). If checkout
   buttons or Supabase read empty on the live site, this is why.
3. **`ANTHROPIC_API_KEY` should be deleted** (you have no API budget). It's ignored while
   `MODEL_PROVIDER=openai-compatible`, but delete it so a stray `MODEL_PROVIDER=anthropic` can't point
   at an unfunded key.
4. **The revenue migration (0011) must be applied** (see §C) or paid Polar orders have nowhere to land.

---

## §A — Make the AI run for free (Groq, ~$0)

You have no Anthropic budget, so **everything** runs on Groq via the OpenAI-compatible path. Set on Vercel
(Project → Settings → Environment Variables, Production):

| Var | Value | Sensitive? |
|---|---|---|
| `MODEL_PROVIDER` | `openai-compatible` | no |
| `MODEL_BASE_URL` | `https://api.groq.com/openai/v1` | no |
| `MODEL_API_KEY` | your Groq key (`gsk_…`) | **yes** |
| `MODEL_ID` | `llama-3.3-70b-versatile` | no |
| `MODEL_MID` | `llama-3.3-70b-versatile` | no |
| `MODEL_CHEAP` | `llama-3.1-8b-instant` | no |

> Groq deprecates model ids periodically — confirm these two are still listed at
> console.groq.com/docs/models and swap if renamed. `MODEL_MID`/`MODEL_CHEAP` exist **because** of the
> per-tier routing above; leaving them at the Claude defaults is the #1 silent-fallback cause.

**Delete:** `ANTHROPIC_API_KEY`, `AI_GATEWAY_API_KEY`, `FREE_TIER_*` (that hybrid path needs a paid
Anthropic key for mid/strong — not your setup). **Verify:** open `/sell` on prod — a tailored plan (not
the generic template) = the key is live end-to-end.

*(Full-stack app builds use a separate model: `FULLSTACK_LLM_API_KEY` + `BUILD_BASE_URL` (defaults to
Gemini's OpenAI-compatible endpoint). Only needed if you turn on `FULLSTACK_BUILDS=1`.)*

---

## §B — Turn on charging (Polar)

Tier ladder is the single source of truth in `lib/engine/billing.ts` → `TIERS`. Create **3 recurring
Polar products** (Free has no checkout). **Critical:** `entitlement.ts → tierOf()` maps the tier by
**substring of the Polar product name / `metadata.plan`** — so the name must contain the keyword, or it
fail-opens to "operator". Set `metadata.plan` on each product to be exact.

| Product name (keyword matters) | Price | `metadata.plan` | Checkout URL goes in… |
|---|---|---|---|
| **competitor.inc — Builder** | $49/mo | `builder` | `NEXT_PUBLIC_CHECKOUT_URL_BUILDER` |
| **competitor.inc — Operator** | $199/mo | `operator` | `NEXT_PUBLIC_CHECKOUT_URL` |
| **competitor.inc — Concierge** | $499/mo | `concierge` | `NEXT_PUBLIC_CHECKOUT_URL_FOUNDER` |

All three checkout URLs are **NON-sensitive**. `NEXT_PUBLIC_CHECKOUT_URL` (Operator) is also what gates
the Build/reveal, so set at least that one.

**Webhook:** Polar → Settings → Webhooks → endpoint `https://<your-domain>/api/billing/polar`, events
`subscription.*` + `order.paid`. Paste its signing secret into `POLAR_WEBHOOK_SECRET` (**sensitive**).

**Copy for the products** (paste into Polar descriptions):
- **Builder — "Your crew builds; you operate."** Real deploys you own · bring your own keys (optional) · email support.
- **Operator — "The crew builds AND runs it."** Autonomous operating loop · GTM drafts → your approval desk · weekly founder reports.
- **Concierge — "Done-with-you — we run it alongside you."** Weekly working session with the crew · direct line + priority · 0% revenue share, you own everything.

*(Optional latent offer: `NEXT_PUBLIC_CHECKOUT_URL_SPRINT` — a one-time "Validation Sprint" — exists in
code but isn't shown on /join. Leave unset unless you want to run it.)*

---

## §C — Public + safe

1. **Migrations:** paste `supabase/migrations/LAUNCH_BUNDLE_go-live.sql` into Supabase → SQL Editor → Run.
   It's idempotent (safe if partly applied) and covers the revenue loop (0009–0012) + usage caps (0022).
2. **`NEXT_PUBLIC_SITE_PUBLIC=1`** (opens indexing; while unset, robots.txt blocks all crawling).
3. **`NEXT_PUBLIC_SITE_URL=https://<your-domain>`** (absolute OG/link-preview images).
4. Confirm GitHub + Google OAuth both enabled in Supabase and sign-in works.

### Env keep / drop (the whole picture)
**SET (launch-critical):** the §A model vars · `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
(both non-sensitive) · `SUPABASE_SERVICE_ROLE_KEY` + `CRON_SECRET` (sensitive; the nightly cron) ·
the §B checkout URLs + `POLAR_WEBHOOK_SECRET` · `NEXT_PUBLIC_SITE_PUBLIC` · `NEXT_PUBLIC_SITE_URL` ·
`TRACK_SALT` (sensitive; funnel dedup).

**DROP / leave blank:** `ANTHROPIC_API_KEY`, `AI_GATEWAY_API_KEY`, `FREE_TIER_*` (§A) ·
`LEMONSQUEEZY_WEBHOOK_SECRET` (migrated to Polar — one provider only) · `STRIPE_*` (Polar is the MoR).

**OPTIONAL (off until you want the feature):** `GITHUB_TOKEN` + `FULLSTACK_*` (real builds) ·
`EMBEDDINGS_*` (semantic memory) · `TELEGRAM_*`/`SLACK_*`/`BLUESKY_*`/`MASTODON_*`/`REDDIT_*` (ChatOps +
auto-marketing) · `NEXT_PUBLIC_FOUNDER_EMAILS` + `METRICS_SECRET` (the /house KPI board) ·
`SENTRY_*`/`OBSERVABILITY_*` (error tracking) · `NEXT_PUBLIC_SERVER_AUTHORITATIVE=1` (needs migration 0024
too — leave off for launch).

---

## §D — The actual bottleneck: traffic

Post the Show HN — see `docs/HN-LAUNCH.md` (updated with the Guildly-teardown angle: *builds AND sells,
runs in the cloud after you close your laptop, no Claude Code subscription*). Product's done;
distribution is the only thing between here and the first collected dollar. Post Tue–Thu ~8–10am ET,
answer every comment, no fabricated traction.
