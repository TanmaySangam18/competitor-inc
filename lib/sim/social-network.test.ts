import { describe, it, expect } from "vitest";
import { generateSocialNetwork, socialStats, DEFAULT_MEMBER_COUNT } from "./social-network";

// A small network for shape/behaviour assertions, and one full-size run for the real claim.
const small = generateSocialNetwork("test-seed", { members: 2000, now: Date.UTC(2026, 7, 15) });

describe("the honesty wall", () => {
  it("marks every network simulated:true, literally", () => {
    expect(small.simulated).toBe(true);
  });

  it("carries no field that could be mistaken for a real user count", () => {
    // The wall is that this data proves the MACHINE works, never that PEOPLE showed up. Nothing in the
    // corpus should read like revenue, signups, or a customer.
    const json = JSON.stringify(small.members.slice(0, 50)) + JSON.stringify(small.companies.slice(0, 5));
    expect(json).not.toMatch(/revenue|mrr|arr|subscription|paid|customer/i);
  });
});

describe("determinism", () => {
  it("same seed yields an identical corpus", () => {
    const a = generateSocialNetwork("abc", { members: 500 });
    const b = generateSocialNetwork("abc", { members: 500 });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("different seeds yield different corpora", () => {
    const a = generateSocialNetwork("abc", { members: 500 });
    const b = generateSocialNetwork("xyz", { members: 500 });
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });
});

describe("the connection graph is power-law, not uniform", () => {
  const s = socialStats(small);

  it("produces hubs far above the mean", () => {
    // A uniform random graph would put max close to the mean. A real social graph does not.
    expect(s.maxConnections).toBeGreaterThan(s.avgConnections * 5);
  });

  it("leaves most members below the mean (the long tail)", () => {
    expect(s.belowMeanShare).toBeGreaterThan(0.5);
  });

  it("stores each connection once, canonically ordered", () => {
    // Canonical means NUMERICALLY ordered on the member index. Comparing the raw ids as strings would
    // be wrong ("m_9" > "m_10" lexicographically), which is exactly the trap this test first fell into.
    const idx = (id: string) => Number(id.slice(2));
    const keys = new Set<string>();
    for (const c of small.connections) {
      expect(idx(c.a)).toBeLessThan(idx(c.b));
      const k = `${c.a}:${c.b}`;
      expect(keys.has(k)).toBe(false);
      keys.add(k);
    }
  });

  it("never connects a member to themselves", () => {
    expect(small.connections.some((c) => c.a === c.b)).toBe(false);
  });
});

describe("referential integrity", () => {
  const ids = new Set(small.members.map((m) => m.id));
  const companyIds = new Set(small.companies.map((c) => c.id));
  const postIds = new Set(small.posts.map((p) => p.id));

  it("every connection points at real members", () => {
    for (const c of small.connections.slice(0, 500)) {
      expect(ids.has(c.a) && ids.has(c.b)).toBe(true);
    }
  });

  it("every position points at a real member and a real company", () => {
    for (const p of small.positions.slice(0, 500)) {
      expect(ids.has(p.memberId)).toBe(true);
      expect(companyIds.has(p.companyId)).toBe(true);
    }
  });

  it("every comment points at a real post and a real author", () => {
    for (const c of small.comments.slice(0, 500)) {
      expect(postIds.has(c.postId)).toBe(true);
      expect(ids.has(c.authorId)).toBe(true);
    }
  });

  it("every message runs between two real, distinct members", () => {
    for (const m of small.messages.slice(0, 500)) {
      expect(ids.has(m.senderId) && ids.has(m.recipientId)).toBe(true);
      expect(m.senderId).not.toBe(m.recipientId);
    }
  });

  it("every notification references something that exists", () => {
    const all = new Set([...ids, ...postIds, ...small.comments.map((c) => c.id), ...small.messages.map((m) => m.id), ...small.jobs.map((j) => j.id)]);
    for (const n of small.notifications.slice(0, 500)) {
      expect(ids.has(n.memberId)).toBe(true);
      expect(all.has(n.refId)).toBe(true);
    }
  });
});

describe("time is coherent", () => {
  it("nothing happens in the future", () => {
    for (const p of small.posts.slice(0, 500)) expect(p.createdAt).toBeLessThanOrEqual(small.now);
    for (const m of small.messages.slice(0, 500)) expect(m.sentAt).toBeLessThanOrEqual(small.now);
    for (const n of small.notifications.slice(0, 500)) expect(n.createdAt).toBeLessThanOrEqual(small.now);
  });

  it("a comment never predates its post", () => {
    const at = new Map(small.posts.map((p) => [p.id, p.createdAt]));
    for (const c of small.comments.slice(0, 500)) {
      expect(c.createdAt).toBeGreaterThanOrEqual(at.get(c.postId)!);
    }
  });

  it("a connection never predates either member joining", () => {
    const joined = new Map(small.members.map((m) => [m.id, m.joinedAt]));
    for (const c of small.connections.slice(0, 500)) {
      expect(c.connectedAt).toBeGreaterThanOrEqual(Math.max(joined.get(c.a)!, joined.get(c.b)!));
    }
  });

  it("an unread message has no read timestamp, and a read one reads after it was sent", () => {
    for (const m of small.messages.slice(0, 500)) {
      if (m.readAt !== null) expect(m.readAt).toBeGreaterThan(m.sentAt);
    }
  });
});

describe("the full 50,000", () => {
  const net = generateSocialNetwork("competitor-social-v1");
  const s = socialStats(net);

  it("generates exactly 50,000 members by default", () => {
    expect(DEFAULT_MEMBER_COUNT).toBe(50_000);
    expect(s.members).toBe(50_000);
  });

  it("builds a graph big enough for fan-out to be a real problem", () => {
    expect(s.connections).toBeGreaterThan(100_000);
    expect(s.maxConnections).toBeGreaterThan(500);
  });

  it("has content, conversations and notifications at scale", () => {
    expect(s.posts).toBeGreaterThan(10_000);
    expect(s.comments).toBeGreaterThan(5_000);
    expect(s.messages).toBeGreaterThan(10_000);
    expect(s.notifications).toBeGreaterThan(50_000);
    expect(s.companies).toBeGreaterThan(100);
    expect(s.jobs).toBeGreaterThan(100);
  });
});
