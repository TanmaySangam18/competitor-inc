-- ═══════════════════════════════════════════════════════════════════════════
-- LAUNCH_BUNDLE_go-live.sql — the revenue + limits migrations, in ONE paste.
--
-- WHAT: bundles 0009 (product/goal + approval kinds), 0010 (funnel events),
--       0011 (revenue_events — REQUIRED for the Polar webhook to record money),
--       0012 (growth experiments), 0022 (server-side per-user usage caps).
-- WHY:  without 0011 the paid Polar orders have nowhere to land → you literally
--       cannot measure "collected revenue" (the goal). Without 0022 users on your
--       model key can drain the budget.
-- HOW:  Supabase → SQL Editor → paste → Run. Fully IDEMPOTENT + dependency-safe
--       (only touches companies/approvals/auth.users, which already exist once
--       signup works). Safe to run even if some parts were applied before.
--
-- NOT included (apply separately, in order, only if you need them):
--   0023 chatops · 0024 realtime (needs rocks/issues; only for
--   NEXT_PUBLIC_SERVER_AUTHORITATIVE=1) · 0025 lifecycle sends.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 0009: company product/goal persistence + widen approval kinds ────────────
alter table public.companies add column if not exists goal jsonb;
alter table public.companies add column if not exists product jsonb;

alter table public.approvals drop constraint if exists approvals_kind_check;
alter table public.approvals add constraint approvals_kind_check
  check (kind in ('spend','outreach','deploy','delete','bluesky','mastodon','twitter','linkedin','reddit'));

-- ── 0010: first-party funnel events (views/signups; purchases NEVER here) ─────
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null,
  type        text not null check (type in ('view','signup','purchase')),
  value_cents integer,
  source      text,
  dedup_hash  text,
  created_at  timestamptz not null default now()
);
create unique index if not exists events_dedup_uq on public.events (dedup_hash);
create index if not exists events_slug_type_idx on public.events (slug, type, created_at);
alter table public.events enable row level security;
-- no policies: service-role only, by design.

-- ── 0011: real revenue amounts (the Polar webhook writes here) ───────────────
create table if not exists public.revenue_events (
  id           uuid primary key default gen_random_uuid(),
  external_id  text not null unique,
  email        text not null,
  amount_cents integer not null check (amount_cents > 0),
  currency     text not null default 'usd',
  product      text,
  slug         text,
  created_at   timestamptz not null default now()
);
create index if not exists revenue_events_slug_idx on public.revenue_events (slug, created_at);
create index if not exists revenue_events_email_idx on public.revenue_events (email);
alter table public.revenue_events enable row level security;
-- no policies: service-role only, by design.

-- ── 0012: the growth-experiment ledger ──────────────────────────────────────
create table if not exists public.growth_experiments (
  id            uuid primary key,
  company_id    uuid not null references public.companies(id) on delete cascade,
  hypothesis    text not null,
  metric        text not null check (metric in ('views','signups','signup_rate','paying_customers','revenue_cents')),
  baseline      numeric,
  target        numeric not null,
  started_night integer not null,
  window_nights integer not null default 3,
  status        text not null default 'running' check (status in ('running','won','lost','inconclusive')),
  result_value  numeric,
  result_basis  text check (result_basis in ('real','estimate')),
  learning      text,
  activity_ids  jsonb not null default '[]',
  created_at    timestamptz not null default now(),
  closed_at     timestamptz
);
create index if not exists growth_experiments_company_idx on public.growth_experiments (company_id, status);
alter table public.growth_experiments enable row level security;

-- drop-if-exists guards added so this bundle is safe to re-run (the raw 0012 used bare CREATE POLICY).
drop policy if exists "growth_experiments - select own" on public.growth_experiments;
create policy "growth_experiments - select own" on public.growth_experiments
  for select to authenticated using (
    exists (select 1 from public.companies c where c.id = growth_experiments.company_id and c.user_id = auth.uid())
  );
drop policy if exists "growth_experiments - insert own" on public.growth_experiments;
create policy "growth_experiments - insert own" on public.growth_experiments
  for insert to authenticated with check (
    exists (select 1 from public.companies c where c.id = growth_experiments.company_id and c.user_id = auth.uid())
  );
drop policy if exists "growth_experiments - update own" on public.growth_experiments;
create policy "growth_experiments - update own" on public.growth_experiments
  for update to authenticated using (
    exists (select 1 from public.companies c where c.id = growth_experiments.company_id and c.user_id = auth.uid())
  );

-- ── 0022: server-enforced per-user daily usage caps ─────────────────────────
create table if not exists public.usage_counters (
  user_id uuid not null references auth.users (id) on delete cascade,
  day     date not null,
  kind    text not null,
  count   integer not null default 0,
  primary key (user_id, day, kind)
);
alter table public.usage_counters enable row level security;
drop policy if exists "usage_counters - select own" on public.usage_counters;
create policy "usage_counters - select own" on public.usage_counters
  for select using (user_id = auth.uid());

create or replace function public.bump_usage(p_kind text, p_limit integer)
returns table(allowed boolean, used integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  d   date := (now() at time zone 'utc')::date;
  cur integer;
begin
  if uid is null then
    return query select false, 0;
    return;
  end if;
  insert into public.usage_counters (user_id, day, kind, count)
    values (uid, d, p_kind, 0)
    on conflict (user_id, day, kind) do nothing;
  select count into cur from public.usage_counters
    where user_id = uid and day = d and kind = p_kind
    for update;
  if cur >= p_limit then
    return query select false, cur;
    return;
  end if;
  update public.usage_counters set count = count + 1
    where user_id = uid and day = d and kind = p_kind
    returning count into cur;
  return query select true, cur;
end;
$$;
revoke all on function public.bump_usage(text, integer) from public;
grant execute on function public.bump_usage(text, integer) to authenticated;
