import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import OrgChart, { type DeptView, type RoleNode } from "@/components/OrgChart";
import { DEPARTMENTS, ROLES, orgSize, getRole, validateOrg, type OrgRole } from "@/lib/org/organization";

// /org — THE WORKFORCE, as a visual hierarchy (ADR-0008; rebuilds the ADR-0006-era card list).
//
// The real structure, drawn: THE HUMAN on top (the only human — signs money, contracts, launches) →
// the Chief of Staff (validateOrg's single root) → the departments → every role, nested exactly as it
// reports. Everything derives from lib/org/organization.ts — counts, names, edges — so this page cannot
// show an agent that doesn't exist or hide one that does. Every role links to its detail page.

export const metadata: Metadata = {
  title: "competitor.inc · the workforce",
  description:
    "Every AI employee in the company, as a real org chart: who reports to whom, what each role does, and the acts that always require the human. Rendered from the canonical role model.",
};

// Build each department's real sub-tree: top nodes are the dept's roles whose manager sits OUTSIDE the
// department (the root, or a cross-department line); children nest by the actual reporting edges.
function toNode(r: OrgRole, deptRoles: OrgRole[]): RoleNode {
  return {
    id: r.id,
    title: r.title,
    level: r.level,
    mandate: r.mandate,
    children: deptRoles.filter((c) => c.reportsTo === r.id).map((c) => toNode(c, deptRoles)),
  };
}

export default function OrgPage() {
  const root = ROLES.find((r) => r.reportsTo === null)!;
  const issues = validateOrg();

  const depts: DeptView[] = DEPARTMENTS.map((d) => {
    const deptRoles = ROLES.filter((r) => r.department === d.id);
    const inDept = new Set(deptRoles.map((r) => r.id));
    const tops = deptRoles.filter((r) => r.reportsTo === null || !inDept.has(r.reportsTo));
    return {
      id: d.id,
      name: d.name,
      mission: d.mission,
      headTitle: getRole(d.headRoleId)?.title ?? "—",
      count: deptRoles.length,
      nodes: tops.map((r) => toNode(r, deptRoles)),
    };
  });

  return (
    <main id="main" className="min-h-[100dvh] bg-bg text-text">
      <SiteHeader />

      <section className="mx-auto w-full max-w-5xl px-6 py-14">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-muted-2">
          The workforce
        </p>
        <h1 className="display mt-5 text-3xl leading-[1.05] sm:text-5xl">
          {orgSize()} AI employees. {DEPARTMENTS.length} departments. One human signature.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
          This chart renders from the company&apos;s real role model — the same file the engine routes
          work through — so it cannot drift from the truth.{" "}
          {issues.length === 0
            ? "Org integrity: verified — one root, no cycles, every role complete."
            : `Org integrity: ${issues.length} issue(s) found.`}
        </p>

        {/* the human → the root: the two nodes above every department */}
        <div className="mt-10 flex flex-col items-center">
          <div className="w-full max-w-md border border-text px-6 py-4 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">The only human</p>
            <p className="display mt-1 text-lg">The Founder</p>
            <p className="mt-1 text-xs leading-snug text-muted">
              Signs money, contracts, and launches. Owns the kill switch. Everything below prepares;
              this seat decides.
            </p>
          </div>
          <div aria-hidden="true" className="h-7 w-px bg-border" />
          <a
            href={`/org/${root.id}`}
            className="group w-full max-w-md border border-border px-6 py-4 text-center transition hover:bg-surface-2"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-2">
              The tree&apos;s single root · reports to the human
            </p>
            <p className="display mt-1 text-lg underline-offset-4 group-hover:underline">{root.title}</p>
            <p className="mt-1 text-xs leading-snug text-muted">{root.mandate}</p>
          </a>
          <div aria-hidden="true" className="h-7 w-px bg-border" />
        </div>

        {/* the departments — expandable, every role linked, real edges only */}
        <OrgChart depts={depts} />

        <p className="mt-6 text-[11px] leading-relaxed text-muted-2">
          The Auditor is structurally independent: the Chief of Staff cannot overrule or suppress a
          finding — findings go straight to the human. Programmatic view:{" "}
          <span className="font-medium text-muted">GET /api/org</span>.
        </p>
      </section>

      <SiteFooter />
    </main>
  );
}
