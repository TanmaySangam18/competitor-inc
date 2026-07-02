-- R2 of the Revenue Loop: first-party funnel events (our own pixel).
-- views + signups per slug; purchases NEVER arrive here (revenue only via the Polar webhook, so the
-- public pixel can't fabricate money). RLS on with NO anon policies: all reads/writes go through the
-- server (service role) — aggregates only ever leave the API.

create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null,               -- joins demand_tests.slug / companies.slug
  type        text not null check (type in ('view','signup','purchase')),
  value_cents integer,                     -- only for purchase rows (webhook-written)
  source      text,                        -- utm_source/ref, truncated server-side
  dedup_hash  text,                        -- salted hash(ip+ua+slug+type+day); raw IP never stored
  created_at  timestamptz not null default now()
);

-- Plain unique index (not partial): Postgres treats NULLs as distinct, so no-salt rows always
-- insert, and ON CONFLICT (dedup_hash) is targetable by the upsert.
create unique index if not exists events_dedup_uq on public.events (dedup_hash);
create index if not exists events_slug_type_idx on public.events (slug, type, created_at);

alter table public.events enable row level security;
-- no policies: service-role only, by design.
