// ─────────────────────────────────────────────────────────────────────────────
// HACKATHON RADAR (ADR-0014, founder-as-customer-#1, 2026-07-18).
//
// The bootstrap service: find ongoing/upcoming online hackathons with cash prizes; on "make me win
// this," produce the WIN PLAN — an org-run goal that starts with the COMPLIANCE RULES CHECK (the
// non-negotiable rails from [[hackathon-bootstrap]]): AI-use policy (skip events that ban AI tools,
// never hide usage), event-window originality rules, solo eligibility, disclosure requirements.
//
// $0 by design: discovery hits Devpost's public listing endpoint with plain fetch (no key, no paid
// scraper; UNOFFICIAL endpoint — parser is defensive and fails honest). Idea/strategy generation is
// cognition and runs in the org only when a model key is connected; without one the radar still finds
// and ranks, and says plainly what's missing.
// ─────────────────────────────────────────────────────────────────────────────

export interface RadarHit {
  title: string;
  url: string;
  prizeUsd: number; // parsed from the listing; 0 = unstated (kept honest, still listed)
  online: boolean;
  openState: string; // "open" | "upcoming" | as reported
  submissionDates: string;
  source: "devpost";
}

const DEVPOST_URL = "https://devpost.com/api/hackathons?status[]=open&status[]=upcoming&open_to[]=public";

function parsePrize(html: unknown): number {
  if (typeof html !== "string") return 0;
  // Real Devpost shape: `$<span data-currency-value>100,000</span>` — strip tags BEFORE matching.
  const m = html.replace(/<[^>]*>/g, "").replace(/,/g, "").match(/\$\s*(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

/** Scan Devpost's public listing. Injectable fetch → offline tests; network/shape failures are honest. */
export async function scanHackathons(opts: { fetchImpl?: typeof fetch; minPrizeUsd?: number } = {}): Promise<
  { ok: true; hits: RadarHit[] } | { ok: false; error: string }
> {
  const doFetch = opts.fetchImpl ?? fetch;
  try {
    const res = await doFetch(DEVPOST_URL, { headers: { accept: "application/json" } });
    if (!res.ok) return { ok: false, error: `devpost listing → HTTP ${res.status} (unofficial endpoint may have moved)` };
    const data = (await res.json()) as { hackathons?: Array<Record<string, unknown>> };
    if (!Array.isArray(data.hackathons)) return { ok: false, error: "devpost reply shape changed — radar needs a parser update, not guesses" };
    const hits = data.hackathons
      .map((h): RadarHit => ({
        title: String(h.title ?? "untitled"),
        url: String(h.url ?? ""),
        prizeUsd: parsePrize(h.prize_amount),
        online: /online|virtual/i.test(JSON.stringify(h.displayed_location ?? "")) ,
        openState: String(h.open_state ?? "unknown"),
        submissionDates: String(h.submission_period_dates ?? ""),
        source: "devpost",
      }))
      .filter((h) => h.url && h.online && h.prizeUsd >= (opts.minPrizeUsd ?? 0))
      .sort((a, b) => b.prizeUsd - a.prizeUsd);
    return { ok: true, hits };
  } catch (e) {
    return { ok: false, error: `radar network error: ${e instanceof Error ? e.message : "unknown"}` };
  }
}

/**
 * "Make me win this" → the org-run goal. Compliance FIRST: the run's opening tasks are the rules
 * check, and the goal states the abort condition (AI-banned events are skipped, never gamed).
 * The founder registers and submits personally — the org builds; the human enters.
 */
export function winPlan(hit: RadarHit): { goal: string; rulesCheck: string[] } {
  const rulesCheck = [
    `Read the full rules at ${hit.url}: does the event ALLOW AI tools/assistants? If banned → ABORT this plan and report why (we skip, we never hide).`,
    "Event-window rule: may work be prepared before the event, or must all work happen in-window? Plan the build schedule to comply exactly.",
    "Eligibility: solo entrants allowed? Region/student restrictions? Disclosure requirements for AI use? List what the founder must declare.",
    "Prize terms: cash vs credits, payout conditions, IP assignment clauses — flag anything that transfers ownership of the submission.",
  ];
  return {
    goal: [
      `WIN PLAN — ${hit.title} (${hit.prizeUsd ? `$${hit.prizeUsd.toLocaleString()} prize pool` : "prize unstated"}, submissions ${hit.submissionDates || "TBA"}).`,
      `Step 0 (gate): complete the compliance rules check below; ABORT if AI assistance is prohibited.`,
      `Then: analyze judging criteria + sponsor tracks from ${hit.url}; propose the 3 strongest COMPLIANT ideas ranked by (judge fit × build feasibility × demo impact); founder picks one;`,
      `build the submission through the standard pipeline (design review + regression wall + live deploy + demo script), disclosing AI authorship per the rules.`,
      `Honesty floor: no fabricated metrics or users in the submission; "built by my AI software company, disclosed" IS the story.`,
    ].join(" "),
    rulesCheck,
  };
}
