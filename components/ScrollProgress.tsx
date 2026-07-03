"use client";

import { useEffect, useState } from "react";

// Wayfinding, not decoration: a 2px reading-progress bar so a long page always answers "how much is
// left." Renders nothing on pages shorter than ~1.5 viewports — no chrome where none is needed.
export default function ScrollProgress() {
  const [pct, setPct] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setShow(max > window.innerHeight * 0.5);
      setPct(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  if (!show) return null;
  return (
    <div aria-hidden className="fixed inset-x-0 top-0 z-[60] h-0.5 bg-transparent">
      <div className="h-full bg-coral transition-[width] duration-150" style={{ width: `${pct}%` }} />
    </div>
  );
}
