import Link from "next/link";
import type { Metadata } from "next";
import { LogoMark } from "@/components/Logo";
import { DEPARTMENTS, ROLES, getRole, orgSize, directReports, type OrgRole, type OrgLevel } from "@/lib/org/organization";
import { FOUNDER_GATED_KINDS } from "@/lib/org/autopilot";

// BLOCK 6 — "the company you can hire." Renders the real org (Block 0) so a prospective customer (agency
// or founder) can SEE the software company they'd get: every department, team, and position, its job,
// who it reports to, and exactly which acts stay gated to the human. Marketing/eval page → scrolls (the
// documented exception to the no-scroll cockpit rule).

export const metadata: Metadata = {
  title: "The company you can hire · competitor.inc",
  description: "An autonomous software company — 11 departments, 55 positions — that builds, licenses, supports, and sells software. See the org you'd hire.",
};

const LEVEL_LABEL: Record<OrgLevel, string> = { exec: "Executive", director: "Director", lead: "Team Lead", ic: "Individual" };
const gatedCount = ROLES.filter((r) => r.humanApprovalFor.length > 0).length;

function LevelBadge({ level }: { level: OrgLevel }) {
  const shade = level === "exec" ? "bg-text text-bg" : level === "director" ? "bg-surface-2 text-text" : "border border-border text-muted";
  return <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-medium ${shade}`}>{LEVEL_LABEL[level]}</span>;
}

function RoleCard({ role }: { role: OrgRole }) {
  const manager = role.reportsTo ? getRole(role.reportsTo) : null;
  const reports = directReports(role.id).length;
  return (
    <div className="rounded-2xl glass-panel p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-mono text-sm font-semibold text-text">{role.title}</h3>
        <LevelBadge level={role.level} />
      </div>
      <div className="mt-1 font-mono text-[11px] text-muted-2">
        {role.team ? `${role.team} team · ` : ""}{role.channel}
        {manager ? ` · reports to ${manager.title}` : " · reports to the founder"}
        {reports > 0 ? ` · manages ${reports}` : ""}
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-muted">{role.mandate}</p>
      <p className="mt-2 text-[12px] leading-relaxed text-muted-2">{role.jobDescription}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {role.kpis.map((k) => (
          <span key={k} className="rounded-md border border-border bg-bg/40 px-2 py-0.5 font-mono text-[10px] text-muted-2">{k}</span>
        ))}
      </div>
      {role.humanApprovalFor.length > 0 ? (
        <p className="mt-3 border-t border-border pt-2 font-mono text-[11px] text-text">
          <span className="text-muted-2">founder sign-off:</span> {role.humanApprovalFor.join(" · ")}
        </p>
      ) : (
        <p className="mt-3 border-t border-border pt-2 font-mono text-[11px] text-muted-2">acts autonomously · under caps + kill switch</p>
      )}
    </div>
  );
}

export default function CompanyPage() {
  return (
    <div className="min-h-screen">
      <header className="glass-nav sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 font-mono text-lg font-bold tracking-tight">
            <LogoMark size={32} /> competitor.inc
          </Link>
          <Link href="/dashboard" className="font-mono text-sm text-muted transition hover:text-text">dashboard →</Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <section className="max-w-3xl">
          <div className="font-mono text-xs font-semibold uppercase tracking-wider text-coral">The company you can hire</div>
          <h1 className="mt-3 text-4xl font-bold leading-tight md:text-5xl">
            An autonomous software company — <span className="gradient-text">not a chatbot</span>.
          </h1>
          <p className="mt-4 text-lg text-muted">
            {orgSize()} agents across {DEPARTMENTS.length} departments that develop, license, support, and
            <em className="not-italic text-text"> sell</em> software — each one titled by its job, with a real
            manager and a real scorecard. They run themselves. You only sign off on the {gatedCount} roles that
            touch money, contracts, pricing, deletion, or a production launch.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 font-mono text-xs">
            <span className="rounded-full glass-panel px-3 py-1.5">{DEPARTMENTS.length} departments</span>
            <span className="rounded-full glass-panel px-3 py-1.5">{orgSize()} positions</span>
            <span className="rounded-full glass-panel px-3 py-1.5">runs while you sleep</span>
            <span className="rounded-full glass-panel px-3 py-1.5">{FOUNDER_GATED_KINDS.size} action classes gated to you</span>
          </div>
        </section>

        <nav className="mt-10 flex flex-wrap gap-2 border-y border-border py-4 font-mono text-xs">
          {DEPARTMENTS.map((d) => (
            <a key={d.id} href={`#${d.id}`} className="rounded-full border border-border px-3 py-1.5 text-muted transition hover:text-text">
              {d.name}
            </a>
          ))}
        </nav>

        {DEPARTMENTS.map((d) => {
          const roles = ROLES.filter((r) => r.department === d.id);
          const head = getRole(d.headRoleId);
          return (
            <section key={d.id} id={d.id} className="scroll-mt-20 pt-12">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-2xl font-bold">{d.name}</h2>
                <span className="font-mono text-xs text-muted-2">{roles.length} {roles.length === 1 ? "role" : "roles"}{head ? ` · led by the ${head.title}` : ""}</span>
              </div>
              <p className="mt-1 max-w-2xl text-sm text-muted">{d.mission}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {roles.map((r) => <RoleCard key={r.id} role={r} />)}
              </div>
            </section>
          );
        })}

        <section className="mt-16 rounded-3xl glass-panel p-8 text-center">
          <h2 className="text-2xl font-bold">Hire the whole company.</h2>
          <p className="mx-auto mt-2 max-w-xl text-muted">
            Point it at your software or your clients&apos;. The crew builds it, ships it, supports it, and works
            the growth — and you only get pinged for the calls that are genuinely yours to make.
          </p>
          <Link href="/dashboard" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-coral px-6 py-3.5 font-mono font-semibold text-bg transition hover:brightness-110">
            Start your company →
          </Link>
        </section>
      </main>
    </div>
  );
}
