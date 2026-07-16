// ─────────────────────────────────────────────────────────────────────────────
// DESIGN STUDIO — our design agents drive Open Design (nexu-io, Apache-2.0) as the rendering engine.
//
// Screened ALLOWED by the license gate (THIRD-PARTY-NOTICES.md). Open Design runs as a LOCAL daemon
// (its `od` bin owns /api/*, skills, design systems, artifacts) — we sell the governed design SERVICE
// on top: agent-produced prototypes, landing pages, decks, images/video, exported as real files. Never
// their code, never their marks, and every deliverable carries engine provenance (honest attribution).
//
// Same spine as everything else: governAction BEFORE any I/O. Producing a local artifact is build-class
// work (T1, reversible) — SHIPPING it to a customer stays behind the review gates like any build.
// ─────────────────────────────────────────────────────────────────────────────

import { governAction, type GovernOptions } from "@/lib/core/govern";

export type DeliverableKind = "landing" | "prototype" | "deck" | "dashboard" | "image" | "video";

export interface DesignRequest {
  kind: DeliverableKind;
  brief: string; // what the customer needs, in plain words
  designSystem?: string; // optional brand DESIGN.md name (Open Design's design-systems/)
}

export interface DesignArtifact {
  kind: DeliverableKind;
  ref: string; // the artifact path/url the daemon reports
  engine: "open-design (Apache-2.0)"; // provenance rides on every deliverable — never claimed as hand-made
}

export type DesignResult =
  | { ok: true; artifact: DesignArtifact }
  | { ok: false; error: string; governed?: "BLOCK" | "QUEUE" };

export function designStudioStatus(env: Record<string, string | undefined> = process.env): { configured: boolean; url?: string } {
  const url = env.OPEN_DESIGN_URL; // the local od daemon, e.g. http://127.0.0.1:4820
  return { configured: Boolean(url), url };
}

/**
 * Request one deliverable from the engine. Governance first (kill switch → decide; build-class, T1,
 * reversible — a local artifact can be discarded); then POST the brief to the daemon's artifact endpoint
 * (path configurable via OPEN_DESIGN_ARTIFACTS_PATH while we pin the daemon's exact contract).
 */
export async function requestDeliverable(
  req: DesignRequest,
  opts: { fetchImpl?: typeof fetch; env?: Record<string, string | undefined>; govern?: GovernOptions } = {},
): Promise<DesignResult> {
  const env = opts.env ?? process.env;
  const { configured, url } = designStudioStatus(env);
  if (!configured || !url) return { ok: false, error: "Design Studio not connected (set OPEN_DESIGN_URL to the local od daemon)" };

  const g = governAction(
    { type: "design_draft", agent: "engineering", hasCredential: true, reversible: true, observable: true },
    { ...opts.govern, input: `design-studio:${req.kind} ${req.brief.slice(0, 300)}` },
  );
  if (g.decision.verdict !== "AUTO") {
    return { ok: false, error: `governed: ${g.decision.verdict} — ${g.decision.reason}`, governed: g.decision.verdict as "BLOCK" | "QUEUE" };
  }

  const doFetch = opts.fetchImpl ?? fetch;
  try {
    const res = await doFetch(`${url}${env.OPEN_DESIGN_ARTIFACTS_PATH ?? "/api/artifacts"}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind: req.kind, brief: req.brief, designSystem: req.designSystem }),
    });
    if (!res.ok) return { ok: false, error: `od daemon → HTTP ${res.status}` };
    const body = (await res.json()) as { artifact?: string; path?: string; url?: string };
    const ref = body.artifact ?? body.path ?? body.url;
    if (!ref) return { ok: false, error: "daemon returned no artifact ref — nothing to show, nothing claimed" };
    return { ok: true, artifact: { kind: req.kind, ref, engine: "open-design (Apache-2.0)" } };
  } catch (e) {
    return { ok: false, error: `daemon unreachable: ${e instanceof Error ? e.message : "unknown"}` };
  }
}
