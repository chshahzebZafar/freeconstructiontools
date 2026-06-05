import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  HardHat,
  Check,
  Ruler,
  FileDown,
  Calculator as CalcIcon,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/Badge";
import { categoryTools, getCategoryToolBySlug } from "@/lib/category-tools";

/* Calculators grouped into editorial sections for the homepage. */
const groups: { title: string; blurb: string; slugs: string[] }[] = [
  {
    title: "Concrete, lumber & landscaping",
    blurb: "Volume and quantity estimates for the materials you order by the yard.",
    slugs: ["concrete-calculator", "lumber-calculator", "mulch-calculator"],
  },
  {
    title: "Walls, floors & surfaces",
    blurb: "Area-based estimates for everything you cover, coat, or tile.",
    slugs: [
      "drywall-estimator",
      "flooring-calculator",
      "paint-calculator",
      "tile-calculator",
      "square-footage-calculator",
    ],
  },
  {
    title: "Roofing, stairs & structures",
    blurb: "Framing and exterior estimates that have to meet code and pitch.",
    slugs: ["roofing-calculator", "roof-pitch-calculator", "stair-calculator", "fence-calculator"],
  },
];

const steps = [
  {
    icon: CalcIcon,
    title: "Pick a calculator",
    text: "Choose the material or job you're estimating — concrete, roofing, paint, and more.",
  },
  {
    icon: Ruler,
    title: "Enter your dimensions",
    text: "Type in lengths, areas, and a waste factor. Switch between metric and imperial freely.",
  },
  {
    icon: FileDown,
    title: "Get quantities & cost",
    text: "See exactly what to buy and a rough cost — then export a materials list to PDF.",
  },
];

const stats = [
  { value: `${categoryTools.length}`, label: "Free calculators" },
  { value: "$0", label: "Forever — no paywall" },
  { value: "0", label: "Accounts or signups" },
  { value: "2", label: "Unit systems (metric + imperial)" },
];

