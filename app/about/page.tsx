import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HardHat } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { categoryTools } from "@/lib/category-tools";

export const metadata: Metadata = {
  title: "About — Free Construction Tools",
  description:
    "Free Construction Tools is a free, browser-based collection of construction calculators and estimators built for contractors, builders, and DIYers. Learn who builds it and why.",
  alternates: { canonical: "https://freeconstructiontools.com/about" },
  openGraph: {
    title: "About — Free Construction Tools",
    description:
      "Why Free Construction Tools exists: accurate, no-signup construction calculators that respect your time and privacy.",
    url: "https://freeconstructiontools.com/about",
    siteName: "Free Construction Tools",
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-1">
        <Breadcrumbs />
        <section className="border-b border-zinc-200">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
            <Badge variant="neutral" className="mb-4">
              <HardHat className="w-3 h-3" />
              About
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-semibold text-zinc-950 tracking-tight mb-5">
              Construction math, made simple and free
            </h1>
            <p className="text-lg text-zinc-600 leading-relaxed">
              Free Construction Tools is a growing collection of {categoryTools.length} free
              calculators and estimators for the trades — concrete, lumber, roofing, drywall,
              flooring, paint, tile, fencing, stairs, and more.
            </p>
          </div>
        </section>

        <section>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10">
            <div className="space-y-4 text-zinc-700 leading-relaxed">
              <h2 className="text-2xl font-semibold text-zinc-950 tracking-tight">Why this exists</h2>
              <p>
                Estimating materials shouldn&apos;t mean wrestling with a spreadsheet, paying
                for software, or handing over your email to download a result. Whether
                you&apos;re a contractor pricing a job, a builder ordering a delivery, or a
                weekend DIYer pouring a patio, you need one thing: an honest number you can
                trust before you spend money.
              </p>
              <p>
                That&apos;s the whole idea. Every tool here is free, runs entirely in your
                browser, and gives you a clear quantity and a rough cost — with a built-in
                waste factor so the estimate reflects the real world, not a perfect one.
              </p>
            </div>

            <div className="space-y-4 text-zinc-700 leading-relaxed">
              <h2 className="text-2xl font-semibold text-zinc-950 tracking-tight">
                How it&apos;s built
              </h2>
              <p>
                Each calculator uses standard, well-documented construction formulas. The math
                runs locally on your device — nothing you type is sent to a server or stored.
                Most tools support both imperial and metric units, and many let you export a
                clean materials list to PDF to take to the supplier or hand to a crew.
              </p>
              <p>
                Estimates are exactly that — estimates. They&apos;re a planning aid, not a
                substitute for professional judgment, a supplier quote, or your local building
                code. Always confirm before you order or build.
              </p>
            </div>

            <div className="space-y-4 text-zinc-700 leading-relaxed">
              <h2 className="text-2xl font-semibold text-zinc-950 tracking-tight">Who builds it</h2>
              <p>
                Free Construction Tools is built and maintained by{" "}
                <a
                  href="https://shahzebzafar.netlify.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-700 underline underline-offset-2"
                >
                  Shahzeb Zafar
                </a>
                , an independent software developer. It&apos;s funded by unobtrusive
                advertising so the calculators can stay free for everyone, with no paywalls and
                no accounts.
              </p>
              <p>
                Have an idea for a calculator we don&apos;t have yet, or spotted a number that
                looks off? That feedback is the single best way to make these tools better —{" "}
                <Link
                  href="/contact"
                  className="text-indigo-600 hover:text-indigo-700 underline underline-offset-2"
                >
                  get in touch
                </Link>
                .
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/#calculators"
                className="inline-flex items-center justify-center gap-2 h-11 px-5 bg-zinc-950 text-white hover:bg-zinc-800 rounded-md text-sm font-medium transition-colors"
              >
                Browse all calculators
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
