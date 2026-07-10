import Link from "next/link";
import type { Metadata } from "next";
import { ShieldCheck, Link2, Hammer, BarChart3, Receipt, Eye } from "lucide-react";
import { LedgerShell, Eyebrow, serifStyle } from "@/components/ledger/LedgerShell";

export const metadata: Metadata = {
  title: "The Proof Standard — competitor.inc",
  description:
    "Don't trust us. Click it. Every action competitor.inc takes ships with a verifiable artifact — a live link, a shipped build, a real metric, or a receipt. No projections, no AI slop.",
};

// PUBLIC proof-standard page. The honest, citable commitment that separates us from "autonomous"
// builders that impress with projected fiction. The PRIVATE, receipted ledger lives at /house/proof
// (METRICS_SECRET-gated) and goes fully public at launch — this page is the standard it's held to.

const proofTypes = [
  { icon: Link2, label: "Live link", body: "A real, resolvable URL — a deployed site, a shipped page. Click it; it loads or it doesn't count." },
  { icon: Hammer, label: "Shipped build", body: "A passing build with a commit behind it. Real code in a real repo you own — not a screenshot." },
  { icon: BarChart3, label: "Verified metric", body: "A number with a source — a real demand-test result or analytics reading, never a guess dressed up as data." },
  { icon: Receipt, label: "Receipt", body: "A real transaction — a charge, a send, a delivery. The truest proof a business is alive." },
];

export default function ProofStandard() {
  return (
    <LedgerShell>
      <div className="mx-auto max-w-2xl px-5 py-14">
        <Eyebrow>THE PROOF STANDARD</Eyebrow>
        <h1 className="mt-4 text-[38px] font-medium leading-[1.1] sm:text-[44px]" style={serifStyle}>
          Don&apos;t trust us. <em>Click it.</em>
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-muted">
          Most &ldquo;AI that runs your company&rdquo; impresses with projections — five-year growth curves
          for a business that launched this morning. We hold ourselves to the opposite rule:
          <span className="text-ink"> every action our crew takes ships with a verifiable artifact, or it does not count as done.</span>
        </p>

        <h2 className="mt-14 text-2xl font-medium" style={serifStyle}>Four kinds of proof</h2>
        <p className="mt-2 text-sm text-ink-muted">Each completed task is tagged with the form of evidence behind it.</p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {proofTypes.map((p) => (
            <div key={p.label} className="press h-full rounded-2xl bg-cream-2 p-5">
              <span className="grid h-9 w-9 place-items-center rounded-xl border border-rule bg-cream text-sienna">
                <p.icon size={16} />
              </span>
              <h3 className="mt-3 text-base font-semibold">{p.label}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">{p.body}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-14 text-2xl font-medium" style={serifStyle}>How we keep it honest</h2>
        <div className="mt-6 space-y-4">
          {[
            ["Re-verified, not remembered", "Every receipt is re-checked when the board loads — if a link no longer resolves, it's marked archived, not quietly left looking live."],
            ["Real actions only", "Nothing simulated ever reaches the proof ledger. A card appears only when an execution key is on and the crew takes a live action — a real repo, deploy, send, or charge."],
            ["Your numbers, with consent", "Customer receipts are shown only with the founder's consent, identities redacted. Your wins are yours; we don't parade them without a yes."],
            ["We'd rather show a zero", "If we can't prove it, we don't claim it. An honest zero beats an impressive fiction — that's the whole company."],
          ].map(([h, b]) => (
            <div key={h} className="flex items-start gap-3 border-t border-rule px-1 py-4">
              <ShieldCheck size={16} className="mt-0.5 shrink-0 text-pine" />
              <div>
                <div className="text-sm font-semibold">{h}</div>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{b}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="press mt-12 rounded-2xl bg-cream-2 p-6">
          <h3 className="font-semibold">Where the numbers are today</h3>
          <p className="mt-2 text-sm text-ink-muted">
            We&apos;re pre-launch and honest about it. competitor.inc&apos;s own receipts are accruing in a
            private ledger now and go fully public at launch; customer receipts populate as real actions
            happen. You will never see a number here we can&apos;t hand you the proof for.
          </p>
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/live" className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-ink px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-cream-2">
            <Eye size={15} /> See the live board
          </Link>
          <Link href="/dashboard" className="inline-flex items-center rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-cream transition hover:opacity-90">
            Prove your idea free
          </Link>
        </div>
      </div>
    </LedgerShell>
  );
}
