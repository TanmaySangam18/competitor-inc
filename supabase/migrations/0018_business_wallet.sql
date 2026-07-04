-- Business Wallet — funded, permissioned agent spending. Money in CENTS (integers) end-to-end.
-- One wallet per company; every spend is a row attributable to an agent + task, with full status +
-- refund tracking (the audit log). Owner-scoped RLS; the cron/executor writes via the service role.

create table if not exists public.wallets (
  id                      uuid primary key default gen_random_uuid(),
  company_id              uuid not null references public.companies(id) on delete cascade,
  funded_cents            integer not null default 0 check (funded_cents >= 0),
  per_transaction_cap_cents integer not null default 5000,
  monthly_cap_cents       integer not null default 200000,
  auto_approve_under_cents integer not null default 2000,
  category_budgets_cents  jsonb not null default '{}'::jsonb,
  paused                  boolean not null default false,
  revoked                 boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (company_id)
);

alter table public.wallets enable row level security;
drop policy if exists "wallet owner all" on public.wallets;
create policy "wallet owner all" on public.wallets for all to authenticated
  using (company_id in (select id from public.companies where user_id = auth.uid()))
  with check (company_id in (select id from public.companies where user_id = auth.uid()));

create table if not exists public.wallet_transactions (
  id            uuid primary key default gen_random_uuid(),
  wallet_id     uuid not null references public.wallets(id) on delete cascade,
  company_id    uuid not null references public.companies(id) on delete cascade,
  agent         text not null,                 -- attributable to the responsible agent
  task          text not null,                 -- and the task the spend was for
  category      text not null check (category in
                  ('domain','hosting','cloud','ads','saas','api','ai_service','marketing','tool','other')),
  amount_cents  integer not null check (amount_cents > 0),
  vendor        text,
  description   text,
  status        text not null default 'pending' check (status in
                  ('pending','approved','executed','blocked','refunded')),
  refund_cents  integer,
  month         text not null,                 -- 'YYYY-MM' for fast monthly aggregation
  created_at    timestamptz not null default now()
);

create index if not exists wallet_txn_wallet_idx on public.wallet_transactions (wallet_id, created_at desc);
create index if not exists wallet_txn_month_idx on public.wallet_transactions (company_id, month);

alter table public.wallet_transactions enable row level security;
drop policy if exists "wallet txn owner read" on public.wallet_transactions;
create policy "wallet txn owner read" on public.wallet_transactions for select to authenticated
  using (company_id in (select id from public.companies where user_id = auth.uid()));
-- Writes go through the server (service role) so the wallet decision + policy floor always run first.
