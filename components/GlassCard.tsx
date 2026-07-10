"use client";

import { useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

// The single-page workspace primitive: one feature = one flat terminal panel. `collapsible` gives
// progressive disclosure (secondary features start closed, one tap reveals them). Direction B: no icons —
// the `icon` prop is accepted for back-compat but not rendered (text + structure only).
export function GlassCard({
  title,
  children,
  collapsible = false,
  defaultOpen = true,
  badge,
  action,
  subtitle,
  fill = false,
  id,
  className = "",
}: {
  title?: string;
  icon?: LucideIcon; // accepted for back-compat, intentionally not rendered
  children: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  badge?: ReactNode;
  action?: ReactNode;
  subtitle?: string;
  fill?: boolean; // tile mode: fill the grid cell, header fixed, body scrolls INSIDE the tile
  id?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const showBody = !collapsible || open;
  const pad = fill ? "p-4" : "p-5 sm:p-7";
  return (
    <section
      id={id}
      className={`scroll-mt-24 rounded-3xl glass-panel ${pad} ${fill ? "flex min-h-0 flex-col overflow-hidden" : ""} ${className}`}
    >
      {title && (
        <div className="flex shrink-0 items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => collapsible && setOpen((o) => !o)}
            className={`group flex min-w-0 items-center gap-2 text-left ${collapsible ? "cursor-pointer" : "cursor-default"}`}
            aria-expanded={collapsible ? open : undefined}
          >
            <span className="flex items-baseline gap-2 truncate">
              <span className="truncate font-display text-sm font-semibold tracking-tight text-text">{title}</span>
              {subtitle && <span className="truncate text-xs text-muted-2">{subtitle}</span>}
            </span>
            {badge}
            {collapsible && <span className="shrink-0 text-xs text-muted-2">{open ? "–" : "+"}</span>}
          </button>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {showBody && (
        <div className={`${title ? "mt-3" : ""} ${fill ? "min-h-0 flex-1 overflow-y-auto pr-1" : ""}`}>{children}</div>
      )}
    </section>
  );
}
