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
// FIDELITY, not just volume. The first pass generated 50,000 rows that were internally incoherent: the
// same job title at every employer, a PhD in Biology feeding a QA career, a hub with 933 connections whose
// last login was eight years ago, and two different colleagues recommending someone in identical words.
// Row counts were right and every row was a tell. So the data is now CORRELATED: a career track picks the
// titles, the skills, the degree field and the certifications together; seniority climbs with years
// served; education ends before the first job starts; activity is recency-skewed the way real networks
// are; profile views and followers scale with degree. The generator's job is to be indistinguishable in
// STRUCTURE from a real corpus, because that is what makes a query written against it honest.
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
  /** Vanity slug, unique across the corpus (name-derived, disambiguated by index like the real thing). */
  slug: string;
  firstName: string;
  lastName: string;
  name: string;
  pronouns: string;
  email: string;
  headline: string;
  about: string;
  location: string;
  country: string;
  /** Matches the industry of where they actually work, not an unrelated roll. */
  industry: string;
  /** Which career ladder this member is on. Drives titles, skills, degree field and certifications. */
  track: string;
  /** Denormalised current role, so feed and search code has something to read without a join. */
  currentTitle: string;
  currentCompanyId: string | null;
  /** Whole years since their first job started. Seniority, skills and the about-text all follow it. */
  yearsExperience: number;
  languages: string[];
  openToWork: boolean;
  openToHire: boolean;
  profileViews: number;
  /** Followers exceed connections: on a real network people follow without a mutual accept. */
  followerCount: number;
  joinedAt: number;
  lastActiveAt: number;
  /** Power-law: most members have few connections, a few have hundreds. */
  connectionCount: number;
}

export interface SimCertification {
  memberId: string;
  name: string;
  issuer: string;
  credentialId: string;
  issuedAt: number;
  expiresAt: number | null;
}

export interface SimRecommendation {
  id: string;
  memberId: string; // who it is about
  authorId: string; // who wrote it
  relationship: string;
  body: string;
  createdAt: number;
}

export interface SimPosition {
  memberId: string;
  companyId: string;
  title: string;
  /** Index on the track ladder. Never decreases across a member's history. */
  level: number;
  employmentType: string;
  location: string;
  workplaceType: string;
  startedAt: number;
  endedAt: number | null; // null = current role
}

export interface SimEducation {
  memberId: string;
  school: string;
  degree: string;
  field: string;
  startedAt: number;
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
  visibility: "anyone" | "connections";
  createdAt: number;
  reactions: number;
  reshares: number;
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
  slug: string;
  name: string;
  tagline: string;
  website: string;
  industry: string;
  size: string;
  employeeCount: number;
  headquarters: string;
  followerCount: number;
  foundedAt: number;
}

