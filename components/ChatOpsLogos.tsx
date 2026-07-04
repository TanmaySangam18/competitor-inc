// Tiny monochrome Slack + Telegram marks for ChatOps surfaces. Ink-only (currentColor) so they sit
// inside the black-and-white system; pair with the .bob / .bob-late utilities for the float animation.

export function SlackMark({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      role="img"
      aria-label="Slack"
    >
      <path d="M9.04 2a2.1 2.1 0 0 0 0 4.2h2.1V4.1A2.1 2.1 0 0 0 9.04 2Zm0 5.25H3.6a2.1 2.1 0 0 0 0 4.2h5.44a2.1 2.1 0 0 0 0-4.2ZM22 9.35a2.1 2.1 0 0 0-4.2 0v2.1h2.1a2.1 2.1 0 0 0 2.1-2.1Zm-5.25 0V3.9a2.1 2.1 0 0 0-4.2 0v5.45a2.1 2.1 0 0 0 4.2 0ZM14.96 22a2.1 2.1 0 0 0 0-4.2h-2.1v2.1a2.1 2.1 0 0 0 2.1 2.1Zm0-5.25h5.44a2.1 2.1 0 0 0 0-4.2h-5.44a2.1 2.1 0 0 0 0 4.2ZM2 14.65a2.1 2.1 0 0 0 4.2 0v-2.1H4.1a2.1 2.1 0 0 0-2.1 2.1Zm5.25 0v5.45a2.1 2.1 0 0 0 4.2 0v-5.45a2.1 2.1 0 0 0-4.2 0Z" />
    </svg>
  );
}

export function TelegramMark({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      role="img"
      aria-label="Telegram"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm4.64 6.56-1.6 7.54c-.12.54-.44.67-.9.42l-2.48-1.83-1.2 1.15c-.13.13-.24.24-.5.24l.18-2.52 4.6-4.15c.2-.18-.04-.28-.31-.1l-5.68 3.57-2.45-.76c-.53-.17-.54-.53.11-.79l9.57-3.69c.44-.16.83.11.66.92Z" />
    </svg>
  );
}
