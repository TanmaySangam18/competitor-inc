-- R1 of the Revenue Loop (docs/plan: Block R). Apply via Supabase → SQL Editor.
-- 1) companies.goal — the founder-set north star every shift is judged against.
-- 2) companies.product — FIXES a live persistence gap: the client tracks product {url, status}
--    but the DB never stored it, so cron-side shifts lost imported companies' "live" status.
-- 3) Widen approvals.kind to match the ApprovalKind union in lib/engine/types.ts — the original
--    CHECK ('spend','outreach','deploy','delete') rejects social kinds the engine emits today.

alter table public.companies add column if not exists goal jsonb;
alter table public.companies add column if not exists product jsonb;

alter table public.approvals drop constraint if exists approvals_kind_check;
alter table public.approvals add constraint approvals_kind_check
  check (kind in ('spend','outreach','deploy','delete','bluesky','mastodon','twitter','linkedin','reddit'));
