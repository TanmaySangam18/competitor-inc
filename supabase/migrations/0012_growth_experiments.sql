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
