import { describe, it, expect } from "vitest";
import { paymentsConfigured, connectProduct, checkoutUrl } from "./payments";

// No STRIPE_SECRET_KEY in test env → everything fails SOFT and never touches Stripe.
describe("payments — fail-soft until a key is connected", () => {
  it("reports not configured without a key", () => {
    expect(paymentsConfigured()).toBe(false);
  });

  it("connectProduct returns { configured: false } and makes no Stripe call", async () => {
    const r = await connectProduct({ email: "a@b.com", refreshUrl: "http://x/r", returnUrl: "http://x/done" });
    expect(r).toEqual({ configured: false });
  });

  it("checkoutUrl returns null without a key", async () => {
    const url = await checkoutUrl({ connectedAccount: "acct_x", priceId: "price_x", successUrl: "http://x/ok", cancelUrl: "http://x/no" });
    expect(url).toBeNull();
  });
});
