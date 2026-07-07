-- 0024_realtime.sql — Realtime for server-authoritative mode (flag NEXT_PUBLIC_SERVER_AUTHORITATIVE).
--
-- Adds the per-user state tables to the `supabase_realtime` publication so changes written by the nightly
-- cron (service role) or another device stream live to the owner's browser. Delivery is RLS-scoped: a
-- subscriber only receives rows their SELECT policy (auth.uid() ownership, see 0001_init.sql) allows — so
-- one user can never receive another's rows. Idempotent + additive: inert to the flag-off (best-effort) path,
-- and safe to run more than once. The founder pastes this in the Supabase SQL editor (like prior migrations).

-- Add each table to the publication only if it isn't already a member (`add table` errors on a dup).
do $$
declare t text;
begin
  foreach t in array array['companies','activities','approvals','rocks','issues','growth_experiments'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- Child tables are keyed by company_id (not user_id). REPLICA IDENTITY FULL makes DELETE/UPDATE events carry
-- the full old row, so the client can filter/reconcile by id. (companies already emits its id/user_id.)
alter table public.activities replica identity full;
alter table public.approvals replica identity full;
alter table public.rocks replica identity full;
alter table public.issues replica identity full;
alter table public.growth_experiments replica identity full;
