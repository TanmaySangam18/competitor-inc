import "server-only";
import crypto from "node:crypto";

// 1.1 "It knows me" — consent-first self-enrichment (Playbook: Product Direction Review §4).
//
// SAFETY (the safe case in the whole field): this ONLY ever enriches the AUTHENTICATED user's OWN email —
// the data subject IS the user, with a direct relationship and consent at the door. We never accept an
// arbitrary email (so it can't profile third parties), use only PUBLIC sources, never scrape (no LinkedIn),
// never touch sensitive categories, and the UI lets the user confirm/correct/DELETE what we found.
// Fail-soft everywhere: consumer/Gmail resolves poorly (~20–40%), so a graceful "couldn't find much" is normal.

export interface EnrichLink {
  label: string;
  url: string;
}
export interface EnrichResult {
  found: boolean;
  name?: string;
  avatar?: string;
  bio?: string;
  company?: string;
  location?: string;
  links: EnrichLink[];
  sources: string[];
}

const TIMEOUT = 6000;
const UA = "competitor.inc-enrich";

// Gravatar: md5(lowercased email) → public profile JSON. The classic "how did they get my photo + bio."
async function fromGravatar(email: string): Promise<Partial<EnrichResult> | null> {
  const hash = crypto.createHash("md5").update(email.trim().toLowerCase()).digest("hex");
  try {
    const res = await fetch(`https://gravatar.com/${hash}.json`, {
      signal: AbortSignal.timeout(TIMEOUT),
      headers: { "user-agent": UA },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { entry?: Array<Record<string, unknown>> };
    const e = data?.entry?.[0];
    if (!e) return null;
    const accounts = (e.accounts as Array<{ shortname?: string; name?: string; url?: string }>) ?? [];
    const nameObj = e.name as { formatted?: string } | undefined;
    return {
      name: (e.displayName as string) || nameObj?.formatted,
      avatar: e.thumbnailUrl ? `${e.thumbnailUrl as string}?s=200` : undefined,
      bio: e.aboutMe as string | undefined,
      location: e.currentLocation as string | undefined,
      links: accounts.filter((a) => a.url).map((a) => ({ label: a.shortname || a.name || "link", url: a.url! })),
    };
  } catch {
    return null;
  }
}

// GitHub: a public user whose PUBLIC email matches (only returns if they made it public + searchable).
// Uses the operator GITHUB_TOKEN when present (higher rate limit + better email search), else anonymous.
async function fromGitHub(email: string): Promise<Partial<EnrichResult> | null> {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = { accept: "application/vnd.github+json", "user-agent": UA };
  if (token) headers.authorization = `Bearer ${token}`;
  try {
    const search = await fetch(`https://api.github.com/search/users?q=${encodeURIComponent(email)}+in:email`, {
      signal: AbortSignal.timeout(TIMEOUT),
      headers,
    });
    if (!search.ok) return null;
    const data = (await search.json()) as { items?: Array<{ login?: string; html_url?: string; avatar_url?: string }> };
    const hit = data?.items?.[0];
    if (!hit?.login) return null;
    const prof = (await fetch(`https://api.github.com/users/${hit.login}`, {
      signal: AbortSignal.timeout(TIMEOUT),
      headers,
    })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)) as { name?: string; bio?: string; company?: string; location?: string } | null;
    return {
      name: prof?.name || hit.login,
      avatar: hit.avatar_url,
      bio: prof?.bio ?? undefined,
      company: prof?.company ?? undefined,
      location: prof?.location ?? undefined,
      links: hit.html_url ? [{ label: "GitHub", url: hit.html_url }] : [],
    };
  } catch {
    return null;
  }
}

// Enrich the user about THEMSELVES. Merges free public sources, fail-soft. (PDL can be added later, gated
// on PEOPLE_DATA_LABS_API_KEY, for ~95% coverage — same pattern, paid.)
export async function enrichSelf(email: string): Promise<EnrichResult> {
  const out: EnrichResult = { found: false, links: [], sources: [] };
  if (!email || !email.includes("@")) return out;
  const results: Array<readonly [string, Partial<EnrichResult> | null]> = await Promise.all([
    (async () => ["gravatar", await fromGravatar(email)] as const)(),
    (async () => ["github", await fromGitHub(email)] as const)(),
  ]);
  for (const [src, r] of results) {
    if (!r) continue;
    out.found = true;
    out.sources.push(src);
    out.name ??= r.name;
    out.avatar ??= r.avatar;
    out.bio ??= r.bio;
    out.company ??= r.company;
    out.location ??= r.location;
    if (r.links) out.links.push(...r.links);
  }
  const seen = new Set<string>();
  out.links = out.links.filter((l) => l.url && !seen.has(l.url) && (seen.add(l.url), true));
  return out;
}
