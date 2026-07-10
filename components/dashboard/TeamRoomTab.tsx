"use client";

// THE TEAM ROOM (Phase 7, Living Org C.2) — talk to your company like a founder talks to their leads.
// Pick a leader from the STAGED org (org-stages: the company only shows departments it has earned),
// give a directive; the reply is generated in-character from the role's REAL job description (org-soul),
// clearly tagged AI. Consequential asks queue a REAL approval (x-approval header → the same inbox as
// everywhere else). Below the thread, "the floor" streams the org-run's REAL activities — actual work
// rolling up with proofs, never narration. Honesty rails live in the soul itself.

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Send, TrendingUp } from "lucide-react";
import { useEngine } from "@/lib/engine/useEngine";
import { getByok } from "@/lib/engine/config";
import type { AgentRole, ApprovalKind, Company } from "@/lib/engine/types";
import { activeDepartments, activeRoles, stageForSignals, STAGE_STORY } from "@/lib/org/org-stages";
import { orgSoul, relayLine } from "@/lib/org/org-soul";
import type { OrgRole } from "@/lib/org/organization";

interface RoomMsg { who: "you" | "role"; roleId?: string; title?: string; text: string; chip?: string }

const initials = (title: string) =>
  title.split(/\s+/).filter((w) => /^[A-Za-z]/.test(w)).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");

