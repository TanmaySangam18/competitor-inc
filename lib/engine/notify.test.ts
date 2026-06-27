import { describe, it, expect, afterEach } from "vitest";
import { notifyCustomer, customerNotifyLive } from "./notify";

describe("customer notifications (provider-agnostic, gated)", () => {
  const orig = process.env.TELEGRAM_BOT_TOKEN;
  afterEach(() => {
    if (orig === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
    else process.env.TELEGRAM_BOT_TOKEN = orig;
  });

  it("is disabled (no-op) when no channel is configured", async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    expect(customerNotifyLive()).toBe(false);
    const r = await notifyCustomer({ telegramChatId: "123" }, "hi"); // token check short-circuits before any fetch
    expect(r.ok).toBe(false);
    expect(r.disabled).toBe(true);
  });

  it("no target ⇒ no-op even when a channel exists", async () => {
    process.env.TELEGRAM_BOT_TOKEN = "test-token";
    expect(customerNotifyLive()).toBe(true);
    const r = await notifyCustomer({}, "hi"); // no telegramChatId → returns before any fetch
    expect(r.channel).toBe("none");
    expect(r.disabled).toBe(true);
  });
});
