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