export function TeamRoomTab({ company, r }: { company: Company; r: ReturnType<typeof useEngine> }) {
  const storeKey = `cofounder:teamroom:${company.id}`;

  // The STAGE comes from real signals only. product.url is set exclusively by the verified-live path,
  // so it's an honest "the product exists" bit. Signups/revenue wire in when per-company demand data
  // reaches the client store — until then the org stays honestly small rather than optimistically big.
  const stage = stageForSignals({ hasVerifiedLiveBuild: company.product?.status === "live" && !!company.product?.url });
  const story = STAGE_STORY[stage];
  const depts = activeDepartments(stage);

  // The customer talks to LEADERSHIP; leads relay down (the soul explains who they'd assign to).
  const leaders = useMemo(
    () => activeRoles(stage).filter((x) => x.level === "exec" || x.level === "director" || x.level === "lead"),
    [stage],
  );
  const [roleId, setRoleId] = useState(leaders[0]?.id ?? "chief-executive-officer");
  const role: OrgRole | undefined = leaders.find((x) => x.id === roleId) ?? leaders[0];

  const [msgs, setMsgs] = useState<RoomMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storeKey);
      if (raw) setMsgs(JSON.parse(raw) as RoomMsg[]);
    } catch { /* ignore */ }
  }, [storeKey]);
  useEffect(() => {
    if (msgs.length) { try { window.localStorage.setItem(storeKey, JSON.stringify(msgs)); } catch { /* ignore */ } }
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, storeKey]);

  // The floor — the org run's REAL activities (recorded server-side with role attribution), newest last.
  const floor = useMemo(
    () => r.activities.filter((a) => (a.meta ?? "").includes("org run")).slice(-6),
    [r.activities],
  );

  async function send() {
    const text = input.trim();
    if (!text || sending || !role) return;
    setInput("");
    setMsgs((m) => [...m, { who: "you", text }]);
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
      let queued: { agent: AgentRole; kind: ApprovalKind; title: string; detail: string; amount?: number } | null = null;
      const h = res.headers.get("x-approval");
      if (h) { try { queued = JSON.parse(decodeURIComponent(h)); } catch { /* ignore */ } }
      if (!res.body) {
        const data = await res.json().catch(() => ({ reply: "…" }));
        setMsgs((m) => [...m, { who: "role", roleId: role.id, title: role.title, text: data.reply ?? "…" }]);
      } else {
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        setMsgs((m) => [...m, { who: "role", roleId: role.id, title: role.title, text: "" }]);
        let acc = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += dec.decode(value, { stream: true });
          setMsgs((m) => { const c = m.slice(); c[c.length - 1] = { ...c[c.length - 1], text: acc }; return c; });
        }
      }
      if (queued) {
        r.addApproval(queued);
        setMsgs((m) => [...m, { who: "role", roleId: role.id, title: role.title, text: "Queued for your approval — nothing consequential ships without your yes.", chip: "needs you" }]);
      }
    } catch {
      setMsgs((m) => [...m, { who: "role", roleId: role?.id, title: role?.title, text: "I couldn't reach the engine just now — try again?" }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-3">
      {/* Stage banner — the company you've EARNED so far (org-stages; grows on real signals only) */}
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-surface-2 text-text"><TrendingUp size={15} /></span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{story.label} company</span>
            <span className="text-[11px] text-muted-2">{depts.length} of 11 departments active · unlocked by: {story.unlockedBy.toLowerCase()}</span>
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">{story.story}</p>
        </div>
      </div>

      {/* The room */}
      <div className="flex flex-col rounded-2xl border border-border bg-surface">
        <div className="flex items-center gap-2 border-b border-border p-3">
          <select
            value={role?.id}
            onChange={(e) => setRoleId(e.target.value)}
            aria-label="Choose who to talk to"
            className="max-w-[15rem] shrink-0 rounded-lg border border-border bg-bg/50 px-2.5 py-2 text-xs font-medium outline-none"
          >
            {leaders.map((l) => (
              <option key={l.id} value={l.id}>{l.title}</option>
            ))}
          </select>
          <span className="truncate text-[11px] text-muted-2">{role ? relayLine(role) ?? "does the work directly" : ""}</span>
        </div>

        <div className="h-[300px] space-y-3 overflow-y-auto p-4">
          {msgs.length === 0 && role && (
            <p className="text-xs leading-relaxed text-muted-2">
              This is your team room. You&apos;re talking to the {role.title} — give a direction, ask for status, push back.
              Leads relay work down their team and report back up; anything consequential lands on your desk first.
            </p>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={m.who === "you" ? "flex justify-end" : "flex items-start gap-2.5"}>
              {m.who === "role" && (
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-border bg-surface-2 text-[10px] font-semibold">
                  {initials(m.title ?? "AI")}
                </span>
              )}
              <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${m.who === "you" ? "rounded-tr-sm bg-surface-2" : "rounded-tl-sm border border-border bg-bg/50 text-muted"}`}>
                {m.who === "role" && (
                  <div className="mb-0.5 flex items-center gap-1.5 text-[10px] text-muted-2">
                    <span className="font-semibold text-text">{m.title}</span>
                    <span className="rounded border border-border px-1">AI</span>
                    {m.chip && <span className="rounded bg-amber/10 px-1.5 py-px font-medium text-amber">{m.chip}</span>}
                  </div>
                )}
                {m.text}
              </div>
            </div>
          ))}
          {sending && msgs[msgs.length - 1]?.who === "you" && (
            <div className="flex items-center gap-2 text-xs text-muted-2"><Loader2 size={12} className="animate-spin" /> {role?.title} is thinking…</div>
          )}
          <div ref={endRef} />
        </div>

        <div className="flex items-center gap-2 border-t border-border p-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={role ? `Direct the ${role.title}…` : "Direct your team…"}
            aria-label="Direct your team"
            className="w-full rounded-xl bg-bg/50 px-4 py-2.5 text-sm outline-none placeholder:text-muted-2"
          />
          <button onClick={send} disabled={!input.trim() || sending} aria-label="Send" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-coral text-bg transition hover:brightness-110 disabled:opacity-40">
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* The floor — REAL work rolling up from the org run (server-recorded, with proofs) */}
      {floor.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-2">The floor — work rolling up</div>
          <ul className="mt-2 space-y-1.5">
            {floor.map((a) => (
              <li key={a.id} className="flex items-center gap-2 text-xs">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${a.status === "done" ? "bg-text" : "bg-amber"}`} />
                <span className="shrink-0 font-medium text-text">{a.agent}</span>
                <span className="truncate text-muted-2">{a.action}</span>
                {a.proof?.kind === "url" && (
                  <a href={a.proof.value} target="_blank" rel="noreferrer" className="shrink-0 text-muted underline decoration-dotted underline-offset-2 hover:text-text">proof</a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
