import crypto from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { serviceClient } from "@/lib/engine/service";
import { dueLifecycleEmails, lifecycleEmail, type LifecycleUser } from "@/lib/engine/lifecycle-email";
import { runShift, modelForAgent } from "@/lib/engine/server";
import { runOperatingCycle } from "@/lib/engine/operating-loop";
import { persistCycle } from "@/lib/engine/cycle-store";
import { packContext } from "@/lib/engine/context-compression";
import { insertActivities, insertApprovals, insertExperiments, closeExperiment, fetchExperiments, updateCompany, toCompany } from "@/lib/engine/db";
import { sendEmail } from "@/lib/engine/execution";
import { fetchOperate } from "@/lib/engine/db";
import { generateWeeklyDigest, sendWeeklyDigest } from "@/lib/engine/weekly-review-digest";
import { notifyFounder } from "@/lib/org/twilio-notify";
import { saveScorecardSnapshot, type ScorecardMetric } from "@/lib/engine/scorecard-persistence";
import { auditShiftActivities } from "@/lib/engine/office-house-architecture";
import { performanceWeightedAllocations, overageForAllocation, breachesForAllocations, spendByAgent } from "@/lib/engine/office-budget";
import { successRateByAgent } from "@/lib/engine/agent-performance";
import { loadWallet } from "@/lib/engine/wallet-db";
import { decideSpend } from "@/lib/engine/wallet";
import { draftProgressPost, shouldShare } from "@/lib/engine/buildinpublic";
import { postToBluesky, postToMastodon } from "@/lib/engine/execution";
import { rolesForIdea } from "@/lib/engine/dynamic-crew";
import { POLICY } from "@/lib/engine/policy";
import { loadActiveOrgRuns, saveOrgRun } from "@/lib/engine/org-runs-db";
import { advanceOrgRun } from "@/lib/engine/org-run-step";
import { isComplete } from "@/lib/engine/org-run";
import { serverRealExecutor } from "@/lib/engine/real-executor";
import type { Company, Activity, AgentRole, ApprovalItem, ApprovalKind } from "@/lib/engine/types";
import type { FunnelDiagnosis } from "@/lib/engine/growth";
import { remember, recall } from "@/lib/engine/memory";
import { buildGraph, summarizeGraph } from "@/lib/engine/bkg";
import { withTrace } from "@/lib/engine/observability";
import { raiseAlert } from "@/lib/engine/alerts";
import { runGrowthStep } from "@/lib/engine/growth";
import { readFunnel } from "@/lib/engine/funnel";
import { organicShift, toChannelInputs } from "@/lib/engine/organic-shift";
import { attributeChannels } from "@/lib/engine/attribution";

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

