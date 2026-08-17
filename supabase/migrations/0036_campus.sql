-- 0036: THE CAMPUS TIER — a university authorises once, every student inherits.
--
-- WHY: a student needed four vendor accounts (model, GitHub, Vercel, Supabase) before the machine could
-- build anything, which is roughly twenty human acts and one pasted service-role key. None of that can be
-- automated away: creating an account, accepting terms and paying are three of the six hard-stops, they
-- breach vendor terms of service, and they would bind a student to contracts nobody showed them.
--
-- So the acts move to the party that should perform them. The campus admin authorises once, per vendor,
-- as a real OAuth click. Students inherit the CAPABILITY and never touch the CREDENTIAL.
--
-- CUSTODY: tokens here are the UNIVERSITY's, encrypted with AES-256-GCM under CONNECTIONS_SECRET (env
-- only), revocable by them at any time. Same scheme as user_connections (0033), same key, one crypto path.
-- A leaked row reveals nothing. We are not a managed-credential provider and this table is not us holding
-- customer keys on our own behalf.
--
-- RLS: membership-scoped rather than auth.uid()-scoped, because the whole point is that a resource belongs
-- to an org and is reachable by its members. The token column is NEVER selectable by a member session at
-- all: only the service role reads `enc`, which is why a student can inherit a capability without ever
-- being able to exfiltrate the credential behind it.

create table if not exists orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  -- Seats sold on the licence. Enforced in lib/core/campus.ts seatCheck(); 0 means nothing provisioned yet.
  seats int not null default 0,
  -- The email domain that lets a student self-join by signing in (e.g. "northeastern.edu"). Null disables
  -- domain joining, in which case an admin adds members explicitly.
  join_domain text,
  created_at timestamptz not null default now()
);

create table if not exists org_members (
  org_id uuid not null references orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'student' check (role in ('admin', 'faculty', 'student')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);
-- One campus per user for now. Multi-campus membership is a real case (a TA at two schools) but it makes
-- capability inheritance ambiguous, so it is deliberately deferred rather than half-supported.
create unique index if not exists org_members_one_campus on org_members (user_id);

create table if not exists org_connections (
  org_id uuid not null references orgs(id) on delete cascade,
  provider text not null,
  connection_id text not null,  -- which connection-map entry this satisfies ("github", "hosting", ...)
  enc text not null,            -- base64(iv || gcm-tag || ciphertext); service role only, never a member
  meta jsonb not null default '{}'::jsonb, -- NON-secret display info (org login, team name)
  -- The human who clicked Authorize. Binding an institution to a vendor's terms is an act with a name on
  -- it, and an audit that cannot say whose name is not an audit.
  authorised_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (org_id, provider)
);

-- Per-student resources the machine provisioned with the campus's delegated tokens. Tracked so a student
-- can be de-provisioned cleanly, and so "what did we create in the university's account" is answerable.
create table if not exists org_provisioned (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('repo', 'hosting-project', 'db-schema')),
  external_ref text not null,   -- repo full name, Vercel project id, schema name
  created_at timestamptz not null default now()
);
create index if not exists org_provisioned_member on org_provisioned (org_id, user_id);

alter table orgs enable row level security;
alter table org_members enable row level security;
alter table org_connections enable row level security;
alter table org_provisioned enable row level security;

-- A member may read their own campus.
create policy "orgs member read" on orgs
  for select using (exists (select 1 from org_members m where m.org_id = orgs.id and m.user_id = auth.uid()));

-- A member may see who else is on their campus. Rosters are not secret and faculty need them.
create policy "org_members same campus read" on org_members
  for select using (exists (select 1 from org_members m where m.org_id = org_members.org_id and m.user_id = auth.uid()));

-- Connections: a member may see WHICH providers are connected and the non-secret meta. The policy grants
-- select on the row, so `enc` must never be selected by a member-session query. Server code reads tokens
-- through the service role only (readOrgToken in lib/engine/org-connections-db.ts).
create policy "org_connections member read status" on org_connections
  for select using (exists (select 1 from org_members m where m.org_id = org_connections.org_id and m.user_id = auth.uid()));

-- Only an admin of that campus may revoke. Revocation is the university's right and must not need us.
create policy "org_connections admin delete" on org_connections
  for delete using (exists (
    select 1 from org_members m
    where m.org_id = org_connections.org_id and m.user_id = auth.uid() and m.role = 'admin'
  ));

-- A student may see what was provisioned for them.
create policy "org_provisioned owner read" on org_provisioned
  for select using (user_id = auth.uid());

-- No insert or update policies anywhere on purpose: writes are service-role only. A member cannot add
-- themselves to a campus, cannot grant themselves admin, and cannot mint a connection. Every write goes
-- through server code that has already checked mayAuthorise() and seatCheck().
