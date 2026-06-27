import { describe, it, expect } from "vitest";
import { generateCampaignPosts, evaluatePost, ROOMIE, type CampaignPolicy } from "./campaign";

const company = { name: "Plantly", idea: "a marketplace for rare houseplants" };
const policy: CampaignPolicy = { platforms: ["bluesky", "mastodon"], maxPosts: 2, link: "https://plantly.example/t/plantly" };

describe("campaign engine", () => {
  it("brands every post with the link + competitor.inc, per platform", () => {
    const posts = generateCampaignPosts(company, policy);
    expect(posts.length).toBe(4); // 2 platforms × 2 posts
    for (const p of posts) {
      expect(p.text).toContain("Plantly");
      expect(p.text).toContain(policy.link);
      expect(p.text.toLowerCase()).toContain("competitor.inc");
    }
  });

  it("respects each platform's length limit (Bluesky 300)", () => {
    const long: CampaignPolicy = { ...policy, angles: ["x".repeat(400)], platforms: ["bluesky"], maxPosts: 1 };
    const [post] = generateCampaignPosts(company, long);
    expect(post.text.length).toBeLessThanOrEqual(300);
  });

  it("ROOMIE identity is the bot name", () => {
    expect(ROOMIE).toContain("competitor.inc");
  });

  it("evaluator PASSES generated (on-policy) posts", () => {
    for (const p of generateCampaignPosts(company, policy)) {
      expect(evaluatePost(p, policy).pass).toBe(true);
    }
  });

  it("evaluator FAILS off-policy posts (missing link, missing brand, spammy, too long)", () => {
    expect(evaluatePost({ platform: "bluesky", angle: "", text: "no link here, built on competitor.inc" }, policy).pass).toBe(false);
    expect(evaluatePost({ platform: "bluesky", angle: "", text: `check it ${policy.link}` }, policy).pass).toBe(false); // no competitor.inc
    expect(evaluatePost({ platform: "bluesky", angle: "", text: `GUARANTEED riches ${policy.link} competitor.inc` }, policy).pass).toBe(false);
    expect(evaluatePost({ platform: "bluesky", angle: "", text: "a".repeat(320) + ` ${policy.link} competitor.inc` }, policy).pass).toBe(false);
  });
});
