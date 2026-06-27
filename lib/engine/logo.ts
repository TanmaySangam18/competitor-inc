// Deterministic per-company logo (monogram). Pure + testable: the same name always yields the same
// mark — no storage, no network, stable across every render and device. competitor.inc keeps its own
// LogoMark; each USER company gets a generated monogram so it reads like a real company on the board,
// the dashboard header, and its public /t demand-test page.

export interface Monogram {
  initials: string; // 1–2 uppercase letters
  hue: number; // 0–359, stable from the name
  hue2: number; // second gradient stop, derived from the same hash
}

// FNV-1a — small, fast, deterministic, no deps.
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export function monogram(name: string): Monogram {
  const h = hash((name || "company").trim().toLowerCase());
  const hue = h % 360;
  const hue2 = (hue + 40 + ((h >> 9) % 60)) % 360; // a related-but-distinct second stop
  return { initials: initialsOf(name), hue, hue2 };
}
