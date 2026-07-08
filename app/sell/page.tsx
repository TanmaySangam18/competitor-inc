import type { Metadata } from "next";
import SellThis from "@/components/SellThis";

// Public, no-signup viral tool. Server component for share metadata; interactive part in <SellThis/>.
export const metadata: Metadata = {
  title: "Sell This — the go-to-market that sells any product · competitor.inc",
  description:
    "Paste any product. Our AI sales floor — trained on the canon of sales science — returns a real, playbook-grounded go-to-market that would sell it. Free, no signup. Others build the app; we get it paid.",
  openGraph: {
    title: "Sell This — paste a product, get the plan that sells it",
    description: "AI agents trained on 50 years of sales science turn a product nobody was going to buy into a plan to sell it.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sell This — the go-to-market that sells any product",
    description: "AI agents trained on the sales-science canon. Others build the app; we get it paid.",
  },
};

export default function SellPage() {
  return <SellThis />;
}
