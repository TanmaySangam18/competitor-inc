import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { DEPARTMENTS, ROLES, getRole, directReports } from "@/lib/org/organization";
import { getSop } from "@/lib/org/sops";
import { CONNECTION_MAP } from "@/lib/core/connections";

// /org/[id] — THE AGENT DETAIL PAGE (ADR-0008): one page per role, generated from the canonical org
// model. Everything on it is derived, never authored twice: the JD verbatim from code, the real
// reporting edges, the SOP where one exists, and the tools from the CONNECTION_MAP. Where a section is
// an illustration rather than a record (the workflow), it says so in the label — the honesty floor.

export const dynamicParams = false;

export function generateStaticParams() {
  return ROLES.map((r) => ({ id: r.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const role = getRole(id);
  if (!role) return { title: "Role not found · competitor.inc" };
  return {
    title: `${role.title} · the workforce · competitor.inc`,
    description: role.mandate,
  };
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-muted-2">
      {children}
    </h2>
  );
}

function RoleChip({ id, note }: { id: string; note?: string }) {
  const r = getRole(id);
  if (!r) return null;
  return (
    <a
      href={`/org/${r.id}`}
      className="group border border-border px-3 py-2 transition hover:border-text"
    >
      <span className="block text-sm font-semibold tracking-tight underline-offset-4 group-hover:underline">
        {r.title}
      </span>
      {note && (
        <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-2">
          {note}
        </span>
      )}
    </a>
  );
}

export default async function RolePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const role = getRole(id);
  if (!role) notFound();

  const dept = DEPARTMENTS.find((d) => d.id === role.department)!;
  const manager = role.reportsTo ? getRole(role.reportsTo) : null;
  const reports = directReports(role.id);
  const reportIds = new Set(reports.map((r) => r.id));
  // Same-department peers: everyone else in the department who isn't the manager or a direct report.
  const peers = ROLES.filter(
    (r) => r.department === role.department && r.id !== role.id && r.id !== role.reportsTo && !reportIds.has(r.id),
  );
  const sop = getSop(role.id);

  // Tools = the CONNECTION_MAP entries the platform wires for this role's execution department, plus
  // the model key every agent thinks with. Honest framing: these are the tools the PLATFORM connects
  // for that department (BYOK — the customer's accounts), not a per-agent usage log.
  const tools = [
    ...CONNECTION_MAP.filter((c) => c.id === "ai-model"),
    ...CONNECTION_MAP.filter((c) => c.department === role.execFn && c.id !== "ai-model"),
  ];

  return (
    <main id="main" className="min-h-[100dvh] bg-bg text-text">
      <SiteHeader />

      <article className="mx-auto w-full max-w-3xl px-6 py-14">
        <a
          href="/org"
          className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted underline-offset-4 transition hover:text-text hover:underline"
        >
          &larr; The workforce
        </a>

        {/* header — title, department, the reporting line */}
        <header className="mt-8">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-muted-2">
            {dept.name} · {role.level}
          </p>
          <h1 className="display mt-4 text-3xl leading-[1.05] sm:text-5xl">{role.title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">{role.mandate}</p>
          <p className="mt-5 font-mono text-xs text-muted">
            Reports to{" "}
            {manager ? (
              <a href={`/org/${manager.id}`} className="font-semibold text-text underline underline-offset-4 transition hover:text-muted">
                {manager.title}
              </a>
            ) : (
              <span className="font-semibold text-text">the founder — the only human</span>
            )}
          </p>
        </header>

        {/* the job, verbatim from the role model */}
        <section className="mt-12">
          <SectionLabel>The job</SectionLabel>
          <p className="mt-4 text-base leading-relaxed text-text">{role.jobDescription}</p>
        </section>

        {/* responsibilities + KPIs, side by side */}
        <section className="mt-12 grid gap-10 sm:grid-cols-2">
          <div>
            <SectionLabel>Responsibilities</SectionLabel>
            <ul className="mt-4 space-y-2.5">
              {role.responsibilities.map((r) => (
                <li key={r} className="flex gap-3 text-sm leading-relaxed text-muted">
                  <span aria-hidden="true" className="mt-2 h-px w-4 shrink-0 bg-text" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SectionLabel>Judged by</SectionLabel>
            <ul className="mt-4 space-y-2.5">
              {role.kpis.map((k) => (
                <li key={k} className="flex gap-3 text-sm leading-relaxed text-muted">
                  <span aria-hidden="true" className="mt-2 h-px w-4 shrink-0 bg-text" />
                  <span>{k}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] leading-relaxed text-muted-2">
              KPIs are computed outside the agent&apos;s prompt and paired with counter-metrics — the
              role can&apos;t game a number it never sees.
            </p>
          </div>
        </section>

        {/* the human line — what always escalates, what always needs a signature */}
        <section className="mt-12 border-y border-border py-8">
          <SectionLabel>The human line</SectionLabel>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            <span className="font-semibold text-text">Escalates when:</span> {role.escalatesWhen}
          </p>
          {role.humanApprovalFor.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-text">Always needs the human&apos;s signature:</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {role.humanApprovalFor.map((h) => (
                  <li key={h} className="border border-text px-2.5 py-1 font-mono text-[11px] text-text">
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* the workflow — the SOP where one exists (procedure, not promises); otherwise an
            illustrative day-in-the-life derived from the responsibilities, labeled as such */}
        <section className="mt-12">
          <SectionLabel>{sop ? "Standard operating procedure" : "Illustrative workflow"}</SectionLabel>
          {sop ? (
            <>
              <p className="mt-3 text-sm font-semibold tracking-tight">{sop.name}</p>
              <ol className="mt-4 space-y-3">
                {sop.steps.map((s, i) => (
                  <li key={s} className="flex gap-4 text-sm leading-relaxed text-muted">
                    <span className="font-mono text-xs text-muted-2">{String(i + 1).padStart(2, "0")}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-[11px] leading-relaxed text-muted-2">
                The repeatable way this role does its job — procedure, not promises. SOPs carry no
                metrics or guarantees by rule.
              </p>
            </>
          ) : (
            <>
              <ol className="mt-4 space-y-3">
                {role.responsibilities.map((r, i) => (
                  <li key={r} className="flex gap-4 text-sm leading-relaxed text-muted">
                    <span className="font-mono text-xs text-muted-2">{String(i + 1).padStart(2, "0")}</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-[11px] leading-relaxed text-muted-2">
                Illustrative — a day in the life derived from this role&apos;s responsibilities, not a
                production log.
              </p>
            </>
          )}
        </section>

        {/* collaborators — the real edges: manager, direct reports, same-department peers */}
        <section className="mt-12">
          <SectionLabel>Works with</SectionLabel>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {manager && <RoleChip id={manager.id} note="manager" />}
            {reports.map((r) => (
              <RoleChip key={r.id} id={r.id} note="direct report" />
            ))}
            {peers.map((r) => (
              <RoleChip key={r.id} id={r.id} note="department peer" />
            ))}
          </div>
          {!manager && (
            <p className="mt-3 text-[11px] leading-relaxed text-muted-2">
              This is the tree&apos;s single root — above it sits only the human.
            </p>
          )}
        </section>

        {/* tools — from the CONNECTION_MAP, honestly framed */}
        <section className="mt-12">
          <SectionLabel>Tools it uses</SectionLabel>
          <p className="mt-3 max-w-2xl text-[11px] leading-relaxed text-muted-2">
            The services the platform wires for this role&apos;s department — BYOK, on the customer&apos;s
            own accounts — plus the model key every agent thinks with. A connection map, not a usage log.
          </p>
          <div className="mt-4 divide-y divide-border border-y border-border">
            {tools.map((t) => (
              <div key={t.id} className="flex items-baseline justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-semibold tracking-tight">{t.name}</p>
                  <p className="mt-0.5 text-xs leading-snug text-muted">{t.purpose}</p>
                </div>
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-2">
                  {t.tier}
                </span>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-14 border-t border-border pt-8">
          <a
            href="/org"
            className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted underline-offset-4 transition hover:text-text hover:underline"
          >
            &larr; Back to the workforce
          </a>
        </div>
      </article>

      <SiteFooter />
    </main>
  );
}
