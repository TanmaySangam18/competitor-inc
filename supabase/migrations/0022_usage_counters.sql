-- Per-user daily usage counters — SERVER-enforced limits so users running on the operator's (founder's)
-- model key, not their own BYOK key, can't drain the budget. Keyed to auth.uid(); the app's old caps were
-- client-side localStorage (bypassable). Checked + incremented atomically by bump_usage() below.

create table if not exists public.usage_counters (
  user_id uuid not null references auth.users (id) on delete cascade,
  day     date not null,
  kind    text not null,
  count   integer not null default 0,
  primary key (user_id, day, kind)
);

alter table public.usage_counters enable row level security;

-- A user may read their own counters (to show "X of Y left today"); only the SECURITY DEFINER RPC writes.
drop policy if exists "usage_counters - select own" on public.usage_counters;
create policy "usage_counters - select own" on public.usage_counters
  for select using (user_id = auth.uid());

-- Atomic gate: if the signed-in user is under p_limit for (today, p_kind), increment and return
-- allowed=true; otherwise return allowed=false WITHOUT incrementing. Uses auth.uid() internally so a
-- caller can't spoof another user's quota. Row-locked (FOR UPDATE) so concurrent requests can't race
-- past the cap. Returns the post-check used count for display.
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
