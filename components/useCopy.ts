"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// THE copy-to-clipboard hook — one behavior for every copy button (four hand-rolled versions had
// already drifted: one missed the `?.` guard and threw on insecure/older contexts). Guarded,
// fail-quiet, and the reset timer is cleaned up on unmount.
export function useCopy(resetMs = 2000): { copied: boolean; copy: (text: string) => void } {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const copy = useCallback(
    (text: string) => {
      navigator.clipboard
        ?.writeText(text)
        .then(() => {
          setCopied(true);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => setCopied(false), resetMs);
        })
        .catch(() => {});
    },
    [resetMs],
  );
  return { copied, copy };
}
