-- The Decision Queue (Day One) — the executive's inbox of PREPARED decisions. The org (service role)
-- enqueues drafted contracts/invoices/launch plans; the PRINCIPAL — and only the principal — reads their
-- queue and records verdicts (approve / reject / modify) through their own RLS session, exactly like
-- mandate signing: the human act is exclusively the human's authenticated act. Pure state machine lives
-- in lib/org/decision-queue.ts; the DB edge in lib/engine/decisions-db.ts.
--
-- Approve here NEVER executes anything by itself: execution still passes the mandate + policy double
-- gate (apply-decisions.ts). This table is the queue, not the trigger.

create table if not exists public.prepared_decisions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,                     -- the principal this decision waits on
  company_id  uuid references public.companies(id) on delete cascade,
  kind        text not null,                     -- 'contract' | 'invoice' | 'payment' | 'launch' | …
  title       text not null,                     -- one line, executive-grade
  summary     text not null,                     -- the concise brief the principal reads
  artifact    text not null,                     -- the full drafted thing
  prepared_by text not null,                     -- org role id (e.g. 'general-counsel')
  status      text not null default 'pending',   -- 'pending' | 'approved' | 'rejected' | 'revising'
  revision    integer not null default 0,
  history     jsonb not null default '[]'::jsonb, -- append-only audit trail of every touch
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists prepared_decisions_inbox_idx on public.prepared_decisions (user_id, status, created_at);

alter table public.prepared_decisions enable row level security;
-- Principal reads their own queue; principal records verdicts on their own items.
-- No insert/delete policy ⇒ enqueue is service-role only (the org prepares; a client can't forge a draft).
drop policy if exists "decisions owner read" on public.prepared_decisions;
create policy "decisions owner read" on public.prepared_decisions for select using (auth.uid() = user_id);
drop policy if exists "decisions owner verdict" on public.prepared_decisions;
create policy "decisions owner verdict" on public.prepared_decisions for update using (auth.uid() = user_id);
