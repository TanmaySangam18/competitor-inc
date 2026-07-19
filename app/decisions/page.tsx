"use client";

// THE EXECUTIVE INBOX (Day One) — the principal's entire day on one page: the org's PREPARED decisions,
// each with three verbs. Approve marks executable (the mandate+policy double gate still stands before
// anything fires); Reject closes it with the reason; Modify sends it back to the desk with a note.
// Signed-out shows an honest empty state (RLS scopes rows — nothing can leak). This page is the surface
// the coworker (desktop) embeds; it lives here because the authenticated session lives here.

import { useCallback, useEffect, useRef, useState } from "react";
import { LedgerShell, Eyebrow, serifStyle } from "@/components/ledger/LedgerShell";

interface Decision {
  id: string;
  kind: string;
  title: string;
  summary: string;
  artifact: string;
  preparedBy: string;
  revision: number;
  createdAt: number;
}

const ROLE_NAMES: Record<string, string> = {
  "legal-compliance-analyst": "Naomi · General Counsel",
  "finance-controller": "Chief Financial Officer",
  "chief-of-staff": "Chief of Staff",
};

export default function DecisionsPage() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [busy, setBusy] = useState<string | null>(null); // decision id being acted on
  const [note, setNote] = useState<Record<string, string>>({});
  const [openArtifact, setOpenArtifact] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const alive = useRef(true);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/decisions");
      const j = (await r.json()) as { ok: boolean; signedIn?: boolean; decisions?: Decision[] };
      if (!alive.current) return;
      setSignedIn(!!j.signedIn);
      setDecisions(Array.isArray(j.decisions) ? j.decisions : []);
    } catch {
      if (alive.current) setError("Could not reach the queue.");
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    void load();
    const t = setInterval(load, 30_000); // the org keeps preparing while the page is open
    return () => { alive.current = false; clearInterval(t); };
  }, [load]);

  async function verdict(id: string, verb: "approve" | "reject" | "modify") {
    setBusy(id);
    setError(null);
    try {
      const body: Record<string, string> = { id, verb };
      if (verb === "modify") body.note = (note[id] ?? "").trim();
      const r = await fetch("/api/decisions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const j = (await r.json()) as { ok: boolean; outcome?: string };
      if (!j.ok) setError(j.outcome ?? "The verdict was not recorded.");
      await load();
    } catch {
      setError("The verdict did not reach the queue.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <LedgerShell>
      <main className="mx-auto w-full max-w-3xl px-6 py-14">
        <Eyebrow>The Executive Inbox</Eyebrow>
        <h1 className="mt-2 text-3xl" style={serifStyle}>
          Decisions awaiting you
        </h1>
        <p className="mt-3 text-sm leading-6 opacity-80">
          The organization runs around the clock. What reaches you is only what is legally yours to decide —
          each item prepared, drafted, and briefed. Approve, reject, or send it back with a note.
        </p>

        {error && <p className="mt-6 rounded border border-border bg-surface-2 px-4 py-3 text-sm text-text">{error}</p>}

        {signedIn === false && (
          <div className="mt-10 rounded border border-border bg-surface px-6 py-8 text-sm opacity-80">
            Sign in to see your queue. Decisions are scoped to their principal — no one else can read or act on yours.
          </div>
        )}

        {signedIn && decisions.length === 0 && (
          <div className="mt-10 rounded border border-border bg-surface px-6 py-8 text-sm opacity-80">
            Nothing awaits you. The organization is working; you will see the next prepared decision here.
          </div>
        )}

        <ul className="mt-8 space-y-6">
          {decisions.map((d) => (
            <li key={d.id} className="rounded border border-border bg-surface p-5">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-[11px] uppercase tracking-widest opacity-60">{d.kind}{d.revision > 0 ? ` · revision ${d.revision}` : ""}</span>
                <span className="text-[11px] opacity-50">{new Date(d.createdAt).toLocaleString()}</span>
              </div>
              <h2 className="mt-2 text-lg" style={serifStyle}>{d.title}</h2>
              <p className="mt-2 text-sm leading-6 opacity-85">{d.summary}</p>
              <p className="mt-2 text-xs opacity-60">Prepared by {ROLE_NAMES[d.preparedBy] ?? d.preparedBy}</p>

              <button
                className="mt-3 text-xs underline underline-offset-2 opacity-70 hover:opacity-100"
                onClick={() => setOpenArtifact(openArtifact === d.id ? null : d.id)}
              >
                {openArtifact === d.id ? "Hide the full draft" : "Read the full draft"}
              </button>
              {openArtifact === d.id && (
                <pre className="mt-3 overflow-x-auto rounded bg-surface-2 p-4 font-mono text-xs leading-5">{d.artifact}</pre>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  disabled={busy === d.id}
                  onClick={() => verdict(d.id, "approve")}
                  className="rounded bg-text px-4 py-1.5 text-sm text-bg hover:opacity-90 disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  disabled={busy === d.id}
                  onClick={() => verdict(d.id, "reject")}
                  className="rounded border border-text px-4 py-1.5 text-sm text-text hover:bg-surface-2 disabled:opacity-50"
                >
                  Reject
                </button>
                <input
                  value={note[d.id] ?? ""}
                  onChange={(e) => setNote({ ...note, [d.id]: e.target.value })}
                  placeholder="What should change?"
                  className="min-w-0 flex-1 rounded border border-border bg-surface-2 px-3 py-1.5 text-sm"
                />
                <button
                  disabled={busy === d.id || !(note[d.id] ?? "").trim()}
                  onClick={() => verdict(d.id, "modify")}
                  className="rounded border border-text px-4 py-1.5 text-sm hover:bg-surface-2 disabled:opacity-40"
                >
                  Send back
                </button>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-10 text-xs leading-5 opacity-60">
          Approval marks a decision executable — it does not execute it. Every act still passes your signed
          mandate and the platform policy engine before anything fires, and every touch is in the audit history.
        </p>
      </main>
    </LedgerShell>
  );
}
