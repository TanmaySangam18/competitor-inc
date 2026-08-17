// lib/core/campus.ts — THE ORG TIER: a university authorises once, every student inherits.
//
// WHY THIS EXISTS. Step 3 of the goal is "set up everything under 3 minutes." Today a student needs FOUR
// third-party accounts before the machine can build and ship: a model provider, GitHub, Vercel and
// Supabase. Each one costs them an account creation, a terms acceptance, a login, sometimes a CAPTCHA and
// sometimes a card. Roughly twenty human acts, and one of them is pasting a service-role key into a form,
// which is bad practice on its own.
//
// The founder's instruction was to automate all of it "no matter what." Taken literally that means the
// machine creates accounts, accepts terms and pays on a student's behalf, which is five of the six
// hard-stops and a breach of essentially every vendor's terms of service. It would also bind a student to
// contracts nobody showed them, and it is the exact behaviour a university's procurement office exists to
// prevent.
//
// So the intent is delivered a different way, and the intent was never "a machine should click Accept." It
// was "a student should not have to do this." Those come apart cleanly once you notice the buyer and the
// beneficiary are different people:
//
//   THE CAMPUS ADMIN performs the irreducible human acts ONCE, as four OAuth authorise clicks.
//   EVERY STUDENT AFTER THAT PERFORMS ZERO. They sign in and start typing.
//
// That is not a workaround. It is how a university already works: IT provisions on students' behalf, and
// no institution would let software open billed accounts in its name anyway. It is also strictly better
// than the managed-credential model our competitors use, because the university holds its own keys and we
// hold nothing.
//
// `studentActsRequired()` below is the measurable form of the promise. It is COMPUTED from what the campus
// has authorised, not asserted, so a test can prove it reaches zero and a regression cannot hide.
//
// Pure and deterministic: no I/O, no clock. Policy, not mechanism, so it never imports lib/engine.

import { CAPABILITIES, capabilityStatus, type CapabilityId, type CapabilityReport } from "./capabilities";
import { ACCOUNTS, type ProviderAccount } from "./accounts";
import type { HardStopKind } from "./hard-stops";

export type CampusRole = "admin" | "faculty" | "student";

/** Only an admin may authorise a campus connection, because authorising IS the human act. */
const MAY_AUTHORISE: readonly CampusRole[] = ["admin"] as const;

export interface Campus {
  id: string;
  name: string;
  /** Connection ids the campus authorised once. Inherited by every member. */
  connections: string[];
  /** Seats on the licence. A member beyond this cannot be provisioned. */
  seats: number;
}

export interface CampusMember {
  userId: string;
  campusId: string;
  role: CampusRole;
  /** Connections this individual added themselves, on top of the campus's. Usually empty, by design. */
  own: string[];
}

export const emptyCampus = (id: string, name: string, seats = 0): Campus => ({ id, name, connections: [], seats });

/** What a member can actually reach: the campus's connections plus anything they added themselves. */
export function effectiveConnections(campus: Campus, member: CampusMember): string[] {
  const set = new Set<string>([...campus.connections, ...member.own]);
  return [...set].sort();
}

/** Capability resolution for one member, inheriting from the campus. Composes capabilityStatus, never
 *  reimplements it, so there is one definition of what a capability needs. */
export function memberCapabilities(campus: Campus, member: CampusMember): CapabilityReport {
  return capabilityStatus(effectiveConnections(campus, member));
}

// ── the burden being removed, written down so it can be measured ─────────────
//
// This is the inventory of what a student must ACTUALLY do today, per vendor, and which hard-stops each
// step touches. It lives in code rather than only in a document because a document drifts silently: a test
// asserts every connectionId here is real and every hard-stop named is a real member of the frozen floor.
//
// Read the totals: FOUR vendor relationships, and each one is an account creation plus a terms acceptance
// plus a login, sometimes a CAPTCHA and sometimes a card. This is the thing the campus tier deletes.

