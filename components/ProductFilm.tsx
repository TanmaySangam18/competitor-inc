"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Radar, Hammer, ShieldCheck, Receipt, Sparkles } from "lucide-react";
import { LogoMark } from "@/components/Logo";

// The product film — a scripted, scene-based motion promo rendered in-browser (Framer Motion).
// Deliberately NOT an mp4: crisp at any resolution, zero buffering, and it plays OFFLINE — which is
// exactly what a live laptop demo needs. Story-bar navigation like stories; click a bar to jump.
// Every claim in the copy is true of the shipped product (no-fake-proof rule applies to marketing too).

interface Scene {
  id: string;
  ms: number;
  kicker?: string;
  title: string;
  sub?: string;
  visual?: "problem" | "radar" | "build" | "govern" | "honest" | "cta";
}

const SCENES: Scene[] = [
  {
    id: "problem",
    ms: 6500,
    kicker: "THE PROBLEM",
    title: "Most side projects die with zero users.",
    sub: "Not because building is hard — because nobody proved anyone wanted it first.",
    visual: "problem",
  },
  {
    id: "radar",
    ms: 7500,
    kicker: "STEP 1 · PROVE IT",
    title: "Your AI co-founder scans real demand — live, with sources.",
    sub: "Hacker News · StackExchange · GitHub — every signal cited. Click it, check it.",
    visual: "radar",
  },
  {
    id: "build",
    ms: 7000,
    kicker: "STEP 2 · BUILD IT",
    title: "Then a real crew ships it. Real repo. Real live URL.",
    sub: "Verified before we ever say “done.” Never a fake link.",
    visual: "build",
  },
  {
    id: "govern",
    ms: 7500,
    kicker: "STEP 3 · RUN IT — GOVERNED",
    title: "It works nightly. Consequential moves wait for your yes.",
    sub: "Every action, dollar, and decision logged in the Glass Box — with one-click undo.",
    visual: "govern",
  },
  {
    id: "honest",
    ms: 7000,
    kicker: "THE DEAL",
    title: "$0 to validate · $39/mo to operate · 0% of your revenue.",
    sub: "Your keys. Your accounts. Export anytime. Real numbers only — we'd rather tell you “don't build it.”",
    visual: "honest",
  },
  {
    id: "cta",
    ms: 6000,
    title: "Prove it before you build it.",
    sub: "competitor.inc — the AI co-founder that tells you the truth.",
    visual: "cta",
  },
];

const TOTAL = SCENES.reduce((t, s) => t + s.ms, 0);

function SceneVisual({ v }: { v: Scene["visual"] }) {
  switch (v) {
    case "problem":
      return (
        <div className="flex items-end justify-center gap-2" aria-hidden>
          {[38, 60, 24, 74, 44, 16, 52].map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: h }}
              animate={{ height: 6, opacity: 0.35 }}
              transition={{ delay: 0.9 + i * 0.28, duration: 1.1, ease: "easeIn" }}
              className="w-6 rounded-t-md bg-coral/70"
              style={{ height: h }}
            />
          ))}
        </div>
      );
    case "radar":
      return (
        <div className="space-y-2 text-left" aria-hidden>
          {[
            ["Hacker News", "84 threads · 3.1k points"],
            ["StackExchange", "212 questions on this pain"],
            ["GitHub", "37 repos · issues trending up"],
          ].map(([src, sig], i) => (
            <motion.div
              key={src}
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + i * 0.55 }}
              className="flex items-center gap-3 rounded-xl border border-mint/25 bg-mint/[0.05] px-4 py-2.5"
            >
              <Radar size={15} className="shrink-0 text-mint" />
              <span className="text-sm font-semibold">{src}</span>
              <span className="ml-auto text-xs text-muted">{sig}</span>
            </motion.div>
          ))}
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.6 }} className="pt-1 text-center text-[11px] text-muted-2">
            illustrative layout — the live Radar cites real, clickable sources
          </motion.p>
        </div>
      );
    case "build":
      return (
        <div className="space-y-2 font-mono text-sm" aria-hidden>
          {[
            ["$ create repo …", "done"],
            ["$ push 14 files …", "done"],
            ["$ deploy pages …", "LIVE ↗"],
          ].map(([cmd, res], i) => (
            <motion.div
              key={cmd}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 + i * 0.7 }}
              className="flex items-center justify-between rounded-lg border border-border bg-bg/60 px-4 py-2"
            >
              <span className="text-muted">{cmd}</span>
              <span className={res === "LIVE ↗" ? "font-bold text-mint" : "text-mint/70"}>{res}</span>
            </motion.div>
          ))}
        </div>
      );
    case "govern":
      return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7 }} className="rounded-2xl border border-coral/30 bg-coral/[0.06] p-4 text-left" aria-hidden>
          <div className="text-[10px] uppercase tracking-wide text-muted-2">Surge · needs your ok</div>
          <div className="mt-1 text-sm font-semibold">Scale ad spend to $240/day</div>
          <div className="mt-3 flex gap-2">
            <motion.div
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1, scale: [1, 1.06, 1] }}
              transition={{ delay: 2.2, duration: 0.5 }}
              className="flex-1 rounded-lg bg-coral py-2 text-center text-xs font-bold text-bg"
            >
              Approve
            </motion.div>
            <div className="rounded-lg border border-border px-4 py-2 text-xs text-muted">Reject</div>
          </div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3 }} className="mt-3 flex items-center gap-1.5 text-[11px] text-mint">
            <ShieldCheck size={12} /> Nothing consequential runs without you.
          </motion.div>
        </motion.div>
      );
    case "honest":
      return (
        <div className="flex items-center justify-center gap-6" aria-hidden>
          {[
            [Receipt, "Real receipts"],
            [ShieldCheck, "Your keys"],
            [Sparkles, "0% cut"],
          ].map(([Icon, label], i) => {
            const I = Icon as typeof Receipt;
            return (
              <motion.div key={String(label)} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 + i * 0.4 }} className="flex flex-col items-center gap-2">
                <span className="grid h-12 w-12 place-items-center rounded-2xl border border-mint/30 bg-mint/[0.07] text-mint">
                  <I size={20} />
                </span>
                <span className="text-xs text-muted">{String(label)}</span>
              </motion.div>
            );
          })}
        </div>
      );
    case "cta":
      return (
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5, type: "spring" }} className="flex justify-center" aria-hidden>
          <LogoMark size={72} />
        </motion.div>
      );
    default:
      return null;
  }
}

