import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { runShift } from "@/lib/roomie/server";
import { insertActivities, insertApprovals, updateCompany, toCompany } from "@/lib/roomie/db";
import { sendEmail } from "@/lib/roomie/execution";

export const runtime = "nodejs";

const round = (n: number) => Math.round(n * 100) / 100;

// Nightly heartbeat. Vercel Cron calls this (see vercel.json). It runs one autonomous shift for
// every operating company and persists the results. Idle until Supabase (service role) is set.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return Response.json({ ran: 0, note: "Supabase service role not configured — nightly heartbeat idle." });
  }

  const sb: SupabaseClient = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data, error } = await sb.from("companies").select("*").eq("status", "operating");
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const EMPTY = { spent: 0, credited: 0, tasksDone: 0, tasksFailed: 0 };
  let ran = 0;
  let failed_companies = 0;
  for (const row of data ?? []) {
    // Isolate each company: one bad row (e.g. null ledger, insert error) must not abort the
    // whole nightly run for everyone else.
    try {
      const company = toCompany(row);
      if (!company.ledger || typeof company.ledger !== "object") company.ledger = { ...EMPTY };
      const { activities, approvals } = await runShift(company);
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
      ran++;
    } catch (err) {
      failed_companies++;
      console.error("[/api/cron] company shift failed:", err instanceof Error ? err.message : "unknown");
    }
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
