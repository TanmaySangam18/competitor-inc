-- 0032: THE LOOP ENGINE's durable state (Loop Engineering, founder directive 2026-07-15).
-- One row per tenant loop ("competitor.inc" = company #0; a customer id = their company's loop).
-- State is the pure LoopState JSON (objectives + append-only learnings); the driver ticks it forward.

create table if not exists loops (
  tenant text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  state jsonb not null,
  current_run_id text, -- the org_run currently executing the active objective's iteration (null between)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table loops enable row level security;

-- Owner can READ their loop (the founder dashboard / customer surface); only the service role writes
-- (the cron driver) — same posture as org_runs.
create policy "loops owner read" on loops for select using (auth.uid() = user_id);
