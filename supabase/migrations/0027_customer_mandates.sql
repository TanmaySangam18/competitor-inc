-- Consent Rails (Block 3 slice 3): the customer's ONE-SIGNATURE standing mandate, persisted per company.
-- The pure decision core is lib/org/customer-mandate.ts; this is its storage. Deny-by-default holds in
-- the data model too: NO ROW ⇒ unsigned ⇒ nothing runs unattended. The kill switch is a column so one
-- UPDATE halts everything instantly (no deploy, no cache).

create table if not exists public.customer_mandates (
  company_id              uuid primary key references public.companies (id) on delete cascade,
  user_id                 uuid not null references auth.users (id) on delete cascade,
  signed_at               timestamptz,                       -- null ⇒ explicitly revoked (unsigned)
  scopes                  jsonb not null default '[]'::jsonb, -- MandateAct[] the signature authorized
  monthly_spend_cap_cents integer not null default 5000,      -- hard ceiling ($50 default)
  kill_switch             boolean not null default false,     -- true ⇒ everything halts
  updated_at              timestamptz not null default now()
);

alter table public.customer_mandates enable row level security;

-- The owner reads + writes ONLY their own mandate (auth.uid). The cron uses the service role.
drop policy if exists customer_mandates_owner_select on public.customer_mandates;
create policy customer_mandates_owner_select on public.customer_mandates
  for select using (auth.uid() = user_id);
drop policy if exists customer_mandates_owner_insert on public.customer_mandates;
create policy customer_mandates_owner_insert on public.customer_mandates
  for insert with check (auth.uid() = user_id);
drop policy if exists customer_mandates_owner_update on public.customer_mandates;
create policy customer_mandates_owner_update on public.customer_mandates
  for update using (auth.uid() = user_id);
