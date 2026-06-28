# Customer onboarding & provisioning — the model (Block B)

**The question:** when a customer enters their idea, do we auto-set-up their Vercel/Supabase/connections
like we did for competitor.inc — or guide them once? **Decision (2026-06-27):** both, by design — *zero setup
to validate, one-time guided connect (or we host it) to build, then automatic.* Never silently create
accounts in their name.

## The model

**1. Validate → zero setup (LIVE).** No infra needed. The demand-test landing page is hosted on *our*
domain (`/t/<slug>`), the AI estimate runs on our engine. The customer types an idea and gets a verdict —
nothing to connect. This is the activation moment; it must stay frictionless.

**2. Build → two paths, customer's choice:**
- **Host-by-default (recommended for first-time founders) — *PHASE, not yet live*.** We run the customer's
  app on *our* infra as an isolated tenant, so it "just works" with zero setup — fastest time-to-value. The
  Operator subscription covers the infra; **one-click eject/export** preserves the *own-everything* wedge.
- **Connect your own (LIVE, gated).** A one-time **OAuth Authorize** the customer clicks → we then deploy to
  *their* GitHub/Vercel/Supabase automatically. Today this is the BYOK-style connect in
  **Settings → Integrations** (GitHub token, etc.) + the gated execution layer (`lib/engine/execution.ts`);
  full OAuth (one-click, no token paste) is the upgrade.

**3. The hard line (trust + ToS):** we **never** silently create accounts in a user's name or handle their
credentials. Any "connect" is a one-time Authorize *they* click — the same "I drive, you click the
irreversible button" model we use everywhere. competitor.inc **guides that one step, once**, then it's
automatic. The one-time setup items surface in the **action bell** ("Connect …").

## What's live vs the real engineering ahead (honest)

| Piece | State |
|---|---|
| Validate with zero setup (hosted `/t`) | ✅ live |
| Connect-your-own (GitHub/Resend/ads via Settings) + gated execution | ✅ live (gated on the user's token/keys) |
| One-time setup surfaced in the action bell | ✅ live |
| Export / eject your data (own-everything) | ✅ live (Settings → Account → export) |
| **Host-by-default tenant provisioning** (we spin the app + DB) | ⛔ **real engineering phase** — see below |
| **One-click OAuth** (Vercel/Supabase/GitHub, no token paste) | ⛔ phase — needs OAuth apps registered on the founder's accounts |

## The host-by-default phase — shaped (Shape Up), to build next
Appetite: large, multi-step. Honest scope (this is genuinely multi-week, not a one-turn build — which is
why it is NOT faked):
- **B-host-1:** per-customer tenant model (schema/namespace isolation in our Supabase; a deploy target on
  our Vercel) + the contract `provisionTenant(company) → { appUrl, dbRef }`, gated + fail-soft.
- **B-host-2:** deploy orchestration (Forge ships the MVP into the tenant; verify-before-done) + the live
  app URL as proof in the Glass Box.
- **B-host-3:** per-tenant cost guardrails (the Operator subscription must cover infra — watch unit
  economics; this is the one block with a real cost-model implication for the founder).
- **B-oauth:** replace token-paste with one-click OAuth for Vercel (integration API), Supabase (Management
  API), GitHub (App) — one-time Authorize, then automatic.
- **B-eject:** one-click "move it to your own infra" (own-everything in one button).

**Why not fake it now:** claiming "it auto-provisions" while it's simulated is the exact dishonesty our
product sells against. Build it real, gated, with proof — or say it's a phase. This doc is the contract for
that build.
