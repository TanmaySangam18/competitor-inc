import { org } from "@/lib/core";
import { getSop } from "@/lib/org/sops";

export const runtime = "nodejs";

// GET /api/org — the full org + agent architecture as structured data (keyless, read-only). The programmatic
// twin of the /org page: departments, every role with its JD/responsibilities/reporting/escalation/human-
// reserved acts, and the integrity check. Generated from the canonical model — it can't drift from reality.
export async function GET() {
  const roles = org.roles.map((r) => ({
    id: r.id, title: r.title, department: r.department, level: r.level,
    reportsTo: r.reportsTo, reportsToTitle: r.reportsTo ? org.getRole(r.reportsTo)?.title ?? null : null,
    mandate: r.mandate, jobDescription: r.jobDescription, responsibilities: r.responsibilities,
    kpis: r.kpis, escalatesWhen: r.escalatesWhen, humanApprovalFor: r.humanApprovalFor,
    sop: getSop(r.id) ?? null,
  }));
  return Response.json({
    ok: true,
    size: org.size(),
    departments: org.departments.map((d) => ({ ...d, headTitle: org.getRole(d.headRoleId)?.title ?? null, roleCount: roles.filter((r) => r.department === d.id).length })),
    roles,
    integrity: org.validate(),
  });
}