export default function ProductFilm() {
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [scene, setScene] = useState(0);
  const [sceneProgress, setSceneProgress] = useState(0); // 0..1 within current scene
  const raf = useRef<number>(0);
  const sceneStart = useRef<number>(0);
  const pausedAt = useRef<number>(0);

  // rAF-driven scene clock: smooth progress bars, pausable, and no timer drift.
  useEffect(() => {
    if (!playing) return;
    sceneStart.current = performance.now() - pausedAt.current;
    const tick = (now: number) => {
      const elapsed = now - sceneStart.current;
      const dur = SCENES[scene].ms;
      if (elapsed >= dur) {
        pausedAt.current = 0;
        if (scene < SCENES.length - 1) {
          setScene((s) => s + 1);
          setSceneProgress(0);
        } else {
          setPlaying(false);
          setSceneProgress(1);
        }
        return;
      }
      setSceneProgress(elapsed / dur);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing, scene]);

  function playPause() {
    if (!started) {
      setStarted(true);
      setScene(0);
      setSceneProgress(0);
      pausedAt.current = 0;
      setPlaying(true);
      return;
    }
    if (playing) {
      pausedAt.current = performance.now() - sceneStart.current;
      setPlaying(false);
    } else {
      // finished? restart
      if (scene === SCENES.length - 1 && sceneProgress >= 1) {
        setScene(0);
        setSceneProgress(0);
        pausedAt.current = 0;
      }
      setPlaying(true);
    }
  }

  function jumpTo(i: number) {
    setScene(i);
    setSceneProgress(0);
    pausedAt.current = 0;
    if (started && !playing) setPlaying(true);
  }

  const s = SCENES[scene];
  const finished = started && !playing && scene === SCENES.length - 1 && sceneProgress >= 1;

  return (
    <section id="film" className="border-t border-border bg-surface/20">
      <div className="mx-auto max-w-4xl px-6 py-24">
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-coral">The 45-second film</div>
          <h2 className="display mt-3 text-3xl md:text-4xl">What we do, in one sitting</h2>
        </div>

        <div className="relative mt-10 overflow-hidden rounded-3xl border border-border bg-bg shadow-2xl" style={{ aspectRatio: "16/9" }}>
          {/* story bars */}
          {started && (
            <div className="absolute inset-x-0 top-0 z-20 flex gap-1.5 p-3">
              {SCENES.map((sc, i) => (
                <button key={sc.id} onClick={() => jumpTo(i)} aria-label={`Scene ${i + 1}`} className="h-1 flex-1 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full bg-coral transition-none"
                    style={{ width: i < scene ? "100%" : i === scene ? `${sceneProgress * 100}%` : "0%" }}
                  />
                </button>
              ))}
            </div>
          )}

          {/* poster / scenes */}
          {!started ? (
            <button onClick={playPause} className="group absolute inset-0 grid place-items-center bg-gradient-to-br from-bg via-surface to-bg mesh">
              <div className="flex flex-col items-center gap-5">
                <LogoMark size={56} />
                <span className="grid h-16 w-16 place-items-center rounded-full bg-coral text-bg shadow-xl transition group-hover:scale-110">
                  <Play size={26} className="ml-1" />
                </span>
                <span className="text-sm text-muted">Play the film · 45s · plays offline</span>
              </div>
            </button>
          ) : (
            <div className="absolute inset-0 mesh">
              <AnimatePresence mode="wait">
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -18 }}
                  transition={{ duration: 0.45 }}
                  className="flex h-full flex-col items-center justify-center gap-6 px-8 text-center sm:px-16"
                >
                  {s.kicker && <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-coral">{s.kicker}</div>}
                  <h3 className="display max-w-2xl text-2xl leading-tight sm:text-4xl">{s.title}</h3>
                  {s.sub && <p className="max-w-xl text-sm text-muted sm:text-base">{s.sub}</p>}
                  <div className="w-full max-w-md">
                    <SceneVisual v={s.visual} />
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* controls */}
              <div className="absolute bottom-3 right-3 z-20 flex gap-2">
                {finished && (
                  <button onClick={() => jumpTo(0)} aria-label="Replay" className="grid h-10 w-10 place-items-center rounded-full border border-border bg-bg/80 text-muted backdrop-blur transition hover:text-text">
                    <RotateCcw size={16} />
                  </button>
                )}
                <button onClick={playPause} aria-label={playing ? "Pause" : "Play"} className="grid h-10 w-10 place-items-center rounded-full border border-border bg-bg/80 text-muted backdrop-blur transition hover:text-text">
                  {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                </button>
              </div>

              {finished && (
                <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center">
                  <a href="/dashboard" className="rounded-xl bg-coral px-6 py-3 text-sm font-semibold text-bg shadow-lg transition hover:brightness-110">
                    Try it now — free
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-[11px] text-muted-2">
          Rendered live in your browser — no video file, no buffering, works offline. Every claim in it is true of the shipped product.
        </p>
      </div>
    </section>
  );
}
