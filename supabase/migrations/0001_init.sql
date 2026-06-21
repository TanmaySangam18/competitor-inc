-- competitor.inc schema — multi-company, per-user, with row-level security.
-- Apply via: Supabase Dashboard → SQL Editor (paste & run), or `supabase db push`.
-- Auth users come from Supabase Auth (auth.users); we key everything to auth.uid().

-- ── companies ────────────────────────────────────────────────
create table if not exists public.companies (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  slug        text not null,
  idea        text not null,
  status      text not null default 'validating'
                check (status in ('validating','validated','rejected','operating')),
  night       integer not null default 0,
  ledger      jsonb not null default '{"spent":0,"credited":0,"tasksDone":0,"tasksFailed":0}'::jsonb,
  validation  jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists companies_user_id_idx on public.companies (user_id);

-- ── activities (the Glass Box log) ───────────────────────────
create table if not exists public.activities (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies (id) on delete cascade,
  night       integer not null,
  agent       text not null,
  action      text not null,
  meta        text,
  cost        numeric(12,2) not null default 0,
  status      text not null default 'done'
                check (status in ('done','failed-credited','pending-approval')),
  proof       jsonb,
  undone      boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists activities_company_id_idx on public.activities (company_id);

-- ── approvals (human-in-the-loop inbox) ──────────────────────
create table if not exists public.approvals (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies (id) on delete cascade,
  night       integer not null,
  agent       text not null,
  kind        text not null check (kind in ('spend','outreach','deploy','delete')),
  title       text not null,
  detail      text,
  amount      numeric(12,2),
  resolved    text check (resolved in ('approved','rejected')),
  created_at  timestamptz not null default now()
);
create index if not exists approvals_company_id_idx on public.approvals (company_id);

-- ── Row-Level Security ───────────────────────────────────────
alter table public.companies  enable row level security;
alter table public.activities enable row level security;
alter table public.approvals  enable row level security;

-- Companies: a user sees and mutates only their own.
create policy "own companies - select" on public.companies
  for select using (auth.uid() = user_id);
create policy "own companies - insert" on public.companies
  for insert with check (auth.uid() = user_id);
create policy "own companies - update" on public.companies
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own companies - delete" on public.companies
  for delete using (auth.uid() = user_id);

-- Activities / approvals: access gated through ownership of the parent company.
create policy "own activities - all" on public.activities
  for all using (
    exists (select 1 from public.companies c where c.id = activities.company_id and c.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.companies c where c.id = activities.company_id and c.user_id = auth.uid())
  );

create policy "own approvals - all" on public.approvals
  for all using (
    exists (select 1 from public.companies c where c.id = approvals.company_id and c.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.companies c where c.id = approvals.company_id and c.user_id = auth.uid())
  );

-- keep updated_at fresh on companies
create or replace function public.touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists companies_touch on public.companies;
create trigger companies_touch before update on public.companies
  for each row execute function public.touch_updated_at();
