"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { MessageSquarePlus, X, Check, Loader2, Send } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuth } from "@/lib/engine/useAuth";

// Beta feedback widget — a small floating button on every page. Writes to the Supabase `feedback`
// table (insert-only RLS; run supabase/migrations/0002_feedback.sql). Hidden when Supabase isn't
// configured, and on the immersive 3D routes so it doesn't clutter them.
const HIDE_ON = ["/house", "/delegation"];

export function FeedbackWidget() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  if (!isSupabaseConfigured()) return null;
  if (HIDE_ON.some((p) => pathname?.startsWith(p))) return null;

  async function submit() {
    const message = msg.trim();
    if (!message) return;
    setState("sending");
    try {
      const who = email.trim() || (user && !user.guest ? user.email : null);
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message, email: who, path: pathname }),
      });
      if (!res.ok) throw new Error("send failed");
      setState("done");
      setMsg("");
      setTimeout(() => { setOpen(false); setState("idle"); }, 1800);
    } catch {
      setState("error");
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-[80] print:hidden">
      {open ? (
        <div className="w-[min(92vw,20rem)] rounded-2xl border border-border bg-surface p-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Beta feedback</h2>
            <button onClick={() => setOpen(false)} aria-label="Close feedback" className="text-muted-2 transition hover:text-text">
              <X size={16} />
            </button>
          </div>
          {state === "done" ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-mint"><Check size={16} /> Thanks — got it.</div>
          ) : (
            <>
              <textarea
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                rows={4}
                maxLength={4000}
                autoFocus
                placeholder="What's working? What's broken? What would you change?"
                className="mt-3 w-full resize-none rounded-xl border border-border bg-bg/50 p-3 text-sm outline-none placeholder:text-muted-2 focus:border-coral/40"
              />
              {!(user && !user.guest) && (
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="Email (optional — for a reply)"
                  className="mt-2 w-full rounded-xl border border-border bg-bg/50 px-3 py-2 text-sm outline-none placeholder:text-muted-2 focus:border-coral/40"
                />
              )}
              {state === "error" && <p className="mt-2 text-xs text-coral">Couldn&apos;t send just now — try again.</p>}
              <button
                onClick={submit}
                disabled={!msg.trim() || state === "sending"}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-coral py-2.5 text-sm font-semibold text-bg transition hover:brightness-110 disabled:opacity-40"
              >
                {state === "sending" ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Send feedback
              </button>
              <p className="mt-2 text-center text-[10px] text-muted-2">Goes straight to the founder. Thank you 🙏</p>
            </>
          )}
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          aria-label="Send beta feedback"
          className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-medium shadow-lg transition hover:border-text/30"
        >
          <MessageSquarePlus size={16} className="text-coral" /> Feedback
        </button>
      )}
    </div>
  );
}
