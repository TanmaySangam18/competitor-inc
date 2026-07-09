"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LogoMark } from "@/components/Logo";
import { ImportPanel } from "@/components/ImportPanel";

// ADHD/ADD-FIRST ONBOARDING (Head of Design, 2026-07-09).
// Principles the design agent chose: ONE decision per screen · the choice is pre-made (a smart default is
// always selected, so "Next" always works — zero decision fatigue) · one big obvious action · visible
// progress · plain words, no jargon · impossible to get lost (Back is always there, nothing is
// destructive) · done in ~60 seconds. This screen IS the in-product brief: the customer tells the crew
// what to build, here — not in a chat. The composed sentence becomes the idea the engine validates + builds.

const WHAT_EXAMPLES = [
  "A study-buddy app for Northeastern students",
  "A tool that turns my voice notes into to-dos",
  "A booking page for a local tutor",
];
const WHO = ["Students", "Small businesses", "Everyone", "Just me"];
const ACTION = ["Sign up & try it", "Book / buy something", "Track their progress", "Get an answer fast"];

const DEFAULT_WHO = 0; // "Students" — a sensible default so the user can just tap Next
const DEFAULT_ACTION = 0;

type Step = 0 | 1 | 2;

export function Onboarding({ onSubmit, hasOthers, onDemo, onImport }: { onSubmit: (idea: string) => void; hasOthers: boolean; onDemo: () => void; onImport: (url: string, title: string) => void }) {
  const [step, setStep] = useState<Step>(0);
  const [what, setWhat] = useState("");
  const [who, setWho] = useState(WHO[DEFAULT_WHO]);
  const [action, setAction] = useState(ACTION[DEFAULT_ACTION]);
  const [showMore, setShowMore] = useState(false);

  const canNext = step === 0 ? what.trim().length > 3 : true;
  const finish = () => onSubmit(`${what.trim()} — for ${who.toLowerCase()}. The first thing they do: ${action.toLowerCase()}.`);
  const next = () => (step === 2 ? finish() : setStep((s) => (s + 1) as Step));
  const back = () => setStep((s) => (s - 1) as Step);

  const QUESTION = ["What do you want to build?", "Who is it for?", "What's the first thing they do?"][step];

  return (
    <div className="mx-auto mt-10 max-w-xl">
      {/* progress — always know where you are */}
      <div className="mb-8 flex items-center gap-3">
        <LogoMark size={28} />
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface">
          <div className="h-full rounded-full bg-text transition-all duration-300" style={{ width: `${((step + 1) / 3) * 100}%` }} />
        </div>
        <span className="shrink-0 font-mono text-xs text-muted-2">step {step + 1} of 3</span>
      </div>

      <motion.div
        key={step}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
          <h1 className="text-3xl font-bold leading-tight md:text-4xl">{hasOthers && step === 0 ? "Start another one — what is it?" : QUESTION}</h1>

          {/* Step 0 — the idea (type OR tap an example) */}
          {step === 0 && (
            <div className="mt-6">
              <textarea
                autoFocus
                value={what}
                onChange={(e) => setWhat(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && canNext) { e.preventDefault(); next(); } }}
                placeholder="Say it in one line. No tech words needed."
                rows={2}
                className="w-full resize-none rounded-2xl glass-panel px-4 py-4 text-lg outline-none placeholder:text-muted-2 focus:border-coral/40"
                aria-label="What do you want to build?"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="py-1.5 text-xs text-muted-2">or tap one:</span>
                {WHAT_EXAMPLES.map((ex) => (
                  <button key={ex} onClick={() => setWhat(ex)} className="rounded-full border border-border px-3 py-1.5 text-xs text-muted transition hover:border-coral/50 hover:text-text">
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Steps 1 & 2 — pick one big card (a default is already chosen) */}
          {step > 0 && (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {(step === 1 ? WHO : ACTION).map((opt) => {
                const selected = step === 1 ? who === opt : action === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => (step === 1 ? setWho(opt) : setAction(opt))}
                    className={`rounded-2xl border p-5 text-left text-lg font-medium transition ${
                      selected ? "border-text bg-text text-bg" : "glass-panel text-text hover:border-coral/40"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}
      </motion.div>

      {/* one big action + a safe way back */}
      <div className="mt-8 flex items-center justify-between gap-3">
        {step > 0 ? (
          <button onClick={back} className="font-mono text-sm text-muted transition hover:text-text">← back</button>
        ) : <span />}
        <button
          onClick={next}
          disabled={!canNext}
          className="inline-flex items-center gap-2 rounded-2xl bg-coral px-8 py-4 text-lg font-semibold text-bg transition hover:brightness-110 disabled:opacity-40"
        >
          {step === 2 ? "Hand it to your crew →" : "Next →"}
        </button>
      </div>

      {step === 2 && (
        <p className="mt-4 text-center text-sm text-muted">
          Your crew will check if people actually want <span className="text-text">&ldquo;{what.trim()}&rdquo;</span> before building a thing. Takes a moment.
        </p>
      )}

      {/* power options tucked away — present, never in the way */}
      {step === 0 && (
        <div className="mt-10 text-center">
          <button onClick={() => setShowMore((v) => !v)} className="font-mono text-xs text-muted-2 underline-offset-4 transition hover:text-text hover:underline">
            {showMore ? "hide options" : "just exploring, or already built something?"}
          </button>
          <AnimatePresence>
            {showMore && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <button onClick={onDemo} className="mt-4 block w-full text-sm text-muted transition hover:text-text">
                  Load a demo company to look around →
                </button>
                <div className="mt-6"><ImportPanel onGrow={onImport} /></div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
