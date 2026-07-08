"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";

// The single-page workspace primitive: one feature = one liquid-glass card. `collapsible` gives
// progressive disclosure (secondary features start closed, one tap reveals them) so the page stays clean
// without hiding anything on a separate route. Uses the existing .glass-panel language.
export function GlassCard({
  title,
  icon: Icon,
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
  icon?: LucideIcon;
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
            {Icon && <Icon size={15} className="shrink-0 text-muted" />}
            <span className="flex items-baseline gap-2 truncate">
              <span className="truncate text-sm font-semibold text-text">{title}</span>
              {subtitle && <span className="truncate text-xs text-muted-2">{subtitle}</span>}
            </span>
            {badge}
            {collapsible && (
              <ChevronDown size={15} className={`shrink-0 text-muted-2 transition group-hover:text-muted ${open ? "rotate-180" : ""}`} />
            )}
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
