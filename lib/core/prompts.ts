// lib/core/prompts.ts — PROMPTS ARE CODE (Tier D · REQUIREMENTS §7).
//
// A system prompt edit changes the entire workforce's behavior at once — so every prompt is versioned,
// rolled out in stages, and instantly rollback-able, exactly like a production deploy. A new version is
// registered STAGED (not live); activating it is the deploy; rollback reverts to the previously-active
// version. Pairs with separation.requiresRegression("prompt") — a prompt change must pass the regression
// wall before it can be activated. Keyless + in-memory; durable versioning wires at connect.

export interface PromptVersion {
  id: string; // the prompt's stable id (e.g. an agent/role id)
  version: number; // monotonic per id
  text: string;
  at: string;
  active: boolean;
}

export class PromptRegistry {
  private byId = new Map<string, PromptVersion[]>();

  // Register a new version — STAGED (never auto-live). Returns it.
  register(id: string, text: string, at: Date = new Date()): PromptVersion {
    const list = this.byId.get(id) ?? [];
    const v: PromptVersion = { id, version: list.length + 1, text, at: at.toISOString(), active: false };
    list.push(v);
    this.byId.set(id, list);
    return v;
  }

  // Activate a version (the "deploy"). Deactivates whatever was live.
  activate(id: string, version: number): PromptVersion | null {
    const list = this.byId.get(id);
    const target = list?.find((v) => v.version === version);
    if (!list || !target) return null;
    for (const v of list) v.active = v.version === version;
    return target;
  }

  // Roll back to the previously-active version (highest active-eligible below the current active).
  rollback(id: string): PromptVersion | null {
    const list = this.byId.get(id);
    if (!list) return null;
    const current = list.find((v) => v.active);
    const below = list.filter((v) => !current || v.version < current.version);
    const prev = below[below.length - 1];
    if (!prev) return null;
    for (const v of list) v.active = v.version === prev.version;
    return prev;
  }

  active(id: string): PromptVersion | null { return this.byId.get(id)?.find((v) => v.active) ?? null; }
  history(id: string): PromptVersion[] { return (this.byId.get(id) ?? []).slice(); }
}

export const prompts = new PromptRegistry();
