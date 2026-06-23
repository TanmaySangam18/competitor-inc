"use client";

// Hidden-in-plain-sight entrance to The House (the private founder floor). There is no visible nav link
// to /house anywhere — the only way in is a secret gesture: triple-click the big competitor.inc wordmark
// on the landing within ~0.8s. Navigating there is harmless on its own — the /house route is still gated
// by the founder email allow-list (auth) on any deployed site, so this only saves the founder a URL type.

import { useRef } from "react";
import { useRouter } from "next/navigation";

export function SecretHouseDoor({ children, className }: { children: React.ReactNode; className?: string }) {
  const router = useRouter();
  const clicks = useRef<number[]>([]);

  const onActivate = () => {
    const now = Date.now();
    clicks.current = [...clicks.current.filter((t) => now - t < 800), now];
    if (clicks.current.length >= 3) {
      clicks.current = [];
      router.push("/house");
    }
  };

  return (
    // Not a link, no pointer cursor, no a11y affordance — it must read as plain text to everyone else.
    <div className={className} onClick={onActivate} role="presentation" style={{ cursor: "default" }}>
      {children}
    </div>
  );
}
