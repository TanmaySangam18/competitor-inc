-- 0034: THE TREASURY — per-department budget envelopes (ADR-0020, "the bank for the 56").
-- One row per (user, department). The human sets monthly_cap_usd once (standing authorization); agents
-- debit spent_this_month_usd within it silently. Withdrawals never touch this table (human-only, T3).
-- RLS: owner reads + sets caps on their own envelopes; the service role records debits (executor path).

create table if not exists treasury_envelopes (
  user_id uuid not null references auth.users(id) on delete cascade,
  department text not null,
  monthly_cap_usd numeric not null default 0,     -- the budget the human authorized (0 = nothing auto-spends)
  spent_this_month_usd numeric not null default 0, -- running debits this UTC month
  month_key text not null default to_char(now(), 'YYYY-MM'), -- roll marker; a new key resets spend
  updated_at timestamptz not null default now(),
  primary key (user_id, department)
);

alter table treasury_envelopes enable row level security;

-- Owner may read their envelopes and set the caps (an insert/update of monthly_cap_usd is a human act).
create policy "treasury owner read" on treasury_envelopes for select using (auth.uid() = user_id);
create policy "treasury owner set cap" on treasury_envelopes for insert with check (auth.uid() = user_id);
create policy "treasury owner update cap" on treasury_envelopes for update using (auth.uid() = user_id);
