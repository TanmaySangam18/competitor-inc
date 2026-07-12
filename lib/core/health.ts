// lib/core/health.ts — the body's vitals. One self-check that exercises the whole company-OS core end to
// end (org integrity → governed roster → plan a goal → convene a meeting → coordinate the loop) and reports
// green/red per system. Keyless + deterministic — proves the backend is coherent and alive with no web
// app, no keys. Powers `competitor doctor` and GET /api/health.

import { ROLES, validateOrg } from "@/lib/org/organization";
import { AGENTS } from "@/lib/engine/types";
import { plan } from "./plan";
import { deliberate } from "./deliberate";
import { coordinate } from "./coordinate";

export interface HealthCheck { name: string; ok: boolean; detail: string }
export interface Health { ok: boolean; checks: HealthCheck[] }

const GOAL = "health check";

export async function checkHealth(): Promise<Health> {
  const checks: HealthCheck[] = [];
  const guard = async (name: string, fn: () => unknown | Promise<unknown>, detail: (v: unknown) => string) => {
    try {
      const v = await fn();
      checks.push({ name, ok: true, detail: detail(v) });
    } catch (e) {
      checks.push({ name, ok: false, detail: e instanceof Error ? e.message : "threw" });
    }
  };

  const issues = validateOrg();
  checks.push({ name: "org", ok: issues.length === 0 && ROLES.length > 0, detail: `${ROLES.length} positions · ${issues.length} integrity issues` });
  checks.push({ name: "agents", ok: Object.keys(AGENTS).length === 9, detail: `${Object.keys(AGENTS).length} governed roles` });

  await guard("plan", () => plan(GOAL), (v) => `${(v as { tasks: unknown[] }).tasks.length} tasks`);
  await guard("deliberate", () => deliberate(GOAL), (v) => `${(v as { participants: unknown[] }).participants.length} in the room`);
  await guard("coordinate", () => coordinate(GOAL), (v) => {
    const c = v as { plan: { tasks: unknown[] }; decisions: unknown[] };
    return `${c.decisions.length}/${c.plan.tasks.length} tasks governed`;
  });
  // coordinate's per-task decision count must match its plan (the loop is internally consistent).
  const last = checks[checks.length - 1];
  if (last.name === "coordinate" && last.ok) {
    const [got, want] = last.detail.split(" ")[0].split("/");
    if (got !== want) last.ok = false;
  }

  return { ok: checks.every((c) => c.ok), checks };
}
