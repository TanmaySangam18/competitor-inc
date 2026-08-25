// ─────────────────────────────────────────────────────────────────────────────
// GEMINI THROUGH GOOGLE'S OWN SDK.
//
// WHY THIS FILE EXISTS AT ALL, given the registry already had a `gemini` entry: that entry points at
// Google's OpenAI-COMPATIBLE endpoint, so calls went out through our generic OpenAI adapter. That works,
// and it is not the same thing as using a Google agent framework. If we are going to say we build on
// Google's stack, the call has to actually go through Google's SDK. Saying it while routing through a
// compatibility shim would be the kind of claim this codebase refuses everywhere else.
//
// MODEL IDS ARE NOT HARDCODED, and that is a scar rather than a preference. Earlier tonight the default
// Groq model pointed at something the provider had decommissioned, so a valid key returned a 404 on every
// call. The lesson: a model id is a fact about the outside world, and facts about the outside world get
// verified, not assumed. listModels() asks Google what it actually serves.
// ─────────────────────────────────────────────────────────────────────────────

import { GoogleGenAI } from "@google/genai";

/** What the hackathon requires and what we default to. Overridable, and verifiable via listModels(). */
export const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash";

export function geminiKey(env: Record<string, string | undefined> = process.env): string | null {
  const k = (env.GEMINI_API_KEY || env.GOOGLE_API_KEY || "").trim();
  return k || null;
}

export function geminiConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return geminiKey(env) !== null;
}

let cached: GoogleGenAI | null = null;
function client(key: string): GoogleGenAI {
  if (!cached) cached = new GoogleGenAI({ apiKey: key });
  return cached;
}

/** Reset between tests, and after a key change. */
export function resetGeminiClient(): void {
  cached = null;
}

export type GeminiResult = { text: string } | { error: string };

/**
 * One completion, through Google's SDK.
 *
 * Returns the provider's own error rather than null. A refusal that does not say what to fix is the
 * thing that cost hours tonight, and it is not repeating.
 */
export async function askGemini(
  system: string,
  user: string,
  opts: { model?: string; maxTokens?: number; env?: Record<string, string | undefined> } = {}
): Promise<GeminiResult> {
  const key = geminiKey(opts.env ?? process.env);
  if (!key) return { error: "GEMINI_API_KEY is not set, so no Gemini call was attempted." };

  const model = opts.model ?? GEMINI_MODEL;
  try {
    const res = await client(key).models.generateContent({
      model,
      contents: user,
      config: {
        systemInstruction: system,
        maxOutputTokens: opts.maxTokens ?? 900,
      },
    });
    const text = (res.text ?? "").trim();
    // An empty completion is not an error, but it is not an answer either, and naming the model that
    // produced nothing is the difference between a fix and a guess.
    return text ? { text } : { error: `${model} returned an empty reply.` };
  } catch (e) {
    return { error: `${model}: ${e instanceof Error ? e.message : "unknown error"}` };
  }
}

/**
 * Ask Google what it actually serves. Exists so a wrong model id is a checkable fact rather than a
 * silent 404, which is exactly how tonight's Groq bug hid.
 */
export async function listGeminiModels(
  env: Record<string, string | undefined> = process.env
): Promise<{ models: string[] } | { error: string }> {
  const key = geminiKey(env);
  if (!key) return { error: "GEMINI_API_KEY is not set." };
  try {
    const out: string[] = [];
    for await (const m of await client(key).models.list()) {
      if (m.name) out.push(m.name.replace(/^models\//, ""));
    }
    return { models: out.sort() };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "unknown error" };
  }
}
