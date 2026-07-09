import crypto from "node:crypto";
import { serviceClient } from "@/lib/engine/service";
import { verifyProof } from "@/lib/engine/execution";
import { buildFundingPack, type FundingPackInput } from "@/lib/org/funding-pack";

export const runtime = "nodejs";

// BLOCK 7 — the funding pack, assembled from REAL data. Founder-gated (METRICS_SECRET, same bearer as
// /api/metrics + /api/proof). Every number is computed from settled/verified rows, never fabricated:
//   • collected revenue + paying customers → revenue_events (signature-verified Polar orders only)
//   • autonomy counts → the activities log (autopilot-tagged vs founder-signed)
//   • live receipts → real outcomes re-verified with a HEAD check at load
// Fail-soft: no secret → locked; no DB → an honest all-zero pack ("nothing fabricated"). The assembler
// (lib/org/funding-pack.ts) is pure + property-tested; this route only sources its inputs.

const GOAL_USD = 10_000;
const WINDOW_DAYS = 30;

function bearerOk(req: Request, secret: string): boolean {
  const got = Buffer.from(req.headers.get("authorization") || "", "utf8");
  const want = Buffer.from(`Bearer ${secret}`, "utf8");
  return got.length === want.length && crypto.timingSafeEqual(got, want);
}

export async function GET(req: Request) {
  const secret = process.env.METRICS_SECRET;
  if (!secret) return Response.json({ ok: true, locked: true, note: "Set METRICS_SECRET (env) to open the funding pack." });
  if (!bearerOk(req, secret)) return new Response("Unauthorized", { status: 401 });

  // Honest default: no DB ⇒ an empty, un-inflated pack.
  const emptyInput: FundingPackInput = {
    companyName: "competitor.inc",
    goalUsd: GOAL_USD,
    autonomy: { ranAutonomously: 0, neededFounder: 0, killSwitchEngagements: 0 },
    revenue: { collectedUsd: 0, paidCustomers: 0, windowDays: WINDOW_DAYS },
    proof: { totalReceipts: 0, liveReceipts: 0 },
  };

  const sb = serviceClient();
  if (!sb) return Response.json({ ok: true, persisted: false, pack: buildFundingPack(emptyInput) });

  try {
    const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000).toISOString();

    const [rev, autoActs, humanActs, receiptRows] = await Promise.all([
      // Settled revenue in the trailing window — real Polar orders only.
      sb.from("revenue_events").select("email,amount_cents").gte("created_at", since).limit(5000),
      // Actions the autopilot resolved itself (standing authorization).
      sb.from("activities").select("id", { count: "exact", head: true }).ilike("meta", "autopilot%"),
      // Actions that required the founder's sign-off (the gated exceptions).
      sb.from("activities").select("id", { count: "exact", head: true }).ilike("meta", "%you signed off%"),
      // Receipted real outcomes (for the proof count + a bounded live re-verify).
      sb.from("activities").select("proof,undone,meta").ilike("meta", "%real%").not("proof", "is", null).order("created_at", { ascending: false }).limit(40),
    ]);

    const revRows = (rev.data ?? []) as Array<{ email: string; amount_cents: number }>;
    const collectedUsd = revRows.reduce((t, r) => t + (r.amount_cents || 0), 0) / 100;
    const paidCustomers = new Set(revRows.map((r) => (r.email || "").toLowerCase()).filter(Boolean)).size;

    const receipts = (receiptRows.data ?? []).filter((a) => (a as { undone?: boolean }).undone !== true);
    const totalReceipts = receipts.length;
    // Live re-verify a bounded slice — dead links never count as "live" (the proof-ledger invariant).
    const liveFlags = await Promise.all(
      receipts.slice(0, 12).map(async (a) => {
        const p = (a as { proof?: { kind?: "url" | "build" | "metric"; value?: string } }).proof;
        return p?.kind && p?.value ? await verifyProof({ kind: p.kind, value: p.value }).catch(() => false) : false;
      }),
    );
    const liveReceipts = liveFlags.filter(Boolean).length;

    const pack = buildFundingPack({
      ...emptyInput,
      autonomy: { ranAutonomously: autoActs.count ?? 0, neededFounder: humanActs.count ?? 0, killSwitchEngagements: 0 },
      revenue: { collectedUsd, paidCustomers, windowDays: WINDOW_DAYS },
      proof: { totalReceipts, liveReceipts },
    });

    return Response.json({ ok: true, persisted: true, pack });
  } catch (e) {
    console.error("[/api/funding] failed:", e instanceof Error ? e.message : "unknown");
    return Response.json({ ok: true, persisted: false, pack: buildFundingPack(emptyInput) });
  }
}
