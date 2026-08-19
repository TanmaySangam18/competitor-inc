import "server-only";

// Block V — Demand Radar. The new validation engine: instead of asking people to sign up (weak, slow,
// gameable), the crew CRAWLS THE LIVE WEB in real time, extracts genuine demand signals, and CITES every
// source it read. Every number below traces to a real fetched result — nothing is fabricated. When a
// source is unreachable we say so rather than invent a figure.
//
// Sources are keyless + reliable from a server (verified): Hacker News (Algolia), StackExchange, GitHub
// search, Wikipedia pageviews. Reddit + Bluesky block datacenter IPs, so they arrive via the authenticated
// distribution path (Block D), not here.

export interface RadarSignal {
  source: string;
  title: string;
  url: string; // the citation — a real, openable link
  metric?: string; // e.g. "128 points · 44 comments"
  date?: string; // ISO, when known
}

export interface SourceResult {
  source: string;
  reachable: boolean;
  count: number; // total matches the source reports (breadth of demand)
  engagement: number; // upvotes/comments/answers etc. (depth of demand)
  signals: RadarSignal[]; // top representative items, each with a citation
  note?: string; // set when unreachable/limited, so the report stays honest
}

export interface RadarReport {
  idea: string;
  query: string;
  sources: SourceResult[];
  totalSignals: number;
  totalEngagement: number;
  competition: number; // existing projects in the space (GitHub)
  trend: "rising" | "steady" | "cooling" | "unknown";
  demandScore: number; // 0-100, computed transparently from real counts
  verdict: "strong" | "mixed" | "weak";
  broadened: boolean; // true if we widened the query for recall (semantic-drift caveat applies)
  summary: string;
  citations: string[]; // flat list of every source URL read (proof of work)
}

const STOP = new Set([
  "a","an","the","for","and","or","of","to","in","on","with","that","this","app","platform","tool",
  "my","your","our","is","are","be","it","as","at","by","from","i","we","you","they","help","people",
  "make","build","building","new","startup","idea","company","service","product","using","use","via",
  // filler that was outranking the real nouns: "tells northeastern" beat "co-op postings" until these
  // joined the list. Verbs-of-saying and interrogatives carry no search signal.
  "which","who","what","when","where","why","how","tells","tell","turns","turn","want","wants",
  "need","needs","into","really","actually","just","about","them","their","gets","get","lets","let",
]);

// Pull the meaningful keywords out of an idea sentence (pure — unit-tested without network).
export function deriveQuery(idea: string, max = 5): string {
  const words = (idea || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")     // KEEP hyphens: "co-op" must stay one token, not "co" + "op"
    .split(/\s+/)
    .map((w) => w.replace(/^-+|-+$/g, ""))  // trim stray edge hyphens ("-" alone becomes "")
    .filter((w) => (w.length > 2 || w.includes("-")) && !STOP.has(w));
  // de-dupe, keep order, cap
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of words) {
    if (!seen.has(w)) { seen.add(w); out.push(w); }
    if (out.length >= max) break;
  }
  return out.join(" ") || (idea || "").trim().slice(0, 60);
}

// Some APIs (StackExchange) return HTML-escaped titles. Decode the common entities server-side (no DOM).
function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&#x2F;/g, "/").replace(/&amp;/g, "&");
}

async function getJson(url: string, ms = 8000): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(ms),
      headers: { "user-agent": "competitor.inc-demand-radar/1.0" },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ── Hacker News (Algolia) — discussions + engagement, with dates for the trend read ──
async function crawlHackerNews(query: string): Promise<SourceResult> {
  const u = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=20`;
  const d = (await getJson(u)) as { nbHits?: number; hits?: Array<Record<string, unknown>> } | null;
  if (!d) return { source: "Hacker News", reachable: false, count: 0, engagement: 0, signals: [], note: "unreachable" };
  const hits = d.hits ?? [];
  let engagement = 0;
  const signals: RadarSignal[] = [];
  for (const h of hits) {
    const points = Number(h.points) || 0;
    const comments = Number(h.num_comments) || 0;
    engagement += points + comments;
    if (signals.length < 5 && h.objectID) {
      signals.push({
        source: "Hacker News",
        title: decodeEntities(String(h.title || "(untitled)")).slice(0, 140),
        url: `https://news.ycombinator.com/item?id=${h.objectID}`,
        metric: `${points} points · ${comments} comments`,
        date: h.created_at ? String(h.created_at) : undefined,
      });
    }
  }
  return { source: "Hacker News", reachable: true, count: d.nbHits ?? hits.length, engagement, signals };
}

