-- ALL PENDING PROD MIGRATIONS, one paste (idempotent — safe to re-run).
-- Supabase dashboard → SQL Editor → paste this whole file → Run. Generated 2026-07-02.

-- ══ 0009_growth_goal ══
-- R1 of the Revenue Loop (docs/plan: Block R). Apply via Supabase → SQL Editor.
-- 1) companies.goal — the founder-set north star every shift is judged against.
-- 2) companies.product — FIXES a live persistence gap: the client tracks product {url, status}
--    but the DB never stored it, so cron-side shifts lost imported companies' "live" status.
-- 3) Widen approvals.kind to match the ApprovalKind union in lib/engine/types.ts — the original
--    CHECK ('spend','outreach','deploy','delete') rejects social kinds the engine emits today.

alter table public.companies add column if not exists goal jsonb;
alter table public.companies add column if not exists product jsonb;

alter table public.approvals drop constraint if exists approvals_kind_check;
alter table public.approvals add constraint approvals_kind_check
  check (kind in ('spend','outreach','deploy','delete','bluesky','mastodon','twitter','linkedin','reddit'));

-- ══ 0010_events ══
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

-- ══ 0011_revenue_events ══
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

-- ══ 0012_growth_experiments ══
-- R4 of the Revenue Loop: the experiment ledger. Append + field-flip (same concurrency posture as
-- approvals.resolved): the client or cron INSERTs proposals and UPDATEs a row once when it closes —
-- no whole-row clobber between the two writers. ids are client-authoritative UUIDs.

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

-- Owner read/write via the parent company (mirrors activities); cron writes via service role.
create policy "growth_experiments - select own" on public.growth_experiments
  for select to authenticated using (
    exists (select 1 from public.companies c where c.id = growth_experiments.company_id and c.user_id = auth.uid())
  );
create policy "growth_experiments - insert own" on public.growth_experiments
  for insert to authenticated with check (
    exists (select 1 from public.companies c where c.id = growth_experiments.company_id and c.user_id = auth.uid())
  );
create policy "growth_experiments - update own" on public.growth_experiments
  for update to authenticated using (
    exists (select 1 from public.companies c where c.id = growth_experiments.company_id and c.user_id = auth.uid())
  );

-- ══ 0013_interest ══
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

-- ══ 0014_video_kind ══
-- Widen approvals.kind for the "video" approval kind — the claymation-launch-film creative brief
-- (script + shot prompts) queued by the launch blitz. Copy-first like the social kinds: the founder
-- generates and posts the film themselves; RUNNING it as a paid ad is a separate kind:'spend'
-- approval (Phase 2 governance — budget always needs the founder's explicit yes).
-- Apply via Supabase → SQL Editor. Safe to re-run.

alter table public.approvals drop constraint if exists approvals_kind_check;
alter table public.approvals add constraint approvals_kind_check
  check (kind in ('spend','outreach','deploy','delete','bluesky','mastodon','twitter','linkedin','reddit','video'));