export interface VendorSetup {
  /** Must exist in CONNECTION_MAP. Asserted by test, so this cannot describe a connection we do not have. */
  connectionId: string;
  vendor: string;
  /** Why a student needs it at all, in plain language. */
  forWhat: string;
  /** The human steps, in order. Each one is a thing a person does with their hands. */
  acts: string[];
  /** Which of the six hard-stops these steps touch. This is why none of it can be automated away. */
  hardStops: HardStopKind[];
}

export const VENDOR_SETUP: readonly VendorSetup[] = [
  {
    connectionId: "ai-model",
    vendor: "Anthropic, OpenAI, Groq or OpenRouter",
    forWhat: "cognition. Without it nothing runs at all, which is why it is the only required connection.",
    acts: ["create an account", "accept the terms", "log in", "add a card on some providers", "create an API key", "copy it into a form"],
    hardStops: ["account-create", "accept-terms", "authenticate", "pay"],
  },
  {
    connectionId: "github",
    vendor: "GitHub",
    forWhat: "somewhere for the code to live, with real commit history and CI.",
    acts: ["create an account", "accept the terms", "log in", "generate a personal access token with the right scopes", "copy it into a form"],
    hardStops: ["account-create", "accept-terms", "authenticate"],
  },
  {
    connectionId: "hosting",
    vendor: "Vercel",
    forWhat: "a real URL, so what they build can be opened by someone else.",
    acts: ["create an account", "accept the terms", "log in", "create a token", "copy it into a form"],
    hardStops: ["account-create", "accept-terms", "authenticate"],
  },
  {
    connectionId: "database",
    vendor: "Supabase",
    forWhat: "storing data, so the product can remember a user.",
    acts: ["create an account", "accept the terms", "log in", "create a project", "wait for it to provision", "copy the URL, the anon key and the service-role key"],
    hardStops: ["account-create", "accept-terms", "authenticate"],
  },
] as const;

/** Total human acts a student faces with no campus. The number the campus tier drives to zero. */
export const totalStudentActs = (): number => VENDOR_SETUP.reduce((n, v) => n + v.acts.length, 0);

/** Every distinct hard-stop the student path touches. All of them, which is the point. */
export function stopsTouchedByStudentSetup(): HardStopKind[] {
  return [...new Set(VENDOR_SETUP.flatMap((v) => v.hardStops))].sort();
}

// ── the headline number ──────────────────────────────────────────────────────

export interface StudentBurden {
  /** Accounts a student must still go and create themselves. Zero is the target and the promise. */
  acts: number;
  /** Which accounts, so an unmet promise names itself instead of being a bare number. */
  accounts: ProviderAccount[];
  /** Capabilities the student can use with zero effort on their part. */
  inherited: CapabilityId[];
  line: string;
}

/**
 * How much work is left for a student, given what the campus has authorised. This is the measurable form
 * of step 3 and the reason this module exists: if a campus has authorised the accounts its students need,
 * this returns zero, and a test asserts it.
 *
 * `wants` narrows the question to the capabilities a course actually needs, because a campus that never
 * intends its students to publish outbound should not be marked incomplete for it.
 */
export function studentBurden(campus: Campus, wants: readonly CapabilityId[] = ["think", "commit", "deploy", "persist"]): StudentBurden {
  const have = new Set(campus.connections);
  const needed = new Set<string>();
  for (const cap of CAPABILITIES) {
    if (!wants.includes(cap.id)) continue;
    for (const n of cap.needs) if (!have.has(n)) needed.add(n);
  }
  const accounts = ACCOUNTS.filter((a) => a.covers.some((c) => needed.has(c)));
  const inherited = capabilityStatus(campus.connections).live.map((c) => c.id);
  return {
    acts: accounts.length,
    accounts,
    inherited,
    line:
      accounts.length === 0
        ? "Students connect nothing. They sign in and start."
        : `Students would still have to set up ${accounts.length} ${accounts.length === 1 ? "account" : "accounts"} themselves. The campus should authorise ${accounts.map((a) => a.name).join(", ")} once instead.`,
  };
}

