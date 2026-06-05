import Link from "next/link";
import { ArrowUpRight, HardHat, Check } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/Badge";
import { categoryTools } from "@/lib/category-tools";

const faqs = [
  {
    question: "Are these construction calculators really free?",
    answer:
      "Yes. Every calculator is 100% free, runs entirely in your browser, and needs no signup or account. There are no usage limits.",
  },
  {
    question: "How accurate are the estimates?",
    answer:
      "The math is precise, but material estimates depend on the numbers you enter and real-world conditions like waste, off-cuts, and site irregularities. Each tool includes a waste-factor setting. Always confirm with a local supplier quote and your building code before ordering.",
  },
  {
    question: "Do they work in metric and imperial units?",
    answer:
      "Most calculators support both feet/inches and meters/centimeters, and convert results between cubic yards and cubic meters where relevant.",
  },
  {
    question: "Can I export or save my results?",
    answer:
      "Several estimators (drywall, paint, flooring, tile, roofing, fence, and more) include a PDF export so you can save or print a materials list for the job.",
  },
];

const itemListSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Free Construction Calculators & Estimators",
  description:
    "Free construction calculators for concrete, lumber, roofing, drywall, flooring, paint, tile, fencing, stairs, and more.",
  url: "https://freeconstructiontools.com",
  numberOfItems: categoryTools.length,
  itemListElement: categoryTools.map((tool, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: tool.name,
    url: `https://freeconstructiontools.com${tool.path}`,
  })),
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((qa) => ({
    "@type": "Question",
    name: qa.question,
    acceptedAnswer: { "@type": "Answer", text: qa.answer },
  })),
};

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
            <Badge variant="neutral" className="mb-6">
              <HardHat className="w-3 h-3" />
              {categoryTools.length} free calculators
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-zinc-950 dark:text-white tracking-tight leading-[1.05] mb-5 max-w-3xl mx-auto">
              Construction calculators,{" "}
              <span className="text-zinc-500 dark:text-zinc-400">built right.</span>
            </h1>
            <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-8 leading-relaxed">
              Free estimators for concrete, lumber, roofing, drywall, flooring, paint, and
              more. No signup, no upsell — just the numbers you need to order materials with
              confidence.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              {["100% free", "No signup", "Metric & imperial", "PDF export"].map((f) => (
                <span key={f} className="inline-flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-500" strokeWidth={2.5} />
                  {f}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Calculators grid */}
        <section id="calculators" className="border-b border-zinc-200 dark:border-zinc-800 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <div className="max-w-2xl mb-10">
              <h2 className="text-3xl sm:text-4xl font-semibold text-zinc-950 dark:text-white tracking-tight mb-3">
                Every calculator
              </h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Pick a tool to estimate materials, quantities, and cost for your next project.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categoryTools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Link
                    key={tool.slug}
                    href={tool.path}
                    className="group relative block h-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-10 h-10 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center group-hover:bg-indigo-50 group-hover:border-indigo-200 dark:group-hover:bg-indigo-500/10 dark:group-hover:border-indigo-500/30 transition-colors">
                        <Icon className="w-4 h-4 text-zinc-700 dark:text-zinc-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    </div>
                    <h3 className="font-semibold text-[15px] text-zinc-950 dark:text-white mb-1">
                      {tool.name}
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                      {tool.tagline}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Why */}
        <section className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <Badge variant="neutral" className="mb-4">
              Why use these
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-950 dark:text-white tracking-tight mb-6">
              Estimate materials before you buy
            </h2>
            <div className="space-y-4 text-zinc-700 dark:text-zinc-300 leading-relaxed text-sm sm:text-base">
              <p>
                Ordering too little means a second trip to the supplier and a stalled job.
                Ordering too much wastes money and leaves you with material you can&apos;t
                return. A good estimate up front avoids both.
              </p>
              <p>
                Each calculator uses standard industry formulas and lets you add a waste
                factor for off-cuts and site conditions. Many also estimate a rough cost
                range and export a materials list to PDF — so you can walk into the supplier
                knowing exactly what to ask for.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <Badge variant="neutral" className="mb-4">
              FAQ
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-950 dark:text-white tracking-tight mb-8">
              Frequently asked questions
            </h2>
            <div className="space-y-6">
              {faqs.map((faq) => (
                <div key={faq.question}>
                  <h3 className="font-medium text-zinc-950 dark:text-white mb-1.5">
                    {faq.question}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
