"use client";

import { getByok } from "./config";

// Free-tier usage caps. Users who bring their own key (BYOK) pay their own tokens, so they're
// uncapped. Free users (running on our free-tier/simulated engine) get a generous daily cap so
// our marginal cost stays ~$0. Tracked per-day in localStorage.

const KEY = "roomie:usage:v1";
export const FREE_CAPS = { validate: 3, shift: 12 } as const;

type Kind = keyof typeof FREE_CAPS;
interface Usage {
  date: string;
  validate: number;
  shift: number;
}

const today = () => new Date().toISOString().slice(0, 10);

function read(): Usage {
  if (typeof window === "undefined") return { date: today(), validate: 0, shift: 0 };
  try {
    const u = JSON.parse(window.localStorage.getItem(KEY) || "null") as Usage | null;
    if (u && u.date === today()) return u;
  } catch {
    /* ignore */
  }
  return { date: today(), validate: 0, shift: 0 };
}

function write(u: Usage) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(u));
  } catch {
    /* ignore */
  }
}

/** Free (metered) when there's no BYOK key — BYOK users run on their own bill, uncapped. */
export function isMetered(): boolean {
  return !getByok();
}

export function remaining(kind: Kind): number {
  if (!isMetered()) return Infinity;
  return Math.max(0, FREE_CAPS[kind] - read()[kind]);
}

export function canRun(kind: Kind): boolean {
  return remaining(kind) > 0;
}

export function recordRun(kind: Kind): void {
  if (!isMetered()) return;
  const u = read();
  u[kind] += 1;
  write(u);
}
