-- LAUNCH BUNDLE 0021–0022 — paste-once confirm-or-apply for the latest schema.
-- Combines 0021_operating_cycles + 0022_usage_counters. Both are fully idempotent
-- (create table if not exists / create or replace / drop policy if exists), so running this is safe
-- whether or not they were applied already — it CONFIRMS prod is up to date and applies anything missing.
-- How: Supabase → SQL editor → paste all → Run. No data loss; re-runnable.

-- ── 0021: operating_cycles (persisted history behind /watch) ───────────────────────────────────────
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

drop policy if exists "operating_cycles - select" on public.operating_cycles;
create policy "operating_cycles - select" on public.operating_cycles
  for select using (
    exists (
      select 1 from public.companies c
      where c.id = operating_cycles.company_id and c.user_id = auth.uid()
    )
  );

-- ── 0022: usage_counters + bump_usage() (server-enforced per-user daily caps) ───────────────────────
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

-- ── 0023: chatops_messages (Slack/Telegram reflected into the web CrewBox) ──────────────────────────
create table if not exists public.chatops_messages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users (id) on delete cascade,
  source     text not null,
  direction  text not null,
  text       text not null,
  agent      text,
  created_at timestamptz not null default now()
);
alter table public.chatops_messages add column if not exists user_id uuid references auth.users (id) on delete cascade;
create index if not exists chatops_messages_created_idx on public.chatops_messages (created_at desc);
alter table public.chatops_messages enable row level security;
-- No policies: read via the founder-gated /api/chatops/messages (service role); write via the webhooks (service role).

-- Confirm (optional): these should all return a row.
--   select 'operating_cycles' as t, count(*) from public.operating_cycles;
--   select 'usage_counters'  as t, count(*) from public.usage_counters;
--   select 'chatops_messages' as t, count(*) from public.chatops_messages;
