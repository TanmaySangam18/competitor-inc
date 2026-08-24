import type { Metadata } from "next";
import WaitlistBox from "@/components/WaitlistBox";

// THE TEASER (/soon). A deliberately separate route rather than a change to the landing page, because
// the two surfaces have opposite jobs: / has to answer an investor's and a dean's questions, while this
// exists to make a stranger on LinkedIn curious enough to leave an email. Replacing one with the other
// would have broken the conversations already in flight.
//
// WHAT IS NOT HERE, on purpose: no percentages, no capability claims, no feature list, no screenshots.
// The founder's launch playbook is a single big-bang reveal, and a claim made here is a claim that has to
// be defended later with zero customers behind it. The name, one true sentence, and a box.
export const metadata: Metadata = {
  title: "competitor.inc",
  description: "Something is being built in Boston. Leave an email and you will hear first.",
  // Kept out of search deliberately: this page is for people arriving from a specific post, and an
  // indexed teaser competes with the real landing page for the same name.
  robots: { index: false, follow: false },
};

export default function Soon() {
  return (
    <main id="main" className="flex min-h-[100dvh] flex-col justify-between bg-bg px-6 py-12 text-text">
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-muted-2">
        Boston · 2026
      </p>

      <div className="mx-auto w-full max-w-2xl">
        <h1 className="display text-5xl leading-[0.95] sm:text-7xl">competitor.inc</h1>

        {/* One sentence. Every word of it is true today, which is the only test it has to pass. */}
        <p className="mt-8 max-w-lg text-lg leading-relaxed text-muted">
          I have been building this alone for eighteen months. It is nearly ready to show
          someone.
        </p>

        <div className="mt-12 max-w-md">
          <WaitlistBox />
        </div>
      </div>

      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-2">
        no launch date · no mailing list · one message when it opens
      </p>
    </main>
  );
}
