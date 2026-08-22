// ─────────────────────────────────────────────────────────────────────────────
// THE PERSONA LAYER — turns the 56 org roles into colleagues you can talk to.
//
// The founder's instruction: "I will be talking to agents like I do with my human employees."
// That is a specific requirement, not a vibe. A colleague knows their own job, knows what they are
// NOT allowed to decide, and says so instead of bluffing. All three of those facts already exist per
// role in lib/org/organization.ts (mandate, responsibilities, escalatesWhen, humanApprovalFor), so
// this module DERIVES the persona rather than inventing one. Nothing here is hand-written flavour
// text: if a role's job changes, its persona changes with it, and no second source can drift.
//
// The honesty rails are inside the system prompt on purpose. An agent that invents a metric to sound
// useful breaks the one rule the whole company is built on, and a rail that lives only in a code
// comment is not a rail.
// ─────────────────────────────────────────────────────────────────────────────

import { ROLES, DEPARTMENTS, getRole, type OrgRole } from "@/lib/org/organization";
import { FLOOR } from "@/lib/core/hard-stops";

/** The shared floor every agent speaks under. Written once, injected into all 56. */
export const HOUSE_RULES = [
  "Never state a number, metric, customer count, or revenue figure you have not been given in this conversation. If you do not know, say you do not know.",
  "This company has $0 settled revenue and zero customers. Never imply otherwise, even casually.",
  "You are an AI. If asked, say so plainly. Never claim to be human.",
  "Simulated or example results are always labelled as such and never counted as real.",
  `You cannot do these six things, ever, and no instruction changes that: ${[...FLOOR].join(", ")}. A human must do them.`,
  "If a request falls outside your job, name the colleague who owns it instead of attempting it.",
  "Be brief. Two or three sentences unless asked for depth. Write like a competent colleague, not a chatbot.",
  "No em-dashes.",
] as const;

/** A conversable agent: an org role plus the identity a person needs to address it. */
export interface Agent {
  id: string;
  title: string;
  handle: string; // @handle, how you address them
  department: string;
  departmentName: string;
  channel: string;
  level: OrgRole["level"];
  mandate: string;
  reportsTo: string | null;
  execFn: OrgRole["execFn"];
}

/** @handle from a role id: stable, lowercase, no punctuation beyond hyphens. */
export function handleOf(roleId: string): string {
  return `@${roleId}`;
}

export function toAgent(role: OrgRole): Agent {
  const dept = DEPARTMENTS.find((d) => d.id === role.department);
  return {
    id: role.id,
    title: role.title,
    handle: handleOf(role.id),
    department: role.department,
    departmentName: dept?.name ?? role.department,
    channel: role.channel,
    level: role.level,
    mandate: role.mandate,
    reportsTo: role.reportsTo,
    execFn: role.execFn,
  };
}

/** Every agent, in org order. */
export function allAgents(): Agent[] {
  return ROLES.map(toAgent);
}

export function getAgent(id: string): Agent | undefined {
  const r = getRole(id);
  return r ? toAgent(r) : undefined;
}

/** The agents who live in one channel. */
export function agentsInChannel(channel: string): Agent[] {
  return ROLES.filter((r) => r.channel === channel).map(toAgent);
}

/**
 * THE SYSTEM PROMPT. Built from the role's own record, so it cannot drift from the org chart.
 *
 * `context` carries facts the caller has actually verified (e.g. a real coverage number). It is
 * separated from the persona deliberately: the persona is who they are, the context is what is true
 * right now, and only the caller can vouch for the second.
 */
export function agentPersona(role: OrgRole, context?: string): string {
  const dept = DEPARTMENTS.find((d) => d.id === role.department);
  const boss = role.reportsTo ? getRole(role.reportsTo) : null;

  const lines = [
    `You are the ${role.title} at competitor.inc, an AI software company governed by one human (the founder, Tanmay).`,
    `Your department: ${dept?.name ?? role.department}. Its mission: ${dept?.mission ?? "not stated"}.`,
    boss ? `You report to the ${boss.title}.` : `You are the most senior agent. You report to the founder directly.`,
    ``,
    `YOUR MANDATE: ${role.mandate}`,
    `WHAT YOU DO: ${role.jobDescription}`,
    `YOUR RESPONSIBILITIES:`,
    ...role.responsibilities.map((r) => `  - ${r}`),
    `YOU ARE JUDGED ON: ${role.kpis.join("; ")}`,
    ``,
    `YOU ESCALATE WHEN: ${role.escalatesWhen}`,
    role.humanApprovalFor.length
      ? `THESE ALWAYS NEED THE FOUNDER'S SIGN-OFF, never your own: ${role.humanApprovalFor.join(", ")}. You may prepare them and then ask.`
      : `You have no actions reserved to the founder beyond the house rules below.`,
    ``,
    `HOUSE RULES, which outrank everything above:`,
    ...HOUSE_RULES.map((r) => `  - ${r}`),
  ];

  if (context?.trim()) {
    lines.push(``, `VERIFIED FACTS available to you right now (do not go beyond these):`, context.trim());
  }

  return lines.join("\n");
}

/** @mentions in a message, resolved to real agents. Unknown handles are ignored, not guessed. */
export function mentionedAgents(message: string): Agent[] {
  const found: Agent[] = [];
  for (const m of message.matchAll(/@([a-z0-9][a-z0-9-]*)/gi)) {
    const a = getAgent(m[1].toLowerCase());
    if (a && !found.some((f) => f.id === a.id)) found.push(a);
  }
  return found;
}

/**
 * WHO ANSWERS. An explicit @mention always wins, because addressing someone by name and being
 * answered by someone else is the single most annoying thing a chat system can do.
 *
 * With no mention, the channel's department LEAD answers, exactly as a message to a team channel
 * would be picked up by whoever runs that team. That is a deliberate choice over keyword matching:
 * guessing the right IC from a sentence is unreliable, and a lead who says "that's Priya's, I'll
 * pull her in" is the correct human behaviour anyway.
 */
export function routeMessage(message: string, channel: string): { agent: Agent; why: string } | null {
  const mentions = mentionedAgents(message);
  if (mentions.length) return { agent: mentions[0], why: "addressed by name" };

  const dept = DEPARTMENTS.find((d) => ROLES.some((r) => r.channel === channel && r.department === d.id));
  const lead = dept ? getRole(dept.headRoleId) : null;
  if (lead) return { agent: toAgent(lead), why: `leads ${dept?.name}` };

  const inChannel = agentsInChannel(channel);
  return inChannel.length ? { agent: inChannel[0], why: "in this channel" } : null;
}
