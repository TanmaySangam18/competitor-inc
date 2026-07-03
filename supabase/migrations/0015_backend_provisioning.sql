-- Backend provisioning P1 — the registry + the Felix Operator's persistent memory + a SAFE
-- table-provisioning RPC. Shared multi-tenant Postgres; per-tenant isolation via physical name
-- scoping + RLS (see lib/engine/backend.ts). Service-role only (RLS enabled, no policies).

-- 1) Registry of every provisioned tenant backend (what exists, for the runtime + eject).
create table if not exists public.tenant_backends (
  tenant_id    text primary key,           -- == tenantNamespace(tenant)
  schema       text not null,
  tables       jsonb not null default '[]'::jsonb,   -- scoped physical table names
  functions    jsonb not null default '[]'::jsonb,   -- scoped function route slugs
  auth_enabled boolean not null default false,
  spec         jsonb not null,             -- the validated BackendSpec that produced this
  status       text not null default 'provisioned' check (status in ('provisioned','pending','failed')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.tenant_backends enable row level security;

-- 2) The Felix Operator's 3-layer memory, one row per tenant (semantic/episodic/procedural jsonb).
create table if not exists public.operator_memory (
  tenant_id  text primary key,
  memory     jsonb not null default '{"semantic":[],"episodic":[],"procedural":[]}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.operator_memory enable row level security;

-- 3) SAFE provisioning RPC — creates one per-tenant entity table with the standard shape + RLS.
--    Hard-validates the table name against the exact scoped pattern (t_<8hex>_<snake>) so a caller
--    can never inject arbitrary DDL. Owner-scoped rows lock to auth.uid(); config tables are
--    read-only to authenticated end-users. Security definer so the service role can run DDL.
create or replace function public.provision_tenant_table(p_table text, p_owned boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_table !~ '^t_[0-9a-f]{8}_[a-z0-9_]{1,40}$' then
    raise exception 'invalid tenant table name: %', p_table;
  end if;

  execute format(
    'create table if not exists public.%I (
       id uuid primary key default gen_random_uuid(),
       user_id uuid,
       data jsonb not null default ''{}''::jsonb,
       created_at timestamptz not null default now()
     )', p_table);

  execute format('alter table public.%I enable row level security', p_table);

  if p_owned then
    execute format(
      'create policy %I on public.%I using (user_id = auth.uid()) with check (user_id = auth.uid())',
      p_table || '_owner', p_table);
  else
    execute format(
      'create policy %I on public.%I for select using (auth.role() = ''authenticated'')',
      p_table || '_read', p_table);
  end if;
exception when duplicate_object then
  -- policy already exists (idempotent re-run) — safe to ignore
  null;
end;
$$;