const faqs = [
  {
    question: "Are these construction calculators really free?",
    answer:
      "Yes. Every calculator is 100% free, runs entirely in your browser, and needs no signup or account. There are no usage limits and nothing to install.",
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
  {
    question: "Do you store the numbers I enter?",
    answer:
      "No. The calculators run locally in your browser — your measurements never leave your device or get sent to a server.",
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
    <div className="flex flex-col min-h-screen bg-white">
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
        <section className="relative isolate overflow-hidden border-b border-zinc-200">
          <div className="aurora" aria-hidden />
          <div className="absolute inset-0 bg-dot-grid-animated opacity-60" aria-hidden />
          <div className="absolute inset-0 bg-radial-wash" aria-hidden />
          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
            <Badge variant="accent" className="mb-6 float-soft">
              <Sparkles className="w-3 h-3" />
              {categoryTools.length} free calculators · no signup ever
            </Badge>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-semibold text-zinc-950 tracking-tight leading-[1.03] mb-6 max-w-4xl mx-auto">
              Estimate any job
              <br />
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 bg-clip-text text-transparent">
                before you buy a thing.
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-zinc-600 max-w-2xl mx-auto mb-9 leading-relaxed">
              Free, no-nonsense calculators for concrete, lumber, roofing, drywall, flooring,
              paint, and more. Get the exact quantities and a rough cost — then walk into the
              supplier knowing precisely what to order.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
              <Link
                href="#calculators"
                className="inline-flex items-center justify-center gap-2 h-12 px-6 bg-zinc-950 text-white hover:bg-zinc-800 rounded-md text-base font-medium transition-colors w-full sm:w-auto"
              >
                Browse all calculators
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/concrete-calculator"
                className="inline-flex items-center justify-center gap-2 h-12 px-6 bg-white text-zinc-900 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 rounded-md text-base font-medium transition-colors w-full sm:w-auto"
              >
                Try the concrete calculator
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-zinc-600">
              {["100% free", "No signup", "Metric & imperial", "PDF export", "Runs in your browser"].map(
                (f) => (
                  <span key={f} className="inline-flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-500" strokeWidth={2.5} />
                    {f}
                  </span>
                )
              )}
            </div>
          </div>
        </section>

        {/* Stats strip */}
        <section className="border-b border-zinc-200 bg-zinc-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <dl className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-zinc-200">
              {stats.map((s) => (
                <div key={s.label} className="px-4 py-8 text-center">
                  <dt className="text-3xl sm:text-4xl font-semibold text-zinc-950 tabular-nums tracking-tight">
                    {s.value}
                  </dt>
                  <dd className="mt-1 text-xs sm:text-sm text-zinc-500">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Calculators grid, grouped */}
        <section id="calculators" className="border-b border-zinc-200 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <div className="max-w-2xl mb-12">
              <Badge variant="neutral" className="mb-4">
                <HardHat className="w-3 h-3" />
                The toolbox
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-semibold text-zinc-950 tracking-tight mb-3">
                Every calculator, organized
              </h2>
              <p className="text-lg text-zinc-600 leading-relaxed">
                Grouped by the kind of job you&apos;re estimating. Pick one to get started.
              </p>
            </div>

            <div className="space-y-12">
              {groups.map((group) => (
                <div key={group.title}>
                  <div className="mb-5">
                    <h3 className="text-lg font-semibold text-zinc-950">{group.title}</h3>
                    <p className="text-sm text-zinc-500 mt-0.5">{group.blurb}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.slugs.map((slug) => {
                      const tool = getCategoryToolBySlug(slug);
                      if (!tool) return null;
                      const Icon = tool.icon;
                      return (
                        <Link
                          key={tool.slug}
                          href={tool.path}
                          className="group relative block h-full bg-white border border-zinc-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-500/5 hover:-translate-y-0.5 transition-all duration-200"
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="w-11 h-11 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center group-hover:bg-indigo-50 group-hover:border-indigo-200 transition-colors">
                              <Icon className="w-5 h-5 text-zinc-700 group-hover:text-indigo-600 transition-colors" />
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-zinc-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                          </div>
                          <h4 className="font-semibold text-[15px] text-zinc-950 mb-1">
                            {tool.name}
                          </h4>
                          <p className="text-sm text-zinc-600 line-clamp-2 leading-relaxed">
                            {tool.tagline}
                          </p>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-b border-zinc-200 bg-zinc-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <div className="max-w-2xl mb-12">
              <Badge variant="neutral" className="mb-4">
                How it works
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-semibold text-zinc-950 tracking-tight">
                From measurement to materials list in three steps
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.title}
                    className="relative bg-white border border-zinc-200 rounded-xl p-6"
                  >
                    <span className="absolute top-6 right-6 text-5xl font-semibold text-zinc-100 tabular-nums select-none">
                      {i + 1}
                    </span>
                    <div className="w-11 h-11 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h3 className="text-base font-semibold text-zinc-950 mb-2">{step.title}</h3>
                    <p className="text-sm text-zinc-600 leading-relaxed">{step.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Why */}
        <section className="border-b border-zinc-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
              <div>
                <Badge variant="neutral" className="mb-4">
                  Why use these
                </Badge>
                <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-950 tracking-tight mb-6">
                  Order once. Order right.
                </h2>
                <div className="space-y-4 text-zinc-700 leading-relaxed text-sm sm:text-base">
                  <p>
                    Ordering too little means a second trip to the supplier and a stalled job.
                    Ordering too much wastes money and leaves you with material you can&apos;t
                    return. A solid estimate up front avoids both.
                  </p>
                  <p>
                    Each calculator uses standard industry formulas and lets you add a waste
                    factor for off-cuts and site conditions. Many also estimate a rough cost
                    range and export a materials list to PDF — so you can walk into the supplier
                    knowing exactly what to ask for.
                  </p>
                </div>
              </div>
              <ul className="space-y-4">
                {[
                  {
                    icon: ShieldCheck,
                    title: "No signup, no tracking",
                    text: "Calculators run in your browser. We don't ask who you are and we don't store your numbers.",
                  },
                  {
                    icon: Ruler,
                    title: "Waste factors built in",
                    text: "Every estimate lets you pad for off-cuts and site irregularities, the way the pros do.",
                  },
                  {
                    icon: FileDown,
                    title: "Export to PDF",
                    text: "Save or print a clean materials list to take to the yard or hand to a crew.",
                  },
                ].map((b) => {
                  const Icon = b.icon;
                  return (
                    <li
                      key={b.title}
                      className="flex items-start gap-4 bg-white border border-zinc-200 rounded-xl p-5"
                    >
                      <div className="w-10 h-10 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-zinc-700" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-950 mb-1">{b.title}</h3>
                        <p className="text-sm text-zinc-600 leading-relaxed">{b.text}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-b border-zinc-200">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <Badge variant="neutral" className="mb-4">
              FAQ
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-950 tracking-tight mb-8">
              Frequently asked questions
            </h2>
            <div className="space-y-6">
              {faqs.map((faq) => (
                <div key={faq.question}>
                  <h3 className="font-medium text-zinc-950 mb-1.5">{faq.question}</h3>
                  <p className="text-sm text-zinc-600 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-zinc-950">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white tracking-tight mb-4 max-w-2xl mx-auto">
              Stop guessing. Start estimating.
            </h2>
            <p className="text-lg text-zinc-400 max-w-xl mx-auto mb-8 leading-relaxed">
              {categoryTools.length} free construction calculators, ready when you are. No
              account, no catch.
            </p>
            <Link
              href="#calculators"
              className="inline-flex items-center justify-center gap-2 h-12 px-6 bg-white text-zinc-950 hover:bg-zinc-200 rounded-md text-base font-medium transition-colors"
            >
              Browse all calculators
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
