-- Pay-to-build entitlements. Validating an idea is free; BUILDING & running requires an active Operator
-- subscription. The LemonSqueezy webhook (service role) writes rows here; a signed-in user can read ONLY
-- their own row (RLS), so the client can gate the Build button. Apply via Supabase → SQL Editor.

create table if not exists public.entitlements (
  email               text primary key,
  plan                text not null default 'operator',
  status              text not null default 'inactive',   -- 'active' | 'inactive'
  current_period_end  timestamptz,
  updated_at          timestamptz not null default now()
);

alter table public.entitlements enable row level security;

-- A signed-in user reads only their own entitlement (to unlock Build). No insert/update policy →
-- writes are service-role only (the billing webhook); nobody can grant themselves access via the API.
create policy "owner reads own entitlement" on public.entitlements
  for select to authenticated using (email = (auth.jwt() ->> 'email'));
