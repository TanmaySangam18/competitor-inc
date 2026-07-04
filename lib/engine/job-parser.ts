/**
 * Job Description Parser
 * Extracts responsibilities, decision rights, and metrics from raw job descriptions.
 * Used by dynamic crew generation to create agent profiles.
 */

import type { AgentRole } from "./types";

/* ── Title Standardization ────────────────────────────────────── */

const TITLE_TO_ROLE_MAP: Record<string, AgentRole> = {
  // CEO / Executive
  "chief executive officer": "ceo",
  "ceo": "ceo",
  "president": "ceo",
  "founder": "ceo",

  // Manufacturing
  "vp manufacturing": "manufacturing",
  "vp operations": "manufacturing",
  "head of manufacturing": "manufacturing",
  "director manufacturing": "manufacturing",
  "senior manager supply chain": "manufacturing",
  "supply chain lead": "manufacturing",
  "operations manager": "manufacturing",

  // Engineering
  "vp software": "engineering",
  "vp software & ai": "engineering",
  "vp engineering": "engineering",
  "head of engineering": "engineering",
  "director engineering": "engineering",
  "chief technology officer": "engineering",
  "cto": "engineering",
  "director battery engineering": "engineering",
  "senior engineer firmware": "engineering",
  "senior engineer": "engineering",

  // Marketing / Growth
  "vp sales & distribution": "growth",
  "vp marketing": "growth",
  "head of marketing": "growth",
  "senior manager global marketing": "growth",
  "director marketing": "growth",
  "marketing lead": "growth",
  "growth manager": "growth",

  // Customer Support
  "director customer experience": "support",
  "vp customer support": "support",
  "head of support": "support",
  "customer success lead": "support",
  "support manager": "support",

  // Other
  "director investor relations": "ceo",
  "vp legal & compliance": "ceo",
  "vp hr": "support",
  "director energy & storage": "engineering",
};

export function standardizeTitle(rawTitle: string): AgentRole {
  // Strip punctuation before lookup — "VP, Manufacturing" must hit the "vp manufacturing" key.
  const normalized = rawTitle.toLowerCase().replace(/[,.]/g, "").replace(/\s+/g, " ").trim();
  return TITLE_TO_ROLE_MAP[normalized] || "engineering";
}

/* ── Responsibility Extraction ────────────────────────────────── */

const RESPONSIBILITY_PATTERNS = [
  /own\s+(.+?)(?:\.|,)/gi,
  /responsible for\s+(.+?)(?:\.|,)/gi,
  /lead\s+(.+?)(?:\.|,)/gi,
  /manage\s+(.+?)(?:\.|,)/gi,
  /drive\s+(.+?)(?:\.|,)/gi,
  /set\s+(.+?)(?:\.|,)/gi,
  /develop\s+(.+?)(?:\.|,)/gi,
  /ensure\s+(.+?)(?:\.|,)/gi,
  /coordinate\s+(.+?)(?:\.|,)/gi,
  /handle\s+(.+?)(?:\.|,)/gi,
];

export function extractResponsibilities(description: string): string[] {
  const responsibilities: string[] = [];
  const seen = new Set<string>();

  for (const pattern of RESPONSIBILITY_PATTERNS) {
    let match;
    // eslint-disable-next-line no-cond-assign
    while ((match = pattern.exec(description)) !== null) {
      let resp = match[1].trim();
      // Truncate long responsibilities
      if (resp.length > 80) {
        resp = resp.substring(0, 77) + "...";
      }
      // Deduplicate
      if (!seen.has(resp)) {
        responsibilities.push(resp);
        seen.add(resp);
      }
    }
  }

  // If extraction found nothing, split into sentences
  if (responsibilities.length === 0) {
    const sentences = description.split(/[.!?]+/).slice(0, 3);
    return sentences
      .map((s) => s.trim())
      .filter((s) => s.length > 10 && s.length < 100);
  }

  return responsibilities.slice(0, 8); // Top 8 responsibilities
}

/* ── Decision Rights Extraction ────────────────────────────────── */

const DECISION_PATTERNS = [
  /makes? (?:final )?decisions? on\s+(.+?)(?:\.|,)/gi,
  /decides?\s+(.+?)(?:\.|,)/gi,
  /approves?\s+(.+?)(?:\.|,)/gi,
  /owns?\s+(.+?)(?:\.|,)/gi,
];

export function extractDecisionRights(description: string): string[] {
  const decisions: string[] = [];
  const seen = new Set<string>();

  for (const pattern of DECISION_PATTERNS) {
    let match;
    // eslint-disable-next-line no-cond-assign
    while ((match = pattern.exec(description)) !== null) {
      let decision = match[1].trim();
      if (decision.length > 80) {
        decision = decision.substring(0, 77) + "...";
      }
      if (!seen.has(decision)) {
        decisions.push(decision);
        seen.add(decision);
      }
    }
  }

  // If nothing found, derive from role
  if (decisions.length === 0) {
    decisions.push("Resource allocation within scope");
    decisions.push("Quarterly planning and goal-setting");
  }

  return decisions.slice(0, 5);
}

/* ── Key Metrics Extraction ────────────────────────────────────── */

const METRIC_PATTERNS = [
  /(?:Key )?metrics?:?(.+?)(?:\.|$)/i,
  /KPIs?:?(.+?)(?:\.|$)/i,
  /measured by(.+?)(?:\.|$)/i,
  /track(?:ing|s)?(.+?)(?:\.|$)/i,
];

export function extractKeyMetrics(description: string): string[] {
  const metrics: string[] = [];
  const seen = new Set<string>();

  for (const pattern of METRIC_PATTERNS) {
    const match = pattern.exec(description);
    if (match) {
      const metricsStr = match[1];
      // Split by comma
      const items = metricsStr.split(/,|;/).map((m) => m.trim());
      for (const item of items) {
        if (item.length > 5 && item.length < 100 && !seen.has(item)) {
          metrics.push(item);
          seen.add(item);
        }
      }
    }
  }

  // If nothing found, provide defaults based on role
  if (metrics.length === 0) {
    metrics.push("Output quality");
    metrics.push("On-time delivery");
    metrics.push("Cost efficiency");
  }

  return metrics.slice(0, 6);
}

/* ── Direct Reports Count Extraction ────────────────────────────── */

export function extractDirectReports(description: string): number | null {
  const match = /direct reports?:\s*(\d+)/i.exec(description);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

/* ── Job Role Type ────────────────────────────────────────────── */

export interface JobRole {
  title: string;
  agentRole: AgentRole;
  responsibilities: string[];
  decisionRights: string[];
  keyMetrics: string[];
  directReports: number | null;
  level: string;
  compensation?: {
    base: number;
    stock: number;
    bonus: number;
  };
}

/* ── Main Parser ──────────────────────────────────────────────── */

export function parseJob(rawJob: {
  title: string;
  description: string;
  level: string;
  compensation?: { base: number; stock: number; bonus: number };
}): JobRole {
  return {
    title: rawJob.title,
    agentRole: standardizeTitle(rawJob.title),
    responsibilities: extractResponsibilities(rawJob.description),
    decisionRights: extractDecisionRights(rawJob.description),
    keyMetrics: extractKeyMetrics(rawJob.description),
    directReports: extractDirectReports(rawJob.description),
    level: rawJob.level,
    compensation: rawJob.compensation,
  };
}

export function parseJobs(rawJobs: Array<{
  title: string;
  description: string;
  level: string;
  compensation?: { base: number; stock: number; bonus: number };
}>): JobRole[] {
  return rawJobs.map(parseJob);
}
