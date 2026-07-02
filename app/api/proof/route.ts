import crypto from "node:crypto";
import { serviceClient } from "@/lib/engine/service";
import { verifyProof } from "@/lib/engine/execution";
import { redactText, redactUrl } from "@/lib/engine/redact";
import { classifyProof, type ProofRing } from "@/lib/engine/proof";

export const runtime = "nodejs";

// The PROOF LEDGER — private/Ring-0 for now (competitor.inc's own receipted actions), public at launch.
// Three invariants baked in from day one so flipping it public is safe-by-default:
//   1. REAL only — we show activities tagged "real ✓" (written ONLY when a LIVE executor returned a real
//      proof). Nothing simulated ever appears. An empty board is the honest answer until execution is on.
//   2. RE-VERIFIED — every receipt URL is HEAD-checked at load time, so "Don't trust us, click it" can't
//      boomerang on a dead link: a card is marked live or archived, never falsely "live".
//   3. REDACTED — identities/secrets masked (redactText/redactUrl); the proof stays, the "who" doesn't.
// Founder-gated by METRICS_SECRET (same bearer as /api/metrics). Fail-soft: no secret → locked; no DB → [].

function bearerOk(req: Request, secret: string): boolean {
  const got = Buffer.from(req.headers.get("authorization") || "", "utf8");
  const want = Buffer.from(`Bearer ${secret}`, "utf8");
  return got.length === want.length && crypto.timingSafeEqual(got, want);
}

export interface ProofCard {
  id: string;
  agent: string;
  action: string;
  meta: string;
  proofKind: "url" | "build" | "metric" | null;
  proofType: string; // human proof-type tag (e.g. "Live link", "Shipped build", "Verified metric")
  ring: ProofRing; // whose proof: "ours" (dogfood, Ring-0 today) vs consent-gated "customer" (Ring-2)
  proofValue: string; // a clickable receipt (url) or a redacted descriptor
  live: boolean; // re-verified at load
  at: string;
}

export async function GET(req: Request) {
  const secret = process.env.METRICS_SECRET;
  if (!secret) {
    return Response.json({ ok: true, locked: true, note: "Set METRICS_SECRET (env) to open the proof ledger." });
  }
  if (!bearerOk(req, secret)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const sb = serviceClient();
  if (!sb) {
    return Response.json({ ok: true, persisted: false, cards: [] });
  }

  try {
    // Real, receipted, not-undone outcomes — newest first, bounded (re-verification does live HEAD checks).
    const { data } = await sb
      .from("activities")
      .select("id,agent,action,meta,proof,undone,created_at")
      .ilike("meta", "%real%")
      .not("proof", "is", null)
      .order("created_at", { ascending: false })
      .limit(24);

    const rows = (data ?? []).filter((a) => a.undone !== true);
    const cards: ProofCard[] = await Promise.all(
      rows.map(async (a) => {
        const proof = (a.proof ?? null) as { kind?: "url" | "build" | "metric"; value?: string } | null;
        const live = proof?.kind && proof?.value
          ? await verifyProof({ kind: proof.kind, value: proof.value }).catch(() => false)
          : false;
        // Ring-0 only today (our own dogfood). Customer cards (Ring 2) attach ring:"customer" when
        // the consent-gated customer surface ships — classifyProof already carries the axis.
        const type = classifyProof(proof?.kind ?? null, a.action as string, "ours");
        return {
          id: String(a.id),
          agent: String(a.agent ?? ""),
          action: redactText(a.action as string),
          meta: redactText((a.meta as string) ?? ""),
          proofKind: proof?.kind ?? null,
          proofType: type.label,
          ring: type.ring,
          proofValue: proof?.kind === "url" ? redactUrl(proof.value) : redactText(proof?.value ?? ""),
          live,
          at: String(a.created_at ?? ""),
        };
      })
    );

    return Response.json({ ok: true, persisted: true, cards });
  } catch (e) {
    console.error("[/api/proof] failed:", e instanceof Error ? e.message : "unknown");
    return Response.json({ ok: true, persisted: false, cards: [] });
  }
}
