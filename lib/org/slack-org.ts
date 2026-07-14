// ─────────────────────────────────────────────────────────────────────────────
// BLOCK 2 — THE TEAM ROOM (Slack) : agent identities + the company channel structure.
//
// The crew posts into Slack AS THEMSELVES — each message shows the agent's TITLE as the sender (founder
// mandate: names are positions), in a per-department channel, so the workspace reads like a real
// company's Slack. Daily standup + end-of-day wrap per department; the CEO posts a founder briefing to
// the founder's channel.
//
// The composition logic here is PURE + tested (no keys). The Slack API wrappers are fail-soft: inert
// until SLACK_BOT_TOKEN is set (paste it via docs/SLACK-APP-MANIFEST.md), then they light up unchanged.
// ─────────────────────────────────────────────────────────────────────────────

import { DEPARTMENTS, ROLES, getRole, type OrgRole } from "./organization";
import type { Activity, AgentRole } from "@/lib/engine/types";

// One channel per department — the team room mirrors the org chart. Icons are the department's "avatar"
// so a glance at Slack tells you which function is talking.
export interface DeptChannel { deptId: string; channel: string; icon: string; name: string }

const DEPT_ICON: Record<string, string> = {
  executive: ":crown:",
  product: ":compass:",
  engineering: ":hammer_and_wrench:",
  quality: ":test_tube:",
  operations: ":satellite:",
  finance: ":bar_chart:",
  growth: ":moneybag:",
  knowledge: ":books:",
};

export const DEPT_CHANNELS: DeptChannel[] = DEPARTMENTS.map((d) => ({
  deptId: d.id,
  channel: d.id === "executive" ? "exec" : d.id, // #exec reads better than #executive
  icon: DEPT_ICON[d.id] ?? ":office:",
  name: d.name,
}));

export function channelForDepartment(deptId: string): string {
  return DEPT_CHANNELS.find((c) => c.deptId === deptId)?.channel ?? "general";
}

// The engine executes work under 9 AgentRoles; the org has 56 titled positions. Map each execFn to the
// department whose channel its work belongs in, and to the department head who "signs" the standup line.
const EXECFN_DEPT: Record<AgentRole, string> = {
  ceo: "executive",
  engineering: "engineering",
  manufacturing: "engineering",
  marketing: "growth",
  growth: "growth",
  support: "operations",
  finance: "finance",
  legal: "finance",
  ops: "executive",
};

export function departmentForExecFn(fn: AgentRole): string {
  return EXECFN_DEPT[fn] ?? "executive";
}

// The Slack sender identity for an agent: its TITLE as username + the department icon. Resolves from an
// org role id, or from a bare execFn (falls back to the department head's title).
export function agentSlackIdentity(ref: { roleId?: string; execFn?: AgentRole }): { username: string; icon_emoji: string } {
  let role: OrgRole | undefined = ref.roleId ? getRole(ref.roleId) : undefined;
  if (!role && ref.execFn) {
    const deptId = departmentForExecFn(ref.execFn);
    const head = DEPARTMENTS.find((d) => d.id === deptId)?.headRoleId;
    role = head ? getRole(head) : undefined;
  }
  const deptId = role?.department ?? (ref.execFn ? departmentForExecFn(ref.execFn) : "executive");
  return { username: role?.title ?? "competitor.inc", icon_emoji: DEPT_ICON[deptId] ?? ":office:" };
}

// ── Pure composition (tested) ────────────────────────────────────────────────

export interface StandupPost { deptId: string; channel: string; icon: string; title: string; text: string }

// Compose the per-department standup from a night's activities: group by department, attribute the block
// to that department's head, list what got done. Returns one post per department that actually did work —
// each ready to drop into its channel. Deterministic + side-effect-free.
export function composeStandup(companyName: string, night: number, activities: Activity[]): StandupPost[] {
  const byDept = new Map<string, Activity[]>();
  for (const a of activities) {
    const deptId = departmentForExecFn(a.agent);
    (byDept.get(deptId) ?? byDept.set(deptId, []).get(deptId)!).push(a);
  }
  const posts: StandupPost[] = [];
  for (const dept of DEPARTMENTS) {
    const acts = byDept.get(dept.id);
    if (!acts || acts.length === 0) continue;
    const head = getRole(dept.headRoleId);
    const lines = acts.slice(0, 8).map((a) => `• ${a.action}${a.meta ? ` _(${a.meta})_` : ""}`);
    posts.push({
      deptId: dept.id,
      channel: channelForDepartment(dept.id),
      icon: DEPT_ICON[dept.id] ?? ":office:",
      title: head?.title ?? dept.name,
      text: `*Standup — ${companyName}, night ${night}*\n${lines.join("\n")}`,
    });
  }
  return posts;
}

// The CEO's founder briefing for the founder's own channel — the one message the founder reads each day.
export function composeFounderBriefing(
  companyName: string,
  night: number,
  summary: { shipped: number; needsYou: number; headline?: string },
): { title: string; icon_emoji: string; text: string } {
  const ceo = getRole("chief-executive-officer");
  const needs = summary.needsYou > 0 ? `*${summary.needsYou}* need your sign-off` : "nothing needs you";
  return {
    title: ceo?.title ?? "Chief Executive Officer",
    icon_emoji: ":crown:",
    text:
      `*${companyName} — night ${night} wrap*\n` +
      `${summary.headline ? summary.headline + "\n" : ""}` +
      `• ${summary.shipped} task${summary.shipped === 1 ? "" : "s"} shipped\n• ${needs}\n` +
      `Full log in the department channels.`,
  };
}

// ── Fail-soft Slack API (inert until SLACK_BOT_TOKEN is set) ──────────────────

function slackToken(): string | undefined {
  return process.env.SLACK_BOT_TOKEN;
}

async function slack(method: string, body: Record<string, unknown>): Promise<{ ok: boolean; [k: string]: unknown }> {
  const token = slackToken();
  if (!token) return { ok: false, error: "no token (inert)" };
  try {
    const res = await fetch(`https://slack.com/api/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8", authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    return (await res.json()) as { ok: boolean };
  } catch {
    return { ok: false, error: "network" };
  }
}

// Create the department channels if they don't exist (idempotent-ish: create ignores "already exists").
// No-op without a token. Returns the channel-name → id map for channels it can see/create.
export async function ensureDepartmentChannels(): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  if (!slackToken()) return map;
  const existing = (await slack("conversations.list", { exclude_archived: true, limit: 1000 })) as {
    ok: boolean; channels?: Array<{ id: string; name: string }>;
  };
  const byName = new Map((existing.channels ?? []).map((c) => [c.name, c.id]));
  for (const dc of DEPT_CHANNELS) {
    const found = byName.get(dc.channel);
    if (found) { map[dc.channel] = found; continue; }
    const created = (await slack("conversations.create", { name: dc.channel })) as { ok: boolean; channel?: { id: string } };
    if (created.ok && created.channel) map[dc.channel] = created.channel.id;
  }
  return map;
}

// Post AS an agent (its title as the sender + department icon). channelId is a Slack channel id (from
// ensureDepartmentChannels) OR a channel name. No-op without a token.
export async function postAsAgent(
  channelId: string,
  ref: { roleId?: string; execFn?: AgentRole },
  text: string,
  threadTs?: string,
): Promise<void> {
  const id = agentSlackIdentity(ref);
  await slack("chat.postMessage", { channel: channelId, text, username: id.username, icon_emoji: id.icon_emoji, thread_ts: threadTs });
}
