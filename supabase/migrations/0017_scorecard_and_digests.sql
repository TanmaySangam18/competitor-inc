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
