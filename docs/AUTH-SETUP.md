# Auth setup — making Google / GitHub / magic-link sign-in work on prod

**Why sign-in fails today (verified 2026-07-02):** the CODE path is complete and aligned —
cookie-based `@supabase/ssr` on browser + server, session-refresh middleware, and (new) the
canonical `/auth/callback` exchange route. What's missing is **Supabase dashboard configuration**:
the Google and GitHub providers were never enabled, so `signInWithOAuth` is rejected by Supabase
before any redirect happens. That's a founder-only action (it needs your Google/GitHub accounts).

Everything below happens at **supabase.com/dashboard → your project**. ~20 minutes total.

## 0. The one URL you'll paste everywhere

Your Supabase **OAuth callback URL** (find it under *Authentication → Providers → any provider*):

    https://<your-project-ref>.supabase.co/auth/v1/callback

(`<your-project-ref>` is in the dashboard URL / Settings → API. This is Supabase's endpoint —
distinct from the app's own `/auth/callback` route, which Supabase redirects back to afterward.)

## 1. URL configuration (once)

*Authentication → URL Configuration*:
- **Site URL:** `https://competitor-inc-zeta.vercel.app`
- **Redirect URLs — add both:**
  - `https://competitor-inc-zeta.vercel.app/**`
  - `http://localhost:3000/**` (dev)

## 2. GitHub sign-in (~5 min — do this one first; our beachhead lives on GitHub)

1. github.com → Settings → Developer settings → **OAuth Apps → New OAuth App**
   - Homepage URL: `https://competitor-inc-zeta.vercel.app`
   - **Authorization callback URL:** the Supabase callback from §0
2. Register → copy the **Client ID**, generate a **Client secret**.
3. Supabase → *Authentication → Providers → GitHub* → Enable → paste ID + secret → Save.

## 3. Google sign-in (~10 min)

1. console.cloud.google.com → create/select a project → *APIs & Services → OAuth consent screen*
   - External · app name `competitor.inc` · your support email · add domain `vercel.app` · Save.
2. *Credentials → Create credentials → OAuth client ID → Web application*
   - Authorized JavaScript origins: `https://competitor-inc-zeta.vercel.app`
   - **Authorized redirect URIs:** the Supabase callback from §0
3. Copy Client ID + secret → Supabase → *Providers → Google* → Enable → paste → Save.
4. Consent screen can stay in "Testing" while it's just you — add your emails as test users.
   Publish it before launch (unverified-app warning is cosmetic until ~100 users).

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
