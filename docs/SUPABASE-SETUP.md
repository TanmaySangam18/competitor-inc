> ⚠️ **STALE (2026-07-03).** Says run only `0001_init.sql` — there are now **14 migrations (0001–0014)**; run ALL in filename order or prod ships without entitlements, approvals, RLS tightening, and the revenue loop. Auth specifics: [AUTH-SETUP.md](AUTH-SETUP.md).

# Activating Supabase (auth + persistent multi-company)

competitor.inc ships with the **full Supabase integration already coded** — schema migration,
row-level security, client modules, and a typed data-access layer. It's **gated behind env
vars**: until you provide a project, the app runs on browser `localStorage` (single company,
no login). Provide the two env vars and it switches to real auth + Postgres.

> I (the assistant) could not create tables for you from this session — there's no Supabase MCP
> connection, CLI, or credentials available here. These 3 steps take ~5 minutes and do it.

## Step 1 — Create a project
Create a free project at https://supabase.com → **New project**. Note the project URL and the
**anon / publishable** key (Project Settings → API). *(The anon key is safe for the browser; never
put the `service_role` key in client code or `.env` with `NEXT_PUBLIC_`.)*

## Step 2 — Run the migration
Open **SQL Editor** in the dashboard, paste the contents of
[`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql), and **Run**.
(Or, with the Supabase CLI linked: `supabase db push`.)
This creates `companies`, `activities`, `approvals` and enables row-level security so each user
only ever sees their own data.

## Step 3 — Add env vars
In `.env.local` (see [`.env.example`](../.env.example)):

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

Restart `npm run dev`. `isSupabaseConfigured()` now returns true.

## What's wired vs. what's next
- ✅ Schema + RLS migration (`supabase/migrations/0001_init.sql`)
- ✅ Browser + server clients (`lib/supabase/{client,server}.ts`), env-gated
- ✅ Typed data-access layer (`lib/engine/db.ts`) — CRUD for companies/activities/approvals
- ⏳ **Next (once a project exists & is reachable for testing):** wire auth UI (sign in/up),
  swap `useEngine`'s local store for `db.ts`, add multi-company switching, and a middleware
  session refresh. These are deferred deliberately so they can be **verified against a live DB**
  rather than shipped blind.

Tell me when the project is up (or paste the URL — *not* the keys) and I'll finish the auth +
persistence wiring and verify it end-to-end.
