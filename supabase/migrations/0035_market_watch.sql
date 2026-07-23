-- 0035: MARKET WATCH (ADR-0024) — one row per (user, competitor url): the latest normalized snapshot
-- and the latest scan's deltas. Diffs are computed scan-over-scan; the battlecard renders from deltas.
-- RLS: owner reads and manages their own targets; the scan path writes via the service role.

create table if not exists market_watch (
  user_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  name text not null,
  snapshot text not null default '',            -- latest normalized text (the next scan's diff base)
  deltas jsonb not null default '[]'::jsonb,    -- latest scan's WatchDelta[]
  scanned_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, url)
);

alter table market_watch enable row level security;

create policy "watch owner read" on market_watch for select using (auth.uid() = user_id);
create policy "watch owner add" on market_watch for insert with check (auth.uid() = user_id);
create policy "watch owner update" on market_watch for update using (auth.uid() = user_id);
create policy "watch owner delete" on market_watch for delete using (auth.uid() = user_id);
