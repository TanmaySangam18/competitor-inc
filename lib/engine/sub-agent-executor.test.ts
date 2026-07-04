import { describe, it, expect, beforeEach } from "vitest";
import {
  spawnSubAgents,
  recordSubAgentSpend,
  canSpend,
  remainingBudget,
  executeSubAgentsSequential,
  aggregateSubAgentStatus,
  getSubAgentTemplates,
  MANUFACTURING_SUB_AGENTS,
} from "./sub-agent-executor";
import type { SubAgent, Activity } from "./types";

describe("sub-agent-executor", () => {
  describe("spawnSubAgents", () => {
    it("spawns sub-agents with allocated budgets", () => {
      const parentSpendCap = 200000;
      const subAgents = spawnSubAgents(
        "manufacturing",
        "manufacturing",
        parentSpendCap,
        MANUFACTURING_SUB_AGENTS
      );

      expect(subAgents.length).toBe(2);
      expect(subAgents[0].name).toBe("Supply Chain Agent");
      expect(subAgents[1].name).toBe("Quality Agent");

      // Check allocations
      expect(subAgents[0].allocated).toBe(120000); // 60% of 200K
      expect(subAgents[1].allocated).toBe(80000); // 40% of 200K
    });

    it("ensures allocations don't exceed parent cap", () => {
      const subAgents = spawnSubAgents(
        "manufacturing",
        "manufacturing",
        100000,
        MANUFACTURING_SUB_AGENTS
      );

      const totalAllocated = subAgents.reduce((sum, sa) => sum + sa.allocated, 0);
      expect(totalAllocated).toBeLessThanOrEqual(100000);
    });

    it("sets initial status to idle", () => {
      const subAgents = spawnSubAgents(
        "manufacturing",
        "manufacturing",
        200000,
        MANUFACTURING_SUB_AGENTS
      );

      subAgents.forEach((sa) => {
        expect(sa.status).toBe("idle");
        expect(sa.spent).toBe(0);
      });
    });
  });

  describe("recordSubAgentSpend", () => {
    let subAgent: SubAgent;

    beforeEach(() => {
      subAgent = {
        id: "test-1",
        name: "Test Agent",
        parentAgentId: "parent",
        scope: [],
        blockingOn: [],
        status: "idle",
        spendCap: 100000,
        allocated: 100000,
        spent: 0,
      };
    });

    it("records spending within cap", () => {
      const result = recordSubAgentSpend(subAgent, 50000);
      expect(result).toBe(true);
      expect(subAgent.spent).toBe(50000);
    });

    it("allows multiple spends up to cap", () => {
      recordSubAgentSpend(subAgent, 40000);
      recordSubAgentSpend(subAgent, 40000);
      recordSubAgentSpend(subAgent, 20000);

      expect(subAgent.spent).toBe(100000);
      expect(recordSubAgentSpend(subAgent, 1)).toBe(false);
    });

    it("rejects spending that would exceed cap", () => {
      recordSubAgentSpend(subAgent, 90000);
      const result = recordSubAgentSpend(subAgent, 20000);

      expect(result).toBe(false);
      expect(subAgent.spent).toBe(90000); // unchanged
    });
  });

  describe("canSpend", () => {
    let subAgent: SubAgent;

    beforeEach(() => {
      subAgent = {
        id: "test-1",
        name: "Test Agent",
        parentAgentId: "parent",
        scope: [],
        blockingOn: [],
        status: "idle",
        spendCap: 100000,
        allocated: 100000,
        spent: 50000,
      };
    });

    it("allows spending up to remaining cap", () => {
      expect(canSpend(subAgent, 50000)).toBe(true);
      expect(canSpend(subAgent, 49999)).toBe(true);
    });

    it("rejects spending that would exceed cap", () => {
      expect(canSpend(subAgent, 50001)).toBe(false);
      expect(canSpend(subAgent, 100000)).toBe(false);
    });
  });

  describe("remainingBudget", () => {
    it("calculates remaining budget", () => {
      const subAgent: SubAgent = {
        id: "test-1",
        name: "Test",
        parentAgentId: "parent",
        scope: [],
        blockingOn: [],
        status: "idle",
        spendCap: 100000,
        allocated: 100000,
        spent: 30000,
      };

      expect(remainingBudget(subAgent)).toBe(70000);
    });
  });

  describe("aggregateSubAgentStatus", () => {
    it("returns 'idle' for empty array", () => {
      expect(aggregateSubAgentStatus([])).toBe("idle");
    });

    it("returns 'running' if any agent is running", () => {
      const agents: SubAgent[] = [
        {
          id: "1",
          name: "A",
          parentAgentId: "parent",
          scope: [],
          blockingOn: [],
          status: "idle",
          spendCap: 0,
          allocated: 0,
          spent: 0,
        },
        {
          id: "2",
          name: "B",
          parentAgentId: "parent",
          scope: [],
          blockingOn: [],
          status: "running",
          spendCap: 0,
          allocated: 0,
          spent: 0,
        },
      ];

      expect(aggregateSubAgentStatus(agents)).toBe("running");
    });

    it("returns 'done' only if all are done", () => {
      const agents: SubAgent[] = [
        {
          id: "1",
          name: "A",
          parentAgentId: "parent",
          scope: [],
          blockingOn: [],
          status: "done",
          spendCap: 0,
          allocated: 0,
          spent: 0,
        },
        {
          id: "2",
          name: "B",
          parentAgentId: "parent",
          scope: [],
          blockingOn: [],
          status: "done",
          spendCap: 0,
          allocated: 0,
          spent: 0,
        },
      ];

      expect(aggregateSubAgentStatus(agents)).toBe("done");
    });

    it("returns 'blocked' if any agent is blocked", () => {
      const agents: SubAgent[] = [
        {
          id: "1",
          name: "A",
          parentAgentId: "parent",
          scope: [],
          blockingOn: [],
          status: "done",
          spendCap: 0,
          allocated: 0,
          spent: 0,
        },
        {
          id: "2",
          name: "B",
          parentAgentId: "parent",
          scope: [],
          blockingOn: [],
          status: "blocked",
          spendCap: 0,
          allocated: 0,
          spent: 0,
        },
      ];

      expect(aggregateSubAgentStatus(agents)).toBe("blocked");
    });
  });

  describe("getSubAgentTemplates", () => {
    it("returns manufacturing templates", () => {
      const templates = getSubAgentTemplates("manufacturing");
      expect(templates.length).toBe(2);
      expect(templates[0].name).toBe("Supply Chain Agent");
    });

    it("returns engineering templates", () => {
      const templates = getSubAgentTemplates("engineering");
      expect(templates.length).toBe(3);
      expect(templates.some((t) => t.name === "Firmware Engineer")).toBe(true);
    });

    it("returns growth templates", () => {
      const templates = getSubAgentTemplates("growth");
      expect(templates.length).toBe(2);
    });

    it("returns empty array for roles without sub-agents", () => {
      const templates = getSubAgentTemplates("ceo");
      expect(templates.length).toBe(0);
    });
  });

  describe("executeSubAgentsSequential", () => {
    it("executes sub-agents respecting blocking dependencies", async () => {
      const executionOrder: string[] = [];

      const parentActivity: Activity = {
        id: "parent-1",
        night: 1,
        agent: "manufacturing",
        action: "Test action",
        cost: 0,
        status: "done",
      };

      const subAgents: SubAgent[] = [
        {
          id: "supply-chain",
          name: "Supply Chain",
          parentAgentId: "manufacturing",
          scope: [],
          blockingOn: [],
          status: "idle",
          spendCap: 120000,
          allocated: 120000,
          spent: 0,
        },
        {
          id: "quality",
          name: "Quality",
          parentAgentId: "manufacturing",
          scope: [],
          blockingOn: ["supply-chain"],
          status: "idle",
          spendCap: 80000,
          allocated: 80000,
          spent: 0,
        },
      ];

      const onExecute = async (subAgent: SubAgent): Promise<Activity> => {
        executionOrder.push(subAgent.name);
        return {
          id: `activity-${subAgent.id}`,
          night: 1,
          agent: "manufacturing",
          action: `Work by ${subAgent.name}`,
          cost: 1000,
          status: "done",
        };
      };

      const results = await executeSubAgentsSequential(subAgents, parentActivity, onExecute);

      // Supply Chain should execute before Quality (blocking)
      expect(executionOrder).toEqual(["Supply Chain", "Quality"]);
      expect(results.length).toBe(2);
      expect(results[0].parentActivityId).toBe(parentActivity.id);
    });
  });
});
