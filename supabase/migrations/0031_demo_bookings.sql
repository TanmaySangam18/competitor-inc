-- 0031_demo_bookings — the sales stack's conversion sensor (task #74). A booked demo (from Cal.com /
-- cal.diy BOOKING_CREATED) lands here, deduped by external_id so webhook redeliveries are no-ops. Service
-- role writes it (the webhook); reads are founder/admin only. Not customer data of a built product — this
-- is OUR pipeline.

create table if not exists public.demo_bookings (
  id            uuid primary key default gen_random_uuid(),
  external_id   text unique not null,
  name          text,
  email         text,
  start_time    timestamptz,
  event_type    text,
  created_at    timestamptz not null default now()
);

create index if not exists demo_bookings_created_idx on public.demo_bookings (created_at desc);

alter table public.demo_bookings enable row level security;

-- No public policies: only the service role (the webhook) writes/reads. RLS on with no policy = locked to
-- the service key, which is the intended posture for our own pipeline data.
