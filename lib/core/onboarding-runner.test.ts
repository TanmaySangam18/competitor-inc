import { describe, it, expect, vi } from "vitest";
import { runService, runOnboarding, type BrowserDriver, type RunnerDeps } from "./onboarding-runner";
import type { SetupRecipe } from "./onboarding";
import { killSwitch } from "@/lib/core/killswitch";

const fakeDriver = (detect = true): BrowserDriver => ({
  navigate: vi.fn(async () => {}),
  fill: vi.fn(async () => {}),
  detect: vi.fn(async () => detect),
});

// A recipe: agent opens+fills, human generates (hard-stop), agent detects.
const recipe: SetupRecipe = {
  connectionId: "github", name: "GitHub", oauth: true,
  steps: [
    { actor: "agent", label: "Open token page", url: "https://x/tokens", prefill: ["name: competitor.inc", "scopes: repo"] },
    { actor: "human", label: "Click Generate token", hardStop: "authenticate", url: "https://x/tokens" },
    { actor: "agent", label: "Detect + store", detect: "GITHUB_TOKEN" },
  ],
};

describe("onboarding co-pilot — the hands (ADR-0018)", () => {
  it("no consent → the driver is NEVER touched", async () => {
    const d = fakeDriver();
    const deps: RunnerDeps = { driver: d, consent: false };
    const r = await runOnboarding([recipe], deps);
    expect(r.ran).toBe(false);
    expect(d.navigate).not.toHaveBeenCalled();
  });

  it("drives the agent step (navigate + non-secret fill), then PAUSES at the human hard-stop", async () => {
    const d = fakeDriver();
    const run = await runService(recipe, { driver: d, consent: true });
    expect(d.navigate).toHaveBeenCalledWith("https://x/tokens");
    expect(d.fill).toHaveBeenCalledWith(["name: competitor.inc", "scopes: repo"]);
    expect(run.pausedOn?.hardStop).toBe("authenticate");
    expect(run.completed).toBe(false);
    // the human step was NOT driven — navigate called exactly once (the agent step only)
    expect((d.navigate as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1);
  });

  it("the kill switch BLOCKS before any driver call (governance first)", async () => {
    killSwitch.engageGlobal();
    try {
      const d = fakeDriver();
      const run = await runService(recipe, { driver: d, consent: true });
      expect(run.outcomes[0].status).toBe("blocked");
      expect(d.navigate).not.toHaveBeenCalled();
    } finally { killSwitch.disengageGlobal(); }
  });

  it("defense in depth: an AGENT step mislabeled with a hard-stop is refused, not driven", async () => {
    const bad: SetupRecipe = { connectionId: "x", name: "X", oauth: false,
      steps: [{ actor: "agent", label: "sneaky pay", hardStop: "pay", url: "https://pay" }] };
    const d = fakeDriver();
    const run = await runService(bad, { driver: d, consent: true });
    expect(run.pausedOn).toBeTruthy();
    expect(d.navigate).not.toHaveBeenCalled();
  });

  it("a failed detect() leaves the step UNVERIFIED (no false 'connected')", async () => {
    const solo: SetupRecipe = { connectionId: "x", name: "X", oauth: false,
      steps: [{ actor: "agent", label: "detect", detect: "SOME_KEY" }] };
    const run = await runService(solo, { driver: fakeDriver(false), consent: true });
    expect(run.completed).toBe(false);
    expect(run.outcomes[0].status).toBe("unverified");
  });

  it("reports each performed step to Slack", async () => {
    const report = vi.fn(async (_text: string) => {});
    const solo: SetupRecipe = { connectionId: "x", name: "X", oauth: false,
      steps: [{ actor: "agent", label: "Open page", url: "https://x", prefill: ["name: y"] }] };
    await runService(solo, { driver: fakeDriver(), consent: true, report });
    expect(report).toHaveBeenCalled();
    expect(report.mock.calls[0][0]).toContain("Open page");
  });
});
