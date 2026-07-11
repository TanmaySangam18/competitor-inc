-- Product Memory (P1 — the compounding unlock). A product is a LONG-LIVED thing: its architecture doc and
-- its append-only ADR log persist across build sessions, so every subsequent change reads the ones before
-- it (the recall brief in lib/org/product-memory.ts). This is how a customer's 5th change takes minutes,
-- not a rebuild. Pure composition lives in lib/org/product-memory.ts; the DB edge in
-- lib/engine/product-memory-db.ts.
--
-- Owner READS their own product's docs (auth.uid) to view the memory; WRITES are service-role only (the
-- build / Change-Desk step executor records architecture + ADRs under the cron), mirroring org_runs — a
-- client can never forge a product's decision history.

create table if not exists public.product_docs (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid references public.companies(id) on delete cascade,
  user_id     uuid not null,
  product     text not null,                    -- product/repo slug (a customer may own several products)
  kind        text not null,                    -- 'architecture' | 'adr' | 'roadmap'
  seq         integer not null default 0,       -- architecture/roadmap = 0; ADRs increment from 1
  title       text not null,
  body        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists product_docs_lookup_idx on public.product_docs (company_id, product, kind, seq);

alter table public.product_docs enable row level security;
-- Owner reads their own product memory. No insert/update/delete policy ⇒ writes are service-role only.
drop policy if exists "product_docs owner read" on public.product_docs;
create policy "product_docs owner read" on public.product_docs for select using (auth.uid() = user_id);
