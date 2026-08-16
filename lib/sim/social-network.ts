// ─────────────────────────────────────────────────────────────────────────────
// THE SYNTHETIC SOCIAL NETWORK (SIM) — 50,000 fake members and the graph they live in.
//
// The founder's framing: "imagine LinkedIn where every human account vanishes, but the tech and the
// features remain." This is that substrate. A professional network with everything EXCEPT real people:
// members, work history, education, skills, a realistic connection graph, posts, comments, reactions,
// conversations, notifications, companies, and jobs.
//
// WHY IT EXISTS: you cannot test whether a machine can BUILD a social product against an empty database.
// Feed queries behave differently at 50k members than at 5. Fan-out is trivial until someone has 3,000
// connections. Search relevance is meaningless over ten rows. This is the crash-test data that makes
// those behaviours real.
//
// HONESTY WALL (load-bearing, [[crack-audit-and-no-fake-proof]]): every network is `simulated: true`.
// These 50,000 members may NEVER count toward a user number, a metric, a receipt, or a public claim. They
// prove the MACHINE works; they never prove that PEOPLE showed up. Same rule as synthetic-enterprise.ts.
//
// Pure + deterministic: no I/O, no clock (now is injected). Same seed ⇒ byte-identical network, so a
// compounding run in week 6 is measured against exactly the data week 1 saw.
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_MEMBER_COUNT = 50_000;

export interface SimMember {
  id: string;
  name: string;
  headline: string;
  location: string;
  industry: string;
  joinedAt: number;
  /** Power-law: most members have few connections, a few have thousands. */
  connectionCount: number;
}

export interface SimPosition {
  memberId: string;
  companyId: string;
  title: string;
  startedAt: number;
  endedAt: number | null; // null = current role
}

export interface SimEducation {
  memberId: string;
  school: string;
  degree: string;
  field: string;
  endedAt: number;
}

export interface SimSkill {
  memberId: string;
  skill: string;
  endorsements: number;
}

/** An undirected accepted connection. Always stored a<b so the pair is canonical and never duplicated. */
export interface SimConnection {
  a: string;
  b: string;
  connectedAt: number;
}

export interface SimPost {
  id: string;
  authorId: string;
  body: string;
  createdAt: number;
  reactions: number;
  commentCount: number;
}

export interface SimComment {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  createdAt: number;
}

export interface SimMessage {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  body: string;
  sentAt: number;
  readAt: number | null;
}

export type SimNotificationKind = "connection-request" | "post-reaction" | "comment" | "message" | "job-match";

export interface SimNotification {
  id: string;
  memberId: string;
  kind: SimNotificationKind;
  refId: string;
  createdAt: number;
  readAt: number | null;
}

export interface SimCompany {
  id: string;
  name: string;
  industry: string;
  size: string;
  foundedAt: number;
}

export interface SimJob {
  id: string;
  companyId: string;
  title: string;
  location: string;
  postedAt: number;
  applicantCount: number;
}

export interface SyntheticSocialNetwork {
  simulated: true; // THE WALL — literal true, never a real tenant
  seed: string;
  now: number;
  members: SimMember[];
  companies: SimCompany[];
  positions: SimPosition[];
  educations: SimEducation[];
  skills: SimSkill[];
  connections: SimConnection[];
  posts: SimPost[];
  comments: SimComment[];
  messages: SimMessage[];
  notifications: SimNotification[];
  jobs: SimJob[];
}

// ── deterministic pseudo-randomness (mulberry32 over an FNV-1a seed) ─────────
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function rng(seed: string): () => number {
  let a = hashSeed(seed);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T,>(r: () => number, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)];
const between = (r: () => number, lo: number, hi: number): number => lo + Math.floor(r() * (hi - lo + 1));

