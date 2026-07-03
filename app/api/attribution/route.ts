import { serviceClient } from "@/lib/engine/service";
import { SLUG_RE } from "@/lib/engine/slug";
import { attributeChannels, portfolioRoi, type EventRow } from "@/lib/engine/attribution";
import { rateLimited, clientIp } from "@/lib/engine/ratelimit";

export const runtime = "nodejs";

// Marketing attribution: per-channel view→signup→(revenue/ROAS) rollup for a company, computed from
// our own first-party events. Traffic legs are REAL from the pixel; money legs stay null/"missing"
// until an ad account is connected (Phase 2, founder-approval-gated) — we never fabricate a ROAS.
// Aggregates + channels only, never emails or row-level PII. Fail-soft to an empty honest state.
export async function GET(req: Request) {
  if (rateLimited(`attr:${clientIp(req)}`)) {
    return Response.json({ ok: false, error: "rate limited" }, { status: 429 });
  }
  const slug = (new URL(req.url).searchParams.get("slug") ?? "").trim().toLowerCase();
  if (!SLUG_RE.test(slug)) return Response.json({ ok: false, error: "bad slug" }, { status: 400 });

  const empty = { ok: true, persisted: false, channels: [], portfolio: null, note: "Connect the pixel to measure channels — and an ad account to see ROAS." };
  const sb = serviceClient();
  if (!sb) return Response.json(empty);
  try {
    // Only the two columns attribution needs; bounded. No email, no dedup hash leaves the server.
    const { data } = await sb.from("events").select("type, source").eq("slug", slug).in("type", ["view", "signup"]).limit(50000);
    const rows: EventRow[] = (data ?? []).map((r) => ({ type: r.type as EventRow["type"], source: (r.source as string) ?? null }));
    // Spend stays empty until Phase 2 connects an ad account; attribution runs on real traffic today.
    const channels = attributeChannels(rows, []);
    return Response.json({ ok: true, persisted: true, channels, portfolio: portfolioRoi(channels) });
  } catch {
    return Response.json(empty);
  }
}
