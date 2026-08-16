/**
 * Integration Test: Manufacturing Sub-Agent Orchestration
 *
 * Scenario:
 * 1. Manufacturing agent is assigned complex task: "Reduce cost per unit by 15%"
 * 2. System spawns two sub-agents: Supply Chain ($120K) + Quality ($80K)
 * 3. Supply Chain runs first (no blocking dependencies)
 * 4. Quality waits for Supply Chain, then runs
 * 5. Each sub-agent tracks spending against allocated cap
 * 6. All activities logged to Glass Box with hierarchy (parentActivityId)
 * 7. Policy enforces that neither sub-agent exceeds their cap
 */

import { describe, it, expect } from "vitest";
import {
  spawnSubAgents,
  executeSubAgentsSequential,
  recordSubAgentSpend,
  canSpend,
  remainingBudget,
  MANUFACTURING_SUB_AGENTS,
} from "./sub-agent-executor";
import type { SubAgent, Activity } from "@/lib/core/types";

describe("Manufacturing Sub-Agent Orchestration (E2E)", () => {
  it("orchestrates Supply Chain + Quality sub-agents for manufacturing task", async () => {
    // 1. Parent activity: Manufacturing task
    const parentActivity: Activity = {
      id: "mfg-1",
      night: 1,
      agent: "manufacturing",
      action: "Reduce cost per unit by 15%",
      meta: "Target: $40K → $34K per unit",
      cost: 200000, // Manufacturing's monthly spend cap
      status: "done",
    };

    // 2. Spawn sub-agents
    const subAgents = spawnSubAgents(
      parentActivity.id,
      "manufacturing",
      parentActivity.cost,
      MANUFACTURING_SUB_AGENTS
    );

    expect(subAgents.length).toBe(2);

    const supplyChainAgent = subAgents[0];
    const qualityAgent = subAgents[1];

    expect(supplyChainAgent.name).toBe("Supply Chain Agent");
    expect(supplyChainAgent.allocated).toBe(120000); // 60%
    expect(supplyChainAgent.status).toBe("idle");

    expect(qualityAgent.name).toBe("Quality Agent");
    expect(qualityAgent.allocated).toBe(80000); // 40%
    expect(qualityAgent.status).toBe("idle");

    // 3. Simulate execution: Supply Chain runs first
    const activities: Activity[] = [];

    // Supply Chain Agent executes
    expect(canSpend(supplyChainAgent, 50000)).toBe(true);
    expect(recordSubAgentSpend(supplyChainAgent, 50000)).toBe(true);

    const scActivity: Activity = {
      id: "sc-1",
      night: 1,
      agent: "manufacturing",
      action: "[Supply Chain Agent] Negotiate battery supplier contracts",
      cost: 50000,
      status: "done",
      parentActivityId: parentActivity.id,
    };
    activities.push(scActivity);

    expect(supplyChainAgent.spent).toBe(50000);
    expect(remainingBudget(supplyChainAgent)).toBe(70000);

    // Quality Agent executes (waits for Supply Chain)
    expect(canSpend(qualityAgent, 40000)).toBe(true);
    expect(recordSubAgentSpend(qualityAgent, 40000)).toBe(true);

    const qActivity: Activity = {
      id: "qa-1",
      night: 1,
      agent: "manufacturing",
      action: "[Quality Agent] Design test automation for battery packs",
      cost: 40000,
      status: "done",
      parentActivityId: parentActivity.id,
    };
    activities.push(qActivity);

    expect(qualityAgent.spent).toBe(40000);
    expect(remainingBudget(qualityAgent)).toBe(40000);

    // 4. Verify Glass Box structure
    expect(scActivity.parentActivityId).toBe(parentActivity.id);
    expect(qActivity.parentActivityId).toBe(parentActivity.id);

    // Both sub-activities should be attached
    parentActivity.subActivities = [scActivity, qActivity];
    expect(parentActivity.subActivities.length).toBe(2);
    expect(parentActivity.subActivities.every((a) => a.parentActivityId === parentActivity.id)).toBe(
      true
    );

    // 5. Verify spend caps enforced
    const excessSpend = recordSubAgentSpend(supplyChainAgent, 100000); // 100K > remaining 70K
    expect(excessSpend).toBe(false);
    expect(supplyChainAgent.spent).toBe(50000); // unchanged

    // 6. Verify total sub-spend ≤ parent cap
    const totalSubSpend = supplyChainAgent.spent + qualityAgent.spent;
    expect(totalSubSpend).toBe(90000);
    expect(totalSubSpend).toBeLessThanOrEqual(parentActivity.cost);
  });

  it("enforces sub-agent blocking dependencies (Quality waits for Supply Chain)", async () => {
    // Simulate the execution order with blocking
    const executionLog: string[] = [];

    const supplyChainAgent: SubAgent = {
      id: "sc",
      name: "Supply Chain Agent",
      parentAgentId: "mfg",
      scope: ["sourcing", "logistics"],
      blockingOn: [],
      status: "idle",
      spendCap: 120000,
      allocated: 120000,
      spent: 0,
    };

    const qualityAgent: SubAgent = {
      id: "qa",
      name: "Quality Agent",
      parentAgentId: "mfg",
      scope: ["qa", "testing"],
      blockingOn: ["sc"], // Blocks on Supply Chain
      status: "idle",
      spendCap: 80000,
      allocated: 80000,
      spent: 0,
    };

    const parentActivity: Activity = {
      id: "parent",
      night: 1,
      agent: "manufacturing",
      action: "Reduce costs",
      cost: 0,
      status: "done",
    };

    const subAgents = [supplyChainAgent, qualityAgent];

    const onExecute = async (subAgent: SubAgent): Promise<Activity> => {
      executionLog.push(`${subAgent.name} executing`);
      return {
        id: `activity-${subAgent.id}`,
        night: 1,
        agent: "manufacturing",
        action: `Work by ${subAgent.name}`,
        cost: 1000,
        status: "done",
      };
    };

    // Execute sequentially respecting blocking
    await executeSubAgentsSequential(subAgents, parentActivity, onExecute) ;

    // Verify execution order: Supply Chain must run before Quality
    expect(executionLog[0]).toContain("Supply Chain");
    expect(executionLog[1]).toContain("Quality");
  });

  it("handles sub-agent failure gracefully", async () => {
    const parentActivity: Activity = {
      id: "mfg-failure-test",
      night: 1,
      agent: "manufacturing",
      action: "Complex supply chain work",
      cost: 0,
      status: "done",
    };

    const subAgents: SubAgent[] = [
      {
        id: "sc",
        name: "Supply Chain Agent",
        parentAgentId: "mfg",
        scope: ["sourcing"],
        blockingOn: [],
        status: "idle",
        spendCap: 100000,
        allocated: 100000,
        spent: 0,
      },
      {
        id: "qa",
        name: "Quality Agent",
        parentAgentId: "mfg",
        scope: ["qa"],
        blockingOn: [],
        status: "idle",
        spendCap: 50000,
        allocated: 50000,
        spent: 0,
      },
    ];

    const onExecute = async (subAgent: SubAgent): Promise<Activity> => {
      // Simulate Quality Agent failure
      if (subAgent.id === "qa") {
        throw new Error("Quality Agent failed: insufficient test capacity");
      }

      return {
        id: `activity-${subAgent.id}`,
        night: 1,
        agent: "manufacturing",
        action: `Work by ${subAgent.name}`,
        cost: 1000,
        status: "done",
      };
    };

    // Should not throw; handles failure gracefully
    const results = await executeSubAgentsSequential(subAgents, parentActivity, onExecute);

    // Supply Chain should succeed
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((a) => a.action.includes("Supply Chain"))).toBe(true);

    // Quality Agent should be marked as failed
    expect(subAgents[1].status).toBe("failed");
  });

  it("prevents sub-agent spending beyond allocation", () => {
    const subAgent: SubAgent = {
      id: "sc",
      name: "Supply Chain",
      parentAgentId: "mfg",
      scope: ["sourcing"],
      blockingOn: [],
      status: "idle",
      spendCap: 100000,
      allocated: 100000,
      spent: 0,
    };

    // Should allow spending up to allocation
    expect(recordSubAgentSpend(subAgent, 60000)).toBe(true);
    expect(subAgent.spent).toBe(60000);

    // Should allow more spending up to full allocation
    expect(recordSubAgentSpend(subAgent, 40000)).toBe(true);
    expect(subAgent.spent).toBe(100000);

    // Should NOT allow exceeding allocation
    expect(recordSubAgentSpend(subAgent, 1)).toBe(false);
    expect(subAgent.spent).toBe(100000); // unchanged

    // Should report correct remaining budget
    expect(remainingBudget(subAgent)).toBe(0);
  });

  it("calculates correct sub-agent allocations from parent cap", () => {
    const parentSpendCap = 200000;

    const subAgents = spawnSubAgents(
      "mfg-1",
      "manufacturing",
      parentSpendCap,
      MANUFACTURING_SUB_AGENTS
    );

    // Supply Chain gets 60%, Quality gets 40%
    expect(subAgents[0].allocated).toBe(120000);
    expect(subAgents[1].allocated).toBe(80000);

    // Total allocation = 100% of parent cap
    const total = subAgents.reduce((sum, sa) => sum + sa.allocated, 0);
    expect(total).toBe(parentSpendCap);
  });
});
