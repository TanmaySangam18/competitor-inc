-- Real demand test: a live public landing page per idea + honest signup capture.
-- This is what turns the Validation Gate from an "AI estimate" into a measured, real-traffic verdict.
-- Apply via Supabase → SQL Editor (paste & run).
--
--  demand_tests   — one row per live test. PUBLIC-readable (it renders a public page). Created only
--                   via the service role (the dashboard/agent), so strangers can't spawn tests.
--  demand_signups — insert-only capture. Counts are read server-side via the service role; the list
--                   is never exposed through the public API.

create table if not exists public.demand_tests (
  slug        text primary key,
  headline    text not null,
  subhead     text not null default '',
  goal        integer not null default 25,   -- pre-set threshold: signups that count as a strong signal
  created_at  timestamptz not null default now()
);

alter table public.demand_tests enable row level security;

-- Public read (the landing page must render for anonymous visitors). No anon insert/update policy →
-- only the service role can create or edit a test.
create policy "demand tests are publicly readable" on public.demand_tests
  for select to anon, authenticated using (true);

create table if not exists public.demand_signups (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null references public.demand_tests(slug) on delete cascade,
  email       text not null,
  created_at  timestamptz not null default now(),
  unique (slug, email)
);

alter table public.demand_signups enable row level security;

-- Anyone may sign up to an existing test (the FK guarantees the test is real). No select policy →
-- the signup list is read only via the service role (position/count math) or the Table Editor.
create policy "anyone can sign up to a demand test" on public.demand_signups
  for insert to anon, authenticated
  with check (char_length(email) between 3 and 200 and position('@' in email) > 1);

create index if not exists demand_signups_slug_idx on public.demand_signups (slug);
