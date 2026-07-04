import { describe, it, expect } from "vitest";
import {
  standardizeTitle,
  extractResponsibilities,
  extractDecisionRights,
  extractKeyMetrics,
  extractDirectReports,
  parseJob,
} from "./job-parser";

describe("job-parser", () => {
  describe("standardizeTitle", () => {
    it("maps CEO-like titles to 'ceo'", () => {
      expect(standardizeTitle("Chief Executive Officer")).toBe("ceo");
      expect(standardizeTitle("CEO")).toBe("ceo");
      expect(standardizeTitle("President")).toBe("ceo");
    });

    it("maps engineering titles to 'engineering'", () => {
      expect(standardizeTitle("VP Software & AI")).toBe("engineering");
      expect(standardizeTitle("Senior Engineer Firmware")).toBe("engineering");
      expect(standardizeTitle("Director Engineering")).toBe("engineering");
    });

    it("maps manufacturing titles to 'manufacturing'", () => {
      expect(standardizeTitle("VP Manufacturing")).toBe("manufacturing");
      expect(standardizeTitle("Senior Manager Supply Chain")).toBe("manufacturing");
    });

    it("maps marketing/growth titles to 'growth'", () => {
      expect(standardizeTitle("VP Sales & Distribution")).toBe("growth");
      expect(standardizeTitle("Senior Manager Global Marketing")).toBe("growth");
    });

    it("maps support titles to 'support'", () => {
      expect(standardizeTitle("Director Customer Experience")).toBe("support");
    });

    it("defaults to 'engineering' for unknown titles", () => {
      expect(standardizeTitle("Unknown Role Title")).toBe("engineering");
    });
  });

  describe("extractResponsibilities", () => {
    it("extracts responsibilities from 'own' patterns", () => {
      const desc =
        "Own supply chain strategy. Own relationships with suppliers. Own cost optimization.";
      const resp = extractResponsibilities(desc);
      expect(resp.length).toBeGreaterThan(0);
      expect(resp.some((r) => r.includes("supply chain"))).toBe(true);
    });

    it("extracts responsibilities from 'responsible for' patterns", () => {
      const desc = "Responsible for manufacturing operations. Responsible for quality assurance.";
      const resp = extractResponsibilities(desc);
      expect(resp.length).toBeGreaterThan(0);
    });

    it("extracts responsibilities from 'lead' patterns", () => {
      const desc =
        "Lead autonomous driving development. Lead cloud infrastructure. Lead team of 50.";
      const resp = extractResponsibilities(desc);
      expect(resp.some((r) => r.includes("autonomous"))).toBe(true);
    });

    it("limits to top 8 responsibilities", () => {
      const desc = `
        Own A. Own B. Own C. Own D. Own E. Own F. Own G. Own H. Own I. Own J.
      `;
      const resp = extractResponsibilities(desc);
      expect(resp.length).toBeLessThanOrEqual(8);
    });

    it("falls back to sentences if no patterns match", () => {
      const desc = "This is a simple job description. It has two sentences here.";
      const resp = extractResponsibilities(desc);
      expect(resp.length).toBeGreaterThan(0);
    });
  });

  describe("extractDecisionRights", () => {
    it("extracts decision rights from 'makes decisions on' patterns", () => {
      const desc = "Makes decisions on product roadmap. Makes final decisions on pricing.";
      const resp = extractDecisionRights(desc);
      expect(resp.length).toBeGreaterThan(0);
      expect(resp.some((d) => d.includes("product")));
    });

    it("extracts decision rights from 'approves' patterns", () => {
      const desc = "Approves hiring decisions. Approves capital expenditures.";
      const resp = extractDecisionRights(desc);
      expect(resp.length).toBeGreaterThan(0);
    });

    it("provides defaults if no patterns match", () => {
      const desc = "This job does some work.";
      const resp = extractDecisionRights(desc);
      expect(resp.length).toBeGreaterThan(0);
      expect(resp[0]).toContain("Resource allocation");
    });
  });

  describe("extractKeyMetrics", () => {
    it("extracts metrics from 'Key metrics:' section", () => {
      const desc =
        "Key metrics: units produced/week, defect rate, cost per unit, on-time delivery.";
      const metrics = extractKeyMetrics(desc);
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics.some((m) => m.includes("units"))).toBe(true);
    });

    it("extracts metrics from 'KPIs:' section", () => {
      const desc = "KPIs: conversion rate, CAC, viral reach, media coverage.";
      const metrics = extractKeyMetrics(desc);
      expect(metrics.length).toBeGreaterThan(0);
    });

    it("provides defaults if no metrics found", () => {
      const desc = "This job does work.";
      const metrics = extractKeyMetrics(desc);
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0]).toBe("Output quality");
    });

    it("limits to top 6 metrics", () => {
      const desc =
        "Key metrics: a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t.";
      const metrics = extractKeyMetrics(desc);
      expect(metrics.length).toBeLessThanOrEqual(6);
    });
  });

  describe("extractDirectReports", () => {
    it("extracts direct reports count", () => {
      const desc = "Direct reports: 50+ (plant managers, supply chain leads).";
      const count = extractDirectReports(desc);
      expect(count).toBe(50);
    });

    it("handles 'Direct report:' singular", () => {
      const desc = "Direct report: 1 (assistant).";
      const count = extractDirectReports(desc);
      expect(count).toBe(1);
    });

    it("returns null if no direct reports found", () => {
      const desc = "This job has no direct reports.";
      const count = extractDirectReports(desc);
      expect(count).toBeNull();
    });
  });

  describe("parseJob", () => {
    it("parses a complete job object", () => {
      const rawJob = {
        title: "VP Manufacturing",
        description:
          "Own manufacturing operations. Direct reports: 50+. Key metrics: units produced/week, cost per unit.",
        level: "Director+",
        compensation: { base: 250000, stock: 500000, bonus: 100000 },
      };

      const parsed = parseJob(rawJob);

      expect(parsed.title).toBe("VP Manufacturing");
      expect(parsed.agentRole).toBe("manufacturing");
      expect(parsed.responsibilities.length).toBeGreaterThan(0);
      expect(parsed.decisionRights.length).toBeGreaterThan(0);
      expect(parsed.keyMetrics.length).toBeGreaterThan(0);
      expect(parsed.directReports).toBe(50);
      expect(parsed.level).toBe("Director+");
      expect(parsed.compensation?.base).toBe(250000);
    });
  });
});
