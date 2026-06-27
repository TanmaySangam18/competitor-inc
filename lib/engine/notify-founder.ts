import { sendEmail } from "./execution";

// Founder notifications (waitlist signups, feedback, etc.). Emails the founder via Resend — gated +
// fail-soft (sendEmail returns disabled() if Resend isn't configured, so this never throws/blocks).
// Default recipient is the founder's public address; override with FOUNDER_NOTIFY_EMAIL.
export const FOUNDER_EMAIL = process.env.FOUNDER_NOTIFY_EMAIL || "projecttattva1@gmail.com";

export async function notifyFounder(subject: string, html: string) {
  return sendEmail({ to: FOUNDER_EMAIL, subject, html });
}