// ── vocabulary (small on purpose: texture is a later model pass, scale is code) ──
const FIRST = ["Ana", "Ben", "Chen", "Dara", "Eli", "Fatima", "Gus", "Hana", "Ivan", "Jade", "Kofi", "Lena", "Mateo", "Nia", "Omar", "Priya", "Quinn", "Rosa", "Sam", "Tara", "Uma", "Viktor", "Wei", "Xiomara", "Yusuf", "Zara"] as const;
const LAST = ["Adeyemi", "Bianchi", "Cruz", "Duarte", "Eriksen", "Farouk", "Gupta", "Haddad", "Ibrahim", "Jensen", "Kowalski", "Lindqvist", "Mbeki", "Nakamura", "Okafor", "Petrov", "Quiroga", "Rahman", "Silva", "Tanaka", "Ueda", "Vargas", "Wu", "Ximenes", "Yilmaz", "Zhao"] as const;
const INDUSTRIES = ["Software", "Healthcare", "Finance", "Education", "Logistics", "Manufacturing", "Retail", "Energy", "Media", "Biotech"] as const;
const CITIES = ["Boston", "Austin", "Berlin", "Toronto", "Bengaluru", "Singapore", "Lagos", "São Paulo", "Warsaw", "Manchester", "Seattle", "Dublin"] as const;
const TITLES = ["Software Engineer", "Product Manager", "Data Analyst", "Designer", "Account Executive", "Support Specialist", "Operations Lead", "Recruiter", "Finance Analyst", "Marketing Manager", "Research Scientist", "QA Engineer"] as const;
const SENIORITY = ["Junior", "", "Senior", "Staff", "Principal", "Head of"] as const;
const SCHOOLS = ["Northeastern University", "State Polytechnic", "City College", "National Institute", "Metropolitan University"] as const;
const DEGREES = ["BS", "BA", "MS", "MBA", "PhD"] as const;
const FIELDS = ["Computer Science", "Business", "Economics", "Design", "Biology", "Mechanical Engineering"] as const;
const SKILLS = ["TypeScript", "SQL", "Product Strategy", "Figma", "Kubernetes", "Financial Modelling", "Public Speaking", "Data Visualisation", "Negotiation", "Machine Learning", "Copywriting", "Project Management"] as const;
const COMPANY_WORDS = ["North", "Vertex", "Lumen", "Harbor", "Quanta", "Cedar", "Atlas", "Nimbus", "Forge", "Meridian"] as const;
const COMPANY_TAIL = ["Labs", "Systems", "Group", "Works", "Technologies", "Partners"] as const;
const SIZES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5000+"] as const;
const POST_OPENERS = ["Shipped something today:", "A thing I got wrong this month:", "Hiring for my team:", "Notes from a hard week:", "Unpopular opinion:", "Six months in, here is what changed:"] as const;
const POST_BODIES = ["the boring part was the part that mattered", "we cut scope twice and it still worked", "nobody warned me about the migration", "the fix was one line and four days", "our users told us plainly and we listened late", "measuring it changed what we did"] as const;
const COMMENT_BODIES = ["This matches what we saw.", "Congratulations, well earned.", "How did you handle the rollback?", "Saving this for my team.", "Strong disagree, and here is why.", "Thanks for saying the quiet part."] as const;
const MESSAGE_BODIES = ["Are you free for 15 minutes this week?", "Thanks for the intro, following up now.", "Saw your post, we are solving the same thing.", "Sending the doc over shortly.", "Would you be open to a referral chat?"] as const;

const DAY = 86_400_000;

export interface SocialOptions {
  members?: number;
  now?: number;
  /** Average accepted connections per member. Real professional networks sit near 100 to 500. */
  avgConnections?: number;
}

/**
 * Generate the network. Deterministic in `seed`: identical input yields an identical corpus, which is
 * what lets a compounding experiment in week 6 be compared against week 1 honestly.
 *
 * The connection graph uses PREFERENTIAL ATTACHMENT (each new member attaches to existing members with
 * probability proportional to their current degree), which produces the power-law shape real social
 * graphs have: a long tail of members with a handful of links and a small set of hubs with thousands.
 * A uniform-random graph would make fan-out and feed queries look far easier than they are.
 */
