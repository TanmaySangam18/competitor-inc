-- Tighten approval_decisions RLS: authenticated users may only read decisions
-- for approvals that belong to companies they own. The original policy used
-- `using (true)` which allowed any authenticated user to read any row.

drop policy if exists "approval_decisions - select" on public.approval_decisions;

create policy "approval_decisions - select" on public.approval_decisions
  for select to authenticated using (
    exists (
      select 1
      from public.approvals a
      join public.companies c on c.id = a.company_id
      where a.id = approval_decisions.approval_id
        and c.user_id = auth.uid()
    )
  );
