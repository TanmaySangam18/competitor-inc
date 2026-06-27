-- Waitlist + referral capture. Apply via Supabase → SQL Editor (paste & run).
-- Anyone may JOIN (anon + authenticated). Reads are server-only: the /api/waitlist route uses the
-- service role (which bypasses RLS) to compute position + referral counts. No public select policy,
-- so nobody can scrape the list through the API; you read it in the Supabase Table Editor.

create table if not exists public.waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  code        text not null,            -- this signup's own referral code (shareable)
  ref         text,                     -- the referral code that brought them (nullable)
  created_at  timestamptz not null default now()
);

alter table public.waitlist enable row level security;

-- Insert-only for everyone. (No select/update/delete policies → the list can't be read or altered
-- through the public API; the server route uses the service role for position math.)
create policy "anyone can join the waitlist" on public.waitlist
  for insert to anon, authenticated
  with check (char_length(email) between 3 and 200 and position('@' in email) > 1);

create index if not exists waitlist_ref_idx on public.waitlist (ref);
create index if not exists waitlist_created_idx on public.waitlist (created_at);
