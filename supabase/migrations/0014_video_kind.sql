-- Widen approvals.kind for the "video" approval kind — the claymation-launch-film creative brief
-- (script + shot prompts) queued by the launch blitz. Copy-first like the social kinds: the founder
-- generates and posts the film themselves; RUNNING it as a paid ad is a separate kind:'spend'
-- approval (Phase 2 governance — budget always needs the founder's explicit yes).
-- Apply via Supabase → SQL Editor. Safe to re-run.

alter table public.approvals drop constraint if exists approvals_kind_check;
alter table public.approvals add constraint approvals_kind_check
  check (kind in ('spend','outreach','deploy','delete','bluesky','mastodon','twitter','linkedin','reddit','video'));
