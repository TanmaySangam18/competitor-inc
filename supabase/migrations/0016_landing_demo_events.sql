-- Landing instrumentation (attention-first playbook triggers): the hero demo emits
-- demo_start / demo_verdict events so the funnel can measure demo starts, time-to-first-
-- interaction, and demo→signup — the metrics the playbook says to watch instead of bounce rate.
-- Purchases still NEVER arrive via the pixel (unchanged; Polar webhook only).

alter table public.events drop constraint if exists events_type_check;
alter table public.events add constraint events_type_check
  check (type in ('view','signup','purchase','demo_start','demo_verdict'));
