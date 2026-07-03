import { describe, it, expect } from "vitest";
import { classifyChannel, attributeChannels, portfolioRoi, parseCampaign, attributeCampaigns, weeklySeries, isoWeek, type EventRow, type SpendInput } from "./attribution";

describe("classifyChannel", () => {
  it("maps common sources to channels; empty → direct; unknown → other", () => {
    expect(classifyChannel("google / cpc")).toBe("paid-search");
    expect(classifyChannel("facebook_ad")).toBe("paid-social");
    expect(classifyChannel("t.co")).toBe("organic-social");
    expect(classifyChannel("news.ycombinator.com")).toBe("community");
    expect(classifyChannel("ref=alice")).toBe("referral");
    expect(classifyChannel("newsletter")).toBe("email");
    expect(classifyChannel("")).toBe("direct");
    expect(classifyChannel("wat")).toBe("other");
  });
});

describe("attributeChannels — real traffic legs, honest money legs", () => {
  const events: EventRow[] = [
    ...Array(100).fill({ type: "view", source: "news.ycombinator.com" }),
    ...Array(8).fill({ type: "signup", source: "news.ycombinator.com" }), // 8% — strong
    ...Array(100).fill({ type: "view", source: "t.co" }),
    ...Array(1).fill({ type: "signup", source: "t.co" }), // 1% — weak
  ];

  it("computes real per-channel signup rate from the pixel", () => {
    const stats = attributeChannels(events);
    const hn = stats.find((s) => s.channel === "community")!;
    expect(hn.views).toBe(100);
    expect(hn.signups).toBe(8);
    expect(hn.signupRate).toBeCloseTo(0.08, 5);
    expect(hn.basis.traffic).toBe("real");
  });

  it("money leg is 'missing' and ROAS null until ad spend is connected — never invented", () => {
    const stats = attributeChannels(events);
    for (const s of stats) {
      expect(s.roas).toBeNull();
      expect(s.spendCents).toBeNull();
      expect(s.basis.money).toBe("missing");
    }
  });

  it("verdict falls back to conversion vs median when there's no ROAS (a real signal)", () => {
    const stats = attributeChannels(events);
    expect(stats.find((s) => s.channel === "community")!.verdict).toBe("scale");
    expect(stats.find((s) => s.channel === "organic-social")!.verdict).toBe("pause");
  });

  it("low-volume channel is 'watch', not judged on noise", () => {
    const stats = attributeChannels([...Array(5).fill({ type: "view", source: "ref=bob" })]);
    expect(stats.find((s) => s.channel === "referral")!.verdict).toBe("watch");
  });

  it("with real spend + attributed revenue, ROAS decides and basis becomes real", () => {
    const spend: SpendInput[] = [{ channel: "paid-search", spendCents: 10000, revenueCents: 40000 }];
    const evs: EventRow[] = [...Array(50).fill({ type: "view", source: "google/cpc" }), ...Array(3).fill({ type: "signup", source: "google/cpc" })];
    const stats = attributeChannels(evs, spend);
    const ps = stats.find((s) => s.channel === "paid-search")!;
    expect(ps.roas).toBeCloseTo(4, 5);
    expect(ps.basis.money).toBe("real");
    expect(ps.verdict).toBe("scale");
  });

  it("pauses a money-losing paid channel (ROAS < 1)", () => {
    const spend: SpendInput[] = [{ channel: "paid-social", spendCents: 50000, revenueCents: 20000 }];
    const evs: EventRow[] = [...Array(50).fill({ type: "view", source: "facebook_ad" })];
    const ps = attributeChannels(evs, spend).find((s) => s.channel === "paid-social")!;
    expect(ps.verdict).toBe("pause");
  });
});

describe("portfolioRoi", () => {
  it("is null until any channel has connected spend (honest empty state)", () => {
    expect(portfolioRoi(attributeChannels([{ type: "view", source: "t.co" }]))).toBeNull();
  });
  it("sums spend + revenue across connected channels", () => {
    const spend: SpendInput[] = [
      { channel: "paid-search", spendCents: 10000, revenueCents: 40000 },
      { channel: "paid-social", spendCents: 10000, revenueCents: 5000 },
    ];
    const evs: EventRow[] = [...Array(30).fill({ type: "view", source: "google/cpc" }), ...Array(30).fill({ type: "view", source: "fb_ad" })];
    const roi = portfolioRoi(attributeChannels(evs, spend))!;
    expect(roi.spendCents).toBe(20000);
    expect(roi.revenueCents).toBe(45000);
    expect(roi.roas).toBeCloseTo(2.25, 5);
  });
});

describe("parseCampaign + attributeCampaigns — campaign-level truth", () => {
  it("extracts the /c: suffix; channel classification ignores it", () => {
    expect(parseCampaign("t.co/c:launch-week")).toBe("launch-week");
    expect(parseCampaign("t.co")).toBeNull();
    expect(classifyChannel("news.ycombinator.com/c:show-hn")).toBe("community");
  });

  it("rolls up per campaign with verdicts; untagged traffic never fakes a campaign", () => {
    const evs: EventRow[] = [
      ...Array(100).fill({ type: "view", source: "t.co/c:launch-week" }),
      ...Array(9).fill({ type: "signup", source: "t.co/c:launch-week" }),
      ...Array(100).fill({ type: "view", source: "t.co/c:meme-thread" }),
      ...Array(1).fill({ type: "signup", source: "t.co/c:meme-thread" }),
      ...Array(500).fill({ type: "view", source: "t.co" }), // untagged
    ];
    const stats = attributeCampaigns(evs);
    expect(stats.length).toBe(2);
    const launch = stats.find((s) => s.campaign === "launch-week")!;
    expect(launch.verdict).toBe("scale");
    expect(stats.find((s) => s.campaign === "meme-thread")!.verdict).toBe("pause");
  });
});

describe("weeklySeries — paid vs organic over time", () => {
  it("buckets by ISO week, splits paid/organic, newest last", () => {
    const evs: EventRow[] = [
      { type: "view", source: "google/cpc", createdAt: "2026-06-01T12:00:00Z" },
      { type: "view", source: "t.co", createdAt: "2026-06-01T12:00:00Z" },
      { type: "signup", source: "t.co", createdAt: "2026-06-02T12:00:00Z" },
      { type: "view", source: "fb_ad", createdAt: "2026-06-10T12:00:00Z" },
    ];
    const series = weeklySeries(evs);
    expect(series.length).toBe(2);
    expect(series[0].week < series[1].week).toBe(true);
    expect(series[0].paidViews).toBe(1);
    expect(series[0].organicViews).toBe(1);
    expect(series[0].organicSignups).toBe(1);
    expect(series[1].paidViews).toBe(1);
  });

  it("isoWeek handles year boundaries", () => {
    expect(isoWeek(new Date("2026-01-01T00:00:00Z"))).toMatch(/^202[56]-W\d\d$/);
  });

  it("caps to the requested number of recent weeks and skips undated rows", () => {
    const evs: EventRow[] = Array.from({ length: 12 }, (_, i) => ({ type: "view" as const, source: "t.co", createdAt: Date.UTC(2026, 0, 5 + i * 7) }));
    evs.push({ type: "view", source: "t.co" }); // no createdAt → skipped
    expect(weeklySeries(evs, 8).length).toBe(8);
  });
});
