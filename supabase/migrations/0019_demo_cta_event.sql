-- Landing funnel: add the demo_cta event (the click on the post-demo CTA) so we can measure the
-- demo_verdict → signup-intent step — the drop-off the funnel was previously blind to.
-- Safe to re-run.

alter table public.events drop constraint if exists events_type_check;
alter table public.events add constraint events_type_check
  check (type in ('view','signup','purchase','demo_start','demo_verdict','demo_cta'));
