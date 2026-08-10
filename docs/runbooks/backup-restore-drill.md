# Runbook: quarterly backup restore drill (Supabase)

Drill id: `backup-restore` (see `lib/org/drills.ts`). Cadence: every 90 days.
Evidence: proves control A1.1 (availability) and re-verifies C1.1 (RLS confidentiality) in `lib/org/evidence.ts`.

## Honest status

This drill has not yet run. There is no restore evidence until the first real run is recorded with
`recordDrill`. A backup that has never been test-restored is a hope, not a control, and we say so on the
trust page until this changes.

## Prerequisites (founder access required)

- Founder login to the Supabase dashboard for project `nfxqlyidxrncfawakhuw` (the production project).
- Supabase CLI installed and authenticated (`supabase login`), or dashboard access to Backups.
- Permission to create and delete one scratch Supabase project in the same organization.
- About 45 minutes. Nothing in this drill touches production; the restore target is always the scratch project.

Agents cannot run this drill end to end on their own: creating the scratch project and downloading the
backup sit behind the founder's Supabase account, and account-level actions are human-only by standing rule.
An agent may drive the verification queries once the founder has provisioned the scratch project.

## Procedure

### 1. Create the scratch project

1. In the Supabase dashboard, create a new project named `restore-drill-YYYY-MM-DD` in the same region as production.
2. Never restore into production or into any project holding real customer data.

### 2. Restore the latest backup

1. In the production project, open Database, then Backups, and download the most recent backup
   (or use `supabase db dump` against production for a logical dump).
2. Restore the dump into the scratch project, for example:
   `psql "$SCRATCH_DB_URL" < backup.sql`
3. Note the backup timestamp. All verification below is judged against that timestamp, not against live production.

### 3. Verify row counts on key tables

Run on both the production database (read-only) and the scratch restore, and compare. Production counts
may have grown since the backup timestamp; the scratch counts must match production as of the backup
window, and any mismatch beyond new-row growth is a failed step.

```sql
select 'revenue_events' as t, count(*) from public.revenue_events
union all select 'growth_experiments', count(*) from public.growth_experiments
union all select 'approval_decisions', count(*) from public.approval_decisions
union all select 'prepared_decisions', count(*) from public.prepared_decisions
union all select 'products', count(*) from public.products
union all select 'entitlements', count(*) from public.entitlements
union all select 'customer_mandates', count(*) from public.customer_mandates
union all select 'org_runs', count(*) from public.org_runs;
```

### 4. Verify RLS still holds on the restored copy

The restore must carry the row-level-security policies, not just the rows (see
`supabase/migrations/0008_tighten_rls.sql` and later migrations).

1. Confirm RLS is enabled on the user-owned tables:

```sql
select relname, relrowsecurity
from pg_class
join pg_namespace on pg_namespace.oid = pg_class.relnamespace
where nspname = 'public' and relname in
  ('revenue_events','growth_experiments','approval_decisions','products','entitlements','customer_mandates');
```

Every row must show `relrowsecurity = true`.

2. Using the scratch project's anon key (never the service role key), query a user-owned table without a
   session. The expected result is zero rows. Any rows returned means isolation failed and the drill outcome
   is `failed`, reported as such.

### 5. Record the result

Record a `DrillResult` through `recordDrill` in `lib/org/drills.ts` with the real outcome:

- `passed`: counts match within the backup window and RLS held.
- `partial`: restore worked but at least one verification step could not be completed. Say which one in the notes.
- `failed`: the restore did not complete, counts diverged, or RLS did not hold.

Include in `notes`: backup timestamp, scratch project name, tables verified, and who ran the queries.
The returned evidence record feeds the monthly snapshot in `lib/org/evidence.ts`.

### 6. Destroy the scratch project

1. Delete the scratch Supabase project in the dashboard (founder action).
2. Delete the local backup dump file.
3. Confirm nothing from the drill (URLs, keys, dumps) remains in the repo or in env files.
   `node scripts/secret-scan.mjs` must come back clean.

## Rails

- The restore target is always a scratch project. Production is read-only throughout.
- Service role keys are used only where the anon-key check explicitly requires the contrast, and never leave the founder's machine.
- Outcomes are recorded exactly as observed. A drill that did not run is "not yet run", never assumed passed.
