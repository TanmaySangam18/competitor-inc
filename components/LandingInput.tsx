"use client";

// The one-screen landing's single action: describe your software → go. Routes into the /build demo
// carrying the idea (auto-runs there). Kept as a small client island so app/page.tsx stays a server
// component with metadata. MACHINA: mono, zero-radius, black/sienna.

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingInput() {
  const [idea, setIdea] = useState("");
  const router = useRouter();
  const go = () => {
    const q = idea.trim();
    try { localStorage.setItem("cofounder:ref", "home"); } catch { /* ignore */ }
    router.push(q ? `/build?idea=${encodeURIComponent(q)}` : "/build");
  };
  return (
    <div className="flex w-full max-w-xl items-stretch overflow-hidden rounded-2xl border border-border bg-surface text-left shadow-sm">
      <input
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && go()}
        placeholder="A study-tracker SaaS for night-shift nurses…"
        aria-label="Describe your software in one sentence"
        className="w-full bg-transparent px-4 py-3.5 text-sm outline-none placeholder:text-muted-2"
      />
      <button
        onClick={go}
        className="shrink-0 bg-coral px-6 text-[13px] font-semibold text-white transition hover:brightness-110"
      >
        Build it →
      </button>
    </div>
  );
}
