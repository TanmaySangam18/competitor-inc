-- competitor.inc — ALL migrations bundled into one file.
-- HOW TO RUN: Supabase dashboard (project nfxqlyidxrncfawakhuw) -> SQL Editor -> New query -> paste ALL of this -> Run.
-- Safe to re-run: tables use IF NOT EXISTS and functions use OR REPLACE. Re-running may show harmless "already exists" notices.

-- ====================================================================
-- 0001_init.sql
-- ====================================================================
-- competitor.inc schema — multi-company, per-user, with row-level security.
-- Apply via: Supabase Dashboard → SQL Editor (paste & run), or `supabase db push`.
-- Auth users come from Supabase Auth (auth.users); we key everything to auth.uid().

-- ── companies ────────────────────────────────────────────────
create table if not exists public.companies (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  slug        text not null,
  idea        text not null,
  status      text not null default 'validating'
                check (status in ('validating','validated','rejected','operating')),
  night       integer not null default 0,
  ledger      jsonb not null default '{"spent":0,"credited":0,"tasksDone":0,"tasksFailed":0}'::jsonb,
  validation  jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists companies_user_id_idx on public.companies (user_id);

-- ── activities (the Glass Box log) ───────────────────────────
create table if not exists public.activities (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies (id) on delete cascade,
  night       integer not null,
  agent       text not null,
  action      text not null,
  meta        text,
  cost        numeric(12,2) not null default 0,
  status      text not null default 'done'
                check (status in ('done','failed-credited','pending-approval')),
  proof       jsonb,
  undone      boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists activities_company_id_idx on public.activities (company_id);

-- ── approvals (human-in-the-loop inbox) ──────────────────────
create table if not exists public.approvals (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies (id) on delete cascade,
  night       integer not null,
  agent       text not null,
  kind        text not null check (kind in ('spend','outreach','deploy','delete')),
  title       text not null,
  detail      text,
  amount      numeric(12,2),
  resolved    text check (resolved in ('approved','rejected')),
  created_at  timestamptz not null default now()
);
create index if not exists approvals_company_id_idx on public.approvals (company_id);

-- ── Row-Level Security ───────────────────────────────────────
alter table public.companies  enable row level security;
alter table public.activities enable row level security;
alter table public.approvals  enable row level security;

-- Companies: a user sees and mutates only their own.
create policy "own companies - select" on public.companies
  for select using (auth.uid() = user_id);
create policy "own companies - insert" on public.companies
  for insert with check (auth.uid() = user_id);
create policy "own companies - update" on public.companies
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own companies - delete" on public.companies
  for delete using (auth.uid() = user_id);

-- Activities / approvals: access gated through ownership of the parent company.
create policy "own activities - all" on public.activities
  for all using (
    exists (select 1 from public.companies c where c.id = activities.company_id and c.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.companies c where c.id = activities.company_id and c.user_id = auth.uid())
  );

create policy "own approvals - all" on public.approvals
  for all using (
    exists (select 1 from public.companies c where c.id = approvals.company_id and c.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.companies c where c.id = approvals.company_id and c.user_id = auth.uid())
  );

-- ── operate layer (EOS): quarterly Rocks + an Issues list, per company ───────
create table if not exists public.rocks (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies (id) on delete cascade,
  title       text not null,
  done        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists rocks_company_id_idx on public.rocks (company_id);

create table if not exists public.issues (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies (id) on delete cascade,
  title       text not null,
  resolved    boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists issues_company_id_idx on public.issues (company_id);

alter table public.rocks  enable row level security;
alter table public.issues enable row level security;

-- Rocks / issues: access gated through ownership of the parent company (same as activities/approvals).
create policy "own rocks - all" on public.rocks
  for all using (
    exists (select 1 from public.companies c where c.id = rocks.company_id and c.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.companies c where c.id = rocks.company_id and c.user_id = auth.uid())
  );

create policy "own issues - all" on public.issues
  for all using (
    exists (select 1 from public.companies c where c.id = issues.company_id and c.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.companies c where c.id = issues.company_id and c.user_id = auth.uid())
  );

-- keep updated_at fresh on companies
create or replace function public.touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists companies_touch on public.companies;
create trigger companies_touch before update on public.companies
  for each row execute function public.touch_updated_at();


-- ====================================================================
-- 0002_feedback.sql
-- ====================================================================
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


-- ====================================================================
-- 0003_waitlist.sql
-- ====================================================================
-- Waitlist + referral capture. Apply via Supabase → SQL Editor (paste & run).
-- Anyone may JOIN (anon + authenticated). Reads are server-only: the /api/waitlist route uses the
-- service role (which bypasses RLS) to compute position + referral counts. No public select policy,
-- so nobody can scrape the list through the API; you read it in the Supabase Table Editor.

create table if not exists public.waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  code        text not null,            -- this signup's own referral code (shareable)
  ref         text,                     -- the referral code that brought them (nullable)
  created_at  timestamptz not null default now()
);

alter table public.waitlist enable row level security;

-- Insert-only for everyone. (No select/update/delete policies → the list can't be read or altered
-- through the public API; the server route uses the service role for position math.)
create policy "anyone can join the waitlist" on public.waitlist
  for insert to anon, authenticated
  with check (char_length(email) between 3 and 200 and position('@' in email) > 1);

create index if not exists waitlist_ref_idx on public.waitlist (ref);
create index if not exists waitlist_created_idx on public.waitlist (created_at);


-- ====================================================================
-- 0004_demand_test.sql
-- ====================================================================
-- Real demand test: a live public landing page per idea + honest signup capture.
-- This is what turns the Validation Gate from an "AI estimate" into a measured, real-traffic verdict.
-- Apply via Supabase → SQL Editor (paste & run).
--
--  demand_tests   — one row per live test. PUBLIC-readable (it renders a public page). Created only
--                   via the service role (the dashboard/agent), so strangers can't spawn tests.
--  demand_signups — insert-only capture. Counts are read server-side via the service role; the list
--                   is never exposed through the public API.

create table if not exists public.demand_tests (
  slug        text primary key,
  headline    text not null,
  subhead     text not null default '',
  goal        integer not null default 25,   -- pre-set threshold: signups that count as a strong signal
  created_at  timestamptz not null default now()
);

alter table public.demand_tests enable row level security;

-- Public read (the landing page must render for anonymous visitors). No anon insert/update policy →
-- only the service role can create or edit a test.
create policy "demand tests are publicly readable" on public.demand_tests
  for select to anon, authenticated using (true);

create table if not exists public.demand_signups (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null references public.demand_tests(slug) on delete cascade,
  email       text not null,
  created_at  timestamptz not null default now(),
  unique (slug, email)
);

alter table public.demand_signups enable row level security;

-- Anyone may sign up to an existing test (the FK guarantees the test is real). No select policy →
-- the signup list is read only via the service role (position/count math) or the Table Editor.
create policy "anyone can sign up to a demand test" on public.demand_signups
  for insert to anon, authenticated
  with check (char_length(email) between 3 and 200 and position('@' in email) > 1);

create index if not exists demand_signups_slug_idx on public.demand_signups (slug);


-- ====================================================================
-- 0005_agent_memory.sql
-- ====================================================================
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


-- ====================================================================
-- 0006_entitlements.sql
-- ====================================================================
-- Pay-to-build entitlements. Validating an idea is free; BUILDING & running requires an active Operator
-- subscription. The LemonSqueezy webhook (service role) writes rows here; a signed-in user can read ONLY
-- their own row (RLS), so the client can gate the Build button. Apply via Supabase → SQL Editor.

create table if not exists public.entitlements (
  email               text primary key,
  plan                text not null default 'operator',
  -- The subscription's REAL LemonSqueezy status, stored verbatim: active | on_trial | past_due | paused |
  -- unpaid | cancelled | expired (default inactive before any event). Access is DERIVED from status +
  -- current_period_end in lib/engine/entitlement.ts (isEntitled) — not a collapsed boolean.
  status              text not null default 'inactive',
  current_period_end  timestamptz,   -- renews_at while active; ends_at once cancelled
  updated_at          timestamptz not null default now()
);

alter table public.entitlements enable row level security;

-- A signed-in user reads only their own entitlement (to unlock Build). No insert/update policy →
-- writes are service-role only (the billing webhook); nobody can grant themselves access via the API.
create policy "owner reads own entitlement" on public.entitlements
  for select to authenticated using (email = (auth.jwt() ->> 'email'));


-- ====================================================================
-- 0007_approval_decisions.sql
-- ====================================================================
-- ChatOps: decisions made from outside the app (e.g. tapping Approve/Reject in Telegram). The Telegram
-- webhook (service role) records the call HERE — deliberately NOT on approvals.resolved — so it doesn't
-- clobber the app's pending state. The client reconciles: it reads its pending approvals' decisions and
-- applies each through the normal resolveApproval path (effects run exactly once; then the usual sync
-- writes resolved + the ledger/activity back). Low-sensitivity: just an id + the call.

create table if not exists public.approval_decisions (
  approval_id  uuid primary key,
  decision     text not null check (decision in ('approved','rejected')),
  source       text not null default 'telegram',
  decided_at   timestamptz not null default now()
);

alter table public.approval_decisions enable row level security;

-- Approval ids are unguessable uuids and the row holds no PII, so any signed-in user may read (they can
-- only act on ids they already hold). Writes are service-role only (the webhook) — no client policy.
create policy "approval_decisions - select" on public.approval_decisions
  for select to authenticated using (true);


-- ====================================================================
-- 0008_tighten_rls.sql
-- ====================================================================
-- Tighten approval_decisions RLS: authenticated users may only read decisions
-- for approvals that belong to companies they own. The original policy used
-- `using (true)` which allowed any authenticated user to read any row.

drop policy if exists "approval_decisions - select" on public.approval_decisions;

create policy "approval_decisions - select" on public.approval_decisions
  for select to authenticated using (
    exists (
      select 1
      from public.approvals a
      join public.companies c on c.id = a.company_id
      where a.id = approval_decisions.approval_id
        and c.user_id = auth.uid()
    )
  );


