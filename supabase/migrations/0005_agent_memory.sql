-- Persistent agent memory (pgvector). Each company accumulates a private memory the crew can recall —
-- so the agents get sharper about THIS business over time, instead of starting cold every shift.
-- Apply via Supabase → SQL Editor (paste & run). Requires the pgvector extension (bundled on Supabase).
--
-- Privacy: memory is row-scoped to the owning user (same model as activities/approvals). Writes happen
-- via the service role (cron/server), which bypasses RLS; there is no public write path.

create extension if not exists vector;

create table if not exists public.agent_memory (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  night       integer not null default 0,
  kind        text not null default 'note',
  content     text not null,
  embedding   vector(1536),           -- nullable: the note persists even before an embeddings key is set
  created_at  timestamptz not null default now()
);

alter table public.agent_memory enable row level security;

-- Owner can read their own company's memory; nobody else can. (No insert/update policy → writes are
-- service-role only.)
create policy "owner reads own agent memory" on public.agent_memory
  for select to authenticated using (
    exists (select 1 from public.companies c where c.id = company_id and c.user_id = auth.uid())
  );

create index if not exists agent_memory_company_idx on public.agent_memory (company_id);
create index if not exists agent_memory_embedding_idx
  on public.agent_memory using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Cosine-similarity recall within a single company (private by construction).
create or replace function public.match_agent_memory(p_company uuid, p_query vector(1536), p_count int)
returns table (content text, similarity float)
language sql stable as $$
  select content, 1 - (embedding <=> p_query) as similarity
  from public.agent_memory
  where company_id = p_company and embedding is not null
  order by embedding <=> p_query
  limit greatest(1, least(p_count, 50));
$$;
