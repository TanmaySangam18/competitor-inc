-- Durable org runs — the "runs while you sleep" layer (pragmatic, no Temporal). A multi-agent DAG is
-- persisted here as data; the nightly cron advances it ONE short step per tick (one model call, well under
-- the serverless limit), and the state survives between ticks + crashes. `tasks` holds the full RunTask[]
-- (id, role, goal, blockingOn, state, proof, handoffContext) — see lib/engine/org-run.ts.
--
-- Owner may READ their runs (to poll live progress); all WRITES are service-role only (the cron step
-- executor + the enqueue route), mirroring the revenue_events posture. Deletes cascade with the company.

create table if not exists public.org_runs (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid references public.companies(id) on delete cascade,
  user_id     uuid not null,
  goal        text not null,
  status      text not null default 'pending',   -- pending | running | done | failed
  tasks       jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists org_runs_status_idx  on public.org_runs (status, updated_at);
create index if not exists org_runs_company_idx on public.org_runs (company_id);

alter table public.org_runs enable row level security;
-- Owner reads their own runs to poll progress. No insert/update/delete policy ⇒ writes are service-role
-- only (the step executor runs under the cron's service role), so a client can never forge run state.
create policy "org_runs owner read" on public.org_runs for select using (auth.uid() = user_id);
