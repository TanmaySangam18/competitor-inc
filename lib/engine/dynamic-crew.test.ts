import { describe, it, expect } from "vitest";
import {
  detectBenchmarkCompany,
  matchBenchmarkCompany,
  rolesForIdea,
  generateCrewFromIdea,
  crewToSnapshot,
} from "./dynamic-crew";

describe("dynamic-crew", () => {
  describe("detectBenchmarkCompany", () => {
    it("detects Tesla from EV keywords", () => {
      expect(detectBenchmarkCompany("EV with software-first")).toBe("tesla");
      expect(detectBenchmarkCompany("Electric vehicle company")).toBe("tesla");
      expect(detectBenchmarkCompany("autonomous driving")).toBe("tesla");
    });

    it("detects Notion from productivity keywords", () => {
      expect(detectBenchmarkCompany("project management tool")).toBe("notion");
      expect(detectBenchmarkCompany("collaborative database")).toBe("notion");
    });

    it("detects Slack from communication keywords", () => {
      expect(detectBenchmarkCompany("team messaging platform")).toBe("slack");
      expect(detectBenchmarkCompany("internal communication")).toBe("slack");
    });

    it("detects Zapier from automation keywords", () => {
      expect(detectBenchmarkCompany("workflow automation")).toBe("zapier");
      expect(detectBenchmarkCompany("integration platform")).toBe("zapier");
    });

    it("defaults to tesla for unknown ideas", () => {
      expect(detectBenchmarkCompany("xyz unknown thing")).toBe("tesla");
    });
  });

  describe("matchBenchmarkCompany (strict — only benchmarks with real org data)", () => {
    it("matches tesla for EV ideas", () => {
      expect(matchBenchmarkCompany("EV with software-first")).toBe("tesla");
    });

    it("matches notion for productivity/SaaS ideas", () => {
      expect(matchBenchmarkCompany("project management tool")).toBe("notion");
      expect(matchBenchmarkCompany("collaborative notes app")).toBe("notion");
    });

    it("returns null for keyword hits we hold no data for (slack/zapier)", () => {
      expect(matchBenchmarkCompany("team messaging platform")).toBeNull();
      expect(matchBenchmarkCompany("workflow automation")).toBeNull();
    });

    it("returns null for unmatched ideas (never guesses)", () => {
      expect(matchBenchmarkCompany("a saas for accountants")).toBeNull();
    });
  });

  describe("notion benchmark crew", () => {
    it("generates a SaaS crew with no manufacturing", async () => {
      const crew = await generateCrewFromIdea("collaborative notes app");
      expect(crew.benchmarkCompany).toBe("notion");
      const roles = crew.agents.map((a) => a.role);
      expect(roles[0]).toBe("ceo");
      expect(roles).toContain("engineering");
      expect(roles).not.toContain("manufacturing");
    });
  });

  describe("rolesForIdea", () => {
    it("returns the default five for unmatched ideas", () => {
      expect(rolesForIdea("a saas for accountants")).toEqual(["ceo", "engineering", "marketing", "support", "growth"]);
    });

    it("includes manufacturing (ceo first) for EV ideas", () => {
      const roles = rolesForIdea("EV with software-first architecture");
      expect(roles[0]).toBe("ceo");
      expect(roles).toContain("manufacturing");
    });
  });

  describe("generateCrewFromIdea", () => {
    it("generates crew for EV startup", async () => {
      const crew = await generateCrewFromIdea("EV with software-first architecture");

      expect(crew.idea).toBe("EV with software-first architecture");
      expect(crew.benchmarkCompany).toBe("tesla");
      expect(crew.agents.length).toBeGreaterThan(0);

      // CEO should be first
      expect(crew.agents[0].role).toBe("ceo");

      // CEO first, and the Tesla benchmark must yield engineering + manufacturing
      const roles = crew.agents.map((a) => a.role);
      expect(roles[0]).toBe("ceo");
      expect(roles).toContain("engineering");
      expect(roles).toContain("manufacturing");
    });

    it("generates agents with spend caps", async () => {
      const crew = await generateCrewFromIdea("EV startup");

      crew.agents.forEach((agent) => {
        expect(agent.spendCap).toBeGreaterThan(0);
        expect(typeof agent.spendCap).toBe("number");
      });

      // CEO should have highest cap
      const ceoSpend = crew.agents.find((a) => a.role === "ceo")?.spendCap;
      expect(ceoSpend).toBeGreaterThan(0);
    });

    it("generates sub-agents for complex roles", async () => {
      const crew = await generateCrewFromIdea("EV startup");

      // Should have at least one agent with sub-agents (engineering or manufacturing)
      const agentWithSubs = crew.agents.find((a) => a.subAgents && a.subAgents.length > 0);
      expect(agentWithSubs).toBeDefined();
      expect(agentWithSubs?.subAgents?.length).toBeGreaterThan(0);
    });

    it("includes playbooks in agent profiles", async () => {
      const crew = await generateCrewFromIdea("EV startup");

      crew.agents.forEach((agent) => {
        expect(agent.playbook).toBeTruthy();
        expect(typeof agent.playbook).toBe("string");
      });

      // Check specific playbooks
      const ceo = crew.agents.find((a) => a.role === "ceo");
      expect(ceo?.playbook).toContain("Playing to Win");
    });

    it("calculates total monthly cap", async () => {
      const crew = await generateCrewFromIdea("EV startup");

      expect(crew.totalMonthlyCap).toBeGreaterThan(0);

      // Should match sum of individual caps
      const sumCaps = crew.agents.reduce((sum, a) => sum + a.spendCap, 0);
      expect(crew.totalMonthlyCap).toBe(sumCaps);
    });
  });

  describe("crewToSnapshot", () => {
    it("converts crew to snapshot", async () => {
      const crew = await generateCrewFromIdea("EV startup");
      const snapshot = crewToSnapshot(crew);

      expect(snapshot.idea).toBe(crew.idea);
      expect(snapshot.benchmark).toBe(crew.benchmarkCompany);
      expect(snapshot.agents.length).toBe(crew.agents.length);
      expect(snapshot.createdAt).toBeLessThanOrEqual(Date.now());
      expect(snapshot.createdAt).toBeGreaterThan(Date.now() - 1000); // Within 1 second
    });
  });
});