/** The admin's remaining work, which is the ONLY human work in this model. */
export function adminSetup(campus: Campus, wants: readonly CapabilityId[] = ["think", "commit", "deploy", "persist"]): { remaining: ProviderAccount[]; done: number; line: string } {
  const burden = studentBurden(campus, wants);
  const total = ACCOUNTS.filter((a) => {
    const need = new Set<string>();
    for (const cap of CAPABILITIES) if (wants.includes(cap.id)) cap.needs.forEach((n) => need.add(n));
    return a.covers.some((c) => need.has(c));
  }).length;
  return {
    remaining: burden.accounts,
    done: total - burden.accounts.length,
    line:
      burden.accounts.length === 0
        ? "Campus setup is complete. Nothing further is required from anyone."
        : `${burden.accounts.length} of ${total} left, one authorise click each. This is the only human setup in the whole model.`,
  };
}

// ── who may do what ─────────────────────────────────────────────────────────

export interface AuthoriseVerdict { allowed: boolean; reason: string }

/**
 * May this member authorise a campus connection? Only an admin, because authorising is the human act that
 * binds the institution to a vendor's terms. A student doing it would put a personal account behind a
 * university licence, which is the failure mode this whole design exists to avoid.
 */
export function mayAuthorise(member: CampusMember): AuthoriseVerdict {
  if (!MAY_AUTHORISE.includes(member.role)) {
    return { allowed: false, reason: `a ${member.role} cannot authorise a campus account. Ask an admin, and it is one click for them.` };
  }
  return { allowed: true, reason: "campus admin" };
}

export interface SeatVerdict { allowed: boolean; used: number; seats: number; reason: string }

/** Seat accounting. Universities buy seats, so the licence has to be enforceable without being hostile. */
export function seatCheck(campus: Campus, currentMembers: number): SeatVerdict {
  if (campus.seats <= 0) {
    return { allowed: false, used: currentMembers, seats: 0, reason: "no seats on this licence yet" };
  }
  if (currentMembers >= campus.seats) {
    return { allowed: false, used: currentMembers, seats: campus.seats, reason: `all ${campus.seats} seats are in use. Adding seats is a licence change, not a settings toggle.` };
  }
  return { allowed: true, used: currentMembers, seats: campus.seats, reason: `${campus.seats - currentMembers} of ${campus.seats} seats free` };
}

// ── what has to be created for a new student ─────────────────────────────────

export type ResourceKind = "repo" | "hosting-project" | "db-schema";

export interface ProvisionItem {
  kind: ResourceKind;
  /** The campus connection whose delegated token performs the creation. */
  via: string;
  why: string;
}

/**
 * What must be created for a member to be able to build, derived from the campus's connections rather
 * than hardcoded. Nothing here is a human act: every item is an API call made with a token the admin
 * already authorised.
 *
 * Note there is no "model key" item. A student never gets one; they use the campus's, which is why
 * cognition costs the student nothing and costs us nothing.
 */
export function provisionPlan(campus: Campus): ProvisionItem[] {
  const have = new Set(campus.connections);
  const out: ProvisionItem[] = [];
  if (have.has("github")) out.push({ kind: "repo", via: "github", why: "the student's code needs somewhere to live, inside the university's org" });
  if (have.has("hosting")) out.push({ kind: "hosting-project", via: "hosting", why: "so what they build reaches a real URL" });
  if (have.has("database")) out.push({ kind: "db-schema", via: "database", why: "one schema per student inside the campus project, isolated by row-level security" });
  return out;
}

/** The plain-language summary a campus admin sees. Never overstates what is set up. */
export function campusSummary(campus: Campus, currentMembers: number): string {
  const burden = studentBurden(campus);
  const seats = seatCheck(campus, currentMembers);
  return burden.acts === 0
    ? `${campus.name} is ready. ${burden.line} ${seats.reason}.`
    : `${campus.name} is not ready yet. ${burden.line}`;
}
