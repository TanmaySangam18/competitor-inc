-- Generic interest/signup capture for standalone apps we launch (e.g. Lockin at /lockin).
-- Apply via Supabase → SQL Editor (paste & run). Same posture as waitlist: insert-only for everyone,
-- reads are server-only via the service role (/api/interest). No public select policy → can't be scraped.
--
-- RENUMBERED 2026-07-02: formerly 0005_interest.sql, which collided with 0005_agent_memory.sql (two
-- files, one version prefix — a skip/repair landmine for CLI-driven migration runs). This SQL was
-- ALREADY APPLIED to prod via the SQL editor on 2026-06-30; everything is `if not exists`, so
-- re-running is a safe no-op.

create table if not exists public.interest (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  app         text not null default 'unknown',  -- which app the person signed up for
  note        text,                             -- optional free-text (what they want / feedback)
  created_at  timestamptz not null default now(),
  unique (email, app)                           -- one signup per email per app (idempotent re-submits)
);

alter table public.interest enable row level security;

-- Insert-only for everyone. (No select/update/delete policies → not readable/alterable via public API;
-- the server route uses the service role to count + read.)
create policy "anyone can register interest" on public.interest
  for insert to anon, authenticated
  with check (char_length(email) between 3 and 200 and position('@' in email) > 1);

create index if not exists interest_app_idx on public.interest (app);
create index if not exists interest_created_idx on public.interest (created_at);
