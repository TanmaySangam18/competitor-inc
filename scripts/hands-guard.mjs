// scripts/hands-guard.mjs — THE LAST-INCH GUARD, in the local runner's own language.
//
// lib/core/hard-stops.ts is the source of truth for the floor. This file is its twin, in plain ESM, so
// scripts/hands.mjs (which runs on the USER'S machine and cannot import TypeScript) enforces the exact
// same refusals at the moment before a hand touches a real screen.
//
// The two must never drift, so lib/core/hard-stops.test.ts reads BOTH files and asserts the pattern
// lists are character-identical. Change one, the test fails until you change the other.

export const FLOOR = Object.freeze([
  "account-create",
  "accept-terms",
  "authenticate",
  "captcha",
  "grant-consent",
  "pay",
]);

export const PATTERNS = Object.freeze({
  "account-create": [
    /\bsign\s?up\b/i,
    /\bcreate (an )?account\b/i,
    /\bregister\b/i,
    /\bget started free\b/i,
    /\bnew account\b/i,
  ],
  "accept-terms": [
    /\bi agree\b/i,
    /\baccept\b[^.]{0,30}\b(terms|tos|conditions|policy|agreement)\b/i,
    /\bagree\b[^.]{0,30}\b(terms|continue|proceed)\b/i,
    /\bterms of (service|use)\b/i,
  ],
  authenticate: [
    /\bpassword\b/i,
    /\bpasscode\b/i,
    /\blog\s?in\b/i,
    /\bsign\s?in\b/i,
    /\bone[- ]?time code\b/i,
    /\bverification code\b/i,
    /\b(2fa|mfa|otp|totp)\b/i,
    /\bcurrent-password\b/i,
  ],
  captcha: [
    /\bcaptcha\b/i,
    /\brecaptcha\b/i,
    /\bhcaptcha\b/i,
    /\bturnstile\b/i,
    /\bi'?m not a robot\b/i,
    /\bverify (you are|you're) human\b/i,
  ],
  "grant-consent": [
    /\bauthorize\b/i,
    /\ballow access\b/i,
    /\bgrant (access|permission|consent)\b/i,
    /\bconsent\b/i,
    /\ballow this app\b/i,
  ],
  pay: [
    /\bcard number\b/i,
    /\b(cvc|cvv)\b/i,
    /\bexpir(y|ation)\b/i,
    /\bpay (now|today)\b/i,
    /\bsubscribe\b/i,
    /\bcheckout\b/i,
    /\bplace order\b/i,
    /\bbilling (address|details|info)\b/i,
    /\bcc-number\b/i,
  ],
});

function haystack(t) {
  return [t.text, t.name, t.type, t.autocomplete, t.placeholder, t.ariaLabel, t.url]
    .filter((s) => typeof s === "string" && s.length > 0)
    .join("   ");
}

/** Mirror of inspectTarget(). Returns { stopped, kind, matched }. */
export function inspect(target, additionalStops = []) {
  if (String(target.type ?? "").toLowerCase() === "password") {
    return { stopped: true, kind: "authenticate", matched: 'input[type="password"]' };
  }
  for (const kind of FLOOR) {
    for (const re of PATTERNS[kind]) {
      const m = re.exec(haystack(target));
      if (m) return { stopped: true, kind, matched: m[0] };
    }
  }
  const hay = haystack(target).toLowerCase();
  for (const extra of additionalStops) {
    const e = String(extra).trim().toLowerCase();
    if (e && hay.includes(e)) return { stopped: true, kind: "custom", matched: extra };
  }
  return { stopped: false };
}
