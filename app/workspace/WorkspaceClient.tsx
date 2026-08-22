"use client";

import { useEffect, useRef, useState } from "react";

// THE WORKSPACE, client side. Deliberately local-first: the transcript lives in localStorage, so it
// survives a reload with no database and no account. That is the Guildly shape the founder asked for,
// and it means this works tonight rather than after a migration.

type Speaker = { id: string; title: string; handle: string; department: string; why: string };
type Proposal = { tool: string; what: string; detail: string; because: string; args: Record<string, unknown> };
type Action = { tool: string; ok: boolean; summary: string; mutated?: boolean; proposal?: Proposal };

type Msg = {
  id: string;
  channel: string;
  who: "founder" | "agent";
  title?: string;
  handle?: string;
  text: string;
  at: string;
  action?: Action;
  note?: string;
  agentId?: string;
  /** Set once the founder has decided, so a card cannot be clicked twice. */
  decided?: "approved" | "declined";
};

export type ChannelInfo = { id: string; name: string; purpose: string; members: number; lead: string | null };
export type AgentInfo = { id: string; title: string; handle: string; department: string; channel: string };

const KEY = "competitor.workspace.v1";

function initials(title: string): string {
  return title.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function clock(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function WorkspaceClient({
  channels,
  agents,
  modelConfigured,
}: {
  channels: ChannelInfo[];
  agents: AgentInfo[];
  modelConfigured: boolean;
}) {
  const [active, setActive] = useState(channels[0]?.id ?? "#exec");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [showRoster, setShowRoster] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Load once. Wrapped because a corrupt or foreign value must not white-screen the page.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setMessages(JSON.parse(raw) as Msg[]);
    } catch {
      /* start fresh rather than crash */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(messages.slice(-400)));
    } catch {
      /* over quota: keep working, just stop persisting */
    }
  }, [messages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, active]);

  const here = messages.filter((m) => m.channel === active);
  const channel = channels.find((c) => c.id === active);
  const roster = agents.filter((a) => a.channel === active);

  async function send() {
    const text = draft.trim();
    if (!text || busy) return;
    setDraft("");
    const mine: Msg = { id: `f${Date.now()}`, channel: active, who: "founder", text, at: new Date().toISOString() };
    setMessages((m) => [...m, mine]);
    setBusy(true);

    // Only this channel's recent turns go to the model, so context cannot grow without bound.
    const history = [...here, mine]
      .slice(-12)
      .map((m) => `${m.who === "founder" ? "Founder" : m.title}: ${m.text}`)
      .join("\n");

    try {
      const res = await fetch("/api/workspace", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ channel: active, text, history }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        speaker?: Speaker;
        reply?: string | null;
        note?: string;
        action?: Action;
        error?: string;
      };

      if (!data.ok) {
        setMessages((m) => [...m, { id: `e${Date.now()}`, channel: active, who: "agent", title: "System", text: data.error ?? "Request failed.", at: new Date().toISOString() }]);
      } else {
        setMessages((m) => [
          ...m,
          {
            id: `a${Date.now()}`,
            channel: active,
            who: "agent",
            title: data.speaker?.title ?? "Colleague",
            handle: data.speaker?.handle,
            agentId: data.speaker?.id,
            text: data.reply ?? "",
            note: data.note,
            action: data.action,
            at: new Date().toISOString(),
          },
        ]);
      }
    } catch {
      setMessages((m) => [...m, { id: `x${Date.now()}`, channel: active, who: "agent", title: "System", text: "Could not reach the workspace API.", at: new Date().toISOString() }]);
    } finally {
      setBusy(false);
    }
  }

  // THE FOUNDER'S SIGNATURE. Marks the card decided FIRST so a double click cannot double-run, then
  // posts. Declining is purely local: nothing was started, so there is nothing to call off.
  async function decide(msg: Msg, yes: boolean) {
    const p = msg.action?.proposal;
    if (!p || msg.decided) return;
    setMessages((m) => m.map((x) => (x.id === msg.id ? { ...x, decided: yes ? "approved" : "declined" } : x)));
    if (!yes) return;

    setBusy(true);
    try {
      const res = await fetch("/api/workspace", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirm: { agentId: msg.agentId, tool: p.tool, args: p.args } }),
      });
      const data = (await res.json()) as { ok: boolean; speaker?: Speaker; action?: Action; error?: string };
      setMessages((m) => [
        ...m,
        {
          id: `c${Date.now()}`,
          channel: msg.channel,
          who: "agent",
          title: data.speaker?.title ?? msg.title,
          agentId: msg.agentId,
          text: "",
          action: data.action ?? { tool: p.tool, ok: false, summary: data.error ?? "The approval did not go through." },
          at: new Date().toISOString(),
        },
      ]);
    } catch {
      setMessages((m) => [...m, { id: `c${Date.now()}`, channel: msg.channel, who: "agent", title: "System", text: "Could not reach the workspace API.", at: new Date().toISOString() }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-bg text-text">
      {/* CHANNELS */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface-2 sm:flex">
        <div className="border-b border-border px-5 py-4">
          <p className="display text-sm">competitor.inc</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-2">
            {agents.length} colleagues
          </p>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          {channels.map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className={`mb-0.5 flex w-full items-center justify-between px-3 py-2 text-left text-sm transition ${
                active === c.id ? "bg-surface text-text" : "text-muted hover:bg-surface hover:text-text"
              }`}
            >
              <span className="font-mono">{c.id}</span>
              <span className="font-mono text-[10px] text-muted-2">{c.members}</span>
            </button>
          ))}
        </nav>
        <div className="border-t border-border px-5 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-2">
            {modelConfigured ? "model connected" : "no model key"}
          </p>
        </div>
      </aside>

      {/* CONVERSATION */}
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
          <div className="min-w-0">
            <h1 className="display truncate text-lg">{channel?.id}</h1>
            <p className="truncate text-xs text-muted">{channel?.purpose}</p>
          </div>
          <button
            onClick={() => setShowRoster((s) => !s)}
            className="shrink-0 border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition hover:border-text hover:text-text"
          >
            {showRoster ? "hide" : "who is here"}
          </button>
        </header>

        {showRoster && (
          <div className="border-b border-border bg-surface-2 px-6 py-4">
            <div className="flex flex-wrap gap-2">
              {roster.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setDraft((d) => `${a.handle} ${d}`.trim())}
                  title={`Address the ${a.title}`}
                  className="border border-border px-2.5 py-1 font-mono text-[10px] text-muted transition hover:border-text hover:text-text"
                >
                  {a.handle}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-2">
              Click a name to address them. With nobody named, the lead of this channel answers.
            </p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {here.length === 0 && (
            <div className="mx-auto mt-16 max-w-lg text-center">
              <p className="display text-2xl">{channel?.id}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted">{channel?.purpose}</p>
              <p className="mt-6 text-sm text-muted-2">
                {channel?.members} colleagues are in here. Say something and the lead answers, or name
                someone with an @handle.
              </p>
              {!modelConfigured && (
                <p className="mt-6 border border-border p-4 text-left font-mono text-[11px] leading-relaxed text-muted">
                  No model key configured, so nobody can answer yet. Add one line to .env.local and
                  restart:
                  <br />
                  <span className="text-text">GROQ_API_KEY=...</span>
                  <br />
                  Nothing here will invent a reply in the meantime.
                </p>
              )}
            </div>
          )}

          <div className="mx-auto max-w-3xl space-y-6">
            {here.map((m) => (
              <div key={m.id} className="flex gap-4">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center font-mono text-[10px] ${
                    m.who === "founder" ? "bg-coral text-bg" : "border border-border text-muted"
                  }`}
                >
                  {m.who === "founder" ? "YOU" : initials(m.title ?? "??")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold">{m.who === "founder" ? "You" : m.title}</span>
                    <span className="font-mono text-[10px] text-muted-2">{clock(m.at)}</span>
                  </div>
                  {m.text && <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-muted">{m.text}</p>}
                  {m.note && (
                    <p className="mt-2 border-l-2 border-border pl-3 text-xs leading-relaxed text-muted-2">{m.note}</p>
                  )}
                  {m.action?.proposal && (
                    <div className="mt-3 border border-border p-4">
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-2">
                        {m.decided ? `you ${m.decided} this` : "needs your approval"}
                      </p>
                      <p className="mt-2 text-sm font-semibold">{m.action.proposal.what}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted">{m.action.proposal.because}</p>
                      {!m.decided && (
                        <div className="mt-4 flex gap-3">
                          <button
                            onClick={() => void decide(m, true)}
                            className="border border-text bg-text px-4 py-2 text-xs font-semibold text-bg transition hover:bg-bg hover:text-text"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => void decide(m, false)}
                            className="border border-border px-4 py-2 text-xs font-semibold text-muted transition hover:border-text hover:text-text"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {m.action && !m.action.proposal && (
                    <div className={`mt-2 border-l-2 pl-3 ${m.action.ok ? "border-text" : "border-amber"}`}>
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-2">
                        {m.action.ok ? (m.action.mutated ? "changed" : "ran") : "refused"} · {m.action.tool}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-muted">{m.action.summary}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-border font-mono text-[10px] text-muted-2">
                  ...
                </div>
                <p className="self-center text-sm text-muted-2">thinking</p>
              </div>
            )}
            <div ref={endRef} />
          </div>
        </div>

        <div className="border-t border-border px-6 py-4">
          <div className="mx-auto flex max-w-3xl items-end gap-3">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              rows={1}
              placeholder={`Message ${channel?.id}`}
              aria-label={`Message ${channel?.id}`}
              className="max-h-40 min-h-[46px] flex-1 resize-y border border-border bg-surface-2 px-4 py-3 text-sm text-text outline-none transition placeholder:text-muted-2 focus:border-text"
            />
            <button
              onClick={() => void send()}
              disabled={busy || !draft.trim()}
              className="border border-text bg-text px-5 py-3 text-sm font-semibold text-bg transition hover:bg-bg hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
            >
              Send
            </button>
          </div>
          <p className="mx-auto mt-2 max-w-3xl font-mono text-[10px] uppercase tracking-[0.14em] text-muted-2">
            enter sends · shift enter for a new line · every colleague is an AI
          </p>
        </div>
      </main>
    </div>
  );
}
