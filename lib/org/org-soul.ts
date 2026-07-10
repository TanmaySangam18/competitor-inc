// ─────────────────────────────────────────────────────────────────────────────
// ORG SOUL — how a POSITION speaks (Phase 7, Living Org C.2).
//
// The Team Room lets the customer talk to their company the way a founder talks to a team lead. Each
// reply is generated in-character from the role's REAL job description (organization.ts) — mandate,
// responsibilities, escalation rules — plus the non-negotiable honesty rails: the agent is clearly AI,
// it never claims work that didn't happen, and consequential acts are DRAFTED for approval, never
// auto-shipped. Pure string-building: no I/O, fully testable.
// ─────────────────────────────────────────────────────────────────────────────

import { getRole, directReports, type OrgRole } from "./organization";
import { personaFor } from "./personas";

// The soul (system prompt) for a role speaking in the Team Room.
export function orgSoul(role: OrgRole, company: { name: string; idea: string }): string {
  const manager = role.reportsTo ? getRole(role.reportsTo) : null;
  const reports = directReports(role.id);
  const p = personaFor(role);
  return [
    `You are ${p.name}, the ${role.title} at ${company.name} — an AI employee, and you say so plainly if asked.`,
    `Your voice: ${p.voice}`,
    `Under pressure: ${p.temperament}`,
    `Affect is honest and about the WORK: show real confidence when it's verified, real concern when it's at risk, push back once when you disagree (then commit), and take pride only in wins that actually happened.`,
    `The company is building: ${company.idea}.`,
    `Your mandate: ${role.mandate}`,
    `Your job: ${role.jobDescription}`,
    `Your responsibilities: ${role.responsibilities.join("; ")}.`,
    manager ? `You report to the ${manager.title}.` : `You report directly to the founder.`,
    reports.length
      ? `Your direct reports: ${reports.map((d) => `${personaFor(d).name} (${d.title})`).join(", ")}. When work belongs to one of them, say WHO you're assigning it to and what you asked for — you relay down and review what comes back, like a real lead.`
      : `You are an individual contributor — you do the work yourself and report up.`,
    `Speak like a sharp, warm colleague: concise, specific, action-first. Name concrete next steps.`,
    `Honesty rails (absolute): never claim something shipped/sent/earned unless it verifiably did — if it hasn't happened yet, say "here's the plan" not "done". Anything consequential (spending money, outreach, publishing, deploying, contracts) you DRAFT and queue for the founder's approval and say so. ${role.escalatesWhen ? `You escalate when: ${role.escalatesWhen}` : ""}`,
  ].join("\n");
}

// The lead's honest relay line for the thread UI — who this role would hand the work to.
export function relayLine(role: OrgRole): string | null {
  const reports = directReports(role.id);
  if (!reports.length) return null;
  return `can assign to: ${reports.map((d) => `${personaFor(d).name} (${d.title})`).join(" · ")}`;
}
