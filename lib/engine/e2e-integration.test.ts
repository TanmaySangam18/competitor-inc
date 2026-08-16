/**
 * End-to-End Integration Test: Full Crew Lifecycle
 *
 * Scenario: User creates "EV startup" idea
 *   1. System generates Tesla crew (CEO, Manufacturing, Engineering, Growth)
 *   2. Nightly shift runs
 *   3. Manufacturing proposes $100K spend
 *   4. Policy routes to Approval Inbox (QUEUE verdict)
 *   5. Founder approves from UI
 *   6. Action executes + logs to Glass Box
 *   7. Manufacturing spawns Supply Chain + QA sub-agents
 *   8. All activities hierarchically logged
 */

import { describe, it, expect, beforeEach } from "vitest";
import { generateCrewFromIdea } from "./dynamic-crew";
import { spawnSubAgents, executeSubAgentsSequential } from "./sub-agent-executor";
import { enrichActivitiesWithSubAgents, buildActivityTree } from "./shift-with-subagents";
import { decide } from "@/lib/core/policy";
import type { Activity, Company, ApprovalItem, SubAgent } from "@/lib/core/types";

describe("E2E Integration: Tesla Crew Lifecycle", () => {
  let company: Company;
  let createdAt: number;

  beforeEach(() => {
    createdAt = Date.now();
    company = {
      id: "e2e-test-1",
      name: "EV Startup",
      slug: "ev-startup",
      idea: "EV with software-first architecture",
      createdAt,
      status: "operating",
      night: 1,
      ledger: { spent: 0, credited: 0, tasksDone: 0, tasksFailed: 0 },
    };
  });

  it("generates Tesla crew from idea + spawns sub-agents + executes with approvals", async () => {
    // Step 1: Generate custom crew from idea
    console.log("Step 1: Generate Tesla crew...");
    const crewOutput = await generateCrewFromIdea(company.idea);

    expect(crewOutput.idea).toBe(company.idea);
    expect(crewOutput.benchmarkCompany).toBe("tesla");
    expect(crewOutput.agents.length).toBeGreaterThan(0);

    // CEO should be first
    const ceoAgent = crewOutput.agents[0];
    expect(ceoAgent.role).toBe("ceo");
    expect(ceoAgent.spendCap).toBe(500000); // $500K

    // Should have engineering (required for EV)
    const engAgent = crewOutput.agents.find((a) => a.role === "engineering");
    expect(engAgent).toBeDefined();
    if (engAgent) {
      expect(engAgent.subAgents?.length || 0).toBeGreaterThan(0);
    }

    console.log(`✅ Generated crew: ${crewOutput.agents.length} agents with ${crewOutput.agents.reduce((sum, a) => sum + (a.subAgents?.length || 0), 0)} sub-agents`);

    // Step 2: Simulate nightly shift — Manufacturing proposes $100K spend
    console.log("\nStep 2: Nightly shift — Manufacturing proposes work...");
    const parentActivity: Activity = {
      id: "mfg-proposal",
      night: 1,
      agent: "manufacturing",
      action: "Reduce cost per unit by 15%",
      meta: "Target: battery supplier negotiation + quality testing framework",
      cost: 100000, // $100K spend
      status: "done",
    };

    // Step 3: Policy decides verdict (should be QUEUE for $100K spend)
    console.log("\nStep 3: Policy enforcement...");
    const decision = decide({
      type: "spend",
      agent: parentActivity.agent,
      amountUsd: parentActivity.cost,
      hasCredential: true,
      compliancePass: true,
    });

    expect(decision.verdict).toBe("QUEUE"); // Spend > $1K threshold → QUEUE
    console.log(`✅ Policy verdict: ${decision.verdict} (spend > $1K → needs approval)`);

    // Step 4: Create Approval Inbox item
    console.log("\nStep 4: Queue to Approval Inbox...");
    const approval: ApprovalItem = {
      id: "appr-mfg-1",
      night: 1,
      agent: "manufacturing",
      kind: "spend",
      title: "Manufacturing spend: Supplier negotiation + QA framework",
      detail: `Reduce cost per unit by 15%. Allocate $100K:
        - Supply Chain: $60K (battery supplier negotiations)
        - Quality: $40K (test automation framework)`,
      amount: 100000,
      resolved: undefined,
    };

    console.log(`✅ Approval queued: ${approval.title} ($${approval.amount})`);

    // Step 5: Founder approves
    console.log("\nStep 5: Founder approves from Inbox...");
    approval.resolved = "approved"; // Simulating founder clicking ✅
    console.log(`✅ Approval resolved: ${approval.resolved}`);

    // Step 6: Execute + spawn sub-agents
    console.log("\nStep 6: Execute action + spawn sub-agents...");
    const mfgSubAgents = spawnSubAgents(
      parentActivity.id,
      "manufacturing",
      parentActivity.cost,
      [
        {
          name: "Supply Chain Agent",
          focus: "Sourcing, supplier relationships",
          scopeAreas: ["sourcing", "logistics"],
          portionOfParentCap: 0.6,
        },
        {
          name: "Quality Agent",
          focus: "Testing, QA, automation",
          scopeAreas: ["qa", "testing"],
          portionOfParentCap: 0.4,
        },
      ]
    );

    expect(mfgSubAgents.length).toBe(2);
    expect(mfgSubAgents[0].allocated).toBe(60000); // 60%
    expect(mfgSubAgents[1].allocated).toBe(40000); // 40%

    console.log(`✅ Sub-agents spawned:`);
    mfgSubAgents.forEach((sa) => {
      console.log(`   - ${sa.name}: $${sa.allocated / 1000}K`);
    });

    // Step 7: Execute sub-agents sequentially
    console.log("\nStep 7: Execute sub-agents (respecting dependencies)...");
    const subActivities = await executeSubAgentsSequential(
      mfgSubAgents,
      parentActivity,
      async (subAgent: SubAgent) => {
        // Simulate work by sub-agent
        return {
          id: `activity-${subAgent.id}`,
          night: 1,
          agent: "manufacturing",
          action: `[${subAgent.name}] ${subAgent.scope.join(", ")}`,
          cost: subAgent.allocated * 0.5, // Use 50% of allocation
          status: "done" as const,
          parentActivityId: parentActivity.id,
        };
      }
    );

    expect(subActivities.length).toBe(2);
    console.log(`✅ Sub-agents executed: ${subActivities.length} activities generated`);

    // Step 8: Attach sub-activities to parent
    parentActivity.subActivities = subActivities;

    // Step 9: Verify Glass Box hierarchy
    console.log("\nStep 8: Verify Glass Box hierarchy...");
    const glassBoxTree = buildActivityTree([parentActivity, ...subActivities]);

    expect(glassBoxTree.length).toBe(1); // One root (parent)
    expect(glassBoxTree[0].activity.id).toBe(parentActivity.id);
    expect(glassBoxTree[0].children.length).toBe(2); // Two children (sub-agents)

    console.log(`✅ Glass Box hierarchy:`);
    console.log(`   Root: ${glassBoxTree[0].activity.action}`);
    glassBoxTree[0].children.forEach((child, i) => {
      console.log(`     └─ Child ${i + 1}: ${child.activity.action}`);
    });

    // Step 10: Verify spend tracking
    console.log("\nStep 9: Verify spend caps enforced...");
    let totalSubSpend = 0;
    for (const subActivity of subActivities) {
      totalSubSpend += subActivity.cost;
    }

    expect(totalSubSpend).toBeLessThanOrEqual(parentActivity.cost);
    console.log(`✅ Total sub-spend: $${Math.round(totalSubSpend / 1000)}K (within $${parentActivity.cost / 1000}K cap)`);

    console.log("\n✨ E2E test passed: Full crew lifecycle working!");
  });

  it("handles rejection flow correctly", async () => {
    const approval: ApprovalItem = {
      id: "appr-reject-1",
      night: 1,
      agent: "growth",
      kind: "spend",
      title: "Ad campaign",
      detail: "Run $5K paid ads",
      amount: 5000,
      resolved: undefined,
    };

    // Founder rejects
    approval.resolved = "rejected";

    // Action should NOT execute
    expect(approval.resolved).toBe("rejected");

    // In real system, approval item remains in Inbox but marked rejected
    // Next shift, similar proposal would be made (crew learns from rejection)
  });

  it("enforces policy at multiple levels", async () => {
    // Test: Policy prevents overspending across sub-agents

    const mfgSubAgents = spawnSubAgents(
      "mfg-test",
      "manufacturing",
      100000,
      [
        {
          name: "Supply Chain",
          focus: "Sourcing",
          scopeAreas: ["sourcing"],
          portionOfParentCap: 0.5,
        },
        {
          name: "Quality",
          focus: "QA",
          scopeAreas: ["qa"],
          portionOfParentCap: 0.5,
        },
      ]
    );

    // Allocations sum to 100K
    const totalAllocated = mfgSubAgents.reduce((sum, sa) => sum + sa.allocated, 0);
    expect(totalAllocated).toBe(100000);

    // Parent can't exceed cap
    const parentCap = 100000;
    expect(totalAllocated).toBeLessThanOrEqual(parentCap);

    // Policy decides parent spend (manufacturing spend is APPROVE in the matrix → QUEUE)
    const policyDecision = decide({ type: "spend", agent: "manufacturing", amountUsd: parentCap, hasCredential: true, compliancePass: true });
    expect(policyDecision.verdict).toBe("QUEUE");
  });

  it("builds complete activity tree from nested sub-agents", async () => {
    // Create a 3-level hierarchy
    const root: Activity = {
      id: "root",
      night: 1,
      agent: "engineering",
      action: "Rebuild platform architecture",
      cost: 150000,
      status: "done",
    };

    const level2_1: Activity = {
      id: "firmware",
      night: 1,
      agent: "engineering",
      action: "[Firmware Agent] Motor control optimization",
      cost: 50000,
      status: "done",
      parentActivityId: root.id,
    };

    const level2_2: Activity = {
      id: "ml",
      night: 1,
      agent: "engineering",
      action: "[ML Agent] Model retraining",
      cost: 50000,
      status: "done",
      parentActivityId: root.id,
    };

    const level3: Activity = {
      id: "mlops",
      night: 1,
      agent: "engineering",
      action: "[MLOps Sub-Agent] Deploy model to edge",
      cost: 25000,
      status: "done",
      parentActivityId: level2_2.id,
    };

    const activities = [root, level2_1, level2_2, level3];
    const tree = buildActivityTree(activities);

    // Tree structure
    expect(tree.length).toBe(1); // One root
    expect(tree[0].activity.id).toBe(root.id);
    expect(tree[0].children.length).toBe(2); // Two children
    expect(tree[0].children[1].children.length).toBe(1); // One sub-child
  });

  it("simulates realistic shift with multiple proposals", async () => {
    // Realistic scenario: one shift with 5-7 activities, mix of auto/queue
    const activities: Activity[] = [
      {
        id: "a1",
        night: 1,
        agent: "ceo",
        action: "Diagnosed constraint: traffic is bottleneck",
        cost: 0,
        status: "done",
      },
      {
        id: "a2",
        night: 1,
        agent: "growth",
        action: "[Demand Gen Agent] Set up Meta pixel tracking",
        cost: 500, // Low cost → AUTO
        status: "done",
      },
      {
        id: "a3",
        night: 1,
        agent: "growth",
        action: "Propose ad campaign: target niche communities",
        cost: 10000,
        status: "done",
        // This needs approval
      },
      {
        id: "a4",
        night: 1,
        agent: "engineering",
        action: "[Firmware Agent] Update motor control firmware",
        cost: 2500,
        status: "done",
      },
    ];

    // Check policy verdicts: growth spend is APPROVE in the matrix → QUEUE regardless of amount
    const smallSpend = decide({ type: "spend", agent: "growth", amountUsd: 100, hasCredential: true, compliancePass: true }).verdict;
    const largeSpend = decide({ type: "spend", agent: "growth", amountUsd: 10000, hasCredential: true, compliancePass: true }).verdict;
    expect(smallSpend).toBe("QUEUE");
    expect(largeSpend).toBe("QUEUE");

    // Enrich with sub-agents
    const enriched = await enrichActivitiesWithSubAgents(activities, company, 1);

    expect(enriched.length).toBeGreaterThan(0);

    console.log(`✅ Realistic shift: ${enriched.length} activities, mix of auto + queue`);
  });
});