export interface SimJob {
  id: string;
  companyId: string;
  postedById: string;
  title: string;
  description: string;
  level: number;
  employmentType: string;
  workplaceType: string;
  location: string;
  skills: string[];
  salaryMin: number;
  salaryMax: number;
  currency: string;
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
  certifications: SimCertification[];
  recommendations: SimRecommendation[];
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
/** Pick n distinct items, order preserved by draw. Used wherever a repeat would read as a bug. */
function pickSome<T>(r: () => number, xs: readonly T[], n: number): T[] {
  const out: T[] = [];
  const used = new Set<number>();
  for (let i = 0; i < n * 3 && out.length < Math.min(n, xs.length); i++) {
    const k = Math.floor(r() * xs.length);
    if (used.has(k)) continue;
    used.add(k);
    out.push(xs[k]);
  }
  return out;
}

// ── names ───────────────────────────────────────────────────────────────────
// ~100 x ~90 = ~9,000 name combinations across 50,000 members, so duplicates occur at roughly the rate
// they do in a real global network (many people share a name) without the absurdity of 676 combinations.
const FIRST = ["Aarav", "Abebe", "Ada", "Adaeze", "Ahmet", "Aiko", "Aisha", "Alejandro", "Amara", "Ana", "Anders", "Andrei", "Anika", "Arjun", "Beatriz", "Ben", "Bilal", "Camila", "Carlos", "Chen", "Chiara", "Dara", "David", "Diego", "Dmitri", "Ebele", "Elena", "Eli", "Emeka", "Emma", "Esther", "Fatima", "Felipe", "Freya", "Gabriel", "Grace", "Gus", "Hana", "Hassan", "Helena", "Hiroshi", "Ibrahim", "Ines", "Ingrid", "Isabel", "Ivan", "Jade", "Jae", "Javier", "Jonas", "Julia", "Kaito", "Kalpana", "Kemi", "Kofi", "Lars", "Laila", "Leila", "Lena", "Liam", "Lucia", "Maja", "Marco", "Maria", "Mateo", "Mei", "Mikael", "Mina", "Nadia", "Nia", "Niamh", "Nikhil", "Noor", "Olga", "Omar", "Oscar", "Paulo", "Pedro", "Priya", "Quinn", "Rafael", "Rahul", "Rania", "Ravi", "Rosa", "Ruth", "Sam", "Sanjay", "Sara", "Sofia", "Sung", "Tara", "Thabo", "Tomas", "Uma", "Valeria", "Viktor", "Wei", "Xiomara", "Yara", "Yusuf", "Zara", "Zeynep"] as const;
const LAST = ["Adeyemi", "Ahmadi", "Almeida", "Andersson", "Bakker", "Bianchi", "Botha", "Cardoso", "Chowdhury", "Cruz", "Dahl", "Delgado", "Diallo", "Duarte", "Dubois", "Eriksen", "Esposito", "Farouk", "Fernandes", "Fischer", "Fontaine", "Garcia", "Gupta", "Haddad", "Hansen", "Hernandez", "Ibrahim", "Iqbal", "Jensen", "Kaur", "Keller", "Khan", "Kimura", "Kovac", "Kowalski", "Lindqvist", "Lopez", "Maalouf", "Mbeki", "Mehta", "Mendoza", "Moreau", "Mwangi", "Nakamura", "Navarro", "Nguyen", "Nkemelu", "Novak", "Obi", "Okafor", "Olsen", "Ortega", "Osei", "Pereira", "Petrov", "Popescu", "Quiroga", "Rahman", "Ramirez", "Reyes", "Rossi", "Sandoval", "Santos", "Sato", "Schmidt", "Sharma", "Silva", "Singh", "Sokolov", "Sorensen", "Suzuki", "Tanaka", "Torres", "Tran", "Ueda", "Vargas", "Virtanen", "Wagner", "Wanjiru", "Weber", "Wu", "Ximenes", "Yamada", "Yilmaz", "Zhang", "Zhao", "Ziegler"] as const;
// Most people leave the pronoun field empty, so most of the corpus does too. Pronouns are drawn
// independently of the name on purpose: a name does not tell you someone's pronouns, and a generator
// that pretends otherwise bakes that mistake into every downstream test.
const PRONOUNS = ["she/her", "he/him", "they/them", "", "", "", "", ""] as const;
const LANGUAGES = ["English", "Spanish", "Mandarin", "Hindi", "Arabic", "Portuguese", "French", "German", "Japanese", "Swahili", "Polish", "Turkish"] as const;
const PLACES: readonly (readonly [string, string])[] = [
  ["Boston", "United States"], ["Austin", "United States"], ["Seattle", "United States"], ["Berlin", "Germany"],
  ["Toronto", "Canada"], ["Bengaluru", "India"], ["Mumbai", "India"], ["Singapore", "Singapore"],
  ["Lagos", "Nigeria"], ["Nairobi", "Kenya"], ["São Paulo", "Brazil"], ["Warsaw", "Poland"],
  ["Manchester", "United Kingdom"], ["Dublin", "Ireland"], ["Tokyo", "Japan"], ["Amsterdam", "Netherlands"],
  ["Mexico City", "Mexico"], ["Istanbul", "Türkiye"], ["Stockholm", "Sweden"], ["Lisbon", "Portugal"],
] as const;

// ── career tracks ───────────────────────────────────────────────────────────
// The correlation spine. One roll picks a track, and the track then decides the title ladder, the skills
// worth endorsing, the degree fields that lead there, the certifications that make sense, and what the
// about-text says the person works on. Everything on a profile agrees with everything else because it all
// descends from here, which is the single largest difference between data that reads real and data that
// reads generated.
interface CareerTrack {
  key: string;
  /** Ordered junior to senior. A member's level indexes into this and never moves backwards. */
  ladder: readonly string[];
  skills: readonly string[];
  fields: readonly string[];
  certs: readonly (readonly [string, string])[];
  focus: readonly string[];
  industries: readonly string[];
}

const TRACKS: readonly CareerTrack[] = [
  {
    key: "engineering",
    ladder: ["Junior Software Engineer", "Software Engineer", "Senior Software Engineer", "Staff Software Engineer", "Principal Engineer", "Engineering Manager", "Director of Engineering", "VP of Engineering"],
    skills: ["TypeScript", "Go", "Distributed Systems", "Kubernetes", "PostgreSQL", "System Design", "Code Review", "CI/CD"],
    fields: ["Computer Science", "Software Engineering", "Electrical Engineering", "Mathematics"],
    certs: [["AWS Solutions Architect", "Amazon Web Services"], ["Kubernetes Administrator", "CNCF"], ["Terraform Associate", "HashiCorp"]],
    focus: ["payment infrastructure", "the systems underneath a checkout", "developer tooling nobody sees", "search and ranking", "the parts of the stack that page you at night"],
    industries: ["Software", "Finance", "Media", "Logistics"],
  },
  {
    key: "product",
    ladder: ["Associate Product Manager", "Product Manager", "Senior Product Manager", "Group Product Manager", "Director of Product", "VP of Product", "Chief Product Officer"],
    skills: ["Product Strategy", "Roadmapping", "User Research", "SQL", "Experimentation", "Stakeholder Management", "Pricing", "Discovery"],
    fields: ["Business", "Computer Science", "Economics", "Cognitive Science"],
    certs: [["Certified Scrum Product Owner", "Scrum Alliance"], ["Pragmatic Institute Certified", "Pragmatic Institute"], ["Google Data Analytics", "Google"]],
    focus: ["onboarding and activation", "the first five minutes of a product", "pricing and packaging", "the roadmap nobody wanted to own", "internal tools that quietly matter"],
    industries: ["Software", "Retail", "Healthcare", "Media"],
  },
  {
    key: "data",
    ladder: ["Data Analyst", "Senior Data Analyst", "Data Scientist", "Senior Data Scientist", "Staff Data Scientist", "Head of Data", "VP of Data"],
    skills: ["SQL", "Python", "Machine Learning", "Data Visualisation", "Experimentation", "dbt", "Statistics", "Forecasting"],
    fields: ["Statistics", "Mathematics", "Computer Science", "Economics", "Physics"],
    certs: [["Google Data Analytics", "Google"], ["Databricks Data Engineer", "Databricks"], ["AWS Machine Learning", "Amazon Web Services"]],
    focus: ["forecasting demand", "the metrics layer everyone argues about", "churn models that hold up", "experiment design", "making dashboards people actually open"],
    industries: ["Software", "Finance", "Retail", "Healthcare", "Energy"],
  },
  {
    key: "design",
    ladder: ["Junior Designer", "Product Designer", "Senior Product Designer", "Staff Designer", "Principal Designer", "Head of Design", "VP of Design"],
    skills: ["Figma", "Design Systems", "Prototyping", "User Research", "Accessibility", "Interaction Design", "Typography", "Motion Design"],
    fields: ["Design", "Human Computer Interaction", "Fine Arts", "Architecture"],
    certs: [["Nielsen Norman UX Certification", "Nielsen Norman Group"], ["IAAP Accessibility Specialist", "IAAP"]],
    focus: ["design systems that survive handoff", "the part customers feel first", "accessibility as a default", "onboarding flows", "making dense data legible"],
    industries: ["Software", "Media", "Retail", "Education"],
  },
  {
    key: "sales",
    ladder: ["Sales Development Representative", "Account Executive", "Senior Account Executive", "Enterprise Account Executive", "Sales Manager", "Director of Sales", "VP of Sales"],
    skills: ["Negotiation", "Pipeline Management", "Discovery Calls", "Salesforce", "Forecasting", "Contract Structuring", "Territory Planning", "Public Speaking"],
    fields: ["Business", "Communications", "Economics", "Political Science"],
    certs: [["Challenger Sales Certified", "Challenger Inc"], ["Salesforce Administrator", "Salesforce"], ["MEDDIC Certified", "MEDDIC Academy"]],
    focus: ["complex enterprise deals", "long procurement cycles", "the first ten customers of a category", "public-sector buying", "channel partnerships"],
    industries: ["Software", "Manufacturing", "Logistics", "Finance"],
  },
  {
    key: "customer-success",
    ladder: ["Support Specialist", "Senior Support Specialist", "Customer Success Manager", "Senior Customer Success Manager", "Director of Customer Success", "VP of Customer Success"],
    skills: ["Account Management", "Escalation Handling", "Onboarding", "Renewals", "Technical Troubleshooting", "Zendesk", "Documentation", "Churn Analysis"],
    fields: ["Communications", "Business", "Psychology", "Education"],
    certs: [["ITIL Foundation", "Axelos"], ["Certified Customer Success Manager", "SuccessCOACHING"]],
    focus: ["renewals nobody thought were saveable", "the escalation queue", "onboarding enterprise accounts", "turning support tickets into product fixes"],
    industries: ["Software", "Healthcare", "Retail", "Education"],
  },
  {
    key: "operations",
    ladder: ["Operations Associate", "Operations Manager", "Senior Operations Manager", "Director of Operations", "VP of Operations", "Chief Operating Officer"],
    skills: ["Process Design", "Supply Chain", "Vendor Management", "Capacity Planning", "Lean", "Project Management", "Cost Control", "Logistics"],
    fields: ["Industrial Engineering", "Business", "Supply Chain Management", "Mechanical Engineering"],
    certs: [["Six Sigma Green Belt", "ASQ"], ["PMP", "Project Management Institute"], ["APICS CSCP", "ASCM"]],
    focus: ["moving physical things on time", "the warehouse nobody visits", "vendor contracts", "cost per unit", "the process that broke at scale"],
    industries: ["Logistics", "Manufacturing", "Retail", "Energy"],
  },
  {
    key: "people",
    ladder: ["Recruiting Coordinator", "Technical Recruiter", "Senior Recruiter", "Talent Partner", "Head of Talent", "Head of People", "Chief People Officer"],
    skills: ["Sourcing", "Interview Design", "Compensation Benchmarking", "Employer Branding", "Onboarding", "Employment Law", "Coaching", "Workforce Planning"],
    fields: ["Psychology", "Human Resources", "Business", "Sociology"],
    certs: [["SHRM-CP", "SHRM"], ["PHR", "HRCI"], ["LinkedIn Certified Recruiter", "LinkedIn"]],
    focus: ["hiring without a brand yet", "structured interviews", "levelling and compensation", "the first fifty hires", "keeping people after year two"],
    industries: ["Software", "Healthcare", "Education", "Finance"],
  },
  {
    key: "finance",
    ladder: ["Financial Analyst", "Senior Financial Analyst", "Finance Manager", "Controller", "Director of Finance", "VP of Finance", "Chief Financial Officer"],
    skills: ["Financial Modelling", "Forecasting", "Audit", "Revenue Recognition", "Excel", "Treasury", "Budgeting", "Cost Accounting"],
    fields: ["Accounting", "Finance", "Economics", "Business"],
    certs: [["CFA Level II", "CFA Institute"], ["CPA", "AICPA"], ["FMVA", "CFI"]],
    focus: ["closing the books faster", "unit economics", "the model everyone budgets against", "audit readiness", "cash the week before payroll"],
    industries: ["Finance", "Software", "Manufacturing", "Healthcare"],
  },
  {
    key: "marketing",
    ladder: ["Marketing Associate", "Marketing Manager", "Senior Marketing Manager", "Director of Marketing", "Head of Marketing", "VP of Marketing", "Chief Marketing Officer"],
    skills: ["Copywriting", "SEO", "Lifecycle Marketing", "Positioning", "Paid Acquisition", "Analytics", "Brand Strategy", "Content Design"],
    fields: ["Marketing", "Communications", "Journalism", "Business"],
    certs: [["Google Ads Certification", "Google"], ["HubSpot Inbound", "HubSpot"], ["Google Data Analytics", "Google"]],
    focus: ["positioning a category nobody names yet", "content that compounds", "paid channels that stop working", "launches", "the gap between the promise and the product"],
    industries: ["Media", "Software", "Retail", "Education"],
  },
  {
    key: "research",
    ladder: ["Research Assistant", "Research Scientist", "Senior Research Scientist", "Staff Research Scientist", "Principal Scientist", "Head of Research"],
    skills: ["Experimental Design", "Python", "Statistics", "Scientific Writing", "Literature Review", "Machine Learning", "Lab Operations", "Grant Writing"],
    fields: ["Biology", "Chemistry", "Physics", "Neuroscience", "Bioengineering"],
    certs: [["Good Clinical Practice", "NIH"], ["Lab Safety Certification", "OSHA"]],
    focus: ["assay development", "reproducibility", "the experiment that failed for two years", "translating research into product", "clinical data pipelines"],
    industries: ["Biotech", "Healthcare", "Education", "Energy"],
  },
  {
    key: "quality",
    ladder: ["QA Analyst", "QA Engineer", "Senior QA Engineer", "Staff QA Engineer", "QA Lead", "Director of Quality"],
    skills: ["Test Automation", "Playwright", "Regression Testing", "Performance Testing", "Bug Triage", "CI/CD", "Test Strategy", "Accessibility Testing"],
    fields: ["Computer Science", "Software Engineering", "Information Systems", "Mathematics"],
    certs: [["ISTQB Certified Tester", "ISTQB"], ["Certified Scrum Master", "Scrum Alliance"]],
    focus: ["the regression suite that catches real bugs", "flaky tests", "release gates", "testing what users actually do", "quality without slowing shipping"],
    industries: ["Software", "Healthcare", "Manufacturing", "Finance"],
  },
];

const ALL_TITLES = TRACKS.flatMap((t) => t.ladder);
const GENERAL_SKILLS = ["Public Speaking", "Project Management", "Cross-functional Leadership", "Mentoring", "Technical Writing", "Stakeholder Management", "Budget Ownership", "Hiring"] as const;
const INDUSTRIES = ["Software", "Healthcare", "Finance", "Education", "Logistics", "Manufacturing", "Retail", "Energy", "Media", "Biotech"] as const;

// ── prose (composed, not picked, so 50,000 profiles do not repeat one another) ──
const ABOUT_BELIEF = ["I care about the boring infrastructure underneath.", "I would rather ship small and often.", "I write more than I talk.", "Clear beats clever, every time.", "I like problems that survive contact with reality.", "The unglamorous work is usually the work.", "I ask a lot of questions before I build.", "Measure it or stop arguing about it."] as const;
const ABOUT_TAIL = ["Previously in consulting.", "Career changer, from research.", "Happiest close to the customer.", "Currently learning in public.", "Open to mentoring.", "Remote since 2020.", "", "", ""] as const;
const SPELLED = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"] as const;
/** "one year" / "thirteen years". Singular matters: the first pass wrote "Most of my One years". */
const yearsPhrase = (n: number): string => `${n <= 20 ? SPELLED[Math.max(1, n)] : String(n)} ${n === 1 ? "year" : "years"}`;
const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
function aboutLead(r: () => number, years: number, focus: string): string {
  const y = yearsPhrase(years);
  // The "most of my N years" form only parses in the plural, so short careers get their own shapes.
  return years >= 3
    ? pick(r, [`${cap(y)} of ${focus}.`, `I work on ${focus}. ${cap(y)} in.`, `Most of my ${y} have gone into ${focus}.`, `Currently focused on ${focus}.`])
    : pick(r, [`${cap(y)} of ${focus}.`, `Early in my career, focused on ${focus}.`, `Currently focused on ${focus}.`]);
}

const RELATIONSHIPS = ["managed them directly", "worked on the same team", "was their client", "reported to them", "collaborated across teams", "hired them", "worked with them at a vendor"] as const;
const REC_OPEN = ["Calm under pressure", "Unusually clear in writing", "The person I call when it is broken", "Rare combination of speed and care", "Sets the standard quietly", "Does the work nobody volunteers for", "Turns a vague brief into a plan", "Makes everyone around them better"] as const;
const REC_MIDDLE = ["and the first to say when a plan is wrong", "and relentless about the details that matter", "and generous with credit", "and impossible to rattle", "and honest about tradeoffs", "and completely unbothered by hierarchy", "and quick to hand the work back better than they got it"] as const;
const REC_CLOSE = ["I would work with them again without hesitating.", "Any team would be lucky to have them.", "They raised the bar for the whole group.", "I still use the framework they built.", "One of the few people I have learned from directly.", "Hire them before someone else does."] as const;

const POST_OPENERS = ["Shipped something today:", "A thing I got wrong this month:", "Hiring for my team:", "Notes from a hard week:", "Unpopular opinion:", "Six months in, here is what changed:", "Small win worth writing down:", "Something I keep relearning:"] as const;
const POST_BODIES = ["the boring part was the part that mattered", "we cut scope twice and it still worked", "nobody warned me about the migration", "the fix was one line and four days", "our users told us plainly and we listened late", "measuring it changed what we did", "the second version was half the size", "we deleted more code than we added"] as const;
const POST_CLOSERS = ["Curious how others handle this.", "Happy to share the doc if useful.", "Still not sure it was the right call.", "Would do it again.", "", "", ""] as const;
const COMMENT_BODIES = ["This matches what we saw.", "Congratulations, well earned.", "How did you handle the rollback?", "Saving this for my team.", "Strong disagree, and here is why.", "Thanks for saying the quiet part.", "We hit exactly this last quarter.", "What did the timeline actually look like?", "Sending this to my lead.", "The second point is the whole thing."] as const;
const MESSAGE_BODIES = ["Are you free for 15 minutes this week?", "Thanks for the intro, following up now.", "Saw your post, we are solving the same thing.", "Sending the doc over shortly.", "Would you be open to a referral chat?", "Congrats on the new role.", "Any chance you know someone for this opening?", "Following up on the thread from last month.", "Are you going to be at the conference?", "That was helpful, thank you."] as const;

// ~60 words x 12 tails, plus a two-word pattern, is roughly 4,200 distinct names for 833 companies, so
// the collision retry below almost never fires. The first pass had 60 combinations and produced a wall of
// "Firstyarrow Collective" style fallbacks.
const COMPANY_WORDS = ["North", "Vertex", "Lumen", "Harbor", "Quanta", "Cedar", "Atlas", "Nimbus", "Forge", "Meridian", "Aster", "Basalt", "Cinder", "Delta", "Ember", "Fathom", "Granite", "Halcyon", "Ironwood", "Juniper", "Kestrel", "Lantern", "Mosaic", "Northwind", "Obsidian", "Pinnacle", "Quarry", "Redwood", "Solstice", "Tidewater", "Umbra", "Vantage", "Westgate", "Yarrow", "Zenith", "Anchor", "Bellwether", "Cobalt", "Drift", "Everline", "Foundry", "Glasshouse", "Hollow", "Inlet", "Jetty", "Keystone", "Longbow", "Marrow", "Nightjar", "Overland", "Postern", "Quill", "Ridgeline", "Saltmarsh", "Thornwood", "Upland", "Verge", "Waypoint", "Yardarm", "Ziggurat"] as const;
const COMPANY_TAIL = ["Labs", "Systems", "Group", "Works", "Technologies", "Partners", "Industries", "Collective", "Dynamics", "Holdings", "Union", "Foundry"] as const;
const TAGLINES = ["Infrastructure for the work that pays the bills.", "Software for teams that ship.", "The operating layer for modern operations.", "Built for the people doing the actual work.", "Making a slow process fast.", "One system instead of eleven spreadsheets.", "Tools for the middle of the funnel.", "Quietly running things you depend on."] as const;
const SIZES: readonly (readonly [string, number, number])[] = [["1-10", 1, 10], ["11-50", 11, 50], ["51-200", 51, 200], ["201-500", 201, 500], ["501-1000", 501, 1000], ["1001-5000", 1001, 5000], ["5000+", 5001, 24000]] as const;
// Internship is NOT in this pool: it is assigned explicitly to a short first job at the bottom rung.
// Rolling it freely produced a four-year internship as a Group Product Manager.
const EMPLOYMENT = ["Full-time", "Full-time", "Full-time", "Full-time", "Full-time", "Contract", "Part-time"] as const;
const WORKPLACE = ["On-site", "Hybrid", "Remote"] as const;
const DEGREE_BY_LEVEL: readonly (readonly [string, number])[] = [["BS", 0.42], ["BA", 0.22], ["MS", 0.2], ["MBA", 0.1], ["PhD", 0.06]] as const;
// Non-Latin school names are deliberate: a corpus that is 100% ASCII will let encoding, collation and
// search-tokenisation bugs through that a real network would surface on day one.
const SCHOOLS = ["Northeastern University", "State Polytechnic", "City College", "National Institute of Technology", "Metropolitan University", "Riverside State University", "Kingsford College", "東京工科大学", "Universidade Central", "Cape Union University", "Universität Königsberg", "Üsküdar Teknik Üniversitesi", "São Paulo Politécnica"] as const;
const CURRENCIES: Record<string, string> = { "United States": "USD", Canada: "CAD", Germany: "EUR", Netherlands: "EUR", Ireland: "EUR", Portugal: "EUR", India: "INR", Singapore: "SGD", Nigeria: "NGN", Kenya: "KES", Brazil: "BRL", Poland: "PLN", "United Kingdom": "GBP", Japan: "JPY", Mexico: "MXN", "Türkiye": "TRY", Sweden: "SEK" };

const DAY = 86_400_000;
const YEAR = 365 * DAY;

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
  const start = now - 12 * YEAR; // a twelve-year-old network

