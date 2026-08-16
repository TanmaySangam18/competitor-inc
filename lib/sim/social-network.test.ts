import { describe, it, expect } from "vitest";
import { generateSocialNetwork, socialStats, DEFAULT_MEMBER_COUNT } from "./social-network";

// A small network for shape/behaviour assertions, and one full-size run for the real claim.
const small = generateSocialNetwork("test-seed", { members: 2000, now: Date.UTC(2026, 7, 15) });

describe("the honesty wall", () => {
  it("marks every network simulated:true, literally", () => {
    expect(small.simulated).toBe(true);
  });

  it("carries no FIELD that could be mistaken for revenue or a paying customer", () => {
    // The wall is that this data proves the MACHINE works, never that PEOPLE showed up or PAID. So the
    // check is on field NAMES, not prose: a profile whose about-text mentions customers is just writing,
    // while a field called `revenue` or `paidCustomers` would be a corpus that could be misread as real.
    const keys = new Set<string>();
    const collect = (o: object) => Object.keys(o).forEach((k) => keys.add(k));
    small.members.slice(0, 100).forEach(collect);
    small.companies.forEach(collect);
    small.jobs.slice(0, 50).forEach(collect);
    for (const k of keys) {
      expect(k, `field "${k}" could be misread as a real business metric`)
        .not.toMatch(/^(revenue|mrr|arr|subscription|paid|customers?|signups?|billing)$/i);
    }
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

describe("a profile agrees with itself", () => {
  // These are the fidelity tests. Volume was never the hard part; COHERENCE is. Each one below is a
  // defect found by reading the generated sample by eye, then nailed shut so it cannot come back.
  const byMember = <T extends { memberId: string }>(rows: T[]) => {
    const m = new Map<string, T[]>();
    for (const row of rows) (m.get(row.memberId) ?? m.set(row.memberId, []).get(row.memberId)!).push(row);
    return m;
  };
  const positions = byMember(small.positions);
  const educations = byMember(small.educations);
  const recs = new Map<string, string[]>();
  for (const rec of small.recommendations) recs.set(rec.memberId, [...(recs.get(rec.memberId) ?? []), rec.body]);

  it("gives every member at least one job and one degree", () => {
    for (const m of small.members) {
      expect(positions.get(m.id)?.length ?? 0, `${m.id} has no work history`).toBeGreaterThan(0);
      expect(educations.get(m.id)?.length ?? 0, `${m.id} has no education`).toBeGreaterThan(0);
    }
  });

  it("never demotes anyone: seniority only climbs across a career", () => {
    // The original generator stamped the identical title on every job a member ever held. A human spots
    // that in one glance, so the ladder is now monotonic and asserted.
    for (const [id, ps] of positions) {
      for (let i = 1; i < ps.length; i++) {
        expect(ps[i].level, `${id} went backwards on the ladder`).toBeGreaterThanOrEqual(ps[i - 1].level);
        expect(ps[i].startedAt, `${id} started a job before leaving the last one`).toBeGreaterThanOrEqual(ps[i - 1].endedAt ?? 0);
      }
    }
  });

  it("shows career progression for long careers rather than one frozen title", () => {
    const veterans = small.members.filter((m) => m.yearsExperience >= 16);
    expect(veterans.length).toBeGreaterThan(20);
    const climbed = veterans.filter((m) => {
      const ps = positions.get(m.id) ?? [];
      return ps.length > 1 && ps[ps.length - 1].level > ps[0].level;
    });
    expect(climbed.length / veterans.length).toBeGreaterThan(0.5);
  });

  it("finishes school before starting work", () => {
    for (const [id, ps] of positions) {
      const first = ps[0].startedAt;
      for (const e of educations.get(id) ?? []) {
        expect(e.endedAt, `${id} graduated after their first job began`).toBeLessThanOrEqual(first);
        expect(e.startedAt).toBeLessThan(e.endedAt);
      }
    }
  });

  it("denormalises the title and industry from the job they actually hold", () => {
    const industry = new Map(small.companies.map((c) => [c.id, c.industry]));
    for (const m of small.members) {
      const ps = positions.get(m.id)!;
      const latest = ps[ps.length - 1];
      expect(m.currentTitle).toBe(latest.title);
      expect(m.industry, `${m.id} claims an industry they do not work in`).toBe(industry.get(latest.companyId));
      expect(m.currentCompanyId).toBe(latest.endedAt === null ? latest.companyId : null);
    }
  });

  it("lists skills that belong to the member's own field", () => {
    const skills = new Map<string, string[]>();
    for (const s of small.skills) skills.set(s.memberId, [...(skills.get(s.memberId) ?? []), s.skill]);
    // Every member should share most of their skills with others on the same track. A designer whose
    // list reads SQL / Kubernetes / Financial Modelling is the tell this closes.
    const byTrack = new Map<string, Map<string, number>>();
    for (const m of small.members) {
      const t = byTrack.get(m.track) ?? new Map<string, number>();
      for (const s of skills.get(m.id) ?? []) t.set(s, (t.get(s) ?? 0) + 1);
      byTrack.set(m.track, t);
    }
    for (const [track, counts] of byTrack) {
      const members = small.members.filter((m) => m.track === track).length;
      const top = [...counts.values()].sort((a, b) => b - a).slice(0, 8).reduce((a, b) => a + b, 0);
      const all = [...counts.values()].reduce((a, b) => a + b, 0);
      expect(top / all, `${track} skills are not concentrated in the track`).toBeGreaterThan(0.6);
      expect(members).toBeGreaterThan(0);
    }
  });

  it("never puts the same recommendation twice on one profile", () => {
    for (const [id, bodies] of recs) {
      expect(new Set(bodies).size, `${id} has duplicate recommendation text`).toBe(bodies.length);
      // Same opening clause with a different middle still reads as a template. Openers and closers are
      // unique per profile, not just whole bodies.
      const opens = bodies.map((b) => b.split(",")[0]);
      const closes = bodies.map((b) => b.slice(b.indexOf(". ") + 2));
      expect(new Set(opens).size, `${id} has two recommendations opening identically`).toBe(opens.length);
      expect(new Set(closes).size, `${id} has two recommendations closing identically`).toBe(closes.length);
    }
  });

  it("never holds the same title at three employers in a row", () => {
    for (const [id, ps] of positions) {
      for (let i = 2; i < ps.length; i++) {
        const flat = ps[i].title === ps[i - 1].title && ps[i - 1].title === ps[i - 2].title;
        expect(flat, `${id} held "${ps[i].title}" at three consecutive companies`).toBe(false);
      }
    }
  });

  it("reserves internships for a short first job at the bottom rung", () => {
    for (const [id, ps] of positions) {
      for (let i = 0; i < ps.length; i++) {
        if (ps[i].employmentType !== "Internship") continue;
        expect(i, `${id} took an internship mid-career`).toBe(0);
        expect(ps[i].level, `${id} interned above entry level`).toBe(0);
        expect(ps[i].endedAt, `${id} is still interning`).not.toBeNull();
      }
    }
  });

  it("leaves no multi-year hole at the end of a career", () => {
    // Someone whose newest listed job ended seven years ago, still tagged "open to work", is not a
    // profile: it is a generator that stopped filling the timeline.
    const YEARS = 365 * 86_400_000;
    for (const [id, ps] of positions) {
      const newest = ps[ps.length - 1];
      if (newest.endedAt === null) continue;
      expect(small.now - newest.endedAt, `${id} has been between roles for years`).toBeLessThan(1.2 * YEARS);
    }
  });

  it("covers the whole career with jobs rather than starting it and stopping", () => {
    for (const [id, ps] of positions) {
      const first = ps[0].startedAt;
      const lastEnd = ps[ps.length - 1].endedAt ?? small.now;
      const covered = ps.reduce((a, p) => a + ((p.endedAt ?? small.now) - p.startedAt), 0);
      expect(covered / (lastEnd - first), `${id} has more gap than job`).toBeGreaterThan(0.7);
    }
  });

  it("keeps experience consistent with how long they have been a member", () => {
    // A twelve-year member with one year of experience is the kind of contradiction that makes a corpus
    // useless for testing seniority filters.
    for (const m of small.members) {
      const membershipYears = Math.floor((small.now - m.joinedAt) / (365 * 86_400_000));
      expect(m.yearsExperience, `${m.id} has less experience than membership`).toBeGreaterThanOrEqual(membershipYears);
    }
  });

  it("puts the earliest members at the top of the graph, not random newcomers", () => {
    // Preferential attachment gives degree to whoever arrived first, so join dates have to follow the
    // arrival order or the hubs come out as people who signed up last week.
    const sorted = [...small.members].sort((a, b) => b.connectionCount - a.connectionCount);
    const topJoin = sorted.slice(0, 50).reduce((a, m) => a + m.joinedAt, 0) / 50;
    const bottomJoin = sorted.slice(-50).reduce((a, m) => a + m.joinedAt, 0) / 50;
    expect(topJoin, "the most-connected members are not the earliest").toBeLessThan(bottomJoin);
  });

  it("writes grammatical about-text for one-year careers", () => {
    const rookies = small.members.filter((m) => m.yearsExperience === 1);
    for (const m of rookies) {
      expect(m.about, `${m.id}: "${m.about}"`).not.toMatch(/\bone years\b/i);
      expect(m.about).not.toMatch(/\bMost of my one year have\b/i);
    }
  });

  it("keeps a member's last activity inside their own lifetime on the network", () => {
    for (const m of small.members) {
      expect(m.lastActiveAt).toBeGreaterThanOrEqual(m.joinedAt);
      expect(m.lastActiveAt).toBeLessThanOrEqual(small.now);
    }
  });

  it("scales reach with the graph instead of rolling it independently", () => {
    // Followers are never below connections, and the busiest profiles are seen more than the quietest.
    const sorted = [...small.members].sort((a, b) => b.connectionCount - a.connectionCount);
    const topViews = sorted.slice(0, 50).reduce((a, m) => a + m.profileViews, 0) / 50;
    const bottomViews = sorted.slice(-50).reduce((a, m) => a + m.profileViews, 0) / 50;
    expect(topViews).toBeGreaterThan(bottomViews * 5);
    for (const m of small.members) expect(m.followerCount).toBeGreaterThanOrEqual(m.connectionCount);
  });

  it("gives companies distinct names and coherent size bands", () => {
    expect(new Set(small.companies.map((c) => c.name)).size).toBe(small.companies.length);
    for (const c of small.companies) {
      const [lo, hi] = c.size === "5000+" ? [5001, 24_000] : c.size.split("-").map(Number);
      expect(c.employeeCount).toBeGreaterThanOrEqual(lo);
      expect(c.employeeCount).toBeLessThanOrEqual(hi);
      expect(c.followerCount).toBeGreaterThan(0);
    }
  });

  it("posts jobs with a real poster, a real pay band and real required skills", () => {
    const ids = new Set(small.members.map((m) => m.id));
    for (const j of small.jobs) {
      expect(ids.has(j.postedById)).toBe(true);
      expect(j.salaryMax).toBeGreaterThan(j.salaryMin);
      expect(j.skills.length).toBeGreaterThan(0);
      expect(new Set(j.skills).size).toBe(j.skills.length);
      expect(j.description).toContain(j.title);
    }
  });

  it("writes about-text that is not the same sentence 2,000 times", () => {
    const abouts = new Set(small.members.map((m) => m.about));
    expect(abouts.size / small.members.length).toBeGreaterThan(0.8);
    const headlines = new Set(small.members.map((m) => m.headline));
    expect(headlines.size).toBeGreaterThan(200);
  });

  it("skews activity toward recent, the way a live network does", () => {
    const s = socialStats(small);
    expect(s.activeLast30Share).toBeGreaterThan(0.4);
    expect(s.activeLast30Share).toBeLessThan(0.75);
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
