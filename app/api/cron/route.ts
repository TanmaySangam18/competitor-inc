import crypto from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { runShift } from "@/lib/engine/server";
import { insertActivities, insertApprovals, insertExperiments, closeExperiment, fetchExperiments, updateCompany, toCompany } from "@/lib/engine/db";
import { sendEmail } from "@/lib/engine/execution";
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

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return Response.json({ ran: 0, note: "Supabase service role not configured — nightly heartbeat idle." });
  }

  const sb: SupabaseClient = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data, error } = await sb.from("companies").select("*").eq("status", "operating");
  if (error) {
    console.error("[/api/cron] companies fetch:", error.message);
    return Response.json({ error: "database error" }, { status: 500 });
  }

  const EMPTY = { spent: 0, credited: 0, tasksDone: 0, tasksFailed: 0 };
  let ran = 0;
  let failed_companies = 0;
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
        .select("action,meta,agent")
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
      } catch (e) {
        console.error("[/api/cron] growth step failed:", e instanceof Error ? e.message : "unknown");
      }

      const priorContext = [recalled, graphSummary, growthNotes].filter(Boolean).join(" • ");
      const { activities, approvals } = await withTrace("shift", () => runShift(company, undefined, priorContext, growthContext), { companyId: company.id, night: company.night });
      await insertActivities(sb, company.id, activities);
      await insertApprovals(sb, company.id, approvals);

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

  return Response.json({ ran, failed: failed_companies });
}
