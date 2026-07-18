import { describe, it, expect } from "vitest";
import { slackInviteUrl, liveCta } from "./slack-invite";

describe("slackInviteUrl — env-based, honest detection", () => {
  it("returns the configured invite URL", () => {
    expect(slackInviteUrl({ NEXT_PUBLIC_SLACK_INVITE_URL: "https://join.slack.com/t/competitor-inc/x" }))
      .toBe("https://join.slack.com/t/competitor-inc/x");
  });

  it("returns null when the var is absent", () => {
    expect(slackInviteUrl({})).toBeNull();
  });

  it("returns null when the var is blank or whitespace (never a dead link)", () => {
    expect(slackInviteUrl({ NEXT_PUBLIC_SLACK_INVITE_URL: "" })).toBeNull();
    expect(slackInviteUrl({ NEXT_PUBLIC_SLACK_INVITE_URL: "   " })).toBeNull();
  });
});

describe("liveCta — the single switch behind every 'Join the Slack' button", () => {
  it("live state: real invite URL, 'Join the Slack'", () => {
    const cta = liveCta({ NEXT_PUBLIC_SLACK_INVITE_URL: "https://join.slack.com/t/competitor-inc/x" });
    expect(cta).toEqual({
      href: "https://join.slack.com/t/competitor-inc/x",
      label: "Join the Slack",
      live: true,
    });
  });

  it("fallback state: /join waitlist, 'Get your Slack invite', live=false", () => {
    const cta = liveCta({});
    expect(cta).toEqual({ href: "/join", label: "Get your Slack invite", live: false });
  });

  it("blank env falls back too — a blank var must never render an empty href", () => {
    expect(liveCta({ NEXT_PUBLIC_SLACK_INVITE_URL: " " }).href).toBe("/join");
  });
});
