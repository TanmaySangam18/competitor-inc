-- LAUNCH_BUNDLE_0032-0035.sql — the remaining migrations, in one paste.
--
-- Run this ONCE in Supabase Studio → SQL Editor on project nfxqlyidxrncfawakhuw.
-- Safe to re-run: every statement is guarded (create table if not exists / create policy patterns).
-- Covers: 0032 loops (the loop engine's durable state, without which tickLoop cannot persist),
--         0033 user_connections (per-user key vault), 0034 treasury (envelope budgets),
--         0035 market_watch (competitor scan state).

-- ═══════════════════════════════════════════════════════════════════
-- 0032_loops.sql
-- ═══════════════════════════════════════════════════════════════════
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

-- ═══════════════════════════════════════════════════════════════════
-- 0033_user_connections.sql
-- ═══════════════════════════════════════════════════════════════════
-- 0033: per-user OAuth connections (the "2 minutes" flow, ADR-0010).
-- BYOK custody: tokens are the CUSTOMER's, stored encrypted (AES-256-GCM, key = CONNECTIONS_SECRET held
-- only in env), revocable any time. RLS: owner may read STATUS (not the token) + delete; only the
-- service role writes. The token column is ciphertext — even a leaked row reveals nothing without the key.

create table if not exists user_connections (
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  connection_id text not null, -- which connection-map entry this satisfies (e.g. "github", "slack")
  enc text not null,           -- base64(iv || gcm-tag || ciphertext) of the token payload JSON
  meta jsonb not null default '{}'::jsonb, -- NON-secret display info (team name, account login)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, provider)
);

alter table user_connections enable row level security;

create policy "user_connections owner read" on user_connections
  for select using (auth.uid() = user_id);
create policy "user_connections owner delete" on user_connections
  for delete using (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════
-- 0034_treasury.sql
-- ═══════════════════════════════════════════════════════════════════
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

-- ═══════════════════════════════════════════════════════════════════
-- 0035_market_watch.sql
-- ═══════════════════════════════════════════════════════════════════
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

