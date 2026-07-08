"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Copy, Check, Loader2, Megaphone, Target, Users, Compass, Lightbulb, MessageSquareQuote, ListChecks } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { useCopy } from "@/components/useCopy";
import type { SalesAttack } from "@/lib/engine/sales-playbooks";

// "Sell This" — the free viral tool + the invention on display. Paste any product → the Sales Floor (agents
// trained on the sales-science canon) returns a real, playbook-grounded go-to-market that would sell it.
// Shareable (/sell?product=…). CTA → the paid "have the crew run it" tier. Uses POST /api/engine kind:"sell".

function Tile({ icon: Icon, title, children }: { icon: typeof Target; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl glass-panel p-5">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-2">
        <Icon size={14} /> {title}
      </div>
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
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-text">
            <ArrowLeft size={15} /> Home
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-12">
        {!attack && (
          <div className="text-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-coral">Free · no signup</div>
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
                className={`w-full resize-none rounded-2xl glass-panel px-4 py-3.5 text-sm outline-none placeholder:text-muted-2 focus:border-coral/40 ${err ? "border-coral/60" : ""}`}
                aria-label="Your product"
              />
              {err && <p className="mt-2 text-left text-xs font-medium text-coral" role="alert">{err}</p>}
              <button
                onClick={() => sell(product)}
                disabled={loading}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-coral px-6 py-3.5 font-semibold text-bg transition hover:brightness-110 disabled:opacity-60 sm:w-auto"
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> The sales floor is working…</> : <><Megaphone size={16} /> Build my go-to-market</>}
              </button>
              <p className="mt-3 text-xs text-muted-2">Free to try. Grounded in real playbooks — no fabricated stats.</p>
            </div>
          </div>
        )}

        {attack && (
          <div>
            <div className="flex items-center justify-between gap-3">
              <button onClick={() => { setAttack(null); setErr(""); }} className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-text">
                <ArrowLeft size={14} /> Sell another
              </button>
              <button onClick={() => copy(shareLink)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition hover:text-text">
                {copied ? <Check size={14} className="text-mint" /> : <Copy size={14} />} {copied ? "Link copied" : "Share this plan"}
              </button>
            </div>

            <p className="mt-4 text-sm text-muted-2">Selling</p>
            <p className="mt-1 text-lg font-medium text-text">&ldquo;{sold}&rdquo;</p>

            <div className="mt-4 rounded-3xl border border-coral/40 bg-coral/[0.06] p-6">
              <div className="text-xs font-semibold uppercase tracking-wider text-coral">The pitch · one line</div>
              <p className="mt-2 text-xl font-semibold text-text">{attack.oneLiner}</p>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Tile icon={Target} title="The job it's hired for">{attack.job}</Tile>
              <Tile icon={Compass} title="Positioning">{attack.positioning}</Tile>
              <Tile icon={Users} title="Beachhead">{attack.beachhead}</Tile>
              <Tile icon={Lightbulb} title="The commercial insight">{attack.insight}</Tile>
              <Tile icon={Megaphone} title="Channels">
                <ul className="space-y-1.5">{attack.channels.map((c, i) => <li key={i} className="flex gap-2"><span className="text-muted-2">{i + 1}.</span> {c}</li>)}</ul>
              </Tile>
              <Tile icon={MessageSquareQuote} title="The pitch (copy)">{attack.pitch}</Tile>
            </div>

            <div className="mt-4 rounded-3xl glass-panel p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-2"><MessageSquareQuote size={14} /> Objections, handled</div>
              <div className="mt-3 space-y-3">
                {attack.objections.map((o, i) => (
                  <div key={i} className="border-l-2 border-border pl-3">
                    <div className="text-sm font-medium text-text">{o.objection}</div>
                    <div className="mt-0.5 text-sm text-muted">{o.response}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-3xl glass-panel p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-2"><ListChecks size={14} /> Your first week</div>
              <ul className="mt-3 space-y-1.5">
                {attack.firstWeek.map((m, i) => <li key={i} className="flex gap-2 text-sm text-text"><Check size={15} className="mt-0.5 shrink-0 text-mint" /> {m}</li>)}
              </ul>
            </div>

            <p className="mt-4 text-center text-xs text-muted-2">Grounded in: {attack.frameworks.join(" · ")}</p>

            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href={`/signup?product=${encodeURIComponent(sold)}`} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-coral px-6 py-3.5 font-semibold text-bg transition hover:brightness-110 sm:w-auto">
                Have the crew run this for real <ArrowRight size={16} />
              </Link>
              <button onClick={() => copy(shareLink)} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-6 py-3.5 text-sm font-semibold text-text transition hover:bg-bg/40 sm:w-auto">
                {copied ? "Link copied" : "Share this plan"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