// Slice D: send any due lifecycle/retention emails, deduped via lifecycle_sends (migration 0025).
// DORMANT unless LIFECYCLE_EMAILS=1 AND RESEND is configured AND the table exists — every gap fails soft
// (returns 0), never breaking the nightly shift. Outward sends stay founder-controlled.
async function sendDueLifecycleEmails(sb: SupabaseClient, now: number): Promise<number> {
  const wl = await sb.from("waitlist").select("email, created_at");
  const users: LifecycleUser[] = (wl.data ?? [])
    .map((r) => ({ email: String(r.email || "").toLowerCase(), signupAt: new Date(r.created_at as string).getTime() }))
    .filter((u) => u.email && Number.isFinite(u.signupAt));
  if (users.length === 0) return 0;
  const sentRows = await sb.from("lifecycle_sends").select("email, kind");
  const sent = new Set((sentRows.data ?? []).map((r) => `${r.email}:${r.kind}`));
  const due = dueLifecycleEmails(users, now, sent).slice(0, 100); // cap per run
  let n = 0;
  for (const d of due) {
    const c = lifecycleEmail(d.kind);
    const out = await sendEmail({ to: d.email, subject: c.subject, html: c.html });
    if (out.ok) {
      await sb.from("lifecycle_sends").insert({ email: d.email, kind: d.kind });
      n++;
    }
  }
  return n;
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
  let supervised = 0; // companies advanced by the ephemeral-agent supervised cycle (flag-gated)
  let deskFromCycles = 0; // desk items the supervised cycle prepared for the human across all companies
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

        // ── Organic Growth Engine, operationalized (the "get the first real user a real result" loop). ──
        // Read per-channel attribution from the pixel, run the constraint-matched content plan, and post
        // the plan to the Glass Box every night. Surface ready-to-post DRAFTS to the desk on a batch cadence
        // (every other night, ≤2) so the desk stays clean while matching a realistic posting rhythm. Nothing
        // auto-posts — draft → the founder approves → posts. Rationale: docs/PLAYBOOK-organic-growth.md.
        try {
          const evQ = await sb.from("events").select("type, source").eq("slug", company.slug);
          const channelStats = attributeChannels(
            ((evQ.data ?? []) as { type: "view" | "signup" | "purchase"; source: string | null }[]).map((e) => ({ type: e.type, source: e.source })),
          );
          const surfaceDrafts = (company.night + 1) % 2 === 0; // batch cadence + desk hygiene
          const org = organicShift(company, funnel, toChannelInputs(channelStats), company.night + 1, surfaceDrafts ? 2 : 0);
          await insertActivities(sb, company.id, org.activities).catch((e) => console.error("[/api/cron] organic activity:", e?.message));
          if (org.approvals.length) {
            await insertApprovals(sb, company.id, org.approvals).catch((e) => console.error("[/api/cron] organic drafts:", e?.message));
          }
        } catch (e) {
          console.error("[/api/cron] organic shift failed:", e instanceof Error ? e.message : "unknown");
        }
      } catch (e) {
        console.error("[/api/cron] growth step failed:", e instanceof Error ? e.message : "unknown");
      }

      // COGS discipline: bound the prior-context blob (recall + graph + growth notes) before it hits
      // the model, and dedupe across fragments, so a company's growing history can't balloon the
      // per-shift token bill. compressContext is pure/deterministic — no extra model call.
      const priorContext = packContext([recalled, graphSummary, growthNotes], 6000).text;
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

      // Build-in-public — if this company opted in, post a REAL shipped milestone to competitor.inc's
      // OWN social accounts (never the customer's). The public stream is the platform's marketing.
      // Fail-soft + gated on Bluesky/Mastodon keys; posts nothing when there's no verified milestone.
      if (shouldShare(company, activities)) {
        const post = draftProgressPost(company, activities);
        if (post) {
          await Promise.allSettled([postToBluesky({ text: post }), postToMastodon({ text: post })]).catch(() => {});
        }
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

      // ── Supervised operating cycle (flag-gated: SUPERVISED_CYCLE=1) ──────────────────────────────
      // The newer ephemeral-agent engine, driven by the scheduler with PERSISTED memory: each nightly
      // tick = one cycle. A supervisor decomposes the company's goal → spawns an agent per task →
      // independently verifies → hands off → terminates (returning unspent budget), and escalates the
      // irreducible acts (spend / outbound) as prepared packets for the founder's desk. Memory carries
      // across ticks via recall/remember (bound to the company), so the org builds on prior nights.
      // Off by default (execution is the deterministic simulated path — $0, no real spend/deploys); this
      // is the honest first wiring of long-horizon operation for the ephemeral-agent org. Fail-soft: a
      // cycle error never affects the mature nightly shift above or the rest of the run.
      if (process.env.SUPERVISED_CYCLE === "1") {
        try {
          const { outcome, note } = await withTrace(
            "operating-cycle",
            () =>
              runOperatingCycle(company.idea, {
                roles: rolesForIdea(company.idea),
                modelForRole: modelForAgent,
                makeId: () => crypto.randomUUID(),
                operate: true,
                recall: () => recall(sb, company.id, "supervised operating cycle", 5),
                remember: (n: string) =>
                  remember(sb, company.id, company.night, "operating-cycle", n).then(() => undefined),
              }),
            { companyId: company.id, night: company.night + 1 },
          );
          supervised++;
          deskFromCycles += outcome.packets.length;
          // Persist a bounded snapshot so the founder can watch this cycle at /watch (fail-soft: no-ops
          // without the operating_cycles table). Continuity note already persisted inside the cycle.
          await persistCycle(sb, company.id, company.night + 1, company.idea, outcome).catch(() => false);
          // Mirror the OUTBOUND DRAFTS (approve-to-send) into the durable Approval Inbox so they show on
          // the founder's main board and survive a reload. Money/legal/spine acts are deliberately NOT
          // mirrored — those stay in the accountability-spine lane (persisted in the snapshot above),
          // never as a board item whose approval could fire an executor. Fail-soft.
          const OUTBOUND: Partial<Record<string, ApprovalKind>> = {
            approve_outreach: "outreach",
            approve_publish: "outreach",
            approve_support: "outreach",
          };
          const inboxItems: ApprovalItem[] = outcome.packets
            .filter((p) => OUTBOUND[p.kind])
            .map((p) => ({
              id: p.id,
              night: company.night + 1,
              agent: p.preparedBy,
              kind: OUTBOUND[p.kind] as ApprovalKind,
              title: p.title,
              detail: `${p.summary} — ${p.actionRequired}`,
            }));
          if (inboxItems.length) {
            await insertApprovals(sb, company.id, inboxItems).catch((e) =>
              console.error("[/api/cron] mirror desk packets:", e instanceof Error ? e.message : "unknown"),
            );
          }
          void note;
        } catch (e) {
          console.error("[/api/cron] supervised cycle failed:", e instanceof Error ? e.message : "unknown");
        }
      }

      ran++;
    } catch (err) {
      failed_companies++;
      console.error("[/api/cron] company shift failed:", err instanceof Error ? err.message : "unknown");
    }
  }

  // ── 3.2b: DURABLE ORG RUNS — advance each active run a few short steps this tick (crash-safe, laptop-off).
  // Each active run is a persisted multi-agent DAG; we step it a BOUNDED number of times so no single tick
  // runs long, saving state between steps so it resumes next tick (this is the "runs while you sleep" layer,
  // no Temporal). Company-scoped so each step's proof lands in that company's Glass Box. Fail-soft: a run
  // error never affects the rest of the heartbeat.
  try {
    const activeRuns = await loadActiveOrgRuns(sb, 10);
    const orgExecutor = serverRealExecutor({ token: process.env.GITHUB_TOKEN });
    let orgRunSteps = 0;
    for (const { run, companyId } of activeRuns) {
      if (!companyId) continue; // company-scoped runs only (activity attribution)
      let cur = run;
      for (let i = 0; i < 3 && !isComplete(cur); i++) {
        const { run: next, ranTaskId } = await advanceOrgRun(cur, {
          executor: orgExecutor,
          saveRun: (r) => saveOrgRun(sb, r),
          recordActivity: (a) => insertActivities(sb, companyId, [a]),
          makeId: () => crypto.randomUUID(),
        });
        cur = next;
        orgRunSteps++;
        if (!ranTaskId) break;
      }
    }
    if (orgRunSteps > 0) console.log(`[/api/cron] org-run driver: advanced ${orgRunSteps} step(s) across ${activeRuns.length} run(s)`);
  } catch (e) {
    console.error("[/api/cron] org-run driver:", e instanceof Error ? e.message : "unknown");
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
      html: `<p>Ran <b>${ran}</b> overnight shift${ran === 1 ? "" : "s"}${failed_companies ? `, <b>${failed_companies}</b> skipped` : ""}${supervised ? `; the agent org advanced <b>${supervised}</b> company cycle${supervised === 1 ? "" : "s"}, preparing <b>${deskFromCycles}</b> item${deskFromCycles === 1 ? "" : "s"} for your review` : ""}. Open your dashboard for the Glass Box and any approvals waiting on you.</p>`,
    });
  }

  // Founder PHONE briefing (Phase 3): the mandate's 1:1 line to the founder's phone, complementing email.
  // Opt-in (FOUNDER_SMS_BRIEFING=1) + fail-soft (inert without Twilio creds) + only when something actually
  // advanced (no spam on empty nights) + never breaks the heartbeat. Sent AS the Chief of Staff (whose job
  // is the founder's brief); the title is prefixed in-body since SMS carries no per-message sender identity.
  if (process.env.FOUNDER_SMS_BRIEFING === "1" && ran > 0) {
    const text = `overnight: ${ran} ${ran === 1 ? "company" : "companies"} advanced${deskFromCycles ? `, ${deskFromCycles} need your OK` : ""}. Open the dashboard for the Glass Box + any approvals waiting on you.`;
    try {
      const r = await notifyFounder("chief-of-staff", text);
      if (!r.ok && r.error && !/inert|not configured|no founder destination/.test(r.error)) {
        console.error("[/api/cron] founder SMS briefing:", r.error);
      }
    } catch (e) {
      console.error("[/api/cron] founder SMS briefing threw:", e instanceof Error ? e.message : "unknown");
    }
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

  // Lifecycle/retention emails — dormant unless enabled + configured; fail-soft (never breaks the shift).
  let lifecycleSent = 0;
  if (process.env.LIFECYCLE_EMAILS === "1" && process.env.RESEND_API_KEY && process.env.RESEND_FROM) {
    try {
      lifecycleSent = await sendDueLifecycleEmails(sb, Date.now());
    } catch (e) {
      console.error("[/api/cron] lifecycle emails failed:", e instanceof Error ? e.message : "unknown");
    }
  }

  return Response.json({
    ran,
    supervised, // companies advanced by the ephemeral-agent supervised cycle (0 unless SUPERVISED_CYCLE=1)
    deskItems: deskFromCycles, // prepared packets awaiting the founder's review from those cycles
    failed: failed_companies,
    digests: isFriday ? fridayDigests.length : 0,
    lifecycleSent, // retention emails sent this run (0 unless LIFECYCLE_EMAILS=1 + RESEND configured)
  });
}
