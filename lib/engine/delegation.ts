// The Delegation — the visual layout for the 3D agent office.
// Derived from the canonical AGENTS map so names/playbooks never drift from the rest of the app.
// Inspired by Arturo Paracuellos' "The Delegation" (MIT). All geometry/assets here are original
// and procedural — no third-party 3D models — so it ships in the commercial product cleanly.

import { AGENTS, type AgentRole } from "./types";

export interface DelegationAgent {
  role: AgentRole;
  name: string;
  label: string;
  blurb: string;
  playbook: string;
  /** Grayscale accent brightness 0..1 — color-as-meaning via light, not hue (brand rule). */
  tone: number;
  /** Vivid identity color (hue). Used on The House (private founder floor) where color is welcome;
   *  the public Office stays monochrome-with-faces to protect the brand. */
  color: string;
  /** Resting desk position on the floor plane, [x, z]. */
  desk: [number, number];
}

// Fixed presentation order: strategy leads, then the operators.
const ORDER: AgentRole[] = ["ceo", "engineering", "marketing", "support", "growth"];

const TONE: Record<AgentRole, number> = {
  ceo: 1.0, // Apex — brightest (the lead)
  support: 0.9, // Guard
  engineering: 0.8, // Forge
  growth: 0.7, // Surge
  marketing: 0.62, // Pitch
  manufacturing: 0.66, // Rig (dynamic-crew role; not in the default floor ORDER)
  ops: 0.58, // Pulse (back-office role; not in the default floor ORDER)
  finance: 0.54, // Ledger
  legal: 0.5, // Counsel
};

// Vivid per-agent identity colors (hue) — distinct, friendly, easy to tell apart on the House floor.
const COLOR: Record<AgentRole, string> = {
  ceo: "#ff7a59", // Apex — coral
  engineering: "#5b8cff", // Forge — blue
  marketing: "#ffb84d", // Pitch — amber
  support: "#46d39a", // Guard — mint
  growth: "#a78bfa", // Surge — violet
  manufacturing: "#8a99ab", // Rig — steel
  ops: "#6ac4d0", // Pulse — cyan
  finance: "#3fbf87", // Ledger — green
  legal: "#e879a6", // Counsel — pink
};

// Desks arranged in an arc around the central table, all facing the middle.
const DESK: Record<AgentRole, [number, number]> = {
  ceo: [0, -3.6],
  engineering: [-3.8, -1.5],
  marketing: [3.8, -1.5],
  support: [-2.7, 2.7],
  growth: [2.7, 2.7],
  manufacturing: [0, 3.6],
  ops: [-4.6, 0.6],
  finance: [4.6, 0.6],
  legal: [4.6, 2.7],
};

export const DELEGATION: DelegationAgent[] = ORDER.map((role) => ({
  role,
  name: AGENTS[role].name,
  label: AGENTS[role].label,
  blurb: AGENTS[role].blurb,
  playbook: AGENTS[role].playbook,
  tone: TONE[role],
  color: COLOR[role],
  desk: DESK[role],
}));


/** A grayscale hex for a given tone (0..1). Keeps everything monochrome. */
export function toneHex(tone: number): string {
  const v = Math.round(60 + tone * 195); // 60..255
  const h = v.toString(16).padStart(2, "0");
  return `#${h}${h}${h}`;
}
