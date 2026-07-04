# Auth setup — making Google / GitHub / magic-link sign-in work on prod

**STATUS (2026-07-04):**
- ✅ **GitHub OAuth — ENABLED + verified.** Authorize returns `302 → github.com` (client_id
  `Ov23liT48Lh1ulreqHZV`). Signup via GitHub works.
- ✅ **Client config bug fixed.** `NEXT_PUBLIC_SUPABASE_URL` was missing from the browser build (auth
  ran in "guest" mode → all sign-in dead). Now set in Vercel as a **non-sensitive** var
  (`https://nfxqlyidxrncfawakhuw.supabase.co`) and redeployed. NOTE: Vercel "Sensitive" vars do NOT
  inline into the client bundle and read back empty on `pull` — always use `--no-sensitive` for
  `NEXT_PUBLIC_*`.
- ⬜ **Google OAuth — TODO** (optional; not needed to launch — GitHub + magic-link cover it). §3 below.
- ✅ **Redirect URLs allow-list** includes `https://competitor-inc-zeta.vercel.app/**`.

**Original diagnosis (2026-07-02):** the CODE path is complete — cookie-based `@supabase/ssr`,
session-refresh middleware, canonical `/auth/callback` exchange route. The blockers were all
**Supabase dashboard configuration** (providers not enabled) + the client env bug above.

Everything below happens at **supabase.com/dashboard → your project**.

## 0. The one URL you'll paste everywhere

Your Supabase **OAuth callback URL** (the redirect URI every provider needs):

    https://nfxqlyidxrncfawakhuw.supabase.co/auth/v1/callback

(This is Supabase's endpoint — distinct from the app's own `/auth/callback` route, which Supabase
redirects back to afterward.)

## 1. URL configuration (once)

*Authentication → URL Configuration*:
- **Site URL:** `https://competitor-inc-zeta.vercel.app`
- **Redirect URLs — add both:**
  - `https://competitor-inc-zeta.vercel.app/**`
  - `http://localhost:3000/**` (dev)

## 2. GitHub sign-in — ✅ DONE (2026-07-04)

Enabled + verified. For reference, this is what was done:
1. github.com → Settings → Developer settings → **OAuth Apps → New OAuth App**
   - Homepage URL: `https://competitor-inc-zeta.vercel.app`
   - **Authorization callback URL:** the Supabase callback from §0
2. Register → copy the **Client ID**, generate a **Client secret**.
3. Supabase → *Authentication → Providers → GitHub* → Enable → paste ID + secret → Save.

## 3. Google sign-in — ⬜ TODO (~10 min; optional, not a launch blocker)

⚠️ Google needs its OWN credentials — the GitHub client ID does NOT work (Google IDs look like
`1234567890-abc.apps.googleusercontent.com`).

1. console.cloud.google.com → **New Project** (`competitor-inc`) → select it. (New Google Cloud
   accounts must accept Google's Terms of Service — that's yours to accept.)
2. Search **"Google Auth Platform"** (or *APIs & Services → OAuth consent screen*) → **Get started**
   - **External** · app name `competitor.inc` · your support email · dev contact = you → Finish.
3. *Clients* (or *Credentials → Create credentials → OAuth client ID*) → **Web application**
   - Authorized JavaScript origins: `https://competitor-inc-zeta.vercel.app`
   - **Authorized redirect URIs (exact, no trailing slash):** the Supabase callback from §0
4. **Create** → copy the **Client ID** (`...apps.googleusercontent.com`) + **Client Secret**.
5. ⚠️ **Publish it:** Google Auth Platform → *Audience → Publishing status* → if "Testing", click
   **Publish app → Confirm**. In Testing mode only manually-added test users can sign in; publishing
   lets any Google user in (unverified-app warning is cosmetic until Google verification later).
6. Supabase → *Providers → Google* → Enable → **Client IDs** = the `...apps.googleusercontent.com`
   ID, **Client Secret (for OAuth)** = the secret → Save.

## 4. Magic link (email)

Works today on Supabase's built-in mailer but is **rate-limited (~2–4 emails/hour)** — fine for
you, not for launch. Before launch: *Authentication → SMTP Settings* → point at Resend
(smtp.resend.com, port 465, user `resend`, password = your Resend API key, from = your domain
address). You already planned a Resend account for outreach — same key works here.

## 5. Verify (2 minutes, on the live site)

1. `/login` → **Continue with GitHub** → consent → should land on `/dashboard` signed in.
   (Failures now bounce to `/login` with the real error shown — never a silent dead button.)
2. Same for Google.
3. Sign in with an allow-listed founder email → triple-click the landing wordmark → the House
   should open on prod (this same fix unlocks your Founder account on the live site).
4. `/api/execute` actions and cloud sync start working for signed-in users automatically — they
   read the same session cookie the callback route sets.

## What this unlocks (why it's the keystone)

Real builds attributed to real users · cloud persistence (DB-first for authed users) · the
entitlement gate matching Polar payments to accounts · the Founder account (/house) on prod ·
cron shifts for signed-in founders' companies. One dashboard session, five subsystems.
