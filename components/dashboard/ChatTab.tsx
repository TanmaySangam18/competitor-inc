"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { useEngine } from "@/lib/engine/useEngine";
import { useConfig, getByok } from "@/lib/engine/config";
import type { AgentRole, ApprovalKind, Company } from "@/lib/engine/types";
import { LogoMark } from "@/components/Logo";

interface ChatMsg { role: "you" | "agent"; text: string }

export function ChatTab({ company, r }: { company: Company; r: ReturnType<typeof useEngine> }) {
  const { config } = useConfig();
  const storeKey = `cofounder:chat:${company.id}`;
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storeKey);
      setMsgs(raw ? (JSON.parse(raw) as ChatMsg[]) : [{ role: "agent", text: `Hey! I'm running ${company.name} with you — what should we tackle?` }]);
    } catch {
      setMsgs([]);
    }
  }, [storeKey, company.name]);

  useEffect(() => {
    if (msgs.length) {
      try { window.localStorage.setItem(storeKey, JSON.stringify(msgs)); } catch { /* ignore */ }
    }
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, storeKey]);

  // Approve/reject from chat — the governance IS the one word. "approved" clears the pending inbox
  // items and logs each as governed (nothing is fabricated; a real send still needs the channel
  // connected). Deterministic, no model call. This is the "say approved and it goes" flow.
  function tryChatDecision(text: string): boolean {
    const pending = r.pendingApprovals;
    const approve = /^\s*(approve(d)?|yes[,!.\s]*(send|do|ship|go|please)?|send it|do it|ship it|go ahead|lgtm|👍)\b/i.test(text);
    const reject = /^\s*(reject(ed)?|no[,!.\s]*(don'?t|stop|hold)?|decline|hold( off)?|cancel|stop|👎)\b/i.test(text);
    if ((!approve && !reject) || pending.length === 0) return false;
    setMsgs((m) => [...m, { role: "you", text }]);
    const titles = pending.map((p) => p.title);
    pending.forEach((p) => r.resolveApproval(p.id, approve));
    if (approve) {
      setMsgs((m) => [...m, { role: "agent", text:
        `✅ Approved${titles.length > 1 ? ` (${titles.length})` : ""}: ${titles.join("; ")}. Cleared from your inbox and logged in Activity — you can undo any of it there. Each one executes for real the moment its channel is connected; until then it's governed, not sent. Nothing was fabricated.` }]);
    } else {
      setMsgs((m) => [...m, { role: "agent", text: `🚫 Rejected${titles.length > 1 ? ` (${titles.length})` : ""}: ${titles.join("; ")}. Nothing went out.` }]);
    }
    setInput("");
    return true;
  }

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    // A bare approve/reject with items waiting is handled locally — the human's word is the gate.
    if (tryChatDecision(text)) return;
    setInput("");
    setMsgs((m) => [...m, { role: "you", text }]);
    setSending(true);
    try {
      const res = await fetch("/api/engine", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "chat", company: { name: company.name, idea: company.idea }, message: text, soul: config.soul, byok: getByok() ?? undefined }),
      });
      // A consequential request? The engine flags it; queue a real approval so the inbox matches
      // what the co-founder promises.
      let queued: { agent: AgentRole; kind: ApprovalKind; title: string; detail: string; amount?: number } | null = null;
      const approvalHeader = res.headers.get("x-approval");
      if (approvalHeader) {
        try { queued = JSON.parse(decodeURIComponent(approvalHeader)); } catch { /* ignore */ }
      }
      if (!res.body) {
        const data = await res.json().catch(() => ({ reply: "…" }));
        setMsgs((m) => [...m, { role: "agent", text: data.reply ?? "…" }]);
      } else {
        // stream the reply token-by-token
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        setMsgs((m) => [...m, { role: "agent", text: "" }]);
        let acc = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setMsgs((m) => {
            const copy = m.slice();
            copy[copy.length - 1] = { role: "agent", text: acc };
            return copy;
          });
        }
      }
      if (queued) {
        r.addApproval(queued);
        setMsgs((m) => [...m, { role: "agent", text: "🔔 Queued for your approval. Just reply \"approved\" here and I'll clear it — or open the Operations tab. Nothing happens until you say yes." }]);
      }
    } catch {
      setMsgs((m) => [...m, { role: "agent", text: "I couldn't reach the engine just now — try again?" }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col rounded-2xl border border-border bg-surface">
      <div className="h-[420px] space-y-3 overflow-y-auto p-5">
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "you" ? "flex justify-end" : "flex items-start gap-2.5"}>
            {m.role === "agent" && (
              <LogoMark size={28} className="mt-0.5 shrink-0" />
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.role === "you" ? "rounded-tr-sm bg-surface-2" : "rounded-tl-sm border border-border bg-bg/50 text-muted"}`}>
              {m.text}
            </div>
          </div>
        ))}
        {sending && msgs[msgs.length - 1]?.role === "you" && (
          <div className="flex items-center gap-2 text-xs text-muted-2"><Loader2 size={12} className="animate-spin" /> Thinking…</div>
        )}
        <div ref={endRef} />
      </div>
      <div className="flex items-center gap-2 border-t border-border p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Message your co-founder…"
          className="w-full rounded-xl bg-bg/50 px-4 py-2.5 text-sm outline-none placeholder:text-muted-2"
          aria-label="Message your co-founder"
        />
        <button onClick={send} disabled={!input.trim() || sending} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-coral text-bg transition hover:brightness-110 disabled:opacity-40">
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
