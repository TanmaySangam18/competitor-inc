-- Build-in-public consent. When true, the crew may share this company's REAL shipped milestones on
-- competitor.inc's OWN social accounts (never the customer's). Off by default — opt-in, for privacy.
-- Safe to re-run.

alter table public.companies add column if not exists share_in_public boolean not null default false;
