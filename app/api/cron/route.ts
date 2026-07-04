import crypto from "node:crypto";
import { serviceClient } from "@/lib/engine/service";
import { runShift } from "@/lib/engine/server";
import { insertActivities, insertApprovals, insertExperiments, closeExperiment, fetchExperiments, updateCompany, toCompany } from "@/lib/engine/db";
import { sendEmail } from "@/lib/engine/execution";
import { fetchOperate } from "@/lib/engine/db";
import { generateWeeklyDigest, sendWeeklyDigest } from "@/lib/engine/weekly-review-digest";
import { saveScorecardSnapshot, type ScorecardMetric } from "@/lib/engine/scorecard-persistence";
import { auditShiftActivities } from "@/lib/engine/office-house-architecture";
import { performanceWeightedAllocations, overageForAllocation, breachesForAllocations, spendByAgent } from "@/lib/engine/office-budget";
import { successRateByAgent } from "@/lib/engine/agent-performance";
import { loadWallet } from "@/lib/engine/wallet-db";
import { decideSpend } from "@/lib/engine/wallet";
import { rolesForIdea } from "@/lib/engine/dynamic-crew";
import { POLICY } from "@/lib/engine/policy";
import type { Company, Activity, AgentRole } from "@/lib/engine/types";
import type { FunnelDiagnosis } from "@/lib/engine/growth";
import { remember, recall } from "@/lib/engine/memory";
import { buildGraph, summarizeGraph } from "@/lib/engine/bkg";
import { withTrace } from "@/lib/engine/observability";
import { raiseAlert } from "@/lib/engine/alerts";
import { runGrowthStep } from "@/lib/engine/growth";
import { readFunnel } from "@/lib/engine/funnel";

export const runtime = "nodejs";

const round = (n: number) => Math.round(n * 100) / 100;

// Nightly heartbeat. Vercel Cron calls this (see vercel.json). It runs one autonomous shift for
// every operating company and persists the results. Idle until Supabase (service role) is set.
// Constant-time bearer check (avoids timing leaks; matches the billing-webhook posture).
function bearerOk(req: Request, secret: string): boolean {
  const got = Buffer.from(req.headers.get("authorization") || "", "utf8");
  const want = Buffer.from(`Bearer ${secret}`, "utf8");
  return got.length === want.length && crypto.timingSafeEqual(got, want);
}