export function generateSocialNetwork(seed: string, opts: SocialOptions = {}): SyntheticSocialNetwork {
  const r = rng(seed);
  const memberCount = Math.max(1, opts.members ?? DEFAULT_MEMBER_COUNT);
  const now = opts.now ?? Date.UTC(2026, 7, 15);
  const avgConnections = Math.max(1, opts.avgConnections ?? 40);
  const start = now - 12 * 365 * DAY; // a twelve-year-old network

  // ── companies ─────────────────────────────────────────────────────────────
  const companyCount = Math.max(8, Math.round(memberCount / 60));
  const companies: SimCompany[] = [];
  for (let i = 0; i < companyCount; i++) {
    companies.push({
      id: `co_${i}`,
      name: `${pick(r, COMPANY_WORDS)} ${pick(r, COMPANY_TAIL)}`,
      industry: pick(r, INDUSTRIES),
      size: pick(r, SIZES),
      foundedAt: between(r, start - 8 * 365 * DAY, now - 365 * DAY),
    });
  }

  // ── members ───────────────────────────────────────────────────────────────
  const members: SimMember[] = [];
  for (let i = 0; i < memberCount; i++) {
    const sen = pick(r, SENIORITY);
    const title = pick(r, TITLES);
    members.push({
      id: `m_${i}`,
      name: `${pick(r, FIRST)} ${pick(r, LAST)}`,
      headline: sen ? `${sen} ${title}` : title,
      location: pick(r, CITIES),
      industry: pick(r, INDUSTRIES),
      joinedAt: between(r, start, now - DAY),
      connectionCount: 0, // filled by the graph pass
    });
  }

  // ── the connection graph (preferential attachment) ────────────────────────
  const connections: SimConnection[] = [];
  const degree = new Array<number>(memberCount).fill(0);
  // A repeated-node list: a member appears once per edge, so sampling it uniformly samples nodes in
  // proportion to their degree. This is what makes hubs emerge instead of a flat random graph.
  const bag: number[] = [];
  const seen = new Set<string>();
  const linksPerJoin = Math.max(1, Math.round(avgConnections / 2));

  for (let i = 1; i < memberCount; i++) {
    const links = Math.min(i, Math.max(1, between(r, 1, linksPerJoin * 2)));
    for (let k = 0; k < links; k++) {
      // 85% attach preferentially (to the already-connected), 15% uniformly (keeps the tail alive).
      const j = bag.length > 0 && r() < 0.85 ? bag[Math.floor(r() * bag.length)] : Math.floor(r() * i);
      if (j === i) continue;
      const a = Math.min(i, j), b = Math.max(i, j);
      const key = `${a}:${b}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const at = Math.max(members[a].joinedAt, members[b].joinedAt);
      connections.push({ a: `m_${a}`, b: `m_${b}`, connectedAt: between(r, at, now) });
      degree[a]++; degree[b]++;
      bag.push(a, b);
    }
  }
  for (let i = 0; i < memberCount; i++) members[i].connectionCount = degree[i];

  // ── profile detail ────────────────────────────────────────────────────────
  const positions: SimPosition[] = [];
  const educations: SimEducation[] = [];
  const skills: SimSkill[] = [];
  for (let i = 0; i < memberCount; i++) {
    const m = members[i];
    const roles = between(r, 1, 4);
    let cursor = m.joinedAt - between(r, 0, 6 * 365 * DAY);
    for (let k = 0; k < roles; k++) {
      const startedAt = cursor;
      const last = k === roles - 1;
      const endedAt = last && r() < 0.75 ? null : startedAt + between(r, 200 * DAY, 1400 * DAY);
      positions.push({
        memberId: m.id,
        companyId: pick(r, companies).id,
        title: m.headline,
        startedAt,
        endedAt: endedAt !== null && endedAt > now ? null : endedAt,
      });
      if (endedAt === null) break;
      cursor = endedAt + between(r, 0, 90 * DAY);
      if (cursor > now) break;
    }
    educations.push({
      memberId: m.id,
      school: pick(r, SCHOOLS),
      degree: pick(r, DEGREES),
      field: pick(r, FIELDS),
      endedAt: m.joinedAt - between(r, 0, 10 * 365 * DAY),
    });
    const skillCount = between(r, 3, 8);
    const used = new Set<string>();
    for (let k = 0; k < skillCount; k++) {
      const s = pick(r, SKILLS);
      if (used.has(s)) continue;
      used.add(s);
      // Endorsements track degree: well-connected members get endorsed more. Realistic, and it gives
      // ranking code something non-uniform to sort by.
      skills.push({ memberId: m.id, skill: s, endorsements: Math.floor(r() * (1 + degree[i] / 4)) });
    }
  }

  // ── content ───────────────────────────────────────────────────────────────
  const posts: SimPost[] = [];
  const comments: SimComment[] = [];
  let commentId = 0;
  for (let i = 0; i < memberCount; i++) {
    // Posting also tracks degree: hubs post more. Keeps the feed skewed the way real feeds are.
    const n = r() < 0.6 ? between(r, 0, 2) : between(r, 0, 2 + Math.floor(degree[i] / 20));
    for (let k = 0; k < n; k++) {
      const id = `p_${posts.length}`;
      const createdAt = between(r, members[i].joinedAt, now);
      const cCount = r() < 0.5 ? 0 : between(r, 1, 6);
      posts.push({
        id,
        authorId: members[i].id,
        body: `${pick(r, POST_OPENERS)} ${pick(r, POST_BODIES)}.`,
        createdAt,
        reactions: Math.floor(r() * (2 + degree[i])),
        commentCount: cCount,
      });
      for (let c = 0; c < cCount; c++) {
        comments.push({
          id: `c_${commentId++}`,
          postId: id,
          authorId: members[Math.floor(r() * memberCount)].id,
          body: pick(r, COMMENT_BODIES),
          createdAt: between(r, createdAt, now),
        });
      }
    }
  }

  // ── conversations (only between connected members, like the real thing) ───
  const messages: SimMessage[] = [];
  const convoSample = Math.min(connections.length, Math.round(memberCount * 0.6));
  for (let i = 0; i < convoSample; i++) {
    const edge = connections[Math.floor(r() * connections.length)];
    const conversationId = `cv_${i}`;
    const turns = between(r, 1, 5);
    let at = between(r, edge.connectedAt, now);
    for (let t = 0; t < turns; t++) {
      const fromA = t % 2 === 0;
      messages.push({
        id: `msg_${messages.length}`,
        conversationId,
        senderId: fromA ? edge.a : edge.b,
        recipientId: fromA ? edge.b : edge.a,
        body: pick(r, MESSAGE_BODIES),
        sentAt: at,
        readAt: r() < 0.7 ? at + between(r, 60_000, 3 * DAY) : null,
      });
      at += between(r, 60_000, 2 * DAY);
      if (at > now) break;
    }
  }

  // ── jobs ──────────────────────────────────────────────────────────────────
  const jobs: SimJob[] = [];
  const jobCount = Math.max(4, Math.round(memberCount / 100));
  for (let i = 0; i < jobCount; i++) {
    jobs.push({
      id: `job_${i}`,
      companyId: pick(r, companies).id,
      title: pick(r, TITLES),
      location: pick(r, CITIES),
      postedAt: between(r, now - 120 * DAY, now),
      applicantCount: between(r, 0, 400),
    });
  }

  // ── notifications (each one points at something that actually exists) ─────
  const notifications: SimNotification[] = [];
  const notifCount = Math.round(memberCount * 1.5);
  for (let i = 0; i < notifCount; i++) {
    const memberId = members[Math.floor(r() * memberCount)].id;
    const roll = r();
    let kind: SimNotificationKind;
    let refId: string;
    if (roll < 0.3 && posts.length) { kind = "post-reaction"; refId = pick(r, posts).id; }
    else if (roll < 0.5 && comments.length) { kind = "comment"; refId = pick(r, comments).id; }
    else if (roll < 0.7 && messages.length) { kind = "message"; refId = pick(r, messages).id; }
    else if (roll < 0.85 && jobs.length) { kind = "job-match"; refId = pick(r, jobs).id; }
    else { kind = "connection-request"; refId = members[Math.floor(r() * memberCount)].id; }
    const createdAt = between(r, now - 90 * DAY, now);
    notifications.push({
      id: `n_${i}`,
      memberId,
      kind,
      refId,
      createdAt,
      readAt: r() < 0.55 ? createdAt + between(r, 60_000, 5 * DAY) : null,
    });
  }

  return { simulated: true, seed, now, members, companies, positions, educations, skills, connections, posts, comments, messages, notifications, jobs };
}

export interface SocialStats {
  members: number;
  connections: number;
  avgConnections: number;
  maxConnections: number;
  /** Share of members whose degree is below the mean. A power law puts this well above half. */
  belowMeanShare: number;
  posts: number;
  comments: number;
  messages: number;
  notifications: number;
  companies: number;
  jobs: number;
}

export function socialStats(n: SyntheticSocialNetwork): SocialStats {
  const degrees = n.members.map((m) => m.connectionCount);
  const total = degrees.reduce((a, b) => a + b, 0);
  const mean = total / Math.max(1, degrees.length);
  return {
    members: n.members.length,
    connections: n.connections.length,
    avgConnections: Math.round((mean + Number.EPSILON) * 100) / 100,
    maxConnections: degrees.reduce((a, b) => (b > a ? b : a), 0),
    belowMeanShare: Math.round((degrees.filter((d) => d < mean).length / Math.max(1, degrees.length)) * 1000) / 1000,
    posts: n.posts.length,
    comments: n.comments.length,
    messages: n.messages.length,
    notifications: n.notifications.length,
    companies: n.companies.length,
    jobs: n.jobs.length,
  };
}
