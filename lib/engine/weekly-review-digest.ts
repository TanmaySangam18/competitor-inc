/**
 * Automated Weekly Review Digest
 *
 * Every Friday, the CEO agent generates a digest:
 * - Rocks progress toward quarterly targets
 * - Scorecard metrics + trends
 * - Constraint diagnosis (traffic / conversion / monetization)
 * - Open Issues status
 * - CEO recommendations for next week
 *
 * Sent via: email (Resend) + Telegram + Slack
 * Stored in: Supabase audit_log for founder review
 */

import { getServerSupabase } from "@/lib/supabase/server";
import { generateWeeklyReviewSummary, type WeeklyReviewSummary } from "./scorecard-persistence";
import type { Company, Rock, Issue } from "./types";

/* ── Digest Generation ──────────────────────────────────────────────────── */

export interface WeeklyReviewDigest {
  id: string;
  companyId: string;
  week: number;
  generatedAt: number;
  content: DigestContent;
}

export interface DigestContent {
  title: string;
  summary: string;
  rockProgress: RockProgressItem[];
  scorecard: ScorecardSection;
  issues: IssuesSection;
  constraint: ConstraintSection;
  recommendations: string[];
  ceoInsights: string;
}

interface RockProgressItem {
  title: string;
  target: number;
  current: number;
  percentDone: number;
  onTrack: boolean;
  status: "✅ On track" | "⚠️ At risk" | "❌ Behind";
}

interface ScorecardSection {
  metrics: Array<{
    name: string;
    value: number;
    target: number;
    trend: "↗️ up" | "↘️ down" | "→ flat";
    weekOverWeek: string;
  }>;
  insights: string[];
}

interface IssuesSection {
  open: Array<{ title: string; severity: "high" | "medium" | "low" }>;
  resolved: string[];
}

interface ConstraintSection {
  current: "traffic" | "conversion" | "monetization";
  diagnosis: string;
  recommendation: string;
  principle: string; // e.g., "Demand-first (Blond)" or "Positioning clarity (April Dunford)"
}

/**
 * Generate the digest (called by CEO agent on Friday evening)
 */
export async function generateWeeklyDigest(
  company: Company,
  rocks: Rock[],
  issues: Issue[],
  constraintDiagnosis: string,
  constraintRecommendation: string,
  constraintPrinciple: string,
  nightsElapsed: number,
  nightsRemaining: number
): Promise<WeeklyReviewDigest> {
  // Generate Scorecard trends + Rock progress
  const summary = await generateWeeklyReviewSummary(
    company.id,
    rocks.map((r) => ({
      id: r.id,
      title: r.title,
      target: 1, // Rock targets are usually binary done/not done, but for trending use 1 as target
      current: r.done ? 1 : 0,
    })),
    nightsElapsed,
    nightsRemaining
  );

  // Format Rock progress
  const rockProgress: RockProgressItem[] = summary.rockProgress.map((rp) => ({
    title: rp.title,
    target: rp.target,
    current: rp.current,
    percentDone: rp.progressPercent,
    onTrack: rp.onTrack,
    status: rp.onTrack ? "✅ On track" : rp.progressPercent >= 50 ? "⚠️ At risk" : "❌ Behind",
  }));

  // Format Scorecard
  const scorecard: ScorecardSection = {
    metrics: summary.metricTrends.slice(0, 6).map((t) => ({
      name: t.metric,
      value: t.samples[t.samples.length - 1]?.value || 0,
      target: 100, // placeholder
      trend:
        t.trend === "up"
          ? "↗️ up"
          : t.trend === "down"
            ? "↘️ down"
            : "→ flat",
      weekOverWeek: `${t.weekOverWeekChange >= 0 ? "+" : ""}${t.weekOverWeekChange.toFixed(0)}%`,
    })),
    insights: [
      ...summary.alerts.map((a) => `⚠️ ${a.metric}: ${a.message}`),
    ],
  };

  // Format Issues
  const issuesSection: IssuesSection = {
    open: issues
      .filter((i) => !i.resolved)
      .map((i) => ({
        title: i.title,
        severity: i.title.includes("critical") || i.title.includes("blocking") ? "high" : "medium",
      })),
    resolved: issues.filter((i) => i.resolved).map((i) => i.title),
  };

  // Format Constraint
  const constraintSection: ConstraintSection = {
    current: (constraintDiagnosis.toLowerCase().includes("traffic")
      ? "traffic"
      : constraintDiagnosis.toLowerCase().includes("conversion")
        ? "conversion"
        : "monetization") as any,
    diagnosis: constraintDiagnosis,
    recommendation: constraintRecommendation,
    principle: constraintPrinciple,
  };

  // CEO insights + recommendations
  const ceoInsights = generateCeoInsights(
    summary,
    rockProgress,
    constraintSection
  );

  const digest: WeeklyReviewDigest = {
    id: crypto.randomUUID(),
    companyId: company.id,
    week: Math.floor(nightsElapsed / 7),
    generatedAt: Date.now(),
    content: {
      title: `Weekly Review — Week of ${new Date().toLocaleDateString()}`,
      summary: `${company.name}: ${rockProgress.filter((r) => r.onTrack).length}/${rockProgress.length} Rocks on track. Constraint: ${constraintSection.current}.`,
      rockProgress,
      scorecard,
      issues: issuesSection,
      constraint: constraintSection,
      recommendations: summary.recommendations,
      ceoInsights,
    },
  };

  return digest;
}