export async function GET(req: Request) {
  // Fail-CLOSED: the heartbeat triggers real spend/deploys, so it never runs unauthenticated.
  // Set CRON_SECRET (Vercel Cron sends it automatically) to enable it; absent ⇒ 401, not open.
  const secret = process.env.CRON_SECRET;
  if (!secret) return new Response("Cron disabled — set CRON_SECRET to enable.", { status: 401 });
  if (!bearerOk(req, secret)) return new Response("Unauthorized", { status: 401 });

  const sb = serviceClient();
  if (!sb) {
    return Response.json({ ran: 0, note: "Supabase service role not configured — nightly heartbeat idle." });
  }
  const { data, error } = await sb.from("companies").select("*").eq("status", "operating");
  if (error) {
    console.error("[/api/cron] companies fetch:", error.message);
    return Response.json({ error: "database error" }, { status: 500 });
  }

  const EMPTY = { spent: 0, credited: 0, tasksDone: 0, tasksFailed: 0 };
  let ran = 0;
  let failed_companies = 0;
  // Friday (UTC): collect each company's growth diagnosis during the loop for the weekly digest.
  const isFriday = new Date().getUTCDay() === 5;
  const fridayDigests: Array<{ company: Company; diagnosis: FunnelDiagnosis }> = [];
  for (const row of data ?? []) {
    // Isolate each company: one bad row (e.g. null ledger, insert error) must not abort the
    // whole nightly run for everyone else.
    try {
      const company = toCompany(row);
      if (!company.ledger || typeof company.ledger !== "object") company.ledger = { ...EMPTY };
      // Read-back: recall what earlier nights did so this shift builds on it (coherence over time)…
      const recalled = (await recall(sb, company.id, company.idea, 5).catch(() => [])).join(" • ");
      // …and the BKG: a structured summary of what this company already knows about itself, derived
      // on-read from its own activity history (no new table). Both feed the next shift's context.
      const history = await sb
        .from("activities")
        .select("action,meta,agent,cost,status")
        .eq("company_id", company.id)
        .order("created_at", { ascending: false })
        .limit(60);
      const graphSummary = summarizeGraph(buildGraph((history.data ?? []) as { action?: string; meta?: string; agent?: string }[]));

      // ── Revenue Loop growth step (BEFORE the shift): measure → close → diagnose → propose. ──
      // Fail-soft: a growth error never blocks the shift. Learnings go into memory + priorContext
      // so the model builds on them, and closes/proposals persist to the experiments ledger.
      let growthContext: Parameters<typeof runShift>[3];
      let growthNotes = "";
      try {
        const [openExps, funnel] = await Promise.all([
          fetchExperiments(sb, company.id).then((xs) => xs.filter((x) => x.status === "running")),
          readFunnel(sb, company.slug),
        ]);
        const g = await withTrace("growth", async () => runGrowthStep(company, openExps, funnel, [], company.night + 1), { companyId: company.id });
        for (const x of g.closed) await closeExperiment(sb, x).catch((e) => console.error("[/api/cron] close exp:", e?.message));
        await insertExperiments(sb, company.id, g.proposed).catch((e) => console.error("[/api/cron] insert exps:", e?.message));
        await insertActivities(sb, company.id, g.activities).catch((e) => console.error("[/api/cron] growth log:", e?.message));
        for (const note of g.memoryNotes) {
          await remember(sb, company.id, company.night, "experiment", note);
        }
        growthNotes = g.memoryNotes.join(" • ");
        growthContext = {
          goal: company.growthGoal,
          constraint: g.diagnosis.constraint,
          signal: g.diagnosis.signal,
          learnings: g.closed.map((x) => x.learning ?? "").filter(Boolean),
        };
        if (isFriday) fridayDigests.push({ company, diagnosis: g.diagnosis });

        // Persist a Scorecard snapshot (v0.5) so trend history accumulates for the weekly digest.
        // Real funnel values only — nulls stay null (basis "missing"), never invented.
        const metrics: ScorecardMetric[] = [
          { id: "views", name: "views", value: funnel.views ?? 0, target: 0, basis: funnel.basis.views, unit: "count" },
          { id: "signups", name: "signups", value: funnel.signups ?? 0, target: 0, basis: funnel.basis.signups, unit: "count" },
          { id: "paying", name: "paying_customers", value: funnel.payingCustomers ?? 0, target: 0, basis: funnel.basis.paying, unit: "count" },
          { id: "revenue", name: "revenue_cents", value: funnel.revenueCents ?? 0, target: 0, basis: funnel.basis.revenue, unit: "cents" },
        ];
        await saveScorecardSnapshot(company.id, company.night + 1, metrics, g.diagnosis.constraint, g.diagnosis.signal).catch(
          (e) => console.error("[/api/cron] scorecard snapshot:", e?.message)
        );
      } catch (e) {
        console.error("[/api/cron] growth step failed:", e instanceof Error ? e.message : "unknown");
      }

      const priorContext = [recalled, graphSummary, growthNotes].filter(Boolean).join(" • ");
      const { activities, approvals } = await withTrace("shift", () => runShift(company, undefined, priorContext, growthContext), { companyId: company.id, night: company.night });
      await insertActivities(sb, company.id, activities);

      // Office · Resource Allocator + Policy Enforcer — allocate the monthly cap across the crew,
      // PERFORMANCE-WEIGHTED by each agent's real ship-vs-fail rate (agents that convert spend into
      // shipped work earn more budget; bounded ±25% so one night never starves anyone). Then, BEFORE
      // a consequential spend is queued, check whether it would push that agent past its allocation
      // and annotate the Approval-Inbox item with the Office's veto recommendation.
      const crewRoles = rolesForIdea(company.idea);
      const priorActivities = ((history.data ?? []) as { agent?: string; cost?: number; status?: string }[]).map((h) => ({
        id: "",
        night: 0,
        agent: (h.agent ?? "engineering") as AgentRole,
        action: "",
        cost: typeof h.cost === "number" ? h.cost : 0,
        status: (h.status === "failed-credited" ? "failed-credited" : "done") as Activity["status"],
      })) as Activity[];
      const cumulative = [...priorActivities, ...activities];
      const allocations = performanceWeightedAllocations(POLICY.spend.monthlyCapUsd, crewRoles, successRateByAgent(cumulative));
      const spentSoFar = spendByAgent(cumulative);
      // Business Wallet gate — the hard money gate. Fail-safe: an unfunded/absent wallet blocks all
      // real spend, so the crew can never spend money the founder hasn't funded. Annotate any spend
      // approval the wallet would block so the founder sees it can't clear even if they approve.
      const wallet = await loadWallet(sb, company.id);
      const overBudgetApprovals: string[] = [];
      for (const ap of approvals) {
        if (ap.kind !== "spend" || ap.amount == null) continue;
        const over = overageForAllocation(allocations[ap.agent] ?? 0, spentSoFar[ap.agent] ?? 0, ap.amount);
        if (over > 0) {
          ap.detail = `${ap.detail} ⚠ Office: this would put ${ap.agent} ~$${over.toFixed(0)} over its performance-weighted budget allocation — recommend reject or rebalance.`;
          overBudgetApprovals.push(`${ap.agent} +$${over.toFixed(0)}`);
        }
        const wd = decideSpend(wallet.config, { agent: ap.agent, task: ap.title, category: "other", amountCents: Math.round(ap.amount * 100) }, wallet.txns);
        if (wd.verdict === "block") {
          ap.detail = `${ap.detail} 💳 Wallet: ${wd.reason}`;
        }
      }
      await insertApprovals(sb, company.id, approvals);
      if (overBudgetApprovals.length > 0) {
        raiseAlert("cap_breach", `Office flagged ${overBudgetApprovals.length} over-budget request(s) for ${company.name}`, {
          companyId: company.id,
          night: company.night + 1,
          overBudget: overBudgetApprovals,
        });
      }

      // Enforcer (after the fact): flag any agent whose spend already blew its (reweighted) allocation.
      const breaches = breachesForAllocations(allocations, cumulative);
      if (breaches.length > 0) {
        raiseAlert("cap_breach", `Budget breach: ${breaches.map((b) => b.agent).join(", ")} over allocation for ${company.name}`, {
          companyId: company.id,
          night: company.night + 1,
          breaches: breaches.map((b) => ({ agent: b.agent, spent: b.spentUsd, allocated: b.allocatedUsd, over: b.overUsd })),
        });
      }

      // Office · Chief Audit Officer — review this shift's work; flag overclaims / unproven
      // high-cost actions so the founder sees them in the alert feed (governance that REACTS).
      const audit = auditShiftActivities(activities);
      if (audit.flagged.length > 0) {
        raiseAlert("forbidden_attempt", `Audit flagged ${audit.flagged.length} action(s) for ${company.name}`, {
          companyId: company.id,
          night: company.night + 1,
          flags: audit.flagged.map((f) => ({ action: f.activity.action, issues: f.issues })),
        });
      }

      const done = activities.filter((a) => a.status === "done");
      const failed = activities.filter((a) => a.status === "failed-credited");
      await updateCompany(sb, {
        ...company,
        night: company.night + 1,
        ledger: {
          spent: round(company.ledger.spent + done.reduce((t, a) => t + a.cost, 0)),
          credited: round((company.ledger.credited ?? 0) + failed.reduce((t, a) => t + a.cost, 0)),
          tasksDone: company.ledger.tasksDone + done.length,
          tasksFailed: company.ledger.tasksFailed + failed.length,
        },
      });
      // Accumulate private memory for this company (fail-soft; no-op without an embeddings key).
      await remember(
        sb,
        company.id,
        company.night,
        "shift",
        `Night ${company.night + 1}: ${done.length} done, ${failed.length} failed. ${activities.map((a) => a.action).slice(0, 4).join("; ")}`,
      );
      ran++;
    } catch (err) {
      failed_companies++;
      console.error("[/api/cron] company shift failed:", err instanceof Error ? err.message : "unknown");
    }
  }

  // 3.3: a failure spike pages the founder in real time (observability that REACTS, not just logs).
  if (failed_companies > 0) {
    raiseAlert("failure", `Nightly run: ${failed_companies} company shift(s) failed`, { ran, failed: failed_companies });
  }

  // Morning summary (gated): emails the operator what happened overnight — the incumbent's most-loved
  // feature, on our terms. Off unless Resend + a recipient are configured (sendEmail self-gates).
  const to = process.env.CRON_SUMMARY_EMAIL;
  if (to) {
    await sendEmail({
      to,
      subject: `competitor.inc — overnight: ${ran} ${ran === 1 ? "company" : "companies"} advanced`,
      html: `<p>Ran <b>${ran}</b> overnight shift${ran === 1 ? "" : "s"}${failed_companies ? `, <b>${failed_companies}</b> skipped` : ""}. Open your dashboard for the Glass Box and any approvals waiting on you.</p>`,
    });
  }

  // ── Friday: the CEO's weekly review digest (v0.5) — Rocks, Issues, constraint, next-week focus.
  // Best-effort per company; a digest failure never breaks the heartbeat. Gated on the same
  // recipient as the morning summary. Trend history stays sparse until scorecard snapshots
  // accumulate (known follow-up: snapshot writes still use the cookie-bound client).
  if (isFriday && to && fridayDigests.length > 0) {
    for (const d of fridayDigests) {
      try {
        const operate = await fetchOperate(sb, d.company.id).catch(() => ({ rocks: [], issues: [] }));
        const digest = await generateWeeklyDigest(
          d.company,
          operate.rocks,
          operate.issues,
          `${d.diagnosis.constraint}: ${d.diagnosis.signal}`,
          d.diagnosis.recommendation,
          d.diagnosis.principle,
          d.company.night,
          Math.max(1, 90 - (d.company.night % 90))
        );
        await sendWeeklyDigest(digest, to, process.env.TELEGRAM_CHAT_ID, process.env.SLACK_DIGEST_CHANNEL);
      } catch (e) {
        console.error("[/api/cron] weekly digest failed:", e instanceof Error ? e.message : "unknown");
      }
    }
  }

  return Response.json({ ran, failed: failed_companies, digests: isFriday ? fridayDigests.length : 0 });
}
