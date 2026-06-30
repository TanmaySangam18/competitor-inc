import Link from "next/link";
import type { Metadata } from "next";
import { ShieldCheck, Link2, Hammer, BarChart3, Receipt, ArrowRight, ArrowLeft, Eye } from "lucide-react";
import { LogoMark } from "@/components/Logo";

export const metadata: Metadata = {
  title: "The Proof Standard — competitor.inc",
  description:
    "Don't trust us. Click it. Every action competitor.inc takes ships with a verifiable artifact — a live link, a shipped build, a real metric, or a receipt. No projections, no AI slop.",
};

// PUBLIC proof-standard page. The honest, citable commitment that separates us from "autonomous"
// builders that impress with projected fiction. The PRIVATE, receipted ledger lives at /house/proof
// (METRICS_SECRET-gated) and goes fully public at launch — this page is the standard it's held to.

const proofTypes = [
  { icon: Link2, color: "text-mint", ring: "bg-mint/12", label: "Live link", body: "A real, resolvable URL — a deployed site, a shipped page. Click it; it loads or it doesn't count." },
  { icon: Hammer, color: "text-violet", ring: "bg-violet/12", label: "Shipped build", body: "A passing build with a commit behind it. Real code in a real repo you own — not a screenshot." },
  { icon: BarChart3, color: "text-amber", ring: "bg-amber/12", label: "Verified metric", body: "A number with a source — a real demand-test result or analytics reading, never a guess dressed up as data." },
  { icon: Receipt, color: "text-coral", ring: "bg-coral/12", label: "Receipt", body: "A real transaction — a charge, a send, a delivery. The truest proof a business is alive." },
];

export default function ProofStandard() {
  return (
    <div className="min-h-screen">
      <header className="glass-nav sticky top-0 z-40 border-b border-border">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 font-mono text-lg font-bold tracking-tight">
            <LogoMark size={32} /> competitor.inc
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-text">
            <ArrowLeft size={15} /> Home
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="inline-flex items-center gap-2 rounded-full border border-mint/30 bg-mint/[0.06] px-3 py-1 text-xs font-medium text-mint">
          <ShieldCheck size={13} /> The Proof Standard
        </div>
        <h1 className="display mt-6 text-4xl leading-[1.05] sm:text-5xl">
          Don&apos;t trust us. <span className="text-coral">Click it.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
          Most &ldquo;AI that runs your company&rdquo; impresses with projections — five-year growth curves
          for a business that launched this morning. We hold ourselves to the opposite rule:
          <span className="text-text"> every action our crew takes ships with a verifiable artifact, or it does not count as done.</span>
        </p>

        <h2 className="mt-16 text-2xl font-bold">Four kinds of proof</h2>
        <p className="mt-2 text-muted">Each completed task is tagged with the form of evidence behind it.</p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {proofTypes.map((p) => (
            <div key={p.label} className="card h-full p-6">
              <span className={`grid h-11 w-11 place-items-center rounded-xl ${p.ring} ${p.color}`}>
                <p.icon size={19} />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{p.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{p.body}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-16 text-2xl font-bold">How we keep it honest</h2>
        <div className="mt-6 space-y-4">
          {[
            ["Re-verified, not remembered", "Every receipt is re-checked when the board loads — if a link no longer resolves, it's marked archived, not quietly left looking live."],
            ["Real actions only", "Nothing simulated ever reaches the proof ledger. A card appears only when an execution key is on and the crew takes a live action — a real repo, deploy, send, or charge."],
            ["Your numbers, with consent", "Customer receipts are shown only with the founder's consent, identities redacted. Your wins are yours; we don't parade them without a yes."],
            ["We'd rather show a zero", "If we can't prove it, we don't claim it. An honest zero beats an impressive fiction — that's the whole company."],
          ].map(([h, b]) => (
            <div key={h} className="flex items-start gap-3 rounded-2xl border border-border bg-bg/40 p-5">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-mint" />
              <div>
                <div className="font-semibold">{h}</div>
                <p className="mt-1 text-sm text-muted">{b}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-2xl border border-amber/30 bg-amber/[0.06] p-6">
          <h3 className="font-semibold">Where the numbers are today</h3>
          <p className="mt-2 text-sm text-muted">
            We&apos;re pre-launch and honest about it. competitor.inc&apos;s own receipts are accruing in a
            private ledger now and go fully public at launch; customer receipts populate as real actions
            happen. You will never see a number here we can&apos;t hand you the proof for.
          </p>
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/live" className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-medium text-text transition hover:bg-surface">
            <Eye size={15} /> See the live board
          </Link>
          <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-text px-5 py-3 text-sm font-semibold text-bg transition hover:opacity-90">
            Prove your idea free <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}
