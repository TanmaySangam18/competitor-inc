import { describe, it, expect } from "vitest";
import { enrichActivitiesWithSubAgents, flattenActivitiesForGlassBox, buildActivityTree } from "./shift-with-subagents";
import type { Activity, Company } from "@/lib/core/types";

describe("shift-with-subagents", () => {
  const mockCompany: Company = {
    id: "test-1",
    name: "Test Company",
    slug: "test-co",
    idea: "Test idea",
    createdAt: Date.now(),
    status: "operating",
    night: 1,
    ledger: { spent: 0, credited: 0, tasksDone: 0, tasksFailed: 0 },
  };

  describe("enrichActivitiesWithSubAgents", () => {
    it("leaves simple activities unchanged", async () => {
      const activities: Activity[] = [
        {
          id: "a1",
          night: 1,
          agent: "ceo",
          action: "Set strategy",
          cost: 0,
          status: "done",
        },
      ];

      const enriched = await enrichActivitiesWithSubAgents(activities, mockCompany, 1);

      expect(enriched.length).toBe(1);
      expect(enriched[0].subActivities).toBeUndefined();
    });

    it("spawns sub-agents for complex manufacturing tasks", async () => {
      const activities: Activity[] = [
        {
          id: "a1",
          night: 1,
          agent: "manufacturing",
          action: "Reduce cost per unit by 15%",
          cost: 100000,
          status: "done",
        },
      ];

      const enriched = await enrichActivitiesWithSubAgents(activities, mockCompany, 1);

      expect(enriched.length).toBe(1);
      expect(enriched[0].subActivities).toBeDefined();
      expect(enriched[0].subActivities!.length).toBeGreaterThan(0);
    });

    it("spawns sub-agents for scaling engineering tasks", async () => {
      const activities: Activity[] = [
        {
          id: "a1",
          night: 1,
          agent: "engineering",
          action: "Scale to 10K requests per second",
          cost: 150000,
          status: "done",
        },
      ];

      const enriched = await enrichActivitiesWithSubAgents(activities, mockCompany, 1);

      expect(enriched.length).toBe(1);
      expect(enriched[0].subActivities).toBeDefined();
      expect(enriched[0].subActivities!.length).toBeGreaterThan(0);
    });

    it("does not spawn for low-cost tasks", async () => {
      const activities: Activity[] = [
        {
          id: "a1",
          night: 1,
          agent: "manufacturing",
          action: "Send status update",
          cost: 100, // Low cost
          status: "done",
        },
      ];

      const enriched = await enrichActivitiesWithSubAgents(activities, mockCompany, 1);

      expect(enriched.length).toBe(1);
      expect(enriched[0].subActivities).toBeUndefined();
    });

    it("sets parentActivityId on sub-activities", async () => {
      const activities: Activity[] = [
        {
          id: "manufacturing-task",
          night: 1,
          agent: "manufacturing",
          action: "Optimize production",
          cost: 120000,
          status: "done",
        },
      ];

      const enriched = await enrichActivitiesWithSubAgents(activities, mockCompany, 1);

      expect(enriched[0].subActivities).toBeDefined();
      enriched[0].subActivities!.forEach((sub) => {
        expect(sub.parentActivityId).toBe("manufacturing-task");
      });
    });
  });

  describe("flattenActivitiesForGlassBox", () => {
    it("flattens nested activities while preserving parentActivityId", () => {
      const activities: Activity[] = [
        {
          id: "parent",
          night: 1,
          agent: "manufacturing",
          action: "Parent task",
          cost: 100,
          status: "done",
          subActivities: [
            {
              id: "child-1",
              night: 1,
              agent: "manufacturing",
              action: "Child 1",
              cost: 50,
              status: "done",
              parentActivityId: "parent",
            },
          ],
        },
      ];

      const flattened = flattenActivitiesForGlassBox(activities);

      expect(flattened.length).toBe(2);
      expect(flattened[0].id).toBe("parent");
      expect(flattened[1].id).toBe("child-1");
      expect(flattened[1].parentActivityId).toBe("parent");
    });

    it("handles multiple levels of nesting", () => {
      const activities: Activity[] = [
        {
          id: "level-1",
          night: 1,
          agent: "engineering",
          action: "Task 1",
          cost: 100,
          status: "done",
          subActivities: [
            {
              id: "level-2",
              night: 1,
              agent: "engineering",
              action: "Task 2",
              cost: 50,
              status: "done",
              parentActivityId: "level-1",
              subActivities: [
                {
                  id: "level-3",
                  night: 1,
                  agent: "engineering",
                  action: "Task 3",
                  cost: 25,
                  status: "done",
                  parentActivityId: "level-2",
                },
              ],
            },
          ],
        },
      ];

      const flattened = flattenActivitiesForGlassBox(activities);

      expect(flattened.length).toBe(3);
      expect(flattened[1].parentActivityId).toBe("level-1");
      expect(flattened[2].parentActivityId).toBe("level-2");
    });
  });

  describe("buildActivityTree", () => {
    it("builds a tree from flat activities with parentActivityId", () => {
      const activities: Activity[] = [
        {
          id: "parent",
          night: 1,
          agent: "manufacturing",
          action: "Parent",
          cost: 100,
          status: "done",
        },
        {
          id: "child",
          night: 1,
          agent: "manufacturing",
          action: "Child",
          cost: 50,
          status: "done",
          parentActivityId: "parent",
        },
      ];

      const tree = buildActivityTree(activities);

      expect(tree.length).toBe(1); // One root
      expect(tree[0].activity.id).toBe("parent");
      expect(tree[0].children.length).toBe(1);
      expect(tree[0].children[0].activity.id).toBe("child");
    });

    it("handles multiple roots", () => {
      const activities: Activity[] = [
        {
          id: "root-1",
          night: 1,
          agent: "ceo",
          action: "Task 1",
          cost: 100,
          status: "done",
        },
        {
          id: "root-2",
          night: 1,
          agent: "growth",
          action: "Task 2",
          cost: 100,
          status: "done",
        },
      ];

      const tree = buildActivityTree(activities);

      expect(tree.length).toBe(2);
      expect(tree[0].activity.id).toBe("root-1");
      expect(tree[1].activity.id).toBe("root-2");
    });
  });
});
