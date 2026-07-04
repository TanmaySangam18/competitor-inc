/**
 * Shift Execution with Sub-Agent Orchestration
 *
 * Wraps the standard runShift() to add hierarchical sub-agent spawning.
 * When a parent agent (Manufacturing, Engineering, Growth) is assigned complex work,
 * this layer automatically spawns and executes sub-agents, collecting their activities
 * into the Glass Box.
 */

import type { Activity, Company } from "./types";
import {
  spawnSubAgents,
  getSubAgentTemplates,
  executeSubAgentsSequential,
} from "./sub-agent-executor";

/**
 * Process activities returned by a shift, spawning sub-agents for complex tasks.
 *
 * Example:
 *   - Manufacturing agent proposed: "Reduce cost per unit by 15%" ($50K spend)
 *   - This triggers sub-agent spawning: Supply Chain ($30K) + QA ($20K)
 *   - Both sub-agents run in parallel (respecting blocking dependencies)
 *   - Their activities are attached as subActivities[] to the parent Activity
 *
 * Returns: activities with sub-activities nested hierarchically
 */
export async function enrichActivitiesWithSubAgents(
  activities: Activity[],
  company: Company,
  night: number,
  makeId: () => string = () => crypto.randomUUID()
): Promise<Activity[]> {
  const enriched: Activity[] = [];
  // At most ONE breakdown per shift — the Glass Box stays readable, not padded.
  let spawned = false;

  for (const activity of activities) {
    // Check if this agent role can spawn sub-agents
    const templates = getSubAgentTemplates(activity.agent);
    if (templates.length === 0) {
      // No sub-agents for this role; return as-is
      enriched.push(activity);
      continue;
    }

    // Heuristic: spawn sub-agents if task is complex (high cost or involves operations)
    const isComplex =
      activity.cost > 50000 || // High-spend activities
      activity.action.toLowerCase().includes("scale") ||
      activity.action.toLowerCase().includes("optimize") ||
      activity.action.toLowerCase().includes("build") ||
      activity.action.toLowerCase().includes("launch");

    if (!isComplex || spawned) {
      enriched.push(activity);
      continue;
    }

    try {
      // Allocations split the parent's REAL cost — never a fantasy default. A $12 build fans out
      // into $7.20/$4.80 shares; a $0 task fans out into scope-only children.
      const parentSpendCap = activity.cost;

      // Spawn sub-agents
      const subAgents = spawnSubAgents(
        activity.id,
        activity.agent,
        parentSpendCap,
        templates,
        makeId
      );

      // Execute sub-agents sequentially (respecting dependencies)
      const subActivities = await executeSubAgentsSequential(
        subAgents,
        activity,
        async (subAgent) => {
          // Scope breakdown of the parent's work. Cost is 0 — the parent's cost already counts in
          // the ledger; children never invent additional spend (honesty invariant).
          return {
            id: makeId(),
            night,
            agent: activity.agent,
            action: `[${subAgent.name}] ${activity.action}`,
            meta: `Sub-agent scope: ${subAgent.scope.join(", ")} · cost included in parent`,
            cost: 0,
            status: "done" as const,
            parentActivityId: activity.id,
          };
        }
      );

      // Attach sub-activities to parent
      activity.subActivities = subActivities;
      enriched.push(activity);
      spawned = true;
    } catch (err) {
      console.warn(`Failed to spawn sub-agents for activity ${activity.id}:`, err);
      // Graceful degradation: return activity as-is
      enriched.push(activity);
    }
  }

  return enriched;
}

/* ── Activity Glass Box Formatting ────────────────────────────────– */

/**
 * Format hierarchical activities for Glass Box display.
 * Flattens the tree but preserves hierarchy via parentActivityId.
 */
export function flattenActivitiesForGlassBox(activities: Activity[]): Activity[] {
  const result: Activity[] = [];

  function flatten(activity: Activity, parentId?: string) {
    // Strip the nested copy — children re-appear as flat rows, so keeping the nest would persist
    // every sub-activity twice in the store.
    result.push({
      ...activity,
      subActivities: undefined,
      parentActivityId: parentId || activity.parentActivityId,
    });

    if (activity.subActivities) {
      for (const subActivity of activity.subActivities) {
        flatten(subActivity, activity.id);
      }
    }
  }

  for (const activity of activities) {
    flatten(activity);
  }

  return result;
}

/**
 * Build a hierarchical tree view of activities for Glass Box rendering.
 */
export interface ActivityTreeNode {
  activity: Activity;
  children: ActivityTreeNode[];
}

export function buildActivityTree(activities: Activity[]): ActivityTreeNode[] {
  const byId = new Map(activities.map((a) => [a.id, a]));
  const roots: ActivityTreeNode[] = [];
  const nodes = new Map<string, ActivityTreeNode>();

  // Create nodes for all activities
  for (const activity of activities) {
    nodes.set(activity.id, { activity, children: [] });
  }

  // Build parent-child relationships
  for (const activity of activities) {
    if (activity.parentActivityId && nodes.has(activity.parentActivityId)) {
      const parentNode = nodes.get(activity.parentActivityId)!;
      const childNode = nodes.get(activity.id)!;
      parentNode.children.push(childNode);
    } else if (!activity.parentActivityId) {
      // Root activity
      roots.push(nodes.get(activity.id)!);
    }
  }

  return roots;
}