/**
 * Generate CEO narrative insights (the "why" behind the numbers)
 */
function generateCeoInsights(
  summary: WeeklyReviewSummary,
  rocks: RockProgressItem[],
  constraint: ConstraintSection
): string {
  const insights: string[] = [];

  // Rocks narrative
  const onTrack = rocks.filter((r) => r.onTrack).length;
  const total = rocks.length;
  insights.push(
    onTrack === total
      ? `🎯 All Rocks on track. Keep the pace.`
      : onTrack === 0
        ? `⚠️ No Rocks on track. Critical intervention needed.`
        : `${onTrack}/${total} Rocks on track. ${total - onTrack} need acceleration.`
  );

  // Constraint narrative
  insights.push(
    `📊 Binding constraint: ${constraint.current}. ${constraint.diagnosis} → ${constraint.recommendation}`
  );

  // Trend narrative
  const decliners = summary.metricTrends.filter((t) => t.trend === "down");
  if (decliners.length > 0) {
    insights.push(
      `📉 ${decliners.length} metric(s) declining: ${decliners.map((d) => d.metric).join(", ")}. Investigate.`
    );
  }

  // Issues narrative
  const openIssues = summary.metricTrends.filter((t) => t.alertLevel === "critical");
  if (openIssues.length > 0) {
    insights.push(`🚨 ${openIssues.length} critical issue(s). Prioritize fixes.`);
  }

  // Next week recommendation
  if (decliners.length === 0 && onTrack === total) {
    insights.push(
      `✨ Strong week. Next week: experiment with ${constraint.current} lever. Maintain velocity on other Rocks.`
    );
  } else {
    insights.push(
      `⚡ Next week: focus 80% on ${constraint.current}, 20% on fixing Issues. Reassess Rocks progress Friday.`
    );
  }

  return insights.join("\n");
}

/* ── Digest Distribution ────────────────────────────────────────────────– */

/**
 * Send digest via multiple channels
 */
export async function sendWeeklyDigest(
  digest: WeeklyReviewDigest,
  recipientEmail: string,
  recipientTelegramId?: string,
  recipientSlackId?: string
): Promise<void> {
  // Format digest for email
  const emailHtml = formatDigestHtml(digest);

  // 1. Send via email (Resend)
  if (recipientEmail) {
    await sendDigestEmail(recipientEmail, digest, emailHtml);
  }

  // 2. Send via Telegram
  if (recipientTelegramId) {
    await sendDigestTelegram(recipientTelegramId, digest);
  }

  // 3. Send via Slack
  if (recipientSlackId) {
    await sendDigestSlack(recipientSlackId, digest);
  }

  // 4. Archive in Supabase
  await archiveDigest(digest);
}

