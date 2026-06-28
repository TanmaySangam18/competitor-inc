"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Check, ChevronRight } from "lucide-react";
import { getNotify } from "@/lib/engine/config";
import { billingLive } from "@/lib/engine/billing";

// "For you" — the customer's standing to-do list while the agents build & run. It keeps reminding (badge +
// pulse) until each item is resolved: approvals waiting on them, a build decision, and one-time setup steps
// (connect Telegram, add a subscription). Pure client + derived from current state, so items auto-clear
// when the underlying thing is done — that's the "repeated reminder" without nagging dead items.
interface Item {
  id: string;
  text: string;
  href: string;
  urgent?: boolean;
  once?: boolean; // one-time setup vs recurring action
}

export default function ActionBell({
  pendingApprovals,
  companyStatus,
  companyName,
}: {
  pendingApprovals: number;
  companyStatus?: string;
  companyName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [telegramOn, setTelegramOn] = useState(true); // optimistic until hydrated (no SSR flash)
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTelegramOn(!!getNotify());
  }, [open]);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const items: Item[] = [];
  if (pendingApprovals > 0)
    items.push({ id: "approvals", text: `${pendingApprovals} approval${pendingApprovals === 1 ? "" : "s"} waiting for your ok`, href: "/dashboard", urgent: true });
  if (companyStatus === "validated")
    items.push({ id: "build", text: `Decide: build ${companyName ?? "your company"}?`, href: "/dashboard", urgent: true });
  if (!telegramOn)
    items.push({ id: "telegram", text: "Connect Telegram — approve & get reminders on your phone", href: "/dashboard/settings", once: true });
  if (billingLive() && companyStatus && companyStatus !== "operating")
    items.push({ id: "sub", text: "Building unlocks with an Operator subscription", href: "/dashboard/settings", once: true });

  const count = items.length;
  const urgent = items.some((i) => i.urgent);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={count > 0 ? `${count} things need you` : "Nothing needs you"}
        className="relative grid h-9 w-9 place-items-center rounded-lg border border-border text-muted transition hover:text-text"
      >
        <Bell size={16} />
        {count > 0 && (
          <span
            className={`absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold text-bg ${
              urgent ? "bg-coral" : "bg-text"
            }`}
          >
            {count}
            {urgent && <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-coral/60" />}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
          <div className="border-b border-border px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-2">
            For you {count > 0 && `· ${count}`}
          </div>
          {count === 0 ? (
            <div className="flex items-center gap-2 px-4 py-5 text-sm text-muted-2">
              <Check size={15} className="text-mint" /> You&apos;re all caught up — the crew&apos;s on it.
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto p-1.5">
              {items.map((i) => (
                <li key={i.id}>
                  <Link
                    href={i.href}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-2.5 rounded-lg px-2.5 py-2.5 text-sm transition hover:bg-surface-2"
                  >
                    <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${i.urgent ? "bg-coral" : "bg-muted-2"}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block leading-snug">{i.text}</span>
                      {i.once && <span className="text-[11px] text-muted-2">one-time setup</span>}
                    </span>
                    <ChevronRight size={14} className="mt-0.5 shrink-0 text-muted-2" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
