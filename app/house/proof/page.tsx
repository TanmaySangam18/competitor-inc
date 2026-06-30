"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, KeyRound, ShieldCheck, CheckCircle2, Archive, Lock } from "lucide-react";
import { LogoMark } from "@/components/Logo";

// The PROOF LEDGER (private/Ring-0). Shows competitor.inc's OWN receipted actions — real, re-verified,
// redacted — and nothing simulated. Private until launch; this is where the public "Don't trust us,
// click it" board is rehearsed safely. Founder-gated by METRICS_SECRET (same token as the board).
const TOKEN_KEY = "cofounder:metrics:token";

interface ProofCard {
  id: string;
  agent: string;
  action: string;
  meta: string;
  proofKind: "url" | "build" | "metric" | null;
  proofType?: string;
  ring?: "ours" | "customer";
  proofValue: string;
  live: boolean;
  at: string;
}
interface Resp {
  locked?: boolean;
  persisted?: boolean;
  cards?: ProofCard[];
  note?: string;
}

export default function ProofLedger() {
  const [token, setToken] = useState("");
  const [r, setR] = useState<Resp | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async (t: string) => {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/proof", { headers: t ? { authorization: `Bearer ${t}` } : {} });
      if (res.status === 401) {
        setErr("Token rejected. Check METRICS_SECRET.");
        setR(null);
      } else {
        setR((await res.json()) as Resp);
      }
    } catch {
      setErr("Couldn't reach /api/proof.");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    let t = "";
    try {
      t = localStorage.getItem(TOKEN_KEY) || "";
    } catch {
      /* ignore */
    }
    setToken(t);
    load(t);
  }, [load]);

  function saveAndLoad() {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* ignore */
    }
    load(token);
  }

  const cards = r?.cards ?? [];

  return (
    <div className="min-h-screen">
      <header className="glass-nav sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <Link href="/house" className="flex items-center gap-2.5 font-mono text-lg font-bold tracking-tight">
            <LogoMark size={32} /> Proof ledger
          </Link>
          <Link href="/house/board" className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-text">
            <ArrowLeft size={15} /> Board
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck size={16} className="text-mint" /> Proof ledger — receipted, re-verified, redacted
        </div>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber/30 bg-amber/[0.06] px-3 py-1 text-xs text-muted">
          <Lock size={12} /> Private · Ring 0 (competitor.inc&apos;s own actions) · goes public at launch
        </div>

        {r?.locked && (
          <div className="mt-4 rounded-2xl border border-amber/30 bg-amber/[0.06] px-4 py-3 text-sm text-muted">
            The ledger is off. Set <span className="font-mono text-text">METRICS_SECRET</span> in your deploy env, then paste it below. {r?.note}
          </div>
        )}

        {/* Token entry (kept on-device only) */}
        <div className="mt-4 flex items-center gap-2">
          <div className="relative flex-1">
            <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-2" />
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveAndLoad()}
              placeholder="METRICS_SECRET (stored on this device only)"
              className="w-full rounded-xl glass-panel py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-muted-2 focus:border-mint/40"
            />
          </div>
          <button
            onClick={saveAndLoad}
            disabled={busy}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-text px-4 py-2.5 text-sm font-semibold text-bg transition hover:opacity-90 disabled:opacity-50"
          >
            <RefreshCw size={14} className={busy ? "animate-spin" : ""} /> Load
          </button>
        </div>
        {err && <p className="mt-2 text-xs text-coral">{err}</p>}

        {/* Honest empty state — real receipts only; nothing simulated ever shows here. */}
        {!r?.locked && cards.length === 0 && (
          <div className="mt-8 rounded-2xl border border-border bg-bg/40 p-8 text-center">
            <ShieldCheck size={22} className="mx-auto text-muted-2" />
            <p className="mt-3 text-sm font-semibold">No verified receipts yet</p>
            <p className="mx-auto mt-1 max-w-md text-xs text-muted-2">
              Real, checkable receipts appear here the moment competitor.inc&apos;s own execution keys are on and its
              agents take a live action — a real repo, deploy, send, or charge. Nothing simulated is ever shown.
            </p>
          </div>
        )}

        {/* The receipts. Each is re-verified at load: live ✓ or archived. */}
        {cards.length > 0 && (
          <div className="mt-6 space-y-3">
            {cards.map((c) => (
              <div key={c.id} className="flex items-start gap-3 rounded-2xl border border-border bg-bg/40 p-4">
                <span
                  className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${c.live ? "bg-mint/12 text-mint" : "bg-muted-2/12 text-muted-2"}`}
                  title={c.live ? "re-verified live" : "archived — was live, no longer resolves"}
                >
                  {c.live ? <CheckCircle2 size={16} /> : <Archive size={16} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide text-muted-2">
                    {c.proofType && (
                      <span className="rounded-full border border-border bg-surface px-1.5 py-0.5 normal-case tracking-normal text-muted">
                        {c.proofType}
                      </span>
                    )}
                    {c.ring === "customer" && (
                      <span className="rounded-full border border-mint/30 bg-mint/[0.06] px-1.5 py-0.5 normal-case tracking-normal text-mint">
                        customer
                      </span>
                    )}
                    {c.agent} · {c.live ? "live ✓" : "archived"} {c.at && `· ${new Date(c.at).toLocaleDateString()}`}
                  </div>
                  <div className="mt-0.5 text-sm text-text">{c.action}</div>
                  {c.proofKind === "url" && c.proofValue ? (
                    <a
                      href={c.proofValue}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block break-all text-xs text-mint underline underline-offset-2 hover:opacity-80"
                    >
                      Verify ↗ {c.proofValue}
                    </a>
                  ) : (
                    c.proofValue && <div className="mt-1 text-xs text-muted-2">{c.proofValue}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-8 text-xs text-muted-2">
          Every card is a real, live-executor receipt — re-checked on load, identities redacted. This is the
          private rehearsal of the public board: <span className="text-muted">&quot;Don&apos;t trust us — click it.&quot;</span>
        </p>
      </div>
    </div>
  );
}
