-- Operating-cycle snapshots — the persisted history behind the "watch the org run" surface (/watch).
-- Each row is ONE supervised operating cycle (see app/api/cron + lib/engine/operating-loop): the
-- ephemeral-agent instances that ran that night, the prepared desk packets, artifacts, and counts.
-- Written server-side by the cron service role (which bypasses RLS); read back through the SESSION
-- client so an owner sees only their own company's cycles (RLS below, same shape as activities/approvals).

create table if not exists public.operating_cycles (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies (id) on delete cascade,
  night       integer not null default 0,
  goal        text not null default '',
  outcome     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists operating_cycles_company_idx
  on public.operating_cycles (company_id, created_at desc);

alter table public.operating_cycles enable row level security;

-- Read: only the owner of the parent company. No insert/update/delete policy → writes happen only
-- via the service role (cron), never from the client. Fail-closed by default.
drop policy if exists "operating_cycles - select" on public.operating_cycles;
create policy "operating_cycles - select" on public.operating_cycles
  for select using (
    exists (
      select 1 from public.companies c
      where c.id = operating_cycles.company_id and c.user_id = auth.uid()
    )
  );
