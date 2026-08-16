import { describe, it, expect, vi } from "vitest";
import { runNow, makeCooldown, MAX_TICKS, COOLDOWN_SECONDS } from "./on-demand";
import type { TickResult } from "./loop-driver";

const T = "acme";
const seq = (...rs: TickResult[]) => {
  let i = 0;
  return vi.fn(async () => rs[Math.min(i++, rs.length - 1)]);
};
const spin: TickResult = { acted: "spun-iteration", detail: "iteration 2 of 5" };

describe("runNow — the guards", () => {
  it("refuses while the kill switch is engaged, before any tick", async () => {
    const tick = seq(spin);
    const r = await runNow(T, { tick, halted: () => true });
    expect(r.ok).toBe(false);
    expect(r.stoppedBecause).toBe("halted");
    expect(tick).not.toHaveBeenCalled();
    expect(r.transcript[0]).toMatch(/halted/i);
  });

  it("enforces a cooldown and says how long to wait", async () => {
    const cd = makeCooldown();
    const tick = seq(spin);
    const t0 = 1_000_000;
    const first = await runNow(T, { tick, ...cd, now: () => t0 });
    expect(first.ok).toBe(true);

    const second = await runNow(T, { tick, ...cd, now: () => t0 + 10_000 });
    expect(second.ok).toBe(false);
    expect(second.stoppedBecause).toBe("cooling-down");
    expect(second.retryAfterSeconds).toBe(COOLDOWN_SECONDS - 10);
    expect(second.ran).toBe(0);
  });

  it("allows the next run once the cooldown has elapsed", async () => {
    const cd = makeCooldown();
    const tick = seq(spin);
    const t0 = 5_000_000;
    await runNow(T, { tick, ...cd, now: () => t0 });
    const later = await runNow(T, { tick, ...cd, now: () => t0 + COOLDOWN_SECONDS * 1000 });
    expect(later.ok).toBe(true);
    expect(later.ran).toBeGreaterThan(0);
  });

  it("cools down per tenant, not globally", async () => {
    const cd = makeCooldown();
    const tick = seq(spin);
    const t0 = 2_000_000;
    await runNow("tenant-a", { tick, ...cd, now: () => t0 });
    const other = await runNow("tenant-b", { tick, ...cd, now: () => t0 + 1000 });
    expect(other.ok).toBe(true);
  });
});

describe("runNow — it never steps over the human", () => {
  it("stops immediately when the loop needs a human, and reports it as success", async () => {
    const tick = seq({ acted: "paused", detail: "waiting on the human" });
    const r = await runNow(T, { tick });
    // ok:true because nothing went wrong. The floor working IS the correct outcome.
    expect(r.ok).toBe(true);
    expect(r.stoppedBecause).toBe("needs-human");
    expect(r.ran).toBe(1);
    expect(tick).toHaveBeenCalledTimes(1);
  });

  it("does not keep ticking after a pause even though the cap allows more", async () => {
    const tick = seq({ acted: "paused", detail: "human step" }, spin, spin);
    const r = await runNow(T, { tick });
    expect(tick).toHaveBeenCalledTimes(1);
    expect(r.ticks).toHaveLength(1);
  });
});

describe("runNow — advancing", () => {
  it("advances up to the tick cap and says how to continue", async () => {
    const tick = seq(spin, spin, spin, spin);
    const r = await runNow(T, { tick });
    expect(r.ran).toBe(MAX_TICKS);
    expect(r.stoppedBecause).toBe("tick-cap");
    expect(r.transcript[r.transcript.length - 1]).toMatch(/run again/i);
  });

  it("stops early when work is already in flight", async () => {
    const tick = seq({ acted: "waiting", detail: "org-run mid-flight" }, spin);
    const r = await runNow(T, { tick });
    expect(r.stoppedBecause).toBe("waiting");
    expect(r.ran).toBe(1);
  });

  it("stops on a finished roadmap", async () => {
    const tick = seq({ acted: "finished", detail: "roadmap complete" });
    const r = await runNow(T, { tick });
    expect(r.ok).toBe(true);
    expect(r.stoppedBecause).toBe("finished");
  });

  it("reports no-loop honestly rather than pretending to work", async () => {
    const tick = seq({ acted: "no-loop", detail: "no loop registered for acme" });
    const r = await runNow(T, { tick });
    expect(r.ok).toBe(false);
    expect(r.stoppedBecause).toBe("no-loop");
    expect(r.transcript[0]).toMatch(/no loop/i);
  });

  it("survives a throwing tick and reports the message", async () => {
    const tick = vi.fn(async () => { throw new Error("supabase down"); });
    const r = await runNow(T, { tick });
    expect(r.ok).toBe(false);
    expect(r.stoppedBecause).toBe("error");
    expect(r.transcript[0]).toMatch(/supabase down/);
  });
});

describe("runNow — the transcript is for a person", () => {
  it("produces one readable line per tick, no em-dashes", async () => {
    const tick = seq(
      { acted: "started-objective", detail: "objective 1: get a paying customer" },
      { acted: "advanced", detail: "criterion evidenced" },
      { acted: "finished", detail: "roadmap complete" },
    );
    const r = await runNow(T, { tick });
    expect(r.transcript).toHaveLength(3);
    expect(r.transcript.join("\n")).not.toMatch(/[—–]/);
    expect(r.transcript[0]).toContain("paying customer");
  });
});
