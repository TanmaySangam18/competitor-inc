import { NextRequest, NextResponse } from "next/server";
import { signMetricCard, verifyMetricSig } from "@/lib/engine/receipt-sign";
import { overLimit, clientIp } from "@/lib/engine/ratelimit";

// /api/verify (ADR-0025) — public receipt verification. Anyone can check that a receipt card was
// minted by THIS server (HMAC over title|value with the server secret). Accepts the pasted card URL
// or the (title, value, sig) triplet. Fail-closed and honest: an unarmed deployment says verification
// is unavailable rather than pretending; a bad signature says NOT VERIFIED, never 500s.

export async function GET(req: NextRequest) {
  if (await overLimit(`verify:${clientIp(req)}`)) {
    return NextResponse.json({ ok: false, error: "rate limited" }, { status: 429 });
  }
  const sp = req.nextUrl.searchParams;
  let title = (sp.get("title") ?? "").slice(0, 120);
  let value = (sp.get("value") ?? "").slice(0, 160);
  let sig = (sp.get("sig") ?? "").slice(0, 128);

  const raw = sp.get("url");
  if (raw) {
    try {
      const u = new URL(raw); // parsed only — never fetched
      title = (u.searchParams.get("title") ?? "").slice(0, 120);
      value = (u.searchParams.get("value") ?? "").slice(0, 160);
      sig = (u.searchParams.get("sig") ?? "").slice(0, 128);
    } catch {
      return NextResponse.json({ ok: false, error: "not a valid URL" }, { status: 400 });
    }
  }
  if (!title || !value || !sig) {
    return NextResponse.json({ ok: false, error: "provide a receipt-card url, or title + value + sig" }, { status: 400 });
  }
  // Armed = the deployment holds the signing secret (signMetricCard returns null without it).
  if (signMetricCard("probe", "probe") === null) {
    return NextResponse.json({ ok: true, verifiable: false, reason: "this deployment has no signing secret configured; verification unavailable, honestly" });
  }
  const verified = verifyMetricSig(title, value, sig);
  return NextResponse.json({
    ok: true,
    verifiable: true,
    verified,
    title,
    value,
    reason: verified
      ? "signature valid: this receipt was minted by this server"
      : "signature INVALID: this was not minted by this server, or the content was altered",
  });
}
