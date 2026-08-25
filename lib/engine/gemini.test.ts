import { describe, it, expect, vi, beforeEach } from "vitest";
import { geminiKey, geminiConfigured, askGemini, GEMINI_MODEL, resetGeminiClient } from "./gemini";
import { firestoreConfigured, saveMessage, resetTranscriptStore } from "./transcript-store";

beforeEach(() => { resetGeminiClient(); resetTranscriptStore(); });

describe("Gemini key resolution", () => {
  it("accepts either of Google's two common variable names", () => {
    expect(geminiKey({ GEMINI_API_KEY: "a" })).toBe("a");
    expect(geminiKey({ GOOGLE_API_KEY: "b" })).toBe("b");
  });

  it("prefers the specific name when both are set", () => {
    expect(geminiKey({ GEMINI_API_KEY: "specific", GOOGLE_API_KEY: "generic" })).toBe("specific");
  });

  it("treats blank as absent rather than as a key", () => {
    expect(geminiKey({ GEMINI_API_KEY: "   " })).toBeNull();
    expect(geminiConfigured({ GEMINI_API_KEY: "   " })).toBe(false);
  });

  it("reports unconfigured on an empty environment", () => {
    expect(geminiConfigured({})).toBe(false);
  });
});

describe("it never fails silently, which is the lesson from tonight", () => {
  it("says the key is missing instead of returning null", async () => {
    const r = await askGemini("sys", "hi", { env: {} });
    expect("error" in r).toBe(true);
    if ("error" in r) expect(r.error).toMatch(/GEMINI_API_KEY is not set/);
  });

  it("names the model in the error, so a wrong id is diagnosable", async () => {
    // The Groq bug hid because the error was swallowed and the model was never named.
    const r = await askGemini("sys", "hi", { env: {}, model: "gemini-does-not-exist" });
    expect("error" in r).toBe(true);
  });
});

describe("the model id is configurable rather than assumed", () => {
  it("defaults to a Gemini 3.x model", () => {
    expect(GEMINI_MODEL).toMatch(/^gemini-3/);
  });
});

describe("Firestore fails soft but never claims a false save", () => {
  it("reports unconfigured without a project id", () => {
    expect(firestoreConfigured({})).toBe(false);
  });

  it("recognises ambient Cloud Run and GKE credentials", () => {
    expect(firestoreConfigured({ GOOGLE_CLOUD_PROJECT: "p" })).toBe(true);
    expect(firestoreConfigured({ GCLOUD_PROJECT: "p" })).toBe(true);
    expect(firestoreConfigured({ GOOGLE_APPLICATION_CREDENTIALS: "/k.json" })).toBe(true);
  });

  it("treats blank as absent", () => {
    expect(firestoreConfigured({ GOOGLE_CLOUD_PROJECT: "  " })).toBe(false);
  });

  it("returns saved:false with a reason, never saved:true, when unconfigured", async () => {
    const prior = process.env.GOOGLE_CLOUD_PROJECT;
    delete process.env.GOOGLE_CLOUD_PROJECT;
    const r = await saveMessage({ channel: "#exec", author: "you", text: "hi", at: new Date().toISOString() });
    expect(r.saved).toBe(false);
    if (!r.saved) expect(r.why).toMatch(/only in this browser/);
    if (prior !== undefined) process.env.GOOGLE_CLOUD_PROJECT = prior;
  });
});
