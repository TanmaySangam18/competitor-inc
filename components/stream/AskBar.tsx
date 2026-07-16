"use client";

// "Ask the team anything — or just watch it run." A REAL input — wired to the same engine chat path
// the old team room used (kind:"chat" + org-soul): you address a real staged leader, the reply is
// generated in-character and clearly tagged AI, and anything consequential queues a REAL approval
// (x-approval header → the same pinned decision block as everything else). Optional by design: the
// company already ran; this exists for the rare question. No dead controls — this input only renders
// because it has a live path.

import { useEffect, useMemo, useRef, useState } from "react";
import { getByok } from "@/lib/engine/config";
import type { AgentRole, ApprovalKind, Company } from "@/lib/engine/types";
import { activeRoles, stageForSignals } from "@/lib/org/org-stages";
import { orgSoul } from "@/lib/org/org-soul";
import { displayName, personaFor } from "@/lib/org/personas";
import type { OrgRole } from "@/lib/org/organization";

export interface QueuedApproval {
  agent: AgentRole;
  kind: ApprovalKind;
  title: string;
  detail: string;
  amount?: number;
}

interface AskTurn {
  who: "you" | "team";
  name?: string;
  text: string;
  note?: boolean; // system-ish aside (queued-for-approval / error), rendered quieter
}

const CAP = 24; // keep the stored side-thread small — the ledger is the real record

export function AskBar({ company, onApproval }: { company: Company; onApproval: (q: QueuedApproval) => void }) {
  const storeKey = `competitor:stream:ask:${company.id}`;
  // The STAGE comes from real signals only (same honest bit the team room used): product.url is set
  // exclusively by the verified-live path, so the org stays honestly small until the product is real.
  const stage = stageForSignals({ hasVerifiedLiveBuild: company.product?.status === "live" && !!company.product?.url });
  const leaders = useMemo(
    () => activeRoles(stage).filter((x) => x.level === "exec" || x.level === "director" || x.level === "lead"),
    [stage],
  );
  const [roleId, setRoleId] = useState(leaders[0]?.id ?? "chief-of-staff");
  const role: OrgRole | undefined = leaders.find((x) => x.id === roleId) ?? leaders[0];
  const [turns, setTurns] = useState<AskTurn[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storeKey);
      if (raw) setTurns(JSON.parse(raw) as AskTurn[]);
    } catch { /* ignore */ }
  }, [storeKey]);
  useEffect(() => {
    if (turns.length) {
      try { window.localStorage.setItem(storeKey, JSON.stringify(turns.slice(-CAP))); } catch { /* ignore */ }
    }
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [turns, storeKey]);

  async function send() {
    const text = input.trim();
    if (!text || sending || !role) return;
    setInput("");
    setTurns((m) => [...m, { who: "you" as const, text }].slice(-CAP));
    setSending(true);
    try {
      const res = await fetch("/api/engine", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: "chat",
          company: { name: company.name, idea: company.idea },
          message: text,
          soul: orgSoul(role, { name: company.name, idea: company.idea }),
          agent: role.execFn as AgentRole, // model routing follows the role's execution function
          byok: getByok() ?? undefined,
        }),
      });
      let queued: QueuedApproval | null = null;
      const h = res.headers.get("x-approval");
      if (h) {
        try { queued = JSON.parse(decodeURIComponent(h)) as QueuedApproval; } catch { /* ignore */ }
      }
      if (!res.body) {
        const data = (await res.json().catch(() => ({ reply: "…" }))) as { reply?: string };
        setTurns((m) => [...m, { who: "team" as const, name: displayName(role), text: data.reply ?? "…" }].slice(-CAP));
      } else {
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        setTurns((m) => [...m, { who: "team" as const, name: displayName(role), text: "" }].slice(-CAP));
        let acc = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += dec.decode(value, { stream: true });
          setTurns((m) => {
            const cpy = m.slice();
            cpy[cpy.length - 1] = { ...cpy[cpy.length - 1], text: acc };
            return cpy;
          });
        }
      }
      if (queued) {
        onApproval(queued);
        setTurns((m) =>
          [...m, { who: "team" as const, name: displayName(role), text: "Queued for your approval — it's pinned at the top of the Stream. Nothing consequential ships without your yes.", note: true }].slice(-CAP),
        );
      }
    } catch {
      setTurns((m) => [...m, { who: "team" as const, name: role ? displayName(role) : undefined, text: "I couldn't reach the engine just now — try again?", note: true }].slice(-CAP));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="border-t-[1.5px] border-text pt-3">
      {turns.length > 0 && (
        <div className="mb-3 space-y-2.5">
          {turns.map((t, i) =>
            t.who === "you" ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[80%] border border-border bg-surface-2 px-3 py-1.5 text-sm text-text">{t.text}</div>
              </div>
            ) : (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 border border-border px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-muted">AI</span>
                <div className="min-w-0">
                  {t.name && <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-text">{t.name}</div>}
                  <div className={`text-sm leading-relaxed ${t.note ? "text-muted-2" : "text-muted"}`}>{t.text}</div>
                </div>
              </div>
            ),
          )}
          {sending && turns[turns.length - 1]?.who === "you" && (
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-2">{role ? personaFor(role).name : "The team"} is thinking…</div>
          )}
          <div ref={endRef} />
        </div>
      )}
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-2">Ask the team anything — or just watch it run</div>
      <div className="mt-2 flex items-stretch gap-2">
        <select
          value={role?.id}
          onChange={(e) => setRoleId(e.target.value)}
          aria-label="Choose who to ask"
          className="max-w-[11rem] shrink-0 border border-border bg-bg px-2 py-2 font-mono text-[10px] uppercase tracking-[0.08em] text-muted outline-none focus:border-text"
        >
          {leaders.map((l) => (
            <option key={l.id} value={l.id}>{displayName(l)}</option>
          ))}
        </select>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={role ? `Message ${personaFor(role).name} — your ${role.title}` : "Message the team"}
          aria-label="Ask the team"
          className="min-w-0 flex-1 border border-border bg-bg px-3 py-2 text-sm text-text outline-none placeholder:text-muted-2 focus:border-text"
        />
        <button
          onClick={send}
          disabled={!input.trim() || sending}
          className="shrink-0 border border-text bg-text px-4 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-bg transition hover:bg-bg hover:text-text disabled:opacity-40"
        >
          {sending ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}
