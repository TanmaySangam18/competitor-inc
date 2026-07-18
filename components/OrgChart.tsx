"use client";

// components/OrgChart.tsx — the expandable org chart's client island (ADR-0008).
//
// Receives the ALREADY-DERIVED department trees from the server page (which computes them from the
// canonical lib/org/organization.ts — this component never hardcodes a role or a count). Handles the
// only interactive part: expand/collapse per department, plus auto-expanding the department named in
// the URL hash (the landing's teaser links to /org#engineering etc.). Monochrome: hairline connectors,
// mono labels, no color.

import { useEffect, useState } from "react";

export interface RoleNode {
  id: string;
  title: string;
  level: string;
  mandate: string;
  children: RoleNode[];
}

export interface DeptView {
  id: string;
  name: string;
  mission: string;
  headTitle: string;
  count: number;
  nodes: RoleNode[];
}

function RoleRow({ node, depth }: { node: RoleNode; depth: number }) {
  return (
    <div className={depth > 0 ? "ml-4 border-l border-border pl-4" : ""}>
      <a href={`/org/${node.id}`} className="group block py-2.5">
        <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
          <span className="text-sm font-semibold tracking-tight underline-offset-4 group-hover:underline">
            {node.title}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-2">{node.level}</span>
        </p>
        <p className="mt-0.5 text-xs leading-snug text-muted">{node.mandate}</p>
      </a>
      {node.children.map((c) => (
        <RoleRow key={c.id} node={c} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function OrgChart({ depts }: { depts: DeptView[] }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  // Deep links from the landing teaser (/org#engineering) open that department.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id && depts.some((d) => d.id === id)) {
      setOpen((o) => ({ ...o, [id]: true }));
      document.getElementById(id)?.scrollIntoView({ block: "start" });
    }
  }, [depts]);

  const allOpen = depts.every((d) => open[d.id]);

  return (
    <div>
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => setOpen(Object.fromEntries(depts.map((d) => [d.id, !allOpen])))}
          className="border border-border px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted transition hover:border-text hover:text-text"
        >
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>

      <div className="mt-3 grid gap-px overflow-hidden border border-border bg-border lg:grid-cols-2">
        {depts.map((d) => {
          const isOpen = !!open[d.id];
          return (
            <section key={d.id} id={d.id} className="bg-bg scroll-mt-6">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen((o) => ({ ...o, [d.id]: !o[d.id] }))}
                className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition hover:bg-surface-2"
              >
                <span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-2">
                    {d.count} {d.count === 1 ? "role" : "roles"} · led by {d.headTitle}
                  </span>
                  <span className="display mt-1 block text-lg leading-snug">{d.name}</span>
                  <span className="mt-1 block text-xs leading-snug text-muted">{d.mission}</span>
                </span>
                <span aria-hidden="true" className={`mt-1 font-mono text-lg text-muted-2 transition ${isOpen ? "rotate-45" : ""}`}>
                  +
                </span>
              </button>
              {isOpen && (
                <div className="border-t border-border px-5 py-3">
                  {d.nodes.map((n) => (
                    <RoleRow key={n.id} node={n} depth={0} />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
