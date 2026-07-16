import { describe, it, expect, vi } from "vitest";
import { deliverFinanceReport, financeSummary, renderFinanceReport } from "./finance-report";
import { AuditLog } from "@/lib/core/audit";

describe("renderFinanceReport — real inputs only, 'not connected' over zero-padding", () => {
  it("unknown metrics say 'not connected' — NEVER a fabricated $0.00", () => {
    const md = renderFinanceReport({ periodLabel: "2026-07" });
    expect(md).toContain("Settled revenue: not connected");
    expect(md).toContain("Attributed cost: not connected");
    expect(md).not.toContain("$0.00"); // absence of data must not read as "zero dollars"
  });

  it("known numbers render verbatim; margin appears ONLY when both terms are real", () => {
    const md = renderFinanceReport({ periodLabel: "2026-07", settledRevenueUsd: 1234.5, costUsd: 234.5, sources: ["polar webhook ledger", "audit ledger rollup"] });
    expect(md).toContain("Settled revenue: $1234.50");
    expect(md).toContain("Attributed cost: $234.50");
    expect(md).toContain("Margin: $1000.00");
    expect(md).toContain("polar webhook ledger");
  });

  it("half-known margin is refused, with the honest reason", () => {
    const md = renderFinanceReport({ periodLabel: "2026-07", settledRevenueUsd: 500 });
    expect(md).toContain("Margin: not computable");
    expect(md).not.toMatch(/Margin: \$/);
  });

  it("null (explicitly not connected) is treated exactly like undefined", () => {
    const md = renderFinanceReport({ periodLabel: "w28", settledRevenueUsd: null, costUsd: null });
    expect(md).toContain("Settled revenue: not connected");
  });

  it("no sources → says so, instead of implying the numbers are backed", () => {
    const md = renderFinanceReport({ periodLabel: "2026-07", settledRevenueUsd: 10 });
    expect(md).toContain("none recorded");
  });

  it("spend categories render only what the caller's ledger actually recorded", () => {
    const md = renderFinanceReport({ periodLabel: "2026-07", spendByCategoryUsd: { "model-api": 42.1, hosting: 20 } });
    expect(md).toContain("model-api: $42.10");
    expect(md).toContain("hosting: $20.00");
  });
});

describe("financeSummary + deliverFinanceReport — the governed #finance drop", () => {
  it("summary carries the same honesty (not connected / not computable)", () => {
    expect(financeSummary({ periodLabel: "2026-07" })).toBe("Finance — 2026-07 · settled not connected · cost not connected · margin not computable");
    expect(financeSummary({ periodLabel: "2026-07", settledRevenueUsd: 100, costUsd: 40 })).toContain("margin $60.00");
  });

  it("delivers through the governed office path to the finance channel", async () => {
    const post = vi.fn(async (_c: string, _t: string) => {});
    const log = new AuditLog();
    const r = await deliverFinanceReport(
      { periodLabel: "2026-07", settledRevenueUsd: 100, costUsd: 40, sources: ["test ledger"] },
      { env: { SLACK_BOT_TOKEN: "tok", SLACK_CH_FINANCE: "C-FIN" }, post, govern: { log } },
    );
    expect(r.posted).toMatchObject({ delivered: true, channel: "C-FIN" });
    expect(post.mock.calls[0][1]).toContain("Finance — 2026-07");
    expect(log.all()[0]).toMatchObject({ actor: "finance", action: "slack_post", verdict: "AUTO" });
  });

  it("keyless (no Slack) → the report still renders; delivery is honestly undelivered", async () => {
    const post = vi.fn();
    const r = await deliverFinanceReport({ periodLabel: "2026-07" }, { env: {}, post });
    expect(r.report).toContain("Finance report — 2026-07");
    expect(r.posted.delivered).toBe(false);
    expect(post).not.toHaveBeenCalled();
  });
});
