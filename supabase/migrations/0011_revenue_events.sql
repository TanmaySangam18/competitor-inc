-- R3 of the Revenue Loop: real revenue amounts. Every signature-verified paid Polar order — first
-- purchases AND renewals — lands here with its amount. external_id (the Polar order id) is unique,
-- so webhook retries dedup for free. Service-role only: revenue is read via server aggregates.

create table if not exists public.revenue_events (
  id           uuid primary key default gen_random_uuid(),
  external_id  text not null unique,
  email        text not null,
  amount_cents integer not null check (amount_cents > 0),
  currency     text not null default 'usd',
  product      text,
  slug         text,                          -- company attribution via checkout metadata.slug
  created_at   timestamptz not null default now()
);

create index if not exists revenue_events_slug_idx on public.revenue_events (slug, created_at);
create index if not exists revenue_events_email_idx on public.revenue_events (email);

alter table public.revenue_events enable row level security;
-- no policies: service-role only, by design.
