import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "Terms of Service — Free Construction Tools",
  description:
    "The terms governing your use of Free Construction Tools, including the estimates-only disclaimer and limitation of liability.",
  alternates: { canonical: "https://freeconstructiontools.com/terms" },
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "June 5, 2026";

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-1">
        <Breadcrumbs />
        <section className="border-b border-zinc-200">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
            <Badge variant="neutral" className="mb-4">
              <FileText className="w-3 h-3" />
              Legal
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-semibold text-zinc-950 tracking-tight mb-4">
              Terms of Service
            </h1>
            <p className="text-sm text-zinc-500">Last updated: {LAST_UPDATED}</p>
          </div>
        </section>

        <section>
          <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8 text-zinc-700 leading-relaxed">
            <p>
              These Terms of Service (&ldquo;Terms&rdquo;) govern your use of Free Construction
              Tools, available at freeconstructiontools.com (the &ldquo;Site&rdquo;). By
              accessing or using the Site, you agree to these Terms. If you don&apos;t agree,
              please don&apos;t use the Site.
            </p>

            {/* Highlighted disclaimer — the most important term for a construction estimator */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
              <h2 className="text-base font-semibold text-amber-900 mb-2">
                Estimates only — not professional advice
              </h2>
              <p className="text-sm text-amber-900/90 leading-relaxed">
                The calculators on this Site provide approximate estimates for planning purposes
                only. They are not engineering, architectural, financial, or professional advice
                and are not a substitute for a qualified professional, a supplier quote, or your
                local building codes and permits. Real-world results vary with materials, site
                conditions, and workmanship. Always verify quantities and requirements
                independently before purchasing materials or beginning any work. You are solely
                responsible for decisions made using these tools.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-zinc-950">Use of the Site</h2>
              <p>
                You may use the Site and its calculators for personal and commercial estimating,
                free of charge. You agree not to misuse the Site — including attempting to
                disrupt it, scrape it at scale, reverse-engineer it, introduce malicious code,
                or use it in violation of any applicable law.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-zinc-950">Intellectual property</h2>
              <p>
                The Site&apos;s design, text, and software are owned by us or our licensors and
                are protected by applicable laws. The results a calculator produces from your own
                inputs are yours to use freely. You may not copy or redistribute the Site&apos;s
                code or content as your own product.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-zinc-950">No warranty</h2>
              <p>
                The Site is provided &ldquo;as is&rdquo; and &ldquo;as available,&rdquo; without
                warranties of any kind, express or implied, including accuracy, fitness for a
                particular purpose, or uninterrupted availability. We do not warrant that any
                estimate is correct or complete.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-zinc-950">Limitation of liability</h2>
              <p>
                To the fullest extent permitted by law, we will not be liable for any direct,
                indirect, incidental, consequential, or special damages — including wasted
                materials, cost overruns, delays, or loss of profits — arising from your use of,
                or inability to use, the Site or its calculators.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-zinc-950">Advertising &amp; third parties</h2>
              <p>
                The Site is supported by advertising and may contain links to third-party sites
                and services. We are not responsible for the content, products, or practices of
                third parties. Your use of advertising and external links is governed by those
                third parties&apos; terms and our{" "}
                <Link
                  href="/privacy"
                  className="text-indigo-600 hover:text-indigo-700 underline underline-offset-2"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-zinc-950">Changes</h2>
              <p>
                We may update these Terms at any time. Changes take effect when posted, and
                we&apos;ll revise the &ldquo;Last updated&rdquo; date above. Continued use of the
                Site means you accept the updated Terms.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-zinc-950">Contact</h2>
              <p>
                Questions about these Terms? Email{" "}
                <a
                  href="mailto:shahzaibzafar093@gmail.com"
                  className="text-indigo-600 hover:text-indigo-700 underline underline-offset-2"
                >
                  shahzaibzafar093@gmail.com
                </a>{" "}
                or use our{" "}
                <Link
                  href="/contact"
                  className="text-indigo-600 hover:text-indigo-700 underline underline-offset-2"
                >
                  contact page
                </Link>
                .
              </p>
            </div>
          </article>
        </section>
      </main>
      <Footer />
    </div>
  );
}
