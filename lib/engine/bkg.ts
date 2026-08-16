// v2 — the Business Knowledge Graph (BKG). The memory store (lib/engine/memory.ts) gives the engine
// SEMANTIC recall ("what happened that's similar"); the BKG gives it STRUCTURE — the entities a company
// has accumulated about itself (channels it tried, assets it shipped, metrics it hit, decisions it made)
// and how they connect. Derived ON READ from the activities we already persist, so it needs no new table
// and never goes stale. Pure + deterministic + unit-tested. A model-backed extractor can enrich this
// later; the heuristic core is honest about being heuristic and is useful on day one.

export type EntityType = "channel" | "asset" | "metric" | "decision";

export interface Entity {
  id: string; // `${type}:${label}` — stable, dedupes mentions
  type: EntityType;
  label: string;
  mentions: number;
}
export interface Edge {
  from: string; // entity id
  to: string; // entity id
  rel: string;
}
export interface Graph {
  entities: Entity[];
  edges: Edge[];
}

// Minimal shape we read from an activity (matches lib/core/types Activity).
export interface ActivityLike {
  action?: string;
  meta?: string;
  agent?: string;
}

const CHANNELS = [
  "reddit", "product hunt", "producthunt", "linkedin", "twitter", "tiktok", "instagram",
  "youtube", "bluesky", "mastodon", "hacker news", "discord", "slack", "email", "seo", "ads", "cold outreach",
];

// Pull the entities a single activity reveals. Heuristic + conservative — better to miss than to invent.
export function extractFromActivity(a: ActivityLike): { entities: Omit<Entity, "mentions">[]; } {
  const text = `${a.action ?? ""} ${a.meta ?? ""}`.toLowerCase();
  const out: Omit<Entity, "mentions">[] = [];
  const push = (type: EntityType, label: string) => out.push({ id: `${type}:${label}`, type, label });

  for (const c of CHANNELS) if (text.includes(c)) push("channel", c === "producthunt" ? "product hunt" : c);

  // Assets — a shipped artifact (a real URL or a "built/shipped/deployed" verb).
  if (/https?:\/\//.test(`${a.action ?? ""} ${a.meta ?? ""}`)) push("asset", "live url");
  if (/\b(built|shipped|deployed|launched)\b/.test(text)) push("asset", "shipped build");

  // Metrics — signups, conversion, money.
  if (/\bsignups?\b/.test(text)) push("metric", "signups");
  if (/%|\bctr\b|\bconversion\b/.test(text)) push("metric", "conversion");
  if (/\$\s?\d/.test(`${a.action ?? ""} ${a.meta ?? ""}`)) push("metric", "spend/revenue");

  // Decisions — an explicit choice the company made.
  if (/\b(decided|chose|validated|pivoted|killed)\b/.test(text)) push("decision", "decision made");

  return { entities: out };
}

// Build the whole graph from a company's activity history. Newest-or-oldest order doesn't matter —
// mentions accumulate. Edges connect co-occurring entities within an activity (they're related because
// they happened together), capped so the graph stays legible.
export function buildGraph(activities: ActivityLike[], maxEntities = 24): Graph {
  const byId = new Map<string, Entity>();
  const edgeKey = new Set<string>();
  const edges: Edge[] = [];

  for (const a of activities ?? []) {
    const { entities } = extractFromActivity(a);
    for (const e of entities) {
      const existing = byId.get(e.id);
      if (existing) existing.mentions += 1;
      else byId.set(e.id, { ...e, mentions: 1 });
    }
    // co-occurrence edges within this activity
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const [from, to] = [entities[i].id, entities[j].id].sort();
        const k = `${from}|${to}`;
        if (!edgeKey.has(k)) {
          edgeKey.add(k);
          edges.push({ from, to, rel: "co-occurred" });
        }
      }
    }
  }

  const entities = [...byId.values()].sort((x, y) => y.mentions - x.mentions).slice(0, maxEntities);
  const kept = new Set(entities.map((e) => e.id));
  return { entities, edges: edges.filter((e) => kept.has(e.from) && kept.has(e.to)) };
}

// A compact, model-injectable summary of what the company knows about itself. Empty string when the
// graph is empty (so it adds nothing to a prompt rather than noise).
export function summarizeGraph(g: Graph): string {
  if (!g.entities.length) return "";
  const byType = (t: EntityType) => g.entities.filter((e) => e.type === t).map((e) => e.label);
  const parts: string[] = [];
  const channels = byType("channel");
  const assets = byType("asset");
  const metrics = byType("metric");
  const decisions = byType("decision");
  if (channels.length) parts.push(`channels tried: ${channels.join(", ")}`);
  if (assets.length) parts.push(`assets: ${assets.join(", ")}`);
  if (metrics.length) parts.push(`metrics seen: ${metrics.join(", ")}`);
  if (decisions.length) parts.push(`${decisions.length} decision(s) on record`);
  return parts.length ? `What this company already knows about itself — ${parts.join("; ")}.` : "";
}
