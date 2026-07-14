import type { Metadata } from "next";
import { org, type OrgRole } from "@/lib/core";

export const runtime = "nodejs";

// /org — THE TRANSPARENT ORG (founder request 2026-07-14). Every agent the company runs, in the open: what
// it does, its responsibilities, who it reports to, when it escalates, and which acts always need a human.
// Rendered straight from the canonical 56-role model (lib/org/organization.ts) — the page can't drift from
// the real org because it IS the real org. 8 departments, collapsible; the whole thing is one honest map.

export const metadata: Metadata = {
  title: "competitor.inc — the org",
  description:
    "Every agent in the company, transparently: role, responsibilities, reporting line, escalation rules, and the acts that always require a human. The full org and agent architecture.",
};

const LEVEL_PILL: Record<string, string> = {
  exec: "bg-coral/10 text-coral",
  director: "bg-mint/15 text-mint",
  lead: "bg-amber/15 text-amber",
  ic: "bg-text/[0.06] text-muted",
};

function RoleCard({ r }: { r: OrgRole }) {
  const manager = r.reportsTo ? org.getRole(r.reportsTo) : null;
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold tracking-tight">{r.title}</p>
          <p className="mt-0.5 text-[11px] text-muted-2">
            Reports to {manager ? manager.title : "the founder (human)"}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${LEVEL_PILL[r.level] ?? LEVEL_PILL.ic}`}>{r.level}</span>
      </div>
      <p className="mt-2 text-xs leading-snug text-muted">{r.jobDescription}</p>
      <ul className="mt-2 space-y-1">
        {r.responsibilities.map((d) => (
          <li key={d} className="flex gap-2 text-[12px] leading-snug text-text">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-coral/60" />
            <span>{d}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] leading-snug text-muted-2"><span className="font-medium text-muted">Escalates:</span> {r.escalatesWhen}</p>
      {r.humanApprovalFor.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {r.humanApprovalFor.map((h) => (
            <span key={h} className="rounded-full border border-coral/30 px-2 py-0.5 text-[10px] text-coral">human-approved: {h}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrgPage() {
  const roles = org.roles as OrgRole[];
  const byDept = org.departments.map((d) => ({ dept: d, roles: roles.filter((r) => r.department === d.id) }));
  const issues = org.validate();

  return (
    <main className="flex h-[100dvh] flex-col overflow-hidden bg-bg text-text">
      <header className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
        <a href="/" className="text-lg font-semibold tracking-tight">competitor<span className="text-coral">.inc</span></a>
        <a href="/review" className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-muted transition hover:border-coral/50 hover:text-coral">Control room</a>
      </header>

      <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col overflow-hidden px-6 py-6">
        <div className="shrink-0">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">The company, in the open</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {org.size()} agents across {org.departments.length} departments. The human owner is the CEO; the
            Chief of Staff orchestrates; the Auditor answers to the human alone. Every role below is real —
            with its job, its reporting line, and the acts that always come back to a human.
            {issues.length === 0 ? " Org integrity: verified." : ` Org integrity: ${issues.length} issue(s).`}
          </p>
        </div>

        <div className="mt-5 flex flex-1 flex-col gap-2.5 overflow-y-auto pr-1">
          {byDept.map(({ dept, roles: rs }) => (
            <details key={dept.id} open={dept.id === "executive"} className="group rounded-2xl border border-border open:border-coral/40">
              <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
                <span className="flex-1">
                  <span className="text-base font-semibold tracking-tight">{dept.name}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-muted">{dept.mission}</span>
                </span>
                <span className="shrink-0 text-xs text-muted-2">{rs.length} {rs.length === 1 ? "role" : "roles"} · led by {org.getRole(dept.headRoleId)?.title ?? "—"}</span>
                <svg className="shrink-0 text-muted-2 transition group-open:rotate-180" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </summary>
              <div className="grid gap-2.5 border-t border-border p-4 sm:grid-cols-2">
                {rs.map((r) => <RoleCard key={r.id} r={r} />)}
              </div>
            </details>
          ))}
        </div>

        <p className="mt-3 shrink-0 border-t border-border pt-3 text-[11px] leading-relaxed text-muted-2">
          This map is generated from the company&apos;s real role model — it cannot show an agent that doesn&apos;t
          exist or hide one that does. Programmatic view: <span className="font-medium text-muted">GET /api/org</span>.
        </p>
      </section>
    </main>
  );
}
