import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { signMetricCard, verifyMetricSig } from "@/lib/engine/receipt-sign";

// /verify (ADR-0025) — the anti-fabrication page. Paste a receipt card URL (or its triplet) and this
// deployment checks its own signature, in public. Plain GET form, zero client JS: verification that
// works with JavaScript disabled is verification that looks like what it is. The page never claims
// more than the crypto shows: VERIFIED means "minted by this server, unaltered" — nothing else.

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "competitor.inc: verify a receipt",
  description: "Paste a competitor.inc receipt and check its signature against this server. No account, no JavaScript required.",
};

type Result =
  | { state: "idle" }
  | { state: "bad-input"; note: string }
  | { state: "unarmed" }
  | { state: "checked"; verified: boolean; title: string; value: string };

function check(sp: { url?: string; title?: string; value?: string; sig?: string }): Result {
  let { title = "", value = "", sig = "" } = sp;
  if (sp.url) {
    try {
      const u = new URL(sp.url);
      title = u.searchParams.get("title") ?? "";
      value = u.searchParams.get("value") ?? "";
      sig = u.searchParams.get("sig") ?? "";
    } catch {
      return { state: "bad-input", note: "that is not a valid URL" };
    }
  }
  if (!title && !value && !sig) return { state: "idle" };
  if (!title || !value || !sig) return { state: "bad-input", note: "a receipt needs all three: title, value, signature" };
  if (signMetricCard("probe", "probe") === null) return { state: "unarmed" };
  return { state: "checked", verified: verifyMetricSig(title.slice(0, 120), value.slice(0, 160), sig.slice(0, 128)), title, value };
}

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ url?: string; title?: string; value?: string; sig?: string }> }) {
  const sp = await searchParams;
  const result = check(sp);

  return (
    <div className="min-h-screen bg-bg text-text">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-16">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-2">receipts, or it didn&apos;t happen</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Verify a receipt</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Every metric we publish is minted as a signed receipt. Paste one here and this server checks its
          own signature, in front of you. VERIFIED means exactly one thing: this server minted it and the
          content is unaltered. It does not mean &ldquo;impressive&rdquo;; it means <em>true as issued</em>.
        </p>

        <form method="GET" className="mt-8">
          <label htmlFor="url" className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-2">
            receipt card URL
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="url" name="url" type="text" defaultValue={sp.url ?? ""} placeholder="https://…/api/receipt-card?kind=metric&title=…&value=…&sig=…"
              className="min-w-0 flex-1 border border-border bg-transparent px-3 py-2 font-mono text-[12px] outline-none focus:border-text"
            />
            <button type="submit" className="shrink-0 border border-text px-4 py-2 font-mono text-[11px] uppercase tracking-[0.15em] transition-colors hover:bg-text hover:text-bg">
              Check
            </button>
          </div>
        </form>

        {result.state === "bad-input" && (
          <p className="mt-6 border border-border p-4 font-mono text-[12px]">Can&apos;t check that: {result.note}.</p>
        )}
        {result.state === "unarmed" && (
          <p className="mt-6 border border-border p-4 font-mono text-[12px]">
            This deployment has no signing secret configured, so verification is unavailable here. Honestly
            unavailable, not silently broken.
          </p>
        )}
        {result.state === "checked" && (
          <div className={`mt-6 border p-5 ${result.verified ? "border-text" : "border-border"}`}>
            <p className="font-mono text-[11px] uppercase tracking-[0.25em]">
              {result.verified ? "✓ verified: minted by this server, unaltered" : "✗ not verified"}
            </p>
            <p className="mt-3 text-sm"><span className="text-muted">Claim:</span> {result.title}</p>
            <p className="mt-1 text-sm"><span className="text-muted">Value:</span> {result.value}</p>
            {!result.verified && (
              <p className="mt-3 text-[13px] leading-relaxed text-muted">
                Either this receipt was not minted by this server, or its content was changed after minting.
                We do not vouch for it.
              </p>
            )}
          </div>
        )}

        <p className="mt-10 font-mono text-[10px] uppercase leading-relaxed tracking-[0.15em] text-muted-2">
          Why this page exists: numbers without receipts are how this industry burned its trust. Ours come
          with signatures, and the checker is public. Programmatic: GET /api/verify?url=…
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
