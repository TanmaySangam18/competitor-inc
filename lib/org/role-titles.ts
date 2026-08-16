// Real software-company job titles for the agent roles (2026-07-12 founder directive: "names of agents
// that we use in software company" — the Apex/Forge/Pitch codenames are retired from every user-facing
// surface). AgentRole codes stay in the engine; these are the labels humans see. One map, used by the
// roster, the stats pie, and the Meetings/deliberation view.

import type { AgentRole } from "@/lib/core/types";

export const ROLE_TITLE: Record<AgentRole, string> = {
  ceo: "CEO",
  engineering: "Software Engineer",
  marketing: "Marketing Manager",
  manufacturing: "DevOps Engineer", // "manufacturing" doesn't fit software — this is the production/deploy role
  support: "Customer Support",
  growth: "Growth Lead",
  finance: "Finance",
  legal: "Legal Counsel",
  ops: "Operations",
};

export const ROLE_INITIALS: Record<AgentRole, string> = {
  ceo: "CE", engineering: "SE", marketing: "MK", manufacturing: "DO",
  support: "CS", growth: "GR", finance: "FI", legal: "LG", ops: "OP",
};

// Department buckets for the stats pie — collapses 9 roles into 4 readable slices.
export const ROLE_DEPARTMENT: Record<AgentRole, "Engineering" | "Marketing" | "Support" | "Operations"> = {
  engineering: "Engineering", manufacturing: "Engineering",
  marketing: "Marketing", growth: "Marketing",
  support: "Support",
  ceo: "Operations", ops: "Operations", finance: "Operations", legal: "Operations",
};

export const titleFor = (role: AgentRole): string => ROLE_TITLE[role] ?? role;
