"use client";

import { useState } from "react";
import { FlaskConical, CheckCircle2, Eye, Inbox, Send, Lock, Wallet } from "lucide-react";

// Progressive disclosure for the trust capabilities: seven stacked cards became one selector + one
// detail panel (~60% shorter section, same content — Hick's Law applied to the landing). Proper
// tablist semantics so keyboard/screen-reader users get the full experience.
const CAPS = [
  { icon: FlaskConical, title: "Validation Gate", body: "A fast, honest read first — then a commitment test that actually proves demand: real conversations, evidence people already pay, and one costly ask. Not vanity signups, and never a line of product code on a hunch.", color: "text-amber", ring: "bg-amber/12" },
  { icon: CheckCircle2, title: "Proof-of-Work", body: "A task counts as done only with a verifiable artifact — a live URL, a passing build, a real metric.", color: "text-mint", ring: "bg-mint/12" },
  { icon: Eye, title: "The Glass Box", body: "A human-readable log of every action, every dollar, every decision — with one-click undo.", color: "text-violet", ring: "bg-violet/12" },
  { icon: Inbox, title: "Approval Inbox", body: "Consequential actions wait for your yes/no. Safe autonomy by design — and the right way to handle prompt injection.", color: "text-coral", ring: "bg-coral/12" },
  { icon: Send, title: "Autopilot growth", body: "Approve one campaign and the crew drafts launch posts that market your product — to Bluesky and Mastodon, from competitor.inc's own accounts. Each post is policy-checked before it goes out; you never touch a login. Unlocked on Operator.", color: "text-amber", ring: "bg-amber/12" },
  { icon: Lock, title: "Private Mode", body: "Swap in a self-hosted open-weight model so sensitive business data never leaves your own infrastructure.", color: "text-violet", ring: "bg-violet/12" },
  { icon: Wallet, title: "Fair pricing", body: "A flat subscription with no revenue share. Failed work is credited back — you only pay for work that lands. Export and eject anytime.", color: "text-mint", ring: "bg-mint/12" },
];

export default function CapabilityExplorer() {
  const [active, setActive] = useState(0);
  const c = CAPS[active];
  return (
    <div className="mt-8 grid gap-4 lg:grid-cols-[16rem_1fr]">
      <div role="tablist" aria-label="Capabilities" aria-orientation="vertical" className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {CAPS.map((cap, i) => (
          <button
            key={cap.title}
            role="tab"
            aria-selected={i === active}
            id={`cap-tab-${i}`}
            aria-controls="cap-panel"
            onClick={() => setActive(i)}
            className={`flex shrink-0 items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-sm font-medium transition ${
              i === active ? "border-text/30 bg-surface-2 text-text" : "border-border text-muted hover:text-text"
            }`}
          >
            <cap.icon size={15} className={i === active ? cap.color : "text-muted-2"} />
            <span className="whitespace-nowrap">{cap.title}</span>
          </button>
        ))}
      </div>
      <div id="cap-panel" role="tabpanel" aria-labelledby={`cap-tab-${active}`} className="card flex min-h-[13rem] items-start gap-4 p-6">
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${c.ring} ${c.color}`}>
          <c.icon size={21} />
        </span>
        <div>
          <h3 className="text-xl font-semibold">{c.title}</h3>
          <p className="mt-2.5 max-w-xl leading-relaxed text-muted">{c.body}</p>
        </div>
      </div>
    </div>
  );
}
