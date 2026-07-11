/**
 * Persistent Scorecard History & Trending
 *
 * Instead of ephemeral daily metrics, we now:
 * 1. Save daily Scorecard snapshots to Supabase
 * 2. Track historical trends (week-over-week, month-over-month)
 * 3. Surface trend alerts (metric declining, approaching target, exceeded)
 * 4. Inform Rock progress assessment (are we on track quarterly?)
 */

// Service-role client: these run in the nightly cron (no request/cookies), so we use the service
// factory, not the cookie-bound server client. Reads filter by company_id explicitly; the digest
// path is founder-triggered background work, not a public surface.
import { serviceClient } from "@/lib/engine/service";

/* ── Types ──────────────────────────────────────────────────────────────── */

export interface ScorecardMetric {
  id: string;
  name: string; // e.g., "page_views", "conversion_rate", "revenue"
  value: number;
  target: number;
  basis: "real" | "estimate" | "missing";
  unit: string; // "%", "$", "count"
}

export interface ScorecardSnapshot {
  id: string;
  companyId: string;
  night: number;
  timestamp: number;
  metrics: ScorecardMetric[];
  constraint: string; // diagnosed by Growth Loop
  notes: string;
}

export interface ScorecardTrend {
  metric: string;
  samples: Array<{ timestamp: number; value: number }>;
  trend: "up" | "down" | "flat";
  weekOverWeekChange: number; // percent
  monthOverMonthChange: number; // percent
  isOnTrack: boolean; // moving toward target
  alertLevel: "ok" | "warning" | "critical";
}

/* ── Snapshot Persistence ──────────────────────────────────────────────── */

/**
 * Save a daily Scorecard snapshot to Supabase
 */
export async function saveScorecardSnapshot(
  companyId: string,
  night: number,
  metrics: ScorecardMetric[],
  constraint: string,
  notes: string
): Promise<ScorecardSnapshot | null> {
  const sb = serviceClient();
  if (!sb) return null;

  const snapshot: ScorecardSnapshot = {
    id: crypto.randomUUID(),
    companyId,
    night,
    timestamp: Date.now(),
    metrics,
    constraint,
    notes,
  };

  try {
    await sb.from("scorecard_snapshots").insert([
      {
        id: snapshot.id,
        company_id: companyId,
        night,
        timestamp: new Date(snapshot.timestamp).toISOString(),
        metrics: JSON.stringify(metrics),
        // "constraint" is a reserved word in Postgres — the column is constraint_label (0017).
        constraint_label: constraint,
        notes,
      },
    ]);

    return snapshot;
  } catch (err) {
    console.error("Failed to save scorecard snapshot:", err);
    return null;
  }
}

/**
 * Fetch historical snapshots for trending
 */