  // ── companies ─────────────────────────────────────────────────────────────
  const companyCount = Math.max(8, Math.round(memberCount / 60));
  const companies: SimCompany[] = [];
  const companyNames = new Set<string>();
  for (let i = 0; i < companyCount; i++) {
    // Names must be unique: two employers with the same name is a data bug a human spots instantly.
    const draw = (): string => {
      const w = pick(r, COMPANY_WORDS);
      if (r() < 0.55) return `${w} ${pick(r, COMPANY_TAIL)}`;
      const w2 = pick(r, COMPANY_WORDS);
      return w2 === w ? `${w} ${pick(r, COMPANY_TAIL)}` : `${w} ${w2}`;
    };
    let name = draw();
    for (let attempt = 0; companyNames.has(name) && attempt < 12; attempt++) name = draw();
    if (companyNames.has(name)) name = `${name} ${i}`;
    companyNames.add(name);

    const [sizeBand, lo, hi] = pick(r, SIZES);
    const employeeCount = between(r, lo, hi);
    const [hqCity, hqCountry] = pick(r, PLACES);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    companies.push({
      id: `co_${i}`,
      slug,
      name,
      tagline: pick(r, TAGLINES),
      website: `https://${slug}.test`, // .test is reserved by RFC 2606: never resolvable
      industry: pick(r, INDUSTRIES),
      size: sizeBand,
      employeeCount,
      headquarters: `${hqCity}, ${hqCountry}`,
      // Followers run well ahead of headcount, as they do for any company with a public page.
      followerCount: employeeCount * between(r, 3, 40) + between(r, 0, 2000),
      foundedAt: between(r, start - 8 * YEAR, now - YEAR),
    });
  }
  const byIndustry = new Map<string, SimCompany[]>();
  for (const c of companies) {
    const list = byIndustry.get(c.industry);
    if (list) list.push(c); else byIndustry.set(c.industry, [c]);
  }

