-- ChatOps reflection — what the founder types in Slack/Telegram (and the crew's reply) surfaced back in
-- the web CrewBox. Written by the webhooks (service role); read by the auth-gated /api/chatops/messages.
-- RLS on with NO policies → fail-closed for anon/authenticated direct access; only the service role (server)
-- touches it. Fully idempotent.

create table if not exists public.chatops_messages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users (id) on delete cascade,  -- owner (null until chat_id→user mapping exists)
  source     text not null,              -- 'telegram' | 'slack'
  direction  text not null,              -- 'in' (founder typed it) | 'out' (crew reply)
  text       text not null,
  agent      text,                       -- replying agent role, for 'out'
  created_at timestamptz not null default now()
);
-- Idempotent add for envs where the table already exists without the column.
alter table public.chatops_messages add column if not exists user_id uuid references auth.users (id) on delete cascade;

create index if not exists chatops_messages_created_idx on public.chatops_messages (created_at desc);

alter table public.chatops_messages enable row level security;
-- Deliberately no policies: the API reads via the service role behind an auth check; the webhooks write via
-- the service role. Direct client access is fail-closed.
