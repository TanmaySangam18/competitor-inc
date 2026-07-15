// lib/core/licenses.ts — THE LICENSE-COMPLIANCE SHIELD (ORG #29 Dependency/Supply-Chain Auditor + #42 Legal
// & Compliance Analyst). This is how we use open source at scale WITHOUT getting sued: we comply, we don't
// hide. Permissive licenses are allowed for our proprietary commercial product — but ONLY if we keep their
// license + copyright notices and never claim we wrote them. Copyleft/network-copyleft/source-available/
// non-commercial are blocked (they'd force us open or forbid commercial use). Unknown = default-DENY.
//
// "Rebrand as ours, strip attribution, immune from suit" is NOT a thing — stripping notices is the
// violation. The safe path is the boring one: keep the NOTICE, respect trademarks, avoid copyleft.

export type LicenseClass =
  | "public-domain" | "permissive" | "weak-copyleft"
  | "copyleft" | "network-copyleft" | "source-available" | "non-commercial" | "proprietary" | "unknown";

export interface LicenseVerdict {
  spdx: string;
  class: LicenseClass;
  allowed: boolean; // may we use it inside our proprietary, commercial platform?
  requiresAttribution: boolean; // must we keep a license/copyright NOTICE?
  action: string; // what the auditor/agent must do
}

// SPDX id → class. Kept explicit + auditable. Anything not here → unknown (default-deny).
const CLASS: Record<string, LicenseClass> = {
  // public domain / no attribution
  "CC0-1.0": "public-domain", "Unlicense": "public-domain", "0BSD": "public-domain",
  // permissive (attribution required)
  "MIT": "permissive", "ISC": "permissive", "BSD-2-Clause": "permissive", "BSD-3-Clause": "permissive",
  "Apache-2.0": "permissive", "Zlib": "permissive", "BSL-1.0": "permissive", "Python-2.0": "permissive",
  // weak/file-level copyleft — usable, keep modified-file notices
  "MPL-2.0": "weak-copyleft",
  // linking-copyleft — conservative block (obligations are easy to trip)
  "LGPL-2.1": "copyleft", "LGPL-3.0": "copyleft",
  // strong copyleft — would force our own code open
  "GPL-2.0": "copyleft", "GPL-3.0": "copyleft",
  // network copyleft — forces source disclosure for a hosted service (us)
  "AGPL-3.0": "network-copyleft",
  // source-available / non-free
  "SSPL-1.0": "source-available", "BUSL-1.1": "source-available", "Elastic-2.0": "source-available",
  "Commons-Clause": "source-available",
  // explicitly non-commercial
  "CC-BY-NC-4.0": "non-commercial", "CC-BY-NC-SA-4.0": "non-commercial",
};

function normalize(spdx: string): string {
  return (spdx || "").trim().replace(/^\(|\)$/g, "");
}

export function classifyLicense(spdxRaw: string): LicenseVerdict {
  const spdx = normalize(spdxRaw);
  // Compound expressions ("MIT OR Apache-2.0"): pick the most permissive allowed branch.
  if (/\bOR\b/i.test(spdx)) {
    const branches = spdx.split(/\s+OR\s+/i).map((b) => classifyLicense(b));
    const ok = branches.find((b) => b.allowed);
    if (ok) return { ...ok, spdx };
  }
  // "AND" expressions: the STRICTEST branch governs.
  if (/\bAND\b/i.test(spdx)) {
    const branches = spdx.split(/\s+AND\s+/i).map((b) => classifyLicense(b));
    const worst = branches.find((b) => !b.allowed);
    if (worst) return { ...worst, spdx };
  }

  const cls = CLASS[spdx] ?? "unknown";
  switch (cls) {
    case "public-domain":
      return { spdx, class: cls, allowed: true, requiresAttribution: false, action: "Use freely. No attribution required, but never misrepresent authorship." };
    case "permissive":
      return { spdx, class: cls, allowed: true, requiresAttribution: true, action: "Allowed. KEEP the license text + copyright notice in a NOTICE file; never strip it, never claim we wrote it." };
    case "weak-copyleft":
      return { spdx, class: cls, allowed: true, requiresAttribution: true, action: "Allowed (file-level copyleft). Keep notices; changes to ITS files stay under its license; our own files stay ours." };
    case "copyleft":
    case "network-copyleft":
      return { spdx, class: cls, allowed: false, requiresAttribution: true, action: `BLOCK — ${cls} would force our code open. Find a permissive alternative; escalate to Legal & Compliance Analyst.` };
    case "source-available":
    case "non-commercial":
      return { spdx, class: cls, allowed: false, requiresAttribution: true, action: `BLOCK — ${cls} forbids our commercial hosted use. Do not use; escalate to Legal & Compliance Analyst.` };
    default:
      return { spdx: spdx || "(none)", class: "unknown", allowed: false, requiresAttribution: true, action: "DEFAULT-DENY — no clear license = do not use until Legal & Compliance confirms it." };
  }
}

export interface DepScreen {
  name: string;
  spdx: string;
  verdict: LicenseVerdict;
}

// Screen a dependency (name + declared license). CI blocks any `allowed:false` (the auditor's gate).
export function screenDependency(dep: { name: string; license: string }): DepScreen {
  return { name: dep.name, spdx: normalize(dep.license), verdict: classifyLicense(dep.license) };
}

// The NOTICE list every shipped product must carry — one line per attributed dependency.
export function attributionList(deps: { name: string; license: string }[]): string[] {
  return deps
    .map(screenDependency)
    .filter((d) => d.verdict.requiresAttribution && d.verdict.allowed)
    .map((d) => `${d.name} — ${d.spdx}`);
}
