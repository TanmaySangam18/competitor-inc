-- The PRODUCTS REGISTRY (Capability Ladder S3/S4) — the owner-level source of truth for "what products
-- exist." Decision (c), founder 2026-07-11: a product attaches to a USER (always) and a COMPANY (optional
-- grouping). So a founder raw-build (/api/engine?probe=fullstack — no company) still attaches to its owner,
-- and a real customer's products group into a company "suite." Product memory (product_docs) + the suite
-- read product identity from here.
--
-- RLS mirrors org_runs / product_docs: the OWNER reads their own products (auth.uid); WRITES are
-- service-role only (the build registers under the founder session / cron — a client can never forge a
-- product it doesn't own).

create table if not exists public.products (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null,                                              -- the owner (always)
  company_id    uuid references public.companies(id) on delete set null,    -- optional grouping (survives company deletion)
  product       text not null,                                              -- stable slug (repo basename); unique per owner
  repo          text,                                                       -- "owner/name" when built via GitHub; null otherwise
  founding_goal text not null default '',                                   -- the one-line purpose captured at first build
  created_at    timestamptz not null default now(),
  unique (user_id, product)                                                 -- idempotent registration per owner
);

create index if not exists products_owner_idx on public.products (user_id, created_at desc);

alter table public.products enable row level security;
-- Owner reads their own products. No insert/update/delete policy ⇒ writes are service-role only.
drop policy if exists "products owner read" on public.products;
create policy "products owner read" on public.products for select using (auth.uid() = user_id);
