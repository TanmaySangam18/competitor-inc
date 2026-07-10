"use client";

// The Sensitive-trap probe (client island): NEXT_PUBLIC_* values are INLINED into this bundle at build
// time — so whatever renders here is what every visitor's browser actually got. Compared against the
// server reading on /integrations, a mismatch makes the inlining trap visible instead of mysterious.
export function GateProbe() {
  const inlined = process.env.NEXT_PUBLIC_CAMPUS_GATE;
  return (
    <span className={`rounded-md border px-2 py-0.5 font-mono text-[10px] tracking-[0.08em] ${inlined === "1" ? "border-pine text-pine font-semibold" : "border-rule text-ink-faint"}`}>
      CLIENT BUNDLE: {inlined === "1" ? "ON" : inlined === undefined || inlined === "" ? "NOT INLINED" : `"${inlined}"`}
    </span>
  );
}
