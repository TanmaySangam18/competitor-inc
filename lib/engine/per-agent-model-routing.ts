/**
 * Per-Agent Model Routing
 *
 * Different agents need different model capabilities + costs:
 *
 * STRONG (Opus 4.8, $5/$25 per MTok):
 *   - Engineering (Forge): writes production code, safety-critical, high stakes
 *   - CEO (Apex): agentic judgment, strategy, complex reasoning
 *
 * MID (Sonnet 5, $3/$15 per MTok):
 *   - CFO / Policy enforcement: financial decisions, compliance
 *   - Chief Audit Officer: code review, fraud detection
 *
 * CHEAP (Haiku 4.5, $1/$5 per MTok):
 *   - Marketing (Pitch): copy generation, campaign drafts
 *   - Support (Guard): customer responses, routine help
 *   - Growth (Surge): analysis, trending, social posts
 *   - Data analysis: metrics aggregation, reporting
 *
 * Cost savings: Shifting 60% of calls from Opus→Sonnet/Haiku = ~40-60% token savings
 * Quality maintained: each tier handles its domain well (no regression)
 */

import type { AgentRole } from "./types";

/* ── Model Definitions ──────────────────────────────────────────────────── */

export interface ModelSpec {
  id: string;
  name: string;
  tier: "strong" | "mid" | "cheap";
  costPer1kTokensInput: number; // cents
  costPer1kTokensOutput: number;
  maxTokens: number;
  characteristics: string[];
}

const MODELS: Record<string, ModelSpec> = {
  "claude-opus-4-8": {
    id: "claude-opus-4-8",
    name: "Claude Opus 4.8",
    tier: "strong",
    costPer1kTokensInput: 5,
    costPer1kTokensOutput: 25,
    maxTokens: 200000,
    characteristics: ["reasoning", "code", "complex-logic", "agentic", "safety-critical"],
  },
  "claude-sonnet-5": {
    id: "claude-sonnet-5",
    name: "Claude Sonnet 5",
    tier: "mid",
    costPer1kTokensInput: 3,
    costPer1kTokensOutput: 15,
    maxTokens: 200000,
    characteristics: ["agentic", "balanced", "code-review", "analysis"],
  },
  "claude-haiku-4-5": {
    id: "claude-haiku-4-5",
    name: "Claude Haiku 4.5",
    tier: "cheap",
    costPer1kTokensInput: 1,
    costPer1kTokensOutput: 5,
    maxTokens: 8000,
    characteristics: ["fast", "cheap", "copy", "analysis", "routine"],
  },
};

/* ── Agent → Model Mapping ──────────────────────────────────────────────── */

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

/**
 * Get the recommended model for an agent
 */
export function modelForAgent(agent: AgentRole, override?: string): string {
  if (override) return override;

  const tier = AGENT_MODEL_TIER[agent] ?? "cheap";
  return tier === "strong"
    ? "claude-opus-4-8"
    : tier === "mid"
      ? "claude-sonnet-5"
      : "claude-haiku-4-5";
}

/**
 * Get model specs
 */
export function getModel(modelId: string): ModelSpec {
  return MODELS[modelId] || MODELS["claude-opus-4-8"];
}

/* ── Cost Estimation ──────────────────────────────────────────────────── */

/**
 * Estimate cost for a model call
 */
export function estimateCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  const model = getModel(modelId);
  const inputCost = (inputTokens / 1000) * model.costPer1kTokensInput;
  const outputCost = (outputTokens / 1000) * model.costPer1kTokensOutput;
  return inputCost + outputCost;
}

/**
 * Compare costs: if we switched all calls to cheaper models, how much would we save?
 */
export function estimateSavings(callsByAgent: Record<AgentRole, number>): {
  currentCost: number;
  optimizedCost: number;
  savings: number;
  savingsPercent: number;
} {
  const tokensPerCall = 1500; // average
  let currentCost = 0;
  let optimizedCost = 0;

  for (const [agent, count] of Object.entries(callsByAgent)) {
    const role = agent as AgentRole;
    const currentModel = modelForAgent(role);
    const cheaperModel =
      AGENT_MODEL_TIER[role] === "strong"
        ? "claude-sonnet-5" // Strong → Mid
        : AGENT_MODEL_TIER[role] === "mid"
          ? "claude-haiku-4-5" // Mid → Cheap
          : currentModel; // Cheap → no change

    const currentModelCost = estimateCost(
      currentModel,
      Math.round(tokensPerCall * 0.7),
      Math.round(tokensPerCall * 0.3)
    );
    const optimizedModelCost = estimateCost(
      cheaperModel,
      Math.round(tokensPerCall * 0.7),
      Math.round(tokensPerCall * 0.3)
    );

    currentCost += currentModelCost * count;
    optimizedCost += optimizedModelCost * count;
  }

  const savings = currentCost - optimizedCost;
  return {
    currentCost,
    optimizedCost,
    savings,
    savingsPercent: currentCost > 0 ? (savings / currentCost) * 100 : 0,
  };
}

/* ── Context Window Management ──────────────────────────────────────────– */

/**
 * Haiku has only 8K context; truncate context for cheap-tier agents
 */