// ── StackExchange — people ASKING (problem-seeking behavior) ──
async function crawlStackExchange(query: string): Promise<SourceResult> {
  const u = `https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&q=${encodeURIComponent(query)}&site=stackoverflow&pagesize=10&filter=default`;
  const d = (await getJson(u)) as { items?: Array<Record<string, unknown>> } | null;
  if (!d) return { source: "StackExchange", reachable: false, count: 0, engagement: 0, signals: [], note: "unreachable" };
  const items = d.items ?? [];
  let engagement = 0;
  const signals: RadarSignal[] = [];
  for (const it of items) {
    const score = Number(it.score) || 0;
    const answers = Number(it.answer_count) || 0;
    engagement += Math.max(0, score) + answers;
    if (signals.length < 4 && it.link) {
      signals.push({
        source: "StackExchange",
        title: decodeEntities(String(it.title || "(question)")).slice(0, 140),
        url: String(it.link),
        metric: `${score} score · ${answers} answers`,
        date: it.creation_date ? new Date(Number(it.creation_date) * 1000).toISOString() : undefined,
      });
    }
  }
  return { source: "StackExchange", reachable: true, count: items.length, engagement, signals };
}

// ── GitHub — existing projects = competition/supply density (proves a market, or flags saturation) ──
async function crawlGitHub(query: string): Promise<SourceResult> {
  const u = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=5`;
  const d = (await getJson(u)) as { total_count?: number; items?: Array<Record<string, unknown>> } | null;
  if (!d) return { source: "GitHub", reachable: false, count: 0, engagement: 0, signals: [], note: "unreachable or rate-limited" };
  const items = d.items ?? [];
  let engagement = 0;
  const signals: RadarSignal[] = [];
  for (const r of items) {
    const stars = Number(r.stargazers_count) || 0;
    engagement += stars;
    if (signals.length < 4 && r.html_url) {
      signals.push({
        source: "GitHub",
        title: String(r.full_name || "(repo)").slice(0, 140),
        url: String(r.html_url),
        metric: `${stars} stars`,
      });
    }
  }
  return { source: "GitHub", reachable: true, count: d.total_count ?? items.length, engagement, signals };
}

// Compute the trend from Hacker News hit dates: share of discussion in the last ~18 months.
function trendFromHN(hn: SourceResult): RadarReport["trend"] {
  const dated = hn.signals.filter((s) => s.date);
  if (!hn.reachable || dated.length === 0) return "unknown";
  const cutoff = Date.now() - 18 * 30 * 24 * 3600 * 1000;
  const recent = dated.filter((s) => new Date(s.date as string).getTime() >= cutoff).length;
  const share = recent / dated.length;
  if (share >= 0.6) return "rising";
  if (share >= 0.3) return "steady";
  return "cooling";
}

// Transparent scoring — every input is a REAL count. Pure function (unit-tested). 0-100.
export function scoreDemand(input: {
  totalSignals: number;
  totalEngagement: number;
  competition: number;
  trend: RadarReport["trend"];
  reachableSources: number;
  broadened?: boolean;
}): { demandScore: number; verdict: RadarReport["verdict"] } {
  const { totalSignals, totalEngagement, competition, trend, reachableSources, broadened } = input;
  // Log-scale so a few loud signals don't max it out; each component capped.
  const discussion = Math.min(40, Math.round(Math.log10(totalSignals + 1) * 22)); // breadth
  const engage = Math.min(30, Math.round(Math.log10(totalEngagement + 1) * 16)); // depth of caring
  // Competition: some proves a market; zero is risky (no demand) OR greenfield; saturation is hard.
  const comp = competition === 0 ? 6 : competition < 50 ? 18 : competition < 1000 ? 12 : 6;
  const trendAdj = trend === "rising" ? 12 : trend === "steady" ? 6 : trend === "cooling" ? -4 : 0;
  // If we could only reach one source, temper confidence. Broadening the query risks semantic drift
  // (matching adjacent-but-different terms), so temper further when it happened.
  let confidence = reachableSources >= 3 ? 1 : reachableSources === 2 ? 0.85 : 0.7;
  if (broadened) confidence *= 0.8;

  const raw = (discussion + engage + comp + trendAdj) * confidence;
  const demandScore = Math.max(1, Math.min(100, Math.round(raw)));
  const verdict: RadarReport["verdict"] = demandScore >= 62 ? "strong" : demandScore >= 38 ? "mixed" : "weak";
  return { demandScore, verdict };
}

// Assemble the report from crawled sources (pure — unit-tested with injected sources).
export function buildReport(idea: string, query: string, sources: SourceResult[], broadened = false): RadarReport {
  const reachable = sources.filter((s) => s.reachable);
  const totalSignals = reachable.reduce((t, s) => t + (s.source === "GitHub" ? 0 : s.count), 0); // GH = competition, not demand
  const totalEngagement = reachable.reduce((t, s) => t + s.engagement, 0);
  const gh = sources.find((s) => s.source === "GitHub");
  const competition = gh?.reachable ? gh.count : 0;
  const hn = sources.find((s) => s.source === "Hacker News");
  const trend = hn ? trendFromHN(hn) : "unknown";

  const { demandScore, verdict } = scoreDemand({
    totalSignals,
    totalEngagement,
    competition,
    trend,
    reachableSources: reachable.length,
    broadened,
  });

  const citations = sources.flatMap((s) => s.signals.map((sig) => sig.url));
  const unreachable = sources.filter((s) => !s.reachable).map((s) => s.source);

  const summary =
    `Read ${reachable.length} live source${reachable.length === 1 ? "" : "s"} for "${query}": ` +
    `${totalSignals} demand signal${totalSignals === 1 ? "" : "s"}, ${totalEngagement} total engagement, ` +
    `${competition} existing project${competition === 1 ? "" : "s"} (competition), trend ${trend}. ` +
    (verdict === "strong"
      ? "Real, active demand — worth building."
      : verdict === "mixed"
      ? "Some real interest, but not overwhelming — narrow the wedge before building."
      : "Thin demand signal right now — talk to real users before you build.") +
    (broadened ? ` We broadened the search to "${query}" for recall — CHECK the sources below actually match your idea (they may be adjacent).` : "") +
    (unreachable.length ? ` (Couldn't reach: ${unreachable.join(", ")} — score tempered accordingly.)` : "");

  return {
    idea,
    query,
    sources,
    totalSignals,
    totalEngagement,
    competition,
    trend,
    demandScore,
    verdict,
    broadened,
    summary,
    citations,
  };
}

async function crawlAll(query: string): Promise<[SourceResult, SourceResult, SourceResult]> {
  return Promise.all([crawlHackerNews(query), crawlStackExchange(query), crawlGitHub(query)]);
}

// The orchestrator: crawl in parallel (each fails soft), then build the cited report.
// PROGRESSIVE BROADENING: these APIs AND-match terms, so a long query (e.g. 5 words) returns near-zero.
// Start focused (top 3 keywords); if that finds ~nothing, broaden to the top 2 so we don't report a
// false "no demand". We report the query actually used, so the reading stays honest.
export async function runRadar(idea: string): Promise<RadarReport> {
  let query = deriveQuery(idea, 3);
  let [hn, se, gh] = await crawlAll(query);
  let broadened = false;

  const demandSoFar = (hn.reachable ? hn.count : 0) + (se.reachable ? se.count : 0);
  const broader = deriveQuery(idea, 2);
  if (demandSoFar < 5 && broader && broader !== query) {
    query = broader;
    [hn, se, gh] = await crawlAll(query);
    broadened = true;
  }
  return buildReport(idea, query, [hn, se, gh], broadened);
}
