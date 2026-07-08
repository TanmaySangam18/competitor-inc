"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import { useCopy } from "@/components/useCopy";
import type { SalesAttack } from "@/lib/engine/sales-playbooks";

// "Sell This" — the free viral tool + the invention on display. Paste any product → the Sales Floor (agents
// trained on the sales-science canon) returns a real, playbook-grounded go-to-market that would sell it.
// Shareable (/sell?product=…). Direction B: mono chrome, flat panels, NO icons (text + structure only).

function Tile({ label, title, children }: { label: string; title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl glass-panel p-5">
      <div className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-2">{label}</div>
      {title && <div className="mt-1 text-sm font-medium text-text">{title}</div>}
      <div className="mt-2 text-sm text-text">{children}</div>
    </div>
  );
}

export default function SellThis() {
  const [product, setProduct] = useState("");
  const [loading, setLoading] = useState(false);
  const [attack, setAttack] = useState<SalesAttack | null>(null);
  const [sold, setSold] = useState("");
  const [err, setErr] = useState("");
  const { copied, copy } = useCopy(1500);
  const ranOnce = useRef(false);

  async function sell(text: string) {
    const t = text.trim();
    if (t.length < 6) { setErr("Tell me what the product is (a sentence is plenty)."); return; }
    setErr("");
    setLoading(true);
    setAttack(null);
    try {
      const res = await fetch("/api/engine", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "sell", product: t }),
      });
      const data = await res.json();
      if (!res.ok || !data?.attack) {
        setErr(data?.error?.includes("limit") ? "You've used your free runs — sign up to keep going." : (data?.error || "Couldn't build that — try again."));
        return;
      }
      setAttack(data.attack as SalesAttack);
      setSold(t);
      // Funnel-proof: log the tool run (top of the funnel). Fire-and-forget.
      fetch("/api/track", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: "sell", type: "tool", source: "sell-tool" }) }).catch(() => {});
    } catch {
      setErr("Network hiccup — try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;
    try {
      const shared = new URLSearchParams(window.location.search).get("product");
      if (shared && shared.trim()) { setProduct(shared); void sell(shared); }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shareLink = attack && typeof window !== "undefined" ? `${window.location.origin}/sell?product=${encodeURIComponent(sold)}` : "";

  return (
    <div id="main" className="min-h-screen">
      <header className="glass-nav sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 font-mono text-lg font-bold tracking-tight">
            <LogoMark size={32} /> competitor.inc
          </Link>
          <Link href="/" className="font-mono text-sm text-muted transition hover:text-text">← home</Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-12">
        {!attack && (
          <div className="text-center">
            <div className="font-mono text-xs font-semibold uppercase tracking-wider text-coral">Free · no signup</div>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">
              Paste any product. Get the <span className="gradient-text">go-to-market that sells it</span>.
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-muted">
              Our AI sales floor is trained on the canon of sales science — positioning, Jobs-to-be-Done,
              Challenger, SPIN, Sandler, Cialdini, StoryBrand. It turns a product nobody was going to buy into
              a real plan to sell it. Others build the app; we get it paid.
            </p>
            <div className="mx-auto mt-8 max-w-xl">
              <textarea
                value={product}
                onChange={(e) => { setProduct(e.target.value); if (err) setErr(""); }}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) sell(product); }}
                placeholder="e.g. A Chrome extension that summarizes long PDFs for law students."
                rows={3}
                className={`w-full resize-none rounded-xl glass-panel px-4 py-3.5 text-sm outline-none placeholder:text-muted-2 focus:border-coral/40 ${err ? "border-coral/60" : ""}`}
                aria-label="Your product"
              />
              {err && <p className="mt-2 text-left text-xs font-medium text-coral" role="alert">{err}</p>}
              <button
                onClick={() => sell(product)}
                disabled={loading}
                className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-coral px-6 py-3.5 font-mono font-semibold text-bg transition hover:brightness-110 disabled:opacity-60 sm:w-auto"
              >
                {loading ? "the sales floor is working…" : "Build my go-to-market"}
              </button>
              <p className="mt-3 font-mono text-xs text-muted-2">Free to try. Grounded in real playbooks — no fabricated stats.</p>
            </div>
          </div>
        )}

        {attack && (
          <div>
            <div className="flex items-center justify-between gap-3 font-mono text-sm">
              <button onClick={() => { setAttack(null); setErr(""); }} className="text-muted transition hover:text-text">← sell another</button>
              <button onClick={() => copy(shareLink)} className="rounded-lg border border-border px-3 py-1.5 text-muted transition hover:text-text">
                {copied ? "link copied" : "share this plan"}
              </button>
            </div>

            <p className="mt-4 font-mono text-xs uppercase tracking-wider text-muted-2">Selling</p>
            <p className="mt-1 text-lg font-medium text-text">&ldquo;{sold}&rdquo;</p>

            <div className="mt-4 rounded-xl border border-coral/40 bg-coral/[0.06] p-6">
              <div className="font-mono text-xs font-semibold uppercase tracking-wider text-coral">The pitch · one line</div>
              <p className="mt-2 text-xl font-semibold text-text">{attack.oneLiner}</p>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Tile label="The job it's hired for">{attack.job}</Tile>
              <Tile label="Positioning">{attack.positioning}</Tile>
              <Tile label="Beachhead">{attack.beachhead}</Tile>
              <Tile label="The commercial insight">{attack.insight}</Tile>
              <Tile label="Channels">
                <ul className="space-y-1.5">{attack.channels.map((c, i) => <li key={i} className="flex gap-2"><span className="font-mono text-muted-2">{i + 1}.</span> {c}</li>)}</ul>
              </Tile>
              <Tile label="The pitch (copy)">{attack.pitch}</Tile>
            </div>

            <div className="mt-4 rounded-xl glass-panel p-5">
              <div className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-2">Objections, handled</div>
              <div className="mt-3 space-y-3">
                {attack.objections.map((o, i) => (
                  <div key={i} className="border-l-2 border-border pl-3">
                    <div className="text-sm font-medium text-text">{o.objection}</div>
                    <div className="mt-0.5 text-sm text-muted">{o.response}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-xl glass-panel p-5">
              <div className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-2">Your first week</div>
              <ul className="mt-3 space-y-1.5">
                {attack.firstWeek.map((m, i) => <li key={i} className="flex gap-2 text-sm text-text"><span className="font-mono text-muted-2">–</span> {m}</li>)}
              </ul>
            </div>

            <p className="mt-4 text-center font-mono text-xs text-muted-2">Grounded in: {attack.frameworks.join(" · ")}</p>

            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href={`/signup?product=${encodeURIComponent(sold)}`} className="inline-flex w-full items-center justify-center rounded-lg bg-coral px-6 py-3.5 font-mono font-semibold text-bg transition hover:brightness-110 sm:w-auto">
                Have the crew run this for real →
              </Link>
              <button onClick={() => copy(shareLink)} className="inline-flex w-full items-center justify-center rounded-lg border border-border px-6 py-3.5 font-mono text-sm font-semibold text-text transition hover:bg-bg/40 sm:w-auto">
                {copied ? "link copied" : "share this plan"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
