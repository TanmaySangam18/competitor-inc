-- competitor.inc launch bundle: migrations 0016–0020, idempotent, paste into Supabase SQL editor once.
-- Generated 2026-07-04. Safe to re-run.

-- ============================================================
-- 0016_landing_demo_events
-- ============================================================
-- Landing instrumentation (attention-first playbook triggers): the hero demo emits
-- demo_start / demo_verdict events so the funnel can measure demo starts, time-to-first-
-- interaction, and demo→signup — the metrics the playbook says to watch instead of bounce rate.
-- Purchases still NEVER arrive via the pixel (unchanged; Polar webhook only).

alter table public.events drop constraint if exists events_type_check;
alter table public.events add constraint events_type_check
  check (type in ('view','signup','purchase','demo_start','demo_verdict'));


-- ============================================================
-- 0017_scorecard_and_digests
-- ============================================================
-- v0.5 persistence: daily Scorecard snapshots (trend history) + archived weekly review digests.
-- Writes are service-role only; owners can read their own rows (same posture as activities).

create table if not exists public.scorecard_snapshots (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  night integer not null,
  timestamp timestamptz not null default now(),
  metrics jsonb not null,
  constraint_label text,
  notes text,
  created_at timestamptz not null default now(),
  unique (company_id, night)
);
create index if not exists scorecard_company_ts_idx on public.scorecard_snapshots (company_id, timestamp desc);

alter table public.scorecard_snapshots enable row level security;
drop policy if exists "scorecard owner read" on public.scorecard_snapshots;
create policy "scorecard owner read" on public.scorecard_snapshots for select
  using (company_id in (select id from public.companies where user_id = auth.uid()));

create table if not exists public.weekly_review_digests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  week integer not null,
  generated_at timestamptz not null default now(),
  content jsonb not null
);
create index if not exists digests_company_week_idx on public.weekly_review_digests (company_id, week desc);

alter table public.weekly_review_digests enable row level security;
drop policy if exists "digest owner read" on public.weekly_review_digests;
create policy "digest owner read" on public.weekly_review_digests for select
  using (company_id in (select id from public.companies where user_id = auth.uid()));


-- ============================================================
-- 0018_business_wallet
-- ============================================================
-- Business Wallet — funded, permissioned agent spending. Money in CENTS (integers) end-to-end.
-- One wallet per company; every spend is a row attributable to an agent + task, with full status +
-- refund tracking (the audit log). Owner-scoped RLS; the cron/executor writes via the service role.

create table if not exists public.wallets (
  id                      uuid primary key default gen_random_uuid(),
  company_id              uuid not null references public.companies(id) on delete cascade,
  funded_cents            integer not null default 0 check (funded_cents >= 0),
  per_transaction_cap_cents integer not null default 5000,
  monthly_cap_cents       integer not null default 200000,
  auto_approve_under_cents integer not null default 2000,
  category_budgets_cents  jsonb not null default '{}'::jsonb,
  paused                  boolean not null default false,
  revoked                 boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (company_id)
);

alter table public.wallets enable row level security;
drop policy if exists "wallet owner all" on public.wallets;
create policy "wallet owner all" on public.wallets for all to authenticated
  using (company_id in (select id from public.companies where user_id = auth.uid()))
  with check (company_id in (select id from public.companies where user_id = auth.uid()));

create table if not exists public.wallet_transactions (
  id            uuid primary key default gen_random_uuid(),
  wallet_id     uuid not null references public.wallets(id) on delete cascade,
  company_id    uuid not null references public.companies(id) on delete cascade,
  agent         text not null,                 -- attributable to the responsible agent
  task          text not null,                 -- and the task the spend was for
  category      text not null check (category in
                  ('domain','hosting','cloud','ads','saas','api','ai_service','marketing','tool','other')),
  amount_cents  integer not null check (amount_cents > 0),
  vendor        text,
  description   text,
  status        text not null default 'pending' check (status in
                  ('pending','approved','executed','blocked','refunded')),
  refund_cents  integer,
  month         text not null,                 -- 'YYYY-MM' for fast monthly aggregation
  created_at    timestamptz not null default now()
);

create index if not exists wallet_txn_wallet_idx on public.wallet_transactions (wallet_id, created_at desc);
create index if not exists wallet_txn_month_idx on public.wallet_transactions (company_id, month);

alter table public.wallet_transactions enable row level security;
drop policy if exists "wallet txn owner read" on public.wallet_transactions;
create policy "wallet txn owner read" on public.wallet_transactions for select to authenticated
  using (company_id in (select id from public.companies where user_id = auth.uid()));
-- Writes go through the server (service role) so the wallet decision + policy floor always run first.


-- ============================================================
-- 0019_demo_cta_event
-- ============================================================
-- Landing funnel: add the demo_cta event (the click on the post-demo CTA) so we can measure the
-- demo_verdict → signup-intent step — the drop-off the funnel was previously blind to.
-- Safe to re-run.

alter table public.events drop constraint if exists events_type_check;
alter table public.events add constraint events_type_check
  check (type in ('view','signup','purchase','demo_start','demo_verdict','demo_cta'));


-- ============================================================
-- 0020_build_in_public_consent
-- ============================================================
-- Build-in-public consent. When true, the crew may share this company's REAL shipped milestones on
-- competitor.inc's OWN social accounts (never the customer's). Off by default — opt-in, for privacy.
-- Safe to re-run.

alter table public.companies add column if not exists share_in_public boolean not null default false;


