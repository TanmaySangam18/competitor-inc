import crypto from "node:crypto";
import { getServerSupabase } from "@/lib/supabase/server";
import { serviceClient } from "@/lib/engine/service";
import { insertApprovals } from "@/lib/engine/db";
import { loadMandate, UNSIGNED } from "@/lib/engine/mandates-db";
import { processLead } from "@/lib/engine/sales-desk";
import { overLimit, clientIp } from "@/lib/engine/ratelimit";
import type { Lead, LeadSource } from "@/lib/org/outreach";

export const runtime = "nodejs";

// THE SALES DESK route (Block 6c). The owner submits a REAL lead (someone they met, an inbound, a
// referral) → qualify → the consent gate → an honest drafted first-touch that QUEUES on the approval
// desk. Nothing sends from here, ever: execution stays behind the policy floor + the signed mandate.
// Ownership: the caller's RLS session must see the company (same posture as /api/org-run).
export async function POST(req: Request) {
  if (await overLimit(`sales:${clientIp(req)}`)) return Response.json({ ok: false, error: "rate limited" }, { status: 429 });
  const body = (await req.json().catch(() => null)) as { companyId?: string; lead?: Partial<Lead> } | null;
  const companyId = (body?.companyId ?? "").toString().trim();
  const l = body?.lead;
  if (!companyId || !l || typeof l.company !== "string" || !l.company.trim()) {
    return Response.json({ ok: false, error: "companyId + lead.company required" }, { status: 400 });
  }

  const auth = await getServerSupabase();
  if (!auth) return Response.json({ ok: false, error: "server db not configured" }, { status: 503 });
  const { data } = await auth.auth.getUser();
  if (!data?.user) return Response.json({ ok: false, error: "sign in required" }, { status: 401 });
  // Ownership check via RLS: the company must resolve under the caller's session.
  const { data: co } = await auth.from("companies").select("id").eq("id", companyId).maybeSingle();
  if (!co) return Response.json({ ok: false, error: "not found" }, { status: 404 });

  // Sanitize the lead — clamped strings, a known source, booleans coerced. Signals capped at 8.
  const SOURCES: LeadSource[] = ["referral", "inbound", "community", "event", "list"];
  const lead: Lead = {
    id: crypto.randomUUID(),
    name: typeof l.name === "string" ? l.name.slice(0, 80) : undefined,
    title: typeof l.title === "string" ? l.title.slice(0, 80) : undefined,
    company: l.company.slice(0, 120).trim(),
    companySize: Number.isFinite(l.companySize) ? Math.max(1, Math.min(100_000, Math.floor(l.companySize!))) : undefined,
    signals: Array.isArray(l.signals) ? l.signals.filter((s): s is string => typeof s === "string").slice(0, 8).map((s) => s.slice(0, 120)) : undefined,
    source: SOURCES.includes(l.source as LeadSource) ? (l.source as LeadSource) : "list", // unknown ⇒ the strictest gate
    triggerReason: typeof l.triggerReason === "string" ? l.triggerReason.slice(0, 200) : undefined,
    contactPermission: l.contactPermission === true,
  };

  const mandate = await loadMandate(auth, companyId).catch(() => UNSIGNED); // outage never widens authority
  const outcome = processLead(lead, mandate);
  if (!outcome.ok) {
    // Honest declines are the product: the caller sees exactly which rail stopped it and why.
    return Response.json({ ok: false, declined: outcome.stage, reason: outcome.reason, qualification: outcome.qualification ?? null });
  }

  const svc = serviceClient();
  if (!svc) return Response.json({ ok: false, error: "server db not configured" }, { status: 503 });
  try {
    await insertApprovals(svc, companyId, [
      { id: crypto.randomUUID(), night: 0, agent: "growth", kind: "outreach", title: outcome.approval.title, detail: outcome.approval.detail },
    ]);
  } catch (e) {
    console.error("[/api/sales] queue failed:", e instanceof Error ? e.message : "unknown");
    return Response.json({ ok: false, error: "could not queue the draft" }, { status: 500 });
  }
  return Response.json({ ok: true, qualification: outcome.qualification, gate: outcome.gate.reason, sendGoverned: outcome.mandate.decision, draft: outcome.draft });
}
