"use client";

import { useEffect, useState } from "react";
import { Check, X, Sparkles, Pencil, Trash2 } from "lucide-react";

// 1.1 "It knows me" — the trust-wow at sign-in (Playbook: Product Direction Review §4). Shows what's
// PUBLICLY available about the signed-in user (from /api/enrich, self-only) and lets them CONFIRM,
// CORRECT, or DELETE it. Consent-first by design: "we'll only use what you confirm." Renders nothing if
// we found nothing (graceful), once dismissed, or once the user has suppressed enrichment entirely.
// No third-party data — only the user's own. Enrichment is computed live and never stored by us.

interface Enrich {
  found: boolean;
  name?: string;
  avatar?: string;
  bio?: string;
  company?: string;
  location?: string;
  links: { label: string; url: string }[];
  sources: string[];
}

const DISMISS_KEY = "cofounder:enrich:dismissed:v1";
const CONFIRMED_KEY = "cofounder:enrich:confirmed:v1"; // the user-confirmed/corrected copy we may use
const SUPPRESS_KEY = "cofounder:enrich:suppressed:v1"; // permanent "don't enrich me again"

type Editable = { name: string; company: string; location: string; bio: string };

export function SelfEnrichPanel() {
  const [data, setData] = useState<Enrich | null>(null);
  const [dismissed, setDismissed] = useState(true); // default hidden until we know there's something
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Editable>({ name: "", company: "", location: "", bio: "" });
  const [savedNote, setSavedNote] = useState("");

  useEffect(() => {
    try {
      // Respect a prior soft-dismiss OR a permanent suppression — and don't even fetch if suppressed.
      if (localStorage.getItem(SUPPRESS_KEY) || localStorage.getItem(DISMISS_KEY)) return;
    } catch {
      /* ignore */
    }
    setDismissed(false);
    fetch("/api/enrich")
      .then((r) => r.json())
      .then((d: Enrich) => {
        setData(d);
        setDraft({ name: d.name ?? "", company: d.company ?? "", location: d.location ?? "", bio: d.bio ?? "" });
      })
      .catch(() => setData(null));
  }, []);

  function close() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }

  // Confirm (optionally after editing) — persist the user-confirmed copy locally, then collapse.
  function confirm() {
    try {
      localStorage.setItem(CONFIRMED_KEY, JSON.stringify(draft));
    } catch {
      /* ignore */
    }
    close();
  }

  // Real delete (right-to-delete): purge anything server-side (fail-soft), clear the local confirmed
  // copy, and set a permanent suppression so we never fetch/show enrichment again.
  async function remove() {
    try {
      localStorage.removeItem(CONFIRMED_KEY);
      localStorage.setItem(SUPPRESS_KEY, "1");
    } catch {
      /* ignore */
    }
    try {
      await fetch("/api/enrich", { method: "DELETE" });
    } catch {
      /* ignore — local suppression already applied */
    }
    setSavedNote("Removed — we won't show or use your public info again, and we don't store it.");
    setTimeout(() => setDismissed(true), 1400);
  }

  if (dismissed || !data?.found) return null;

  const field = (k: keyof Editable, label: string, multi = false) =>
    multi ? (
      <textarea
        value={draft[k]}
        onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))}
        rows={2}
        aria-label={label}
        className="w-full rounded-lg border border-border bg-surface px-2 py-1 text-sm text-text outline-none focus:border-violet/40"
      />
    ) : (
      <input
        value={draft[k]}
        onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))}
        aria-label={label}
        className="w-full rounded-lg border border-border bg-surface px-2 py-1 text-sm text-text outline-none focus:border-violet/40"
      />
    );

  return (
    <div className="mx-auto max-w-6xl px-6 pt-4">
      <div className="ring-soft rounded-2xl border border-violet/25 bg-violet/[0.05] p-4">
        <div className="flex items-start gap-3">
          {data.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.avatar} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
          ) : (
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-violet/12 text-violet">
              <Sparkles size={18} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-violet">
              <Sparkles size={12} /> Welcome{data.name ? `, ${data.name.split(" ")[0]}` : ""}
            </div>
            <p className="mt-1 text-sm text-text">
              Here&apos;s what&apos;s <span className="font-medium">publicly</span> available about you — we&apos;ll only use what you confirm.
            </p>

            {editing ? (
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <label className="text-xs text-muted-2">Name {field("name", "Name")}</label>
                <label className="text-xs text-muted-2">Company {field("company", "Company")}</label>
                <label className="text-xs text-muted-2">Location {field("location", "Location")}</label>
                <label className="text-xs text-muted-2 sm:col-span-2">Bio {field("bio", "Bio", true)}</label>
              </div>
            ) : (
              <div className="mt-2 space-y-0.5 text-sm text-muted">
                {draft.name && <div><span className="text-muted-2">Name:</span> {draft.name}</div>}
                {draft.company && <div><span className="text-muted-2">Company:</span> {draft.company}</div>}
                {draft.location && <div><span className="text-muted-2">Location:</span> {draft.location}</div>}
                {draft.bio && <div className="line-clamp-2"><span className="text-muted-2">Bio:</span> {draft.bio}</div>}
                {data.links.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {data.links.slice(0, 5).map((l) => (
                      <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="rounded-md border border-border px-2 py-0.5 text-xs text-muted transition hover:text-text">
                        {l.label} ↗
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {savedNote ? (
              <p className="mt-3 text-xs text-mint">{savedNote}</p>
            ) : (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button onClick={confirm} className="inline-flex items-center gap-1.5 rounded-lg bg-text px-3 py-1.5 text-xs font-semibold text-bg transition hover:opacity-90">
                  <Check size={13} /> {editing ? "Save what's right" : "Looks right"}
                </button>
                {!editing && (
                  <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition hover:text-text">
                    <Pencil size={13} /> Correct it
                  </button>
                )}
                <button onClick={remove} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition hover:text-coral">
                  <Trash2 size={13} /> Delete &amp; don&apos;t use
                </button>
                <button onClick={close} aria-label="Dismiss" className="inline-flex items-center rounded-lg border border-border px-2 py-1.5 text-muted-2 transition hover:text-text">
                  <X size={13} />
                </button>
                <span className="ml-auto text-[11px] text-muted-2">via {data.sources.join(", ")}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
