#!/usr/bin/env node

/**
 * Script to generate example crew configurations.
 * Usage: node scripts/generate-crew-example.mjs
 *
 * Outputs beautiful JSON examples to docs/examples/
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");

// Mock implementation of dynamic crew generation
// (In production, would import from lib/engine/dynamic-crew.ts)
async function generateCrewFromIdea(idea, benchmarkCompany) {
  const benchmark = benchmarkCompany || detectBenchmarkCompany(idea);

  // Tesla crew
  const teslaCrew = {
    idea,
    benchmarkCompany: benchmark,
    agents: [
      {
        name: "Elon (CEO)",
        role: "ceo",
        responsibilities: [
          "Set quarterly OKRs for 10K/week production",
          "Solve the binding constraint (battery cost, chip supply, or engineering velocity)",
          "Allocate capital across manufacturing, software, sales",
          "Make final product decisions (specs, features, pricing)",
        ],
        decisionRights: [
          "Product roadmap (what to build, when to ship)",
          "Capital allocation (spend $200K on tooling or R&D?)",
          "Organizational structure (hire, fire, reorg)",
          "Strategic partnerships (supplier deals, government contracts)",
        ],
        keyMetrics: [
          "Units produced/week",
          "Cost per unit ($/unit)",
          "Gross margin %",
          "YoY growth rate",
        ],
        playbook: "Playing to Win (Lafley & Martin) — strategy clarity, constraint diagnosis, resource allocation",
        spendCap: 500000,
        directReports: 4,
        subAgents: [],
      },
      {
        name: "JB (Manufacturing Lead)",
        role: "manufacturing",
        responsibilities: [
          "Get to 10K+ units/week production",
          "Reduce cost per unit by 15% YoY",
          "Manage supply chain (battery, semiconductors, materials)",
          "Own quality (defect rate < 0.5%)",
          "Ensure on-time delivery to customers",
        ],
        decisionRights: [
          "Supply chain sourcing (which suppliers, which materials)",
          "Manufacturing process improvements",
          "Tooling & automation investments",
          "Quality thresholds (what passes inspection)",
        ],
        keyMetrics: [
          "Units produced/week",
          "Defect rate (%)",
          "Cost per unit",
          "On-time delivery %",
        ],
        playbook:
          "Toyota Production System — lean ops, continuous improvement, just-in-time supply",
        spendCap: 200000,
        directReports: 50,
        subAgents: [
          {
            name: "Supply Chain Agent",
            focus:
              "Sourcing battery cells, semiconductors, materials. Negotiate supplier contracts. Forecast demand. Mitigate risks (chip shortages, geopolitical).",
            spendCap: 120000,
          },
          {
            name: "Quality Agent",
            focus:
              "Design test automation. Own defect analysis. Manage recalls. Ensure safety certifications.",
            spendCap: 80000,
          },
        ],
      },
      {
        name: "Lars (Software Lead)",
        role: "engineering",
        responsibilities: [
          "Build vehicle software OS (firmware, Autopilot, infotainment)",
          "Ship OTA updates (over-the-air) to 1M+ vehicles",
          "Own autonomous driving ML models",
          "Manage cloud infrastructure (data telemetry, training)",
        ],
        decisionRights: [
          "Software architecture decisions",
          "ML model choices (which training data, which architecture)",
          "OTA update cadence (weekly? monthly?)",
          "Safety-critical code reviews",
        ],
        keyMetrics: [
          "Lines of code deployed/week",
          "Autopilot safety incidents/month",
          "OTA update adoption rate",
          "Model inference latency (ms)",
        ],
        playbook: "Shape Up (Basecamp) — appetite-driven, bet-driven, fixed scope; ship or kill",
        spendCap: 300000,
        directReports: 150,
        subAgents: [
          {
            name: "Firmware Engineer",
            focus:
              "Motor control, battery management, thermal systems. Embedded C/C++, RTOS, CAN protocols.",
            spendCap: 150000,
          },
          {
            name: "ML/AI Engineer",
            focus:
              "Autopilot neural networks. Training on fleet data. Model optimization for edge inference.",
            spendCap: 105000,
          },
          {
            name: "Infrastructure Engineer",
            focus: "Cloud architecture, CI/CD, DevOps, data pipeline, monitoring.",
            spendCap: 45000,
          },
        ],
      },
      {
        name: "Ella (Growth Lead)",
        role: "growth",
        responsibilities: [
          "Get first 1000 pre-orders without paid ads (founder network, warm intros)",
          "Build go-to-market strategy (DTC vs dealer, pricing)",
          "Run demand tests (fake-door, landing page, pre-order campaign)",
          "Own customer acquisition (organic, PR, partnerships)",
        ],
        decisionRights: [
          "Pricing (base price, variants, discounts)",
          "Channel strategy (online shop vs showrooms vs dealers)",
          "Marketing budget allocation (ads vs PR vs partnerships)",
          "Customer targets (early adopters vs mainstream)",
        ],
        keyMetrics: [
          "Pre-orders placed",
          "Conversion rate (visitor → pre-order)",
          "CAC (cost per acquisition)",
          "Brand awareness (%)",
        ],
        playbook:
          "Bullseye/Traction (Weinberg & Mares) — focus on one channel, test, scale; demand-first",
        spendCap: 100000,
        directReports: 15,
        subAgents: [
          {
            name: "Demand Generation Agent",
            focus: "Paid ads, conversion optimization, landing page A/B testing, funnel analysis.",
            spendCap: 50000,
          },
          {
            name: "Content Agent",
            focus: "Blog posts, social media, PR, founder narrative, brand storytelling.",
            spendCap: 50000,
          },
        ],
      },
      {
        name: "Alex (Support Lead)",
        role: "support",
        responsibilities: [
          "Own customer support for early buyers",
          "Manage Supercharger network (uptime, locations)",
          "Handle warranty claims & recalls",
          "Measure NPS (Net Promoter Score)",
        ],
        decisionRights: [
          "Support policies (warranty terms, refund limits)",
          "Supercharger locations (where to build)",
          "Recall decisions (safety threshold)",
        ],
        keyMetrics: [
          "NPS (Net Promoter Score)",
          "Customer satisfaction score",
          "Support ticket resolution time",
          "Supercharger uptime %",
        ],
        playbook:
          "The Effortless Experience (CEB) — minimize customer effort, empower agents, measure effort score",
        spendCap: 50000,
        directReports: 10,
        subAgents: [],
      },
    ],
    totalMonthlyCap: 1150000,
    description: `Custom crew for: "${idea}". Generated from tesla's org structure. 5 agents with 5 sub-agents. Total monthly spend cap: $1150K.`,
  };

  return teslaCrew;
}

function detectBenchmarkCompany(idea) {
  const lowerIdea = idea.toLowerCase();
  if (lowerIdea.includes("ev") || lowerIdea.includes("electric") || lowerIdea.includes("tesla")) {
    return "tesla";
  }
  return "tesla";
}

// Main execution
async function main() {
  console.log("🚀 Generating crew examples...\n");

  // Generate Tesla crew
  const teslaIdea = "EV with software-first architecture";
  const teslaCrew = await generateCrewFromIdea(teslaIdea);

  // Save to file
  const outputPath = path.join(projectRoot, "docs/examples/tesla-crew.json");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(teslaCrew, null, 2));

  console.log(`✅ Generated Tesla crew: ${outputPath}`);
  console.log(`   ${teslaCrew.agents.length} agents with ${teslaCrew.agents.reduce((sum, a) => sum + (a.subAgents?.length || 0), 0)} sub-agents`);
  console.log(`   Total monthly spend cap: $${(teslaCrew.totalMonthlyCap / 1000).toFixed(0)}K\n`);

  // Print summary
  console.log("Crew Composition:");
  teslaCrew.agents.forEach((agent, i) => {
    const subAgentCount = agent.subAgents?.length || 0;
    console.log(
      `  ${i + 1}. ${agent.name} (${agent.role}) - $${(agent.spendCap / 1000).toFixed(0)}K ${subAgentCount > 0 ? `[+${subAgentCount} sub-agents]` : ""}`
    );
  });

  console.log("\n✨ Generation complete!\n");
}

main().catch(console.error);
