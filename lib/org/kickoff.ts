// ─────────────────────────────────────────────────────────────────────────────
// THE KICKOFF — company-wide mobilization the instant a project is described.
//
// Founder ask (2026-07-09): "the moment I describe the project, all 56 agents get to work immediately,
// reporting who's doing what, in which team, their tasks for the day — everything that happens in a real
// company." This composes exactly that from a one-line brief: a real day-1 task for EVERY role (drawn
// from that role's own top responsibility, applied to the brief — no hardcoded 56 strings), grouped by
// department, plus per-channel standup posts ready to drop into the Slack team room.
//
// Pure + deterministic (tested). The engine/onboarding calls this on "Hand it to your crew"; the standup
// posts go out via slack-org's postAsAgent (each department head announces its team's day 1).
// ─────────────────────────────────────────────────────────────────────────────

import { DEPARTMENTS, ROLES, getRole, type OrgRole } from "./organization";
import { channelForDepartment } from "./slack-org";

export interface DayTask {
  roleId: string;
  title: string; // the agent (its position)
  team?: string;
  task: string; // what it's doing today, for THIS project
  reportsTo: string | null;
}
export interface DepartmentPlan {
  deptId: string;
  name: string;
  channel: string;
  headTitle: string | null;
  tasks: DayTask[];
}
export interface StandupPost { channel: string; headRoleId: string; title: string; text: string }
export interface Kickoff {
  brief: string;
  startedAt: string;
  headline: string;
  totalAgents: number;
  plans: DepartmentPlan[];
  standupPosts: StandupPost[];
  founderBriefing: string; // the CEO's one-line to the founder
}

// Each role's day-1 task = its OWN top responsibility, pointed at the project. Heads/leads get a
// coordinating verb so the hierarchy reads like a real standup (director assigns, IC executes).
function taskForRole(role: OrgRole, brief: string): string {
  const core = role.responsibilities[0] ?? role.mandate;
  if (role.level === "exec" || role.level === "director") return `${core} — set the plan for "${brief}" and assign the team`;
  if (role.level === "lead") return `${core} — break down "${brief}" for the team and start`;
  return `${core} — for "${brief}"`;
}

export function mobilize(brief: string): Kickoff {
  const b = brief.trim().slice(0, 200);
  const plans: DepartmentPlan[] = DEPARTMENTS.map((dept) => {
    const roles = ROLES.filter((r) => r.department === dept.id);
    const head = getRole(dept.headRoleId);
    return {
      deptId: dept.id,
      name: dept.name,
      channel: channelForDepartment(dept.id),
      headTitle: head?.title ?? null,
      tasks: roles.map((r) => ({ roleId: r.id, title: r.title, team: r.team, task: taskForRole(r, b), reportsTo: r.reportsTo })),
    };
  });

  // One standup per department — the head announces the team's day 1 in that department's channel.
  const standupPosts: StandupPost[] = plans
    .filter((p) => p.tasks.length > 0)
    .map((p) => ({
      channel: p.channel,
      headRoleId: DEPARTMENTS.find((d) => d.id === p.deptId)!.headRoleId,
      title: p.headTitle ?? p.name,
      text:
        `*Kickoff — "${b}"*\nDay 1, ${p.name}. Here's the team:\n` +
        p.tasks.map((t) => `• *${t.title}*${t.team ? ` _(${t.team})_` : ""} — ${t.task.replace(` — for "${b}"`, "").replace(` for "${b}" and assign the team`, "").replace(` "${b}" for the team and start`, "")}`).join("\n"),
    }));

  return {
    brief: b,
    startedAt: new Date().toISOString(),
    headline: `${ROLES.length} agents mobilized on "${b}"`,
    totalAgents: ROLES.length,
    plans,
    standupPosts,
    founderBriefing:
      `Chief Executive Officer: the whole company is on "${b}". ${ROLES.length} agents across ${DEPARTMENTS.length} departments have their day-1 tasks — Product is speccing it, Engineering is scaffolding, Design is on the flow, Quality's writing the gate. I'll report milestones here and only ping you for the calls that are yours.`,
  };
}
