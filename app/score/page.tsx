import type { Metadata } from "next";
import Scorecard from "@/components/Scorecard";

// Public, no-signup lead magnet. Server component so it can export share metadata; the interactive part
// lives in <Scorecard/> (client). The OG image is app/score/opengraph-image.tsx.
export const metadata: Metadata = {
  title: "Score your startup idea — free · competitor.inc",
  description:
    "Get an honest AI verdict on your startup idea in 30 seconds — the score, the evidence behind it, and the crew that would build it. Free, no signup.",
  openGraph: {
    title: "Score your startup idea — free",
    description: "An honest AI verdict in 30 seconds: the score, the evidence, and the crew that would build it.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Score your startup idea — free",
    description: "An honest AI verdict in 30 seconds: the score, the evidence, and the crew that would build it.",
  },
};

export default function ScorePage() {
  return <Scorecard />;
}
