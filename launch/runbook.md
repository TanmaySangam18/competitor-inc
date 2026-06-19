# Deploy runbook (for the techie friend)

~30–45 min, no prior context needed. competitor.inc is a standard Next.js 16 app. It runs fully in
**simulated + local mode with zero config** — the steps below take it live and (optionally) turn on
the real pieces.

```bash
# 1. Get the code
git clone https://github.com/TanmaySangam18/competitor-inc
cd competitor-inc && npm install

# 2. Confirm it runs locally
npm run qa     # types + tests + build + e2e smoke — should end "SMOKE PASSED"
npm start      # serves the production build at http://localhost:3000
```

3. **Create free accounts:** a **Vercel** project (Hobby = $0) and — optional, for real auth/DB — a
   **Supabase** project ($0).
4. **(If using Supabase)** open the Supabase SQL editor and run `supabase/migrations/0001_init.sql`.
5. **Set env vars in Vercel** (all optional — app works with none):
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` → real auth + persistence
   - `NEXT_PUBLIC_CHECKOUT_URL` → the founder's LemonSqueezy/Gumroad link (turns on Founding checkout)
   - `SUPABASE_SERVICE_ROLE_KEY` + `CRON_SECRET` → nightly heartbeat cron
   - **Model engine (optional, swappable — pick ONE, or leave unset for the offline simulated demo):**
     - `ROOMIE_PROVIDER=anthropic` + `ANTHROPIC_API_KEY`, or
     - `ROOMIE_PROVIDER=gateway` + `AI_GATEWAY_API_KEY` (Vercel AI Gateway — any provider via a
       `provider/model` string in `ROOMIE_MODEL`), or
     - `ROOMIE_PROVIDER=openai-compatible` + `ROOMIE_PRIVATE_BASE_URL` + `ROOMIE_API_KEY` (OpenAI, Groq,
       OpenRouter, Together, a self-hosted model, …).
     - Users can still **Bring Their Own Key** in-app regardless (stored only in their browser).
     - Full annotated list in [`../.env.example`](../.env.example).
6. **Deploy:** connect the GitHub repo in the Vercel dashboard → **Deploy** (or `npx vercel --prod`).
7. **Domain:** buy one (~$12, e.g. Porkbun) and point it at the Vercel project.
8. **Go live:** confirm the domain loads, then hand the founder the green light to publish the
   `launch/` posts. Done — competitor.inc is on the web.

**Rollback:** Vercel keeps every deployment — one click to promote a previous one. Nothing here is destructive.
