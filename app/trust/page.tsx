import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

// /trust (ADR-0025, the 98-plan trust surface) — the procurement page. Universities run vendor review
// on HECVAT (EDUCAUSE, ~321 questions, now with an AI module); enterprises run security questionnaires.
// This page pre-answers the load-bearing ones with what is ACTUALLY true in the codebase, states
// plainly what does not exist yet (SOC 2), and publishes the metrics constitution. Static truth only:
// nothing here is env-dependent, so nothing here can silently claim more than the repo holds.

export const metadata: Metadata = {
  title: "competitor.inc: trust center",
  description:
    "Security posture, AI governance, data practices, and the metrics constitution. Written for procurement and security review, HECVAT-aligned.",
};

const SECTIONS: { kicker: string; title: string; rows: { q: string; a: string }[] }[] = [
  {
    kicker: "AI governance · the HECVAT AI-module questions",
    title: "How the AI is governed",
    rows: [
      { q: "Is there human oversight of autonomous actions?", a: "Structurally. Every agent action passes a kill switch, a deterministic policy floor (tiers T0 to T3), and an append-only audit ledger before any network I/O. Money out, contracts, deletion, and going public are forbidden to agents entirely; they queue for the accountable human." },
      { q: "What can the AI never do?", a: "Six hard-stops are never automated for anyone: creating accounts, accepting terms, entering passwords, solving CAPTCHAs, granting OAuth consent, and payment or banking entry. Withdrawals and transfers of funds are refused by construction, not by policy memo." },
      { q: "Is customer data used to train models?", a: "No. Models are bring-your-own-key (the customer's own provider account); we do not train models, and tenant data is not used to train anything." },
      { q: "How are AI outputs kept honest?", a: "Two gates. The honesty gate blocks unverified numbers, unlabeled simulations, and receipt-less claims. The judgment gate screens all public prose for hostility, tragedy adjacency, political, medical, or legal territory; a flag routes to a human. Published metrics are HMAC-signed receipts anyone can check at /verify." },
      { q: "Is AI authorship disclosed?", a: "Always. Every outbound artifact carries a named-AI disclosure. It is a hard rail in the publishing mandate, not a style preference." },
    ],
  },
  {
    kicker: "Data protection",
    title: "Where data lives and who can touch it",
    rows: [
      { q: "Tenant isolation?", a: "Row-level security on every user-facing table, keyed to the authenticated user. A row that is not yours does not exist for you; ownership checks ride the database, not application if-statements." },
      { q: "Credentials and secrets?", a: "Customer tokens are stored encrypted at rest with a deployment secret. Revocation is one call, and the UI says plainly that provider-side deauthorization happens on the provider's page. The service-role key exists in exactly one server module and is unreachable from client code." },
      { q: "Custody?", a: "Bring-your-own-key everywhere: the customer's accounts, code, data, and revenue stay theirs. We never pool funds and never move money out. A customer can fire us by revoking keys." },
      { q: "Server-side fetch safety?", a: "Any user-supplied URL passes one shared SSRF guard (https required; private, loopback, and link-local address space rejected) with bounded timeouts. Public-page scanning honors robots.txt with a disclosed user-agent." },
    ],
  },
  {
    kicker: "Security operations",
    title: "Controls that exist today",
    rows: [
      { q: "Change control?", a: "One QA gate is the definition of done, locally and in CI on every push: strict type-check, the full test suite (1,250 tests at the time of writing), a production build, and a smoke suite including a fuzz pass (garbage payloads, zero 5xx tolerated)." },
      { q: "Abuse handling?", a: "Per-IP rate limits on action routes, per-customer freeze, an abuse intake screen, and a kill switch that halts the whole org or a single agent, checked before policy on every action." },
      { q: "Supply chain?", a: "A license allowlist enforced in CI (permissive licenses only in shipped code), third-party notices published at /notices, and a documented no-copyleft posture." },
      { q: "Decision records?", a: "Twenty-five architecture decision records, including the decisions to refuse capabilities: visitor de-anonymization, autonomous funds-out, undisclosed crawling." },
    ],
  },
  {
    kicker: "Honest gaps · what does not exist yet",
    title: "Certifications and roadmap, plainly",
    rows: [
      { q: "SOC 2?", a: "Not yet. The plan of record: SOC 2 Type I before the first institutional contract negotiation, Type II during the first pilot year. This page will say so the day it changes and not before." },
      { q: "HECVAT?", a: "A completed HECVAT (including the AI module) is available on request for university procurement; the sections above are its spine. Ask and it ships." },
      { q: "Penetration test?", a: "Not yet commissioned; scheduled with first institutional funding. The internal drills that do exist: provider failover, per-customer freeze, and full key rotation." },
      { q: "Entity and insurance?", a: "In formation; procurement paperwork (entity, insurance, signed terms) is line one of the current funding plan. We will not sign an institutional contract before it exists." },
    ],
  },
  {
    kicker: "The metrics constitution",
    title: "Rules we publish so you can hold us to them",
    rows: [
      { q: "Revenue claims", a: "ARR means settled, collected revenue only. Trial contracts, break-clause pilots, and bookings are never presented as recurring revenue. Today's number: zero, stated in our own fundraising documents." },
      { q: "Customer claims", a: "No logo appears in our materials without a signed, active, paying relationship and written permission. Trial users are never presented as customers." },
      { q: "Capability claims", a: "Capabilities proven only in simulation are labeled 'simulation' wherever they appear. The public benchmark page carries the label in the headline." },
      { q: "Receipts", a: "Published metrics are minted as HMAC-signed receipts. Anyone can verify one at /verify without an account. A number without a receipt should be treated as our error and reported." },
    ],
  },
];

export default function TrustPage() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-2">for procurement and security review</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Trust center</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
          Written for the people whose job is to say no: university procurement (HECVAT), security teams,
          and diligence. Everything on this page is true in the codebase today, the gaps are stated as
          gaps, and the fastest way to check any of it is a guided read of the repository, offered to any
          reviewer, any week.
        </p>

        {SECTIONS.map((s) => (
          <section key={s.title} className="mt-12">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-2">{s.kicker}</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight">{s.title}</h2>
            <dl className="mt-4">
              {s.rows.map((r) => (
                <div key={r.q} className="border-t border-border py-4">
                  <dt className="text-[14px] font-semibold">{r.q}</dt>
                  <dd className="mt-1.5 text-[13px] leading-relaxed text-muted">{r.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}

        <p className="mt-12 font-mono text-[10px] uppercase leading-relaxed tracking-[0.15em] text-muted-2">
          Verify a receipt: /verify · third-party notices: /notices · the public benchmark: /benchmark ·
          security contact: sangam.d@northeastern.edu
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
