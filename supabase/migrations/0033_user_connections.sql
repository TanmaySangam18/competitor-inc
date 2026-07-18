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
