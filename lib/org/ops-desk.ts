// ─────────────────────────────────────────────────────────────────────────────
// THE OPS DESK — "ops agents watch deploys" (Day One), honestly.
//
// The ops roles' read of deploy REALITY: probe each product's live URL the same way the build pipeline's
// SERVES_REAL gate does (HTTP 200 + a real page, not a scaffold), and report one of four honest states:
//   live      — probed now, serving a real page
//   down      — probed now, not serving (non-200 / empty / error)
//   building  — no URL yet (the pipeline hasn't published one; an honest in-flight state)
//   unknown   — probe didn't run/complete — NEVER guessed as live ([[crack-audit-and-no-fake-proof]])
//
// Split: pure assessment (deterministic, unit-tested) + a thin runner with injectable fetch. A `down`
// product yields an ESCALATION the org can route (notify → decision queue if action is reserved).
// ─────────────────────────────────────────────────────────────────────────────

export interface WatchedProduct {
  productId: string;
  url?: string | null; // absent/null ⇒ still building (the pipeline only publishes verified URLs)
}

export interface ProbeResult {
  productId: string;
  ok: boolean; // fetch completed (any status) — false means network/timeout, i.e. unknown
  status?: number;
  realPage?: boolean; // body looks like a real page, not a scaffold/blank (SERVES_REAL analog)
}

export type DeployState = "live" | "down" | "building" | "unknown";

export interface ProductHealth {
  productId: string;
  state: DeployState;
  evidence: string; // the honest one-liner behind the state — never a bare adjective
}

export interface OpsReport {
  checkedAt: number;
  products: ProductHealth[];
  counts: Record<DeployState, number>;
  escalations: { productId: string; reason: string }[]; // down products the org must act on
}

/** Pure assessment: probe results in, honest states out. No probe result ⇒ unknown, never live. */
export function assessDeploys(products: WatchedProduct[], probes: ProbeResult[], now: number): OpsReport {
  const byId = new Map(probes.map((p) => [p.productId, p]));
  const health: ProductHealth[] = products.map((p) => {
    if (!p.url?.trim()) {
      return { productId: p.productId, state: "building", evidence: "no live URL published yet — the pipeline only publishes verified URLs" };
    }
    const probe = byId.get(p.productId);
    if (!probe || !probe.ok) {
      return { productId: p.productId, state: "unknown", evidence: probe ? "probe did not complete (network) — not guessed" : "not probed this pass — not guessed" };
    }
    if (probe.status === 200 && probe.realPage) {
      return { productId: p.productId, state: "live", evidence: `HTTP 200 + real page at ${p.url}` };
    }
    return { productId: p.productId, state: "down", evidence: `HTTP ${probe.status ?? "?"}${probe.status === 200 ? " but not a real page (scaffold/blank)" : ""} at ${p.url}` };
  });
  const counts: Record<DeployState, number> = { live: 0, down: 0, building: 0, unknown: 0 };
  for (const h of health) counts[h.state]++;
  return {
    checkedAt: now,
    products: health,
    counts,
    escalations: health.filter((h) => h.state === "down").map((h) => ({ productId: h.productId, reason: h.evidence })),
  };
}

// ── The runner (thin; injectable fetch so tests never touch the network) ─────
type FetchLike = (url: string, init?: { signal?: AbortSignal }) => Promise<{ status: number; text(): Promise<string> }>;

const SCAFFOLD_RE = /get started by editing|to get started, edit|edit the page\.tsx/i;

export async function probeProducts(products: WatchedProduct[], fetchImpl: FetchLike, timeoutMs = 10_000): Promise<ProbeResult[]> {
  const withUrls = products.filter((p): p is WatchedProduct & { url: string } => !!p.url?.trim());
  return Promise.all(
    withUrls.map(async (p) => {
      try {
        const r = await fetchImpl(p.url, { signal: AbortSignal.timeout(timeoutMs) });
        const body = await r.text().catch(() => "");
        return { productId: p.productId, ok: true, status: r.status, realPage: body.length > 0 && /<body/i.test(body) && !SCAFFOLD_RE.test(body) };
      } catch {
        return { productId: p.productId, ok: false };
      }
    }),
  );
}

/** One watch pass: probe everything, assess honestly. */
export async function watchDeploys(products: WatchedProduct[], fetchImpl: FetchLike, now: number = Date.now()): Promise<OpsReport> {
  return assessDeploys(products, await probeProducts(products, fetchImpl), now);
}
