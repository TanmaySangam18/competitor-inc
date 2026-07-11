import { describe, it, expect } from "vitest";
import { assessSetup, signalsFromCaps, readinessFromCaps, type SetupSignals } from "./autosetup";

const S = (o: Partial<SetupSignals> = {}): SetupSignals => ({ github: false, modelReady: false, deploy: false, outbound: false, ...o });

describe("auto-setup — connect accounts, everything configures itself (zero cognitive load)", () => {
  it("nothing connected → 'connect to start', pointing at the first real gap (GitHub)", () => {
    const r = assessSetup(S());
    expect(r.level).toBe("connect-to-start");
    expect(r.can).toHaveLength(0);
    expect(r.nextStep?.connect).toBe("GitHub");
  });

  it("GitHub but no model → next step is the model, not a flag", () => {
    expect(assessSetup(S({ github: true })).nextStep?.connect).toContain("model");
  });

  it("GitHub + model → can BUILD; the next unlock is deploy (Vercel)", () => {
    const r = assessSetup(S({ github: true, modelReady: true }));
    expect(r.level).toBe("can-build");
    expect(r.can).toContain("build real software from a plain description");
    expect(r.nextStep?.connect).toBe("Vercel");
  });

  it("build + deploy → can BUILD AND RUN; next unlock is reaching customers", () => {
    const r = assessSetup(S({ github: true, modelReady: true, deploy: true }));
    expect(r.level).toBe("can-build-and-run");
    expect(r.can).toContain("deploy it live and keep it running");
    expect(r.nextStep?.connect).toContain("email");
  });

  it("everything connected → fully operating, no next step nagging", () => {
    const r = assessSetup(S({ github: true, modelReady: true, deploy: true, outbound: true }));
    expect(r.level).toBe("fully-operating");
    expect(r.nextStep).toBeNull();
    expect(r.can).toContain("reach customers on your behalf (with your approval)");
  });

  it("never exposes a flag or jargon — the user reads outcomes, not settings", () => {
    for (const s of [S(), S({ github: true }), S({ github: true, modelReady: true }), S({ github: true, modelReady: true, deploy: true })]) {
      const r = assessSetup(s);
      const text = [r.headline, r.nextStep?.connect ?? "", r.nextStep?.unlocks ?? "", ...r.can].join(" ").toLowerCase();
      for (const jargon of ["env", "flag", "migration", "fullstack_builds", "token", "api key", "supabase", "service role", "sensitive"]) {
        expect(text).not.toContain(jargon);
      }
    }
  });

  it("maps real capabilities() output honestly (only real connections count)", () => {
    const caps = { model: true, github: true, deploy: false, email: true, bluesky: false, ads: false, mastodon: false, reddit: false, payments: false };
    const sig = signalsFromCaps(caps);
    expect(sig).toEqual({ github: true, modelReady: true, deploy: false, outbound: true });
    expect(readinessFromCaps(caps).level).toBe("can-build"); // build yes, deploy no
  });
});
