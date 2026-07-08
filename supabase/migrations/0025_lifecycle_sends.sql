-- Slice D: dedup log for lifecycle / retention emails (welcome / day7 / day21).
-- One row per (email, kind) so the nightly cron sends each at most once. Service-role only (RLS on, no
-- policies) — the cron uses the service key; anon/authed clients get nothing. Inert until LIFECYCLE_EMAILS=1.
create table if not exists public.lifecycle_sends (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  kind text not null,
  sent_at timestamptz not null default now(),
  unique (email, kind)
);

alter table public.lifecycle_sends enable row level security;
