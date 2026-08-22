// ─────────────────────────────────────────────────────────────────────────────
// CHANNELS — derived from the org chart, not configured separately.
//
// Every OrgRole already declares the channel it reports into. So the channel list IS the org's
// communication structure, and deriving it here means a new role appears in its channel with no
// second edit. A hand-maintained channel list would be a second source of truth for the same fact.
// ─────────────────────────────────────────────────────────────────────────────

import { ROLES, DEPARTMENTS } from "@/lib/org/organization";
import { agentsInChannel, type Agent } from "./agents";

export interface Channel {
  id: string; // "#eng"
  name: string; // "eng"
  purpose: string; // the department mission
  departmentId: string;
  memberCount: number;
  lead: Agent | null;
}

/** Every channel the org actually uses, ordered with the executive channel first. */
export function channels(): Channel[] {
  const seen = new Map<string, Channel>();
  for (const dept of DEPARTMENTS) {
    const rolesHere = ROLES.filter((r) => r.department === dept.id);
    for (const ch of new Set(rolesHere.map((r) => r.channel))) {
      if (seen.has(ch)) continue;
      const members = agentsInChannel(ch);
      seen.set(ch, {
        id: ch,
        name: ch.replace(/^#/, ""),
        purpose: dept.mission,
        departmentId: dept.id,
        memberCount: members.length,
        lead: members.find((m) => m.level === "exec" || m.level === "lead") ?? members[0] ?? null,
      });
    }
  }
  return [...seen.values()];
}

export function getChannel(id: string): Channel | undefined {
  const want = id.startsWith("#") ? id : `#${id}`;
  return channels().find((c) => c.id === want);
}

/** The channel a conversation opens in when none is chosen. */
export function defaultChannel(): Channel {
  return getChannel("#exec") ?? channels()[0];
}
