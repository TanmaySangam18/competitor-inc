import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono, Archivo_Black } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { StorageMigrator } from "@/components/StorageMigrator";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import { SignupAttribution } from "@/components/SignupAttribution";
import { SITE_URL } from "@/lib/site";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

// Heavy black display face for the signature uppercase headlines (the "Paper & Ink" theme).
const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-heavy",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

// Canonical site URL (single source of truth in @/lib/site) — absolute OG image URLs need it, and
// canonical/share URLs must point at the founder's live domain, not the stale account.
const TITLE = "competitor.inc — Prove it before you build it";
const DESCRIPTION =
  "competitor.inc is the AI co-founder that validates your idea — honestly — before it builds the winner. Real demand tests, proof-of-work, and human-in-control. You stay the founder.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "AI co-founder",
    "autonomous company",
    "AI agent",
    "validation-first",
    "competitor.inc",
    "AI operations platform",
  ],
  openGraph: {
    title: TITLE,
    description:
      "Validates your idea before it builds it — real demand tests, proof-of-work, human-in-control. Prove it before you build it.",
    type: "website",
    siteName: "competitor.inc",
    url: SITE_URL,
  },
  // The `twitter:` card tags are a cross-platform link-preview standard (Bluesky, Slack, iMessage, etc.
  // read them too) — kept for rich previews. We do NOT market on X; distribution is Bluesky / AT Protocol.
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: "The AI co-founder that proves demand before it builds. Prove it before you build it.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetBrainsMono.variable} ${archivoBlack.variable}`}
    >
      <body>
        <StorageMigrator />
        <SignupAttribution />
        <Analytics />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-coral focus:px-4 focus:py-2 focus:font-semibold focus:text-bg"
        >
          Skip to content
        </a>
        {children}
        <FeedbackWidget />
      </body>
    </html>
  );
}
