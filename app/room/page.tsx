import type { Metadata } from "next";
import RoomConversation from "@/components/RoomConversation";

// THE TEAM ROOM (/room) — the customer watches their AI team deliberate a decision in real time: the chair
// opens, each convened role weighs in, the chair calls it (proceed, or escalate to the founder). ONE screen,
// fixed viewport; the conversation scrolls internally. Teal design system. The reasoning is governed and
// real; the wording of each stance is mandate-derived until a model key wakes live debate (said plainly).

export const metadata: Metadata = {
  title: "competitor.inc — the team room",
  description:
    "Watch your AI team deliberate a decision in real time — the chair opens, each role weighs in, and the governed decision is called (or escalated to you).",
};

export default function RoomPage() {
  return (
    <main className="flex h-[100dvh] flex-col overflow-hidden bg-bg text-text">
      <header className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
        <a href="/" className="text-lg font-semibold tracking-tight">competitor<span className="text-coral">.inc</span></a>
        <a href="/services" className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-muted transition hover:border-coral/50 hover:text-coral">
          Services
        </a>
      </header>

      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col overflow-hidden px-6 py-6">
        <div className="shrink-0">
          <h1 className="display text-3xl sm:text-4xl">The team room</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Put a decision to your AI team and watch them work it out — the chair opens, the right roles weigh
            in, and the call is made under governance. Anything high-consequence goes to you.
          </p>
        </div>

        <div className="mt-5 flex flex-1 flex-col overflow-hidden">
          <RoomConversation />
        </div>
      </section>
    </main>
  );
}