async function fetchScorecardHistory(
  companyId: string,
  limit: number = 30
): Promise<ScorecardSnapshot[]> {
  const sb = serviceClient();
  if (!sb) return [];

  try {
    const { data, error } = await sb
      .from("scorecard_snapshots")
      .select("*")
      .eq("company_id", companyId)
      .order("timestamp", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (
      data?.map((row: any) => ({
        id: row.id,
        companyId: row.company_id,
        night: row.night,
        timestamp: new Date(row.timestamp).getTime(),
        metrics: JSON.parse(row.metrics),
        constraint: row.constraint_label,
        notes: row.notes,
      })) || []
    );
  } catch (err) {
    console.error("Failed to fetch scorecard history:", err);
    return [];
  }
}

/* ── Trend Analysis ────────────────────────────────────────────────────── */

/**
 * Calculate trends for a metric across historical snapshots
 */
function calculateMetricTrend(
  metricName: string,
  snapshots: ScorecardSnapshot[]
): ScorecardTrend {
  const samples = snapshots
    .map((snap) => {
      const metric = snap.metrics.find((m) => m.name === metricName);
      return metric ? { timestamp: snap.timestamp, value: metric.value } : null;
    })
    .filter((s): s is { timestamp: number; value: number } => s !== null)
    .reverse(); // chronological order

  if (samples.length === 0) {
    return {
      metric: metricName,
      samples: [],
      trend: "flat",
      weekOverWeekChange: 0,
      monthOverMonthChange: 0,
      isOnTrack: false,
      alertLevel: "ok",
    };
  }

  // Calculate trend direction
  const recent = samples.slice(-3); // last 3 days
  const older = samples.slice(-7, -4); // 4-7 days ago
  const recentAvg = recent.reduce((s, m) => s + m.value, 0) / recent.length;
  const olderAvg = older.length > 0 ? older.reduce((s, m) => s + m.value, 0) / older.length : recentAvg;

  const trendDirection: "up" | "down" | "flat" =
    recentAvg > olderAvg * 1.05 ? "up" : recentAvg < olderAvg * 0.95 ? "down" : "flat";

  // Calculate week-over-week + month-over-month change
  const oneWeekAgo = samples.find(
    (s) => Date.now() - s.timestamp > 7 * 24 * 60 * 60 * 1000
  );
  const oneMonthAgo = samples.find(
    (s) => Date.now() - s.timestamp > 30 * 24 * 60 * 60 * 1000
  );

  const weekOverWeek =
    oneWeekAgo && samples[0]
      ? ((samples[0].value - oneWeekAgo.value) / oneWeekAgo.value) * 100
      : 0;
  const monthOverMonth =
    oneMonthAgo && samples[0]
      ? ((samples[0].value - oneMonthAgo.value) / oneMonthAgo.value) * 100
      : 0;

  // Is it on track toward target?
  const currentMetric = snapshots[snapshots.length - 1]?.metrics.find(
    (m) => m.name === metricName
  );
  const onTrack =
    currentMetric && currentMetric.target
      ? trendDirection === "up" && currentMetric.value < currentMetric.target
      : false;

  // Alert level
  let alertLevel: "ok" | "warning" | "critical" = "ok";
  if (trendDirection === "down" && currentMetric && currentMetric.target) {
    const progressToTarget = (currentMetric.value / currentMetric.target) * 100;
    if (progressToTarget < 20) alertLevel = "critical";
    else if (progressToTarget < 60) alertLevel = "warning";
  }

  return {
    metric: metricName,
    samples,
    trend: trendDirection,
    weekOverWeekChange: weekOverWeek,
    monthOverMonthChange: monthOverMonth,
    isOnTrack: onTrack,
    alertLevel,
  };
}

/**
 * Get all metric trends
 */
async function getScorecardTrends(companyId: string): Promise<ScorecardTrend[]> {
  const snapshots = await fetchScorecardHistory(companyId, 30);

  // Extract unique metric names
  const metricNames = new Set<string>();
  for (const snap of snapshots) {
    for (const metric of snap.metrics) {
      metricNames.add(metric.name);
    }
  }

  // Calculate trends for each metric
  const trends: ScorecardTrend[] = [];
  for (const name of metricNames) {
    trends.push(calculateMetricTrend(name, snapshots));
  }

  return trends;
}

/* ── Rock Progress Assessment ──────────────────────────────────────────── */

/**
 * Check if a Rock is on track to hit its target
 */
function assessRockProgress(
  rockTarget: number,
  currentValue: number,
  nightsElapsed: number,
  nightsRemaining: number
): {
  onTrack: boolean;
  progressPercent: number;
  requiredVelocity: number;
  currentVelocity: number;
} {
  const progressPercent = (currentValue / rockTarget) * 100;
  const currentVelocity = nightsElapsed > 0 ? currentValue / nightsElapsed : 0;
  const requiredVelocity = (rockTarget - currentValue) / nightsRemaining;

  const onTrack = currentVelocity >= requiredVelocity * 0.8; // 20% buffer

  return {
    onTrack,
    progressPercent,
    requiredVelocity,
    currentVelocity,
  };
}

/* ── Weekly Review Integration ──────────────────────────────────────────– */

/**
 * Generate weekly review summary from Scorecard trends + Rocks progress
 */
export interface WeeklyReviewSummary {
  week: number;
  rockProgress: Array<{
    rockId: string;
    title: string;
    target: number;
    current: number;
    onTrack: boolean;
    progressPercent: number;
  }>;
  metricTrends: ScorecardTrend[];
  alerts: Array<{
    metric: string;
    level: "warning" | "critical";
    message: string;
  }>;
  recommendations: string[];
}

export async function generateWeeklyReviewSummary(
  companyId: string,
  rocks: Array<{ id: string; title: string; target: number; current: number }>,
  nightsElapsed: number,
  nightsRemaining: number
): Promise<WeeklyReviewSummary> {
  const trends = await getScorecardTrends(companyId);

  const rockProgress = rocks.map((rock) => {
    const assessment = assessRockProgress(rock.target, rock.current, nightsElapsed, nightsRemaining);
    return {
      rockId: rock.id,
      title: rock.title,
      target: rock.target,
      current: rock.current,
      onTrack: assessment.onTrack,
      progressPercent: assessment.progressPercent,
    };
  });

  const alerts = trends
    .filter((t) => t.alertLevel !== "ok")
    .map((t) => ({
      metric: t.metric,
      level: t.alertLevel as "warning" | "critical",
      message:
        t.alertLevel === "critical"
          ? `${t.metric} is critically behind target and declining`
          : `${t.metric} is underperforming (${t.trend} trend, ${t.weekOverWeekChange.toFixed(1)}% WoW)`,
    }));

  const recommendations: string[] = [];

  // Add recommendations based on trends
  for (const trend of trends) {
    if (trend.trend === "down" && !trend.isOnTrack) {
      recommendations.push(`${trend.metric} is declining. Investigate the cause.`);
    }
    if (trend.isOnTrack && trend.trend === "up") {
      recommendations.push(`${trend.metric} is moving in the right direction. Keep the momentum.`);
    }
  }

  // Add recommendations based on Rocks
  for (const rock of rockProgress) {
    if (!rock.onTrack) {
      recommendations.push(`${rock.title}: behind pace (${rock.progressPercent.toFixed(0)}% done). Increase velocity.`);
    }
  }

  return {
    week: Math.floor(nightsElapsed / 7),
    rockProgress,
    metricTrends: trends,
    alerts,
    recommendations,
  };
}

/* ── Supabase Schema (migrations) ────────────────────────────────────────── */

/**
 * SQL to create scorecard_snapshots table:
 *
 * CREATE TABLE scorecard_snapshots (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
 *   night INTEGER NOT NULL,
 *   timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
 *   metrics JSONB NOT NULL,
 *   constraint TEXT,
 *   notes TEXT,
 *   created_at TIMESTAMP DEFAULT NOW(),
 *   UNIQUE(company_id, night)
 * );
 *
 * CREATE INDEX idx_scorecard_company_timestamp ON scorecard_snapshots(company_id, timestamp DESC);
 *
 * ALTER TABLE scorecard_snapshots ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Users see only their company's scorecard"
 *   ON scorecard_snapshots FOR SELECT
 *   USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));
 */
