-- Beta feedback capture. Apply via Supabase → SQL Editor (paste & run).
-- Anyone may SUBMIT feedback (anon + authenticated); nobody can READ it via the API (no select
-- policy) — you read it in the Supabase Table Editor, which bypasses RLS.

create table if not exists public.feedback (
  id          uuid primary key default gen_random_uuid(),
  message     text not null,
  email       text,
  path        text,
  user_agent  text,
  created_at  timestamptz not null default now()
);

alter table public.feedback enable row level security;

-- Insert-only for everyone. (No select/update/delete policies → reads/writes beyond insert are denied
-- through the API; the dashboard still sees everything.)
create policy "anyone can submit feedback" on public.feedback
  for insert to anon, authenticated
  with check (char_length(message) between 1 and 4000);
