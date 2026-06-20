import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono, Archivo_Black } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "competitor.inc — Prove it before you build it",
  description:
    "competitor.inc is the AI co-founder that validates your idea — honestly — before it builds the winner. Real demand tests, proof-of-work, and human-in-control. You stay the founder.",
  keywords: [
    "AI co-founder",
    "autonomous company",
    "AI agent",
    "validation-first",
    "competitor.inc",
    "AI operations platform",
  ],
  openGraph: {
    title: "competitor.inc — Prove it before you build it",
    description:
      "Validates your idea before it builds it — real demand tests, proof-of-work, human-in-control. Prove it before you build it.",
    type: "website",
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
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-coral focus:px-4 focus:py-2 focus:font-semibold focus:text-bg"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
