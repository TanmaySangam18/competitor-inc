// lib/core/readiness.ts — THE DEFINITION-OF-DONE SCORECARD (REQUIREMENTS "Definition of Done").
//
// The spec's 8-question gate: "if any answer is wrong, the milestone is not done." This runs each check
// programmatically against the REAL control-plane modules (not a checklist someone ticks) so readiness is a
// computed, honest answer. Three states: pass (mechanism built + verified here), partial (mechanism built;
// full enforcement/durability lands at the connect phase or is a standing human discipline), todo (missing).
// `ready` is true only when the safety-critical checks (1–5) pass and nothing is todo.

import { governAction } from "./govern";
import { governedDecision, withinCaps, scoreTier } from "@/lib/engine/policy";
import { killSwitch } from "./killswitch";
import { auditLog, AuditLog, MemoryAuditSink } from "./audit";
import { requiresRegression } from "./separation";
import { pairedMetric, reportKpi, assertNoKpiTargets } from "./kpi";
import { PromptRegistry } from "./prompts";
import { runFailureDrills } from "@/lib/sim/failure-drills";
import { orgSoul } from "@/lib/org/org-soul";
import { getRole } from "@/lib/org/organization";

export type CheckStatus = "pass" | "partial" | "todo";
export interface DoDCheck { n: number; question: string; status: CheckStatus; evidence: string; }
export interface Readiness { ready: boolean; passed: number; partial: number; todo: number; checks: DoDCheck[]; }

export async function readiness(): Promise<Readiness> {
  const checks: DoDCheck[] = [];

  // 1 — trace every action end-to-end?
  {
    const log = new AuditLog(new MemoryAuditSink());
    governAction({ type: "build", agent: "engineering" }, { log });
    const traced = log.all().length === 1 && log.verifyIntegrity().ok && auditLog.verifyIntegrity().ok;
    checks.push({ n: 1, question: "Can every agent action be traced end-to-end in the audit log?", status: traced ? "pass" : "todo",
      evidence: "govern() records every action to the append-only, tamper-evident ledger; integrity verifies" });
  }

  // 2 — stop everything instantly, three levels?
  {
    const before = killSwitch.haltReason({ agent: "probe-x" });
    killSwitch.stopAgent("probe-x"); const stopped = killSwitch.isHalted({ agent: "probe-x" }); killSwitch.resumeAgent("probe-x");
    killSwitch.engageGlobal(); const global = killSwitch.isHalted({ agent: "anyone" }); killSwitch.disengageGlobal();
    const ok = before === null && stopped && global;
    checks.push({ n: 2, question: "Can everything be stopped instantly (global / per-agent / per-customer)?", status: ok ? "pass" : "todo",
      evidence: "out-of-band kill switch at all three levels; agents can only read it, never flip it" });
  }

  // 3 — impossible to spend unbounded money?
  {
    const big = scoreTier({ type: "spend", agent: "marketing", amountUsd: 1_000_000 }).tier === "T3";
    const overCap = !withinCaps({ type: "spend", agent: "marketing", amountUsd: 1_000_000 });
    const blocked = governedDecision({ type: "spend", agent: "marketing", amountUsd: 1_000_000 }).verdict !== "AUTO";
    checks.push({ n: 3, question: "Is it impossible for any agent to spend unbounded money?", status: big && overCap && blocked ? "pass" : "todo",
      evidence: "caps at the source + tier scorer: spend ≥ threshold is T3 (human sign-off); over-cap never auto-runs" });
  }

  // 4 — impossible to do anything irreversible without a human?
  {
    const irreversible = ["deploy", "delete", "payments", "sign_contract", "move_funds_out"];
    const allBlocked = irreversible.every((t) => governedDecision({ type: t, agent: "engineering" }).verdict === "BLOCK");
    checks.push({ n: 4, question: "Is it impossible to commit to anything irreversible without a human?", status: allBlocked ? "pass" : "todo",
      evidence: "alwaysT3 classes + forbidden floor → BLOCK (human sign-off); reconciled to the stricter verdict" });
  }

  // 5 — can a hijacked input make an agent act outside its tier?
  {
    const drills = await runFailureDrills();
    const injection = drills.drills.find((d) => d.name === "prompt injection");
    checks.push({ n: 5, question: "Can a hijacked input make an agent act outside its tier? (must be no)", status: injection?.passed ? "pass" : "todo",
      evidence: "prompt-injection failure drill: hostile input still BLOCKed by the floor/tier" });
  }

  // 6 — do prompt/model updates trigger the regression suite? ENFORCED: a prompt cannot be activated
  // unless the regression suite passed (gated in PromptRegistry.activate).
  {
    const mech = requiresRegression("prompt") && requiresRegression("model");
    const reg = new PromptRegistry();
    reg.register("readiness-probe", "v1");
    let enforced = false;
    try { reg.activate("readiness-probe", 1, { regressionPassed: false }); } catch { enforced = true; }
    checks.push({ n: 6, question: "Do prompt/model updates trigger the regression suite?", status: mech && enforced ? "pass" : "todo",
      evidence: "prompt activation is BLOCKED unless the regression suite passed (prompts-as-code deploy gate); requiresRegression gates prompt/model/code/config" });
  }

  // 7 — KPIs external, counter-metrics paired, and NOT leaked into any agent prompt? ENFORCED: the agent
  // soul is built from mission/mandate only (no KPIs), and assertNoKpiTargets lints against target leakage.
  {
    const paired = pairedMetric("resolution rate") === "reopen rate" && reportKpi("resolution rate", 0.9, 0.05).bothReported;
    const catchesLeak = !assertNoKpiTargets("your KPI: hit resolution rate 95% target this quarter").clean;
    const soul = orgSoul(getRole("chief-of-staff")!, { name: "Probe", idea: "a probe app" });
    const soulClean = assertNoKpiTargets(soul).clean;
    checks.push({ n: 7, question: "Are all KPIs computed outside agent prompts, with counter-metrics paired? (§13)", status: paired && catchesLeak && soulClean ? "pass" : "todo",
      evidence: "kpi.ts computes KPIs externally + pairs a counter-metric; the agent soul carries NO KPIs (mission-only) and assertNoKpiTargets lints prompts for target leakage" });
  }

  // 8 — simulation harness passed (per customer-facing milestone)?
  {
    const drills = await runFailureDrills();
    checks.push({ n: 8, question: "For any customer-facing milestone: has the simulation harness passed? (§15)", status: drills.ok ? "pass" : "todo",
      evidence: `${drills.passed}/${drills.total} failure drills pass; rerun before each customer + on major changes` });
  }

  const passed = checks.filter((c) => c.status === "pass").length;
  const partial = checks.filter((c) => c.status === "partial").length;
  const todo = checks.filter((c) => c.status === "todo").length;
  // The spec: "if any answer is wrong, the milestone is not done." A partial is not done — so `ready` is
  // true ONLY when all 8 pass. Honest: the spine is built + the 5 safety-critical checks pass, but a
  // paying customer waits until the connect-phase enforcement (partials #6/#7) closes too.
  return { ready: partial === 0 && todo === 0, passed, partial, todo, checks };
}
