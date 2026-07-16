"use client";

import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";

// Inline rename for the company title — the auto-derived name is a starting point; the founder owns it.
// (Moved from the dashboard page when the Stream replaced the Operating cockpit; monochrome chrome.)
export function RenameTitle({ name, onRename }: { name: string; onRename: (n: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const commit = () => { const n = draft.trim(); if (n && n !== name) onRename(n); setEditing(false); };
  if (editing) {
    return (
      <span className="flex items-center gap-1.5">
        <input
          autoFocus
          value={draft}
          maxLength={60}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
          aria-label="Company name"
          className="w-56 border border-border bg-bg px-2 py-1 text-xl font-bold outline-none focus:border-text"
        />
        <button onClick={commit} aria-label="Save name" className="grid h-7 w-7 place-items-center border border-text bg-text text-bg transition hover:bg-bg hover:text-text"><Check size={14} /></button>
        <button onClick={() => setEditing(false)} aria-label="Cancel rename" className="grid h-7 w-7 place-items-center border border-border text-muted transition hover:border-text hover:text-text"><X size={14} /></button>
      </span>
    );
  }
  return (
    <button onClick={() => { setDraft(name); setEditing(true); }} title="Rename company" className="group flex min-w-0 items-center gap-2 text-left">
      <h1 className="truncate text-xl font-bold leading-tight sm:text-2xl">{name}</h1>
      <Pencil size={13} className="shrink-0 opacity-0 transition group-hover:opacity-60" />
    </button>
  );
}
