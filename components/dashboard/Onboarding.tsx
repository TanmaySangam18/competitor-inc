"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { ImportPanel } from "@/components/ImportPanel";

const EXAMPLES = [
  "An app for AI bedtime stories for kids",
  "A newsletter for indie game devs",
  "A marketplace for vintage film cameras",
];

export function Onboarding({ onSubmit, hasOthers, onDemo, onImport }: { onSubmit: (idea: string) => void; hasOthers: boolean; onDemo: () => void; onImport: (url: string, title: string) => void }) {
  const [idea, setIdea] = useState("");
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto mt-8 max-w-2xl text-center"
    >
      <span className="mx-auto grid h-14 w-14 place-items-center">
        <LogoMark size={56} />
      </span>
      <h1 className="mt-6 text-3xl font-bold md:text-4xl">
        {hasOthers ? "Start another company" : "What should we build together?"}
      </h1>
      <p className="mt-3 text-muted">
        Describe your idea in a sentence. Before building anything, competitor.inc checks whether people
        actually want it.
      </p>

      <div className="mt-8 rounded-2xl glass-panel p-3 text-left">
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="e.g. An app that turns my voice notes into polished blog posts…"
          rows={3}
          className="w-full resize-none rounded-xl bg-transparent px-3 py-2 text-text outline-none placeholder:text-muted-2"
          aria-label="Describe your company idea"
        />
        <div className="flex items-center justify-between px-1 pt-1">
          <span className="text-xs text-muted-2">competitor.inc estimates demand first — an honest AI read before you build.</span>
          <button
            onClick={() => onSubmit(idea)}
            disabled={!idea.trim()}
            className="group inline-flex items-center gap-2 rounded-xl bg-coral px-5 py-2.5 text-sm font-semibold text-bg transition hover:brightness-110 disabled:opacity-40"
          >
            Hand it over
            <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs text-muted-2">Try:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => setIdea(ex)}
            className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted transition hover:border-coral/40 hover:text-text"
          >
            {ex}
          </button>
        ))}
      </div>

      <button
        onClick={onDemo}
        className="mt-6 text-xs text-muted-2 underline-offset-4 transition hover:text-text hover:underline"
      >
        Or load a demo company to explore the full workflow →
      </button>

      <div className="mt-10 flex items-center gap-4">
        <div className="h-px flex-1 bg-border" />
        <span className="whitespace-nowrap text-xs uppercase tracking-wide text-muted-2">or grow what you&apos;ve already built</span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <div className="mt-6">
        <ImportPanel onGrow={onImport} />
      </div>
    </motion.div>
  );
}
