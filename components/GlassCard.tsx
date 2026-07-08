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
  id?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const showBody = !collapsible || open;
  return (
    <section id={id} className={`scroll-mt-24 rounded-3xl glass-panel p-5 sm:p-7 ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => collapsible && setOpen((o) => !o)}
            className={`group flex min-w-0 items-center gap-2 text-left ${collapsible ? "cursor-pointer" : "cursor-default"}`}
            aria-expanded={collapsible ? open : undefined}
          >
            {Icon && <Icon size={16} className="shrink-0 text-muted" />}
            <span className="flex items-baseline gap-2">
              <span className="text-sm font-semibold text-text">{title}</span>
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
      {showBody && <div className={title ? "mt-4" : ""}>{children}</div>}
    </section>
  );
}