function formatDigestHtml(digest: WeeklyReviewDigest): string {
  const { content } = digest;

  return `
    <h1>${content.title}</h1>
    <p>${content.summary}</p>

    <h2>📊 Rocks Progress</h2>
    <table>
      ${content.rockProgress
        .map(
          (r) => `
        <tr>
          <td>${r.status}</td>
          <td>${r.title}</td>
          <td>${r.percentDone.toFixed(0)}%</td>
        </tr>
      `
        )
        .join("")}
    </table>

    <h2>📈 Scorecard</h2>
    <ul>
      ${content.scorecard.metrics
        .map((m) => `<li>${m.name}: ${m.value} (target ${m.target}) ${m.trend} ${m.weekOverWeek}</li>`)
        .join("")}
    </ul>

    <h2>🎯 This Week's Constraint</h2>
    <p><strong>${content.constraint.current}</strong></p>
    <p>${content.constraint.diagnosis}</p>
    <p><em>Recommended: ${content.constraint.recommendation}</em></p>

    <h2>🔧 Issues</h2>
    <p><strong>Open:</strong> ${content.issues.open.map((i) => i.title).join(", ")}</p>
    <p><strong>Resolved:</strong> ${content.issues.resolved.join(", ")}</p>

    <h2>💡 CEO Insights</h2>
    <pre>${content.ceoInsights}</pre>

    <h2>Next Steps</h2>
    <ul>
      ${content.recommendations.map((r) => `<li>${r}</li>`).join("")}
    </ul>
  `;
}

async function sendDigestEmail(
  email: string,
  digest: WeeklyReviewDigest,
  html: string
): Promise<void> {
  // Uses Resend API (configured via RESEND_API_KEY env var)
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "digest@competitor.inc",
        to: email,
        subject: digest.content.title,
        html,
      }),
    });
  } catch (err) {
    console.error("Failed to send digest email:", err);
  }
}

async function sendDigestTelegram(chatId: string, digest: WeeklyReviewDigest): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  const text = `
${digest.content.title}

${digest.content.summary}

📊 *Rocks Progress*
${digest.content.rockProgress.map((r) => `${r.status} ${r.title}`).join("\n")}

🎯 *Constraint*
${digest.content.constraint.current}: ${digest.content.constraint.recommendation}

💡 *CEO Insights*
${digest.content.ceoInsights}
  `.trim();

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
      }),
    });
  } catch (err) {
    console.error("Failed to send digest Telegram:", err);
  }
}

async function sendDigestSlack(channelId: string, digest: WeeklyReviewDigest): Promise<void> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return;

  const blocks = [
    {
      type: "header",
      text: { type: "plain_text", text: digest.content.title },
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: digest.content.summary },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Rocks Progress*\n${digest.content.rockProgress.map((r) => `${r.status} ${r.title}`).join("\n")}`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*CEO Insights*\n\`\`\`${digest.content.ceoInsights}\`\`\``,
      },
    },
  ];

  try {
    await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        channel: channelId,
        blocks,
      }),
    });
  } catch (err) {
    console.error("Failed to send digest Slack:", err);
  }
}

async function archiveDigest(digest: WeeklyReviewDigest): Promise<void> {
  const sb = await getServerSupabase();
  if (!sb) return;

  try {
    await sb.from("weekly_review_digests").insert([
      {
        id: digest.id,
        company_id: digest.companyId,
        week: digest.week,
        generated_at: new Date(digest.generatedAt).toISOString(),
        content: JSON.stringify(digest.content),
      },
    ]);
  } catch (err) {
    console.error("Failed to archive digest:", err);
  }
}
