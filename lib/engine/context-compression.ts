// Runtime cost governance — trim context BEFORE it is sent to a model, so the agent org stays cheap to
// run (COGS discipline; a lean autonomous company must be cheap to operate, not an afterthought). The
// concept is borrowed from 9router (context / tool-output compression). Pure + deterministic — NO model
// call — so it is free and fully testable. It never silently changes meaning: it dedupes exact-repeat
// lines, collapses whitespace, and — only when still over an explicit budget — keeps the head and tail
// and elides the middle with a visible marker. Callers get the byte savings back so cost telemetry stays
// honest (we report what we trimmed; we never pretend a call was cheaper than it was).

export interface CompressOptions {
  /** Hard budget (characters) for the returned text. Default 6000. */
  maxChars?: number;
  /** Fraction of the budget kept from the START when eliding (rest kept from the END). Default 0.6. */
  headRatio?: number;
  /** Drop lines identical to one already seen (keeps the first). Default true. */
  dedupeLines?: boolean;
}

export interface CompressResult {
  text: string;
  originalChars: number;
  compressedChars: number;
  savedChars: number;
  /** compressedChars / originalChars — 1 means no change, lower means more trimmed. */
  ratio: number;
}

const DEFAULTS: Required<CompressOptions> = { maxChars: 6000, headRatio: 0.6, dedupeLines: true };

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/**
 * Compress a blob of context to fit a character budget without destroying meaning beyond the budget.
 * Order: normalize whitespace → (optional) dedupe exact-repeat lines → if still over budget, keep
 * head+tail and elide the middle with a marker that states how much was cut (honest, visible).
 */
export function compressContext(input: string, opts: CompressOptions = {}): CompressResult {
  const o = { ...DEFAULTS, ...opts };
  const maxChars = Math.max(80, Math.floor(o.maxChars)); // a floor so the marker always fits
  const headRatio = clamp(o.headRatio, 0.1, 0.9);
  const original = input ?? "";
  const originalChars = original.length;

  // 1) Cheap lossless-ish passes: normalize line endings, trim trailing spaces, collapse 3+ blank
  //    lines to one, and (opt) drop exact-duplicate lines (common in tool output / recalled memory).
  const seen = new Set<string>();
  let blankRun = 0;
  const kept: string[] = [];
  for (const rawLine of original.replace(/\r\n/g, "\n").split("\n")) {
    const line = rawLine.replace(/[ \t]+$/g, "");
    if (line.trim() === "") {
      blankRun++;
      if (blankRun <= 1) kept.push("");
      continue;
    }
    blankRun = 0;
    if (o.dedupeLines) {
      const key = line.trim();
      if (seen.has(key)) continue;
      seen.add(key);
    }
    kept.push(line);
  }
  let text = kept.join("\n").trim();

  // 2) Budget pass: if still over, keep the head and tail (the ends carry the most signal — the ask
  //    and the latest state) and elide the middle with a marker that reports the cut honestly.
  if (text.length > maxChars) {
    const marker = (n: number) => `\n…[compressed ${n} chars]…\n`;
    // Reserve room for the marker; split the remaining budget head/tail by headRatio.
    const room = maxChars - marker(text.length).length;
    const headLen = Math.max(0, Math.floor(room * headRatio));
    const tailLen = Math.max(0, room - headLen);
    const cut = text.length - headLen - tailLen;
    const head = text.slice(0, headLen);
    const tail = tailLen > 0 ? text.slice(text.length - tailLen) : "";
    text = `${head}${marker(cut)}${tail}`;
    // Guard: never exceed the budget even if the marker math drifts.
    if (text.length > maxChars) text = text.slice(0, maxChars);
  }

  const compressedChars = text.length;
  return {
    text,
    originalChars,
    compressedChars,
    savedChars: Math.max(0, originalChars - compressedChars),
    ratio: originalChars === 0 ? 1 : compressedChars / originalChars,
  };
}

/** Convenience: compress a single tool-output / recalled blob with a tight default budget. */
export function compressToolOutput(text: string, maxChars = 2000): string {
  return compressContext(text, { maxChars }).text;
}

/**
 * Join several context fragments (recall, graph summary, growth notes, …) into ONE budgeted blob.
 * De-duplicates across fragments and trims to `maxChars`. This is the seam the nightly loop uses so
 * priorContext can't balloon the per-shift token bill as a company's history grows.
 */
export function packContext(fragments: Array<string | null | undefined>, maxChars = 6000): CompressResult {
  const joined = fragments.filter((f): f is string => !!f && f.trim().length > 0).join("\n");
  return compressContext(joined, { maxChars });
}
