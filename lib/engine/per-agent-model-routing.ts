/**
 * Per-Agent Model Routing — the tier map.
 *
 * Different agents need different model capabilities + costs:
 *   STRONG (Opus)  — production code, safety-critical, high stakes
 *   MID (Sonnet)   — agentic judgment, financial/legal reasoning, review
 *   CHEAP (Haiku)  — copy, routine support, light analysis
 *
 * 2026-07-11 cleanup: this module is now ONLY the tier map (its single consumed export). The
 * aspirational helper layer (model specs/cost estimation/context truncation/batching/telemetry)
 * was never wired by any caller and was removed — the git history keeps it if a future slice
 * actually needs one of those pieces.
 */

import type { AgentRole } from "@/lib/core/types";

/**
 * Default model tier per agent role — the SINGLE source of truth (server.ts imports this).
 * Aligned with the 2026-07-03 token-savings pass: CEO runs MID (Sonnet 5 is near-Opus on the
 * nightly judgment call and ~40-60% cheaper on the run's dominant request).
 */
export const AGENT_MODEL_TIER: Record<AgentRole, "strong" | "mid" | "cheap"> = {
  // Strong tier (production code — quality IS the product)
  engineering: "strong",

  // Mid tier (agentic judgment, complex analysis)
  ceo: "mid", // nightly judgment + growth diagnosis
  manufacturing: "mid", // supply chain decisions
  finance: "mid", // runway + unit-economics reasoning
  legal: "mid", // contract / compliance drafting

  // Cheap tier (copy, routine help, light analysis)
  marketing: "cheap",
  growth: "cheap",
  support: "cheap",
  ops: "cheap", // internal process / scheduling drafts
};