export function truncateContextForModel(
  context: string,
  modelId: string,
  maxChars: number = 2000
): string {
  const model = getModel(modelId);

  // Haiku: aggressive truncation
  if (model.tier === "cheap" && context.length > maxChars) {
    return context.substring(0, maxChars) + "\n[... truncated for space ...]";
  }

  // Sonnet: moderate truncation
  if (model.tier === "mid" && context.length > maxChars * 2) {
    return context.substring(0, maxChars * 2) + "\n[... truncated ...]";
  }

  // Opus: no truncation (200K context)
  return context;
}

/* ── Quality Gates (don't use cheap model for risky tasks) ─────────────── */

/**
 * Check if task is suitable for model tier
 */
export function isSuitableForModel(
  task: string,
  modelId: string
): { suitable: boolean; reason?: string } {
  const model = getModel(modelId);

  // Safety-critical tasks need strong models
  const safetyCritical = [
    "delete",
    "deploy to prod",
    "modify payment",
    "change permission",
  ];
  if (safetyCritical.some((kw) => task.toLowerCase().includes(kw))) {
    if (model.tier === "cheap") {
      return {
        suitable: false,
        reason: `Safety-critical task "${task}" requires ${model.tier === "cheap" ? "at least mid-tier" : "strong-tier"} model`,
      };
    }
  }

  // Code review needs mid or strong
  if (task.toLowerCase().includes("review code")) {
    if (model.tier === "cheap") {
      return {
        suitable: false,
        reason: "Code review requires at least mid-tier model",
      };
    }
  }

  // Complex reasoning needs strong
  if (
    task.toLowerCase().includes("diagnose") ||
    task.toLowerCase().includes("analyze") ||
    task.toLowerCase().includes("strategy")
  ) {
    if (model.tier === "cheap") {
      // Cheap models CAN do analysis, but results may be lower quality
      return {
        suitable: true,
        reason: "Task is suitable but quality may be limited with cheap model",
      };
    }
  }

  return { suitable: true };
}

/* ── Adaptive Routing (based on task complexity) ──────────────────────── */

/**
 * Dynamically choose model tier based on task complexity
 */
export function selectModelByComplexity(
  task: string,
  agent: AgentRole,
  complexity: "simple" | "medium" | "complex"
): string {
  const recommendedTier = AGENT_MODEL_TIER[agent];

  // Upgrade if task is complex
  if (complexity === "complex") {
    if (recommendedTier === "cheap") return "claude-sonnet-5"; // cheap → mid
    if (recommendedTier === "mid") return "claude-opus-4-8"; // mid → strong
    return "claude-opus-4-8"; // already strong
  }

  // Downgrade if task is simple (save money)
  if (complexity === "simple") {
    if (recommendedTier === "strong") return "claude-sonnet-5"; // strong → mid
    if (recommendedTier === "mid") return "claude-haiku-4-5"; // mid → cheap
    return "claude-haiku-4-5"; // already cheap
  }

  // Use recommended tier
  return modelForAgent(agent);
}

/* ── Batch Optimization (group cheap calls, run in parallel) ────────────── */

/**
 * When a cheap-tier agent generates multiple small outputs (e.g., 5 social posts),
 * batch them into one call instead of 5 separate calls to save cost + latency
 */
export interface BatchRequest {
  tasks: string[];
  model: string;
  expectedOutputsPerTask: number;
}

export function optimizeBatch(batch: BatchRequest): {
  batchSize: number;
  estimatedCost: number;
  estimatedTokens: number;
} {
  const model = getModel(batch.model);

  // Cheap models: batch aggressively (5-10 tasks per call)
  // Mid models: batch moderately (3-5 per call)
  // Strong models: batch lightly (1-2 per call) to preserve quality

  const maxBatchSize =
    model.tier === "cheap" ? 10 : model.tier === "mid" ? 5 : 2;

  const batchSize = Math.min(batch.tasks.length, maxBatchSize);
  const callCount = Math.ceil(batch.tasks.length / batchSize);

  const estimatedTokensPerTask = 500;
  const estimatedTokens =
    batch.tasks.length * estimatedTokensPerTask * 1.2 * callCount;

  const estimatedCost = estimateCost(batch.model, estimatedTokens / 2, estimatedTokens / 2);

  return {
    batchSize,
    estimatedCost,
    estimatedTokens,
  };
}

/* ── Telemetry (track actual costs vs estimated) ────────────────────────── */

export interface ModelCallTelemetry {
  agent: AgentRole;
  model: string;
  inputTokens: number;
  outputTokens: number;
  actualCost: number;
  estimatedCost: number;
  latencyMs: number;
  succeeded: boolean;
}

export function trackModelCall(
  telemetry: ModelCallTelemetry,
  records: ModelCallTelemetry[]
): void {
  records.push(telemetry);
}

export function analyzeModelMetrics(records: ModelCallTelemetry[]): {
  totalCost: number;
  avgCostPerCall: number;
  modelDistribution: Record<string, number>;
  costByAgent: Record<AgentRole, number>;
} {
  const totalCost = records.reduce((sum, r) => sum + r.actualCost, 0);
  const avgCostPerCall = records.length > 0 ? totalCost / records.length : 0;

  const modelDistribution: Record<string, number> = {};
  const costByAgent: Record<AgentRole, number> = {} as any;

  for (const record of records) {
    modelDistribution[record.model] = (modelDistribution[record.model] || 0) + 1;
    costByAgent[record.agent] = (costByAgent[record.agent] || 0) + record.actualCost;
  }

  return {
    totalCost,
    avgCostPerCall,
    modelDistribution,
    costByAgent,
  };
}