  // ── members ───────────────────────────────────────────────────────────────
  const members: SimMember[] = [];
  const tracks: CareerTrack[] = [];
  const careerStarts: number[] = [];
  const slugTaken = new Map<string, number>();
  for (let i = 0; i < memberCount; i++) {
    const track = pick(r, TRACKS);
    const firstName = pick(r, FIRST);
    const lastName = pick(r, LAST);
    const [city, country] = pick(r, PLACES);

    // The member INDEX is arrival order, because that is what preferential attachment below assumes: the
    // early nodes are the ones that accumulate degree. So join dates have to follow the index, or the
    // corpus produces a 978-connection hub who signed up last year. Jitter keeps it from being a
    // perfectly sorted column.
    const arrival = Math.min(1, Math.max(0, (i + (r() - 0.5) * memberCount * 0.04) / memberCount));
    const joinedAt = Math.min(now - DAY, start + Math.floor(arrival * (now - start)));
    const membershipYears = Math.floor((now - joinedAt) / YEAR);

    // Career length drives everything downstream: how many jobs, how senior, how many skills, what the
    // about-text says. Skewed young, because every real network is, but never shorter than the time they
    // have been a member: you do not have one year of experience after twelve years on the network.
    const rolled = r() < 0.55 ? between(r, 1, 8) : r() < 0.8 ? between(r, 9, 16) : between(r, 17, 30);
    const years = Math.min(40, Math.max(rolled, membershipYears + between(r, 0, 4)));
    const careerStart = now - years * YEAR - between(r, 0, 300 * DAY);

    // Slugs collide exactly as they do on a real network, so they get a numeric suffix. Ascii-folded so
    // the slug stays URL-safe even when the name is not.
    const base = `${firstName}-${lastName}`.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z-]/g, "");
    const n = (slugTaken.get(base) ?? 0) + 1;
    slugTaken.set(base, n);
    const slug = n === 1 ? base : `${base}-${n}`;

    const languages = pickSome(r, LANGUAGES, between(r, 1, 3));

    // Activity is RECENCY-SKEWED. A uniform roll between joining and today produced hubs whose last
    // login was eight years ago while still holding a current job, which no real profile looks like.
    const roll = r();
    const ago = roll < 0.5 ? between(r, 0, 14 * DAY) : roll < 0.75 ? between(r, 14 * DAY, 120 * DAY) : roll < 0.92 ? between(r, 120 * DAY, YEAR) : between(r, YEAR, 4 * YEAR);
    const lastActiveAt = Math.max(joinedAt, now - ago);

    members.push({
      id: `m_${i}`,
      slug,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      pronouns: pick(r, PRONOUNS),
      email: `${slug}@${pick(r, ["mailbox.test", "example.test", "inbox.test"] as const)}`,
      headline: "", // set by the positions pass, from the job they actually hold
      about: `${aboutLead(r, years, pick(r, track.focus))} ${pick(r, ABOUT_BELIEF)}${(() => { const t = pick(r, ABOUT_TAIL); return t ? ` ${t}` : ""; })()}`,
      location: city,
      country,
      industry: "", // set by the positions pass, from where they actually work
      track: track.key,
      currentTitle: "",
      currentCompanyId: null,
      yearsExperience: years,
      languages,
      openToWork: r() < 0.18,
      openToHire: r() < 0.12,
      profileViews: 0, // set by the graph pass, scaled by degree
      followerCount: 0, // same
      joinedAt,
      lastActiveAt,
      connectionCount: 0,
    });
    tracks.push(track);
    careerStarts.push(careerStart);
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
  for (let i = 0; i < memberCount; i++) {
    const m = members[i];
    m.connectionCount = degree[i];
    // Reach follows the graph. A member with 900 connections does not get 14 profile views.
    m.profileViews = between(r, 0, 30) + Math.floor(degree[i] * (0.4 + r() * 1.6));
    m.followerCount = degree[i] + Math.floor(degree[i] * r() * 3) + between(r, 0, 60);
  }

  // ── profile detail ────────────────────────────────────────────────────────
  const positions: SimPosition[] = [];
  const educations: SimEducation[] = [];
  const skills: SimSkill[] = [];
  const certifications: SimCertification[] = [];
  for (let i = 0; i < memberCount; i++) {
    const m = members[i];
    const track = tracks[i];
    const careerStart = careerStarts[i];

    // ── work history: one company per stint, and the title CLIMBS the ladder ──
    // The first pass stamped the same title on every job a member ever held, which is the single most
    // obvious tell in a professional-network corpus. Level starts near the bottom, rises with tenure,
    // and never moves backwards.
    const wanted = Math.max(1, Math.round(m.yearsExperience / between(r, 2, 5)) + (r() < 0.5 ? 1 : 0));
    // Where they end up: roughly one rung per four years, with variance, capped by the ladder.
    const endLevel = Math.min(track.ladder.length - 1, Math.floor(m.yearsExperience / 4 + (r() < 0.25 ? 1 : 0)));
    // Cap the stint count so the climb spans the history. Allowing more jobs than rungs printed the same
    // title at three consecutive employers; endLevel + 2 permits one honest plateau and no more.
    const roles = Math.max(1, Math.min(track.ladder.length, endLevel + 2, wanted));
    let level = Math.max(0, endLevel - (roles - 1));
    // The stints have to COVER the career, not merely start at the beginning of it. Rolling independent
    // durations left a thirteen-year veteran whose newest job ended in 2019 and who had apparently been
    // unemployed for seven years. So the span is sliced into one boundary per stint, jittered by less
    // than half a slot so the boundaries can never cross.
    const span = Math.max(YEAR, now - careerStart);
    const bounds: number[] = [careerStart];
    for (let k = 1; k < roles; k++) bounds.push(Math.round(careerStart + (span * k) / roles + (r() - 0.5) * (span / roles) * 0.5));
    bounds.push(now);
    // Employers cluster in the industries the track actually hires into.
    const pool = byIndustry.get(pick(r, track.industries)) ?? companies;
    for (let k = 0; k < roles; k++) {
      const startedAt = bounds[k];
      const last = k === roles - 1;
      // A believable gap is months, not years: someone still listed as between roles left recently.
      const endedAt = last
        ? (r() < 0.82 ? null : Math.max(startedAt + 90 * DAY, now - between(r, 30 * DAY, 400 * DAY)))
        : Math.max(startedAt + 60 * DAY, bounds[k + 1] - between(r, 0, 90 * DAY));
      const company = pool.length ? pick(r, pool) : pick(r, companies);
      // The current job is where they say they live. Earlier ones may be elsewhere: people move.
      const workplaceType = pick(r, WORKPLACE);
      const location = workplaceType === "Remote" ? "Remote"
        : last || r() < 0.7 ? `${m.location}, ${m.country}`
        : (() => { const [c, co] = pick(r, PLACES); return `${c}, ${co}`; })();
      const shortFirstJob = k === 0 && level === 0 && endedAt !== null && endedAt - startedAt < 400 * DAY;
      positions.push({
        memberId: m.id,
        companyId: company.id,
        title: track.ladder[level],
        level,
        employmentType: shortFirstJob && r() < 0.4 ? "Internship" : pick(r, EMPLOYMENT),
        location,
        workplaceType,
        startedAt,
        endedAt,
      });
      // The profile denormalises the newest stint, current or not, so search has something to read.
      m.currentTitle = track.ladder[level];
      m.headline = `${track.ladder[level]} at ${company.name}`;
      m.industry = company.industry;
      m.currentCompanyId = endedAt === null ? company.id : null;
      if (level < endLevel) level++;
    }
    // Someone between jobs says so, rather than claiming a role they do not hold.
    if (m.currentCompanyId === null) {
      m.headline = `${m.currentTitle} · Open to work`;
      m.openToWork = true;
    }

    // ── education: ends BEFORE the first job, in a field that leads to this track ──
    let degreeName = "BS";
    let acc = 0;
    const degreeRoll = r();
    for (const [d, w] of DEGREE_BY_LEVEL) { acc += w; if (degreeRoll < acc) { degreeName = d; break; } }
    const gradEnd = careerStart - between(r, 0, 400 * DAY);
    const gradYears = degreeName === "PhD" ? 5 : degreeName === "MBA" ? 2 : degreeName === "MS" ? 2 : 4;
    educations.push({
      memberId: m.id,
      school: pick(r, SCHOOLS),
      degree: degreeName,
      field: pick(r, track.fields),
      startedAt: gradEnd - gradYears * YEAR,
      endedAt: gradEnd,
    });
    // A graduate degree implies an undergraduate one, which is what a real profile shows.
    if (degreeName === "MS" || degreeName === "MBA" || degreeName === "PhD") {
      const ugEnd = gradEnd - gradYears * YEAR - between(r, 0, 3 * YEAR);
      educations.push({
        memberId: m.id,
        school: pick(r, SCHOOLS),
        degree: r() < 0.7 ? "BS" : "BA",
        field: pick(r, track.fields),
        startedAt: ugEnd - 4 * YEAR,
        endedAt: ugEnd,
      });
    }

    // ── skills: mostly the track's, with the odd outside one real people also list ──
    const skillCount = Math.min(12, between(r, 4, 6) + Math.floor(m.yearsExperience / 6));
    const chosen = new Set<string>();
    for (let k = 0; k < skillCount; k++) {
      const s = r() < 0.78 ? pick(r, track.skills) : pick(r, GENERAL_SKILLS);
      if (chosen.has(s)) continue;
      chosen.add(s);
      // Endorsements track degree: well-connected members get endorsed more. Realistic, and it gives
      // ranking code something non-uniform to sort by.
      skills.push({ memberId: m.id, skill: s, endorsements: Math.floor(r() * (1 + degree[i] / 4)) });
    }

    // ── certifications: a minority hold them, and only ones their track would pursue ──
    if (r() < 0.35 && track.certs.length) {
      const [cname, issuer] = pick(r, track.certs);
      const issuedAt = between(r, careerStart, now);
      certifications.push({
        memberId: m.id,
        name: cname,
        issuer,
        credentialId: `${issuer.replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase()}-${between(r, 100000, 999999)}`,
        issuedAt,
        expiresAt: r() < 0.6 ? issuedAt + 3 * YEAR : null,
      });
    }
  }

  // ── recommendations (only from people you are actually connected to) ──────
  // Composed from three pools rather than picked from five fixed strings, because the first pass had two
  // different colleagues recommending the same person in word-for-word identical language.
  const recommendations: SimRecommendation[] = [];
  const recSample = Math.min(connections.length, Math.round(memberCount * 0.35));
  // Deduping on the WHOLE body is not enough: two colleagues opening and closing identically while only
  // the middle clause differs still reads as generated. Openers and closers are unique per profile.
  const usedOpen = new Set<string>();
  const usedClose = new Set<string>();
  for (let i = 0; i < recSample; i++) {
    const edge = connections[Math.floor(r() * connections.length)];
    const aboutA = r() < 0.5;
    const memberId = aboutA ? edge.a : edge.b;
    let open = pick(r, REC_OPEN);
    let close = pick(r, REC_CLOSE);
    for (let a = 0; a < 6 && usedOpen.has(`${memberId}::${open}`); a++) open = pick(r, REC_OPEN);
    for (let a = 0; a < 6 && usedClose.has(`${memberId}::${close}`); a++) close = pick(r, REC_CLOSE);
    if (usedOpen.has(`${memberId}::${open}`) || usedClose.has(`${memberId}::${close}`)) continue;
    usedOpen.add(`${memberId}::${open}`);
    usedClose.add(`${memberId}::${close}`);
    const body = `${open}, ${pick(r, REC_MIDDLE)}. ${close}`;
    recommendations.push({
      id: `rec_${i}`,
      memberId,
      authorId: aboutA ? edge.b : edge.a,
      relationship: pick(r, RELATIONSHIPS),
      body,
      createdAt: between(r, edge.connectedAt, now),
    });
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
      const closer = pick(r, POST_CLOSERS);
      const reactions = Math.floor(r() * (2 + degree[i]));
      posts.push({
        id,
        authorId: members[i].id,
        body: `${pick(r, POST_OPENERS)} ${pick(r, POST_BODIES)}.${closer ? ` ${closer}` : ""}`,
        visibility: r() < 0.75 ? "anyone" : "connections",
        createdAt,
        reactions,
        reshares: Math.floor(reactions * r() * 0.15),
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
    const track = pick(r, TRACKS);
    const level = between(r, 0, track.ladder.length - 1);
    const company = pick(r, companies);
    const [city, country] = pick(r, PLACES);
    const workplaceType = pick(r, WORKPLACE);
    // Pay ladders up with the rung. Currency follows the posting's country, not the poster's.
    const base = 45_000 + level * between(r, 14_000, 26_000);
    const poster = members[Math.floor(r() * memberCount)];
    jobs.push({
      id: `job_${i}`,
      companyId: company.id,
      postedById: poster.id,
      title: track.ladder[level],
      description: `${company.name} is hiring a ${track.ladder[level]} to work on ${pick(r, track.focus)}. You will ${pick(r, ["own the roadmap for one surface", "partner closely with engineering and design", "report to the head of the function", "run this end to end from day one", "help build the team behind it"])}.`,
      level,
      employmentType: pick(r, EMPLOYMENT),
      workplaceType,
      location: workplaceType === "Remote" ? "Remote" : `${city}, ${country}`,
      skills: pickSome(r, track.skills, between(r, 3, 5)),
      salaryMin: base,
      salaryMax: base + between(r, 10_000, 40_000),
      currency: CURRENCIES[country] ?? "USD",
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

  return { simulated: true, seed, now, members, companies, positions, educations, skills, certifications, recommendations, connections, posts, comments, messages, notifications, jobs };
}

export interface SocialStats {
  members: number;
  uniqueNames: number;
  uniqueHeadlines: number;
  certifications: number;
  recommendations: number;
  openToWork: number;
  connections: number;
  avgConnections: number;
  maxConnections: number;
  /** Share of members whose degree is below the mean. A power law puts this well above half. */
  belowMeanShare: number;
  /** Share active in the last 30 days. A real network is recency-heavy; a uniform roll is not. */
  activeLast30Share: number;
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
  const cutoff = n.now - 30 * DAY;
  return {
    members: n.members.length,
    uniqueNames: new Set(n.members.map((m) => m.name)).size,
    uniqueHeadlines: new Set(n.members.map((m) => m.headline)).size,
    certifications: n.certifications.length,
    recommendations: n.recommendations.length,
    openToWork: n.members.filter((m) => m.openToWork).length,
    connections: n.connections.length,
    avgConnections: Math.round((mean + Number.EPSILON) * 100) / 100,
    maxConnections: degrees.reduce((a, b) => (b > a ? b : a), 0),
    belowMeanShare: Math.round((degrees.filter((d) => d < mean).length / Math.max(1, degrees.length)) * 1000) / 1000,
    activeLast30Share: Math.round((n.members.filter((m) => m.lastActiveAt >= cutoff).length / Math.max(1, n.members.length)) * 1000) / 1000,
    posts: n.posts.length,
    comments: n.comments.length,
    messages: n.messages.length,
    notifications: n.notifications.length,
    companies: n.companies.length,
    jobs: n.jobs.length,
  };
}
