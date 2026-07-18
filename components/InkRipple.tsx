"use client";

import { useEffect, useRef } from "react";

// InkRipple — the site-wide interaction splash (ADR-0009). ONE document-level pointerdown listener
// (passive), mounted once in app/layout.tsx, spawns a fixed-position ripple at the exact press point:
// scale 0 → 180px while fading ~0.18 → 0 over ~450ms (keyframes in globals.css), node removed on
// animationend. Design decisions (all load-bearing):
//  - ONE reskin knob: the fill is `var(--ripple-ink, rgba(10,10,10,0.14))` — set --ripple-ink on
//    :root to re-skin every ripple at once; the default is the monochrome ink. No other color source.
//  - transform/opacity ONLY (compositor work, zero layout/paint of the page → no scroll jank, no
//    reflow), will-change hints, pointer-events:none + aria-hidden layer → zero effect on focus,
//    hit-testing, inputs, or the accessibility tree. Zero dependencies.
//  - prefers-reduced-motion: reduce → the handler bails BEFORE creating any node (checked live via
//    matchMedia each press, so flipping the OS setting applies immediately).
//  - Pointer-only by design: keyboard activation already has a visible focus ring; a synthetic
//    centered ripple on Enter/Space would be noise, not feedback.
//  - Concurrency cap: at most 6 live ripples; the oldest is dropped first so fast tapping stays cheap.

const MAX_RIPPLES = 6;
const SIZE = 180; // final ripple diameter, px

export default function InkRipple() {
  const layerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    const onPointerDown = (e: PointerEvent) => {
      if (reduced.matches) return; // reduced motion: don't even attach a span
      if (!e.isTrusted) return; // real presses only — no ripples from synthetic events
      const span = document.createElement("span");
      span.className = "ink-ripple";
      span.style.left = `${e.clientX - SIZE / 2}px`;
      span.style.top = `${e.clientY - SIZE / 2}px`;
      span.addEventListener("animationend", () => span.remove(), { once: true });
      while (layer.childElementCount >= MAX_RIPPLES) layer.firstElementChild?.remove();
      layer.appendChild(span);
    };

    document.addEventListener("pointerdown", onPointerDown, { passive: true });
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return <div ref={layerRef} aria-hidden="true" className="ink-ripple-layer" />;
}
